<!-- refreshed: 2026-11-05 -->
# Architecture

**Analysis Date:** 2026-11-05

## System Overview

```text
┌─────────────────────────────────────────────────────────────┐
│                 Frontend Layer (Angular 20)                 │
├──────────────────────────────┬──────────────────────────────┤
│  App Component (Signals UI)  │  TaskFlowService (HTTP)      │
│  `frontend/src/app/app.ts`   │  `frontend/src/app/services` │
└───────────────┬──────────────┴───────────────┬──────────────┘
                │                              │
                │ HTTP REST Calls (Port 3000)  │
                ▼                              ▼
┌─────────────────────────────────────────────────────────────┐
│                 API Layer (Express Routers)                 │
├─────────────────────┬───────────────────┬───────────────────┤
│    ProjectRouter    │    TaskRouter     │     TagRouter     │
│ `backend/.../routes`│`backend/.../routes│`backend/.../routes│
└───────────────┬─────┴───────────┬───────┴───────────┬───────┘
                │                 │                   │
                ▼                 ▼                   ▼
┌─────────────────────────────────────────────────────────────┐
│                        Service Layer                        │
├─────────────────────┬───────────────────┬───────────────────┤
│   ProjectService    │    TaskService    │    TagService     │
│   DependencyService │ (Business Logic,  │ (Tag Association, │
│  (BFS Cycle Check,  │ Zod Validation,   │   Batch Loading)  │
│    Status Guard)    │   Transactions)   │                   │
└─────────────────────┴───────────┬───────┴───────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────┐
│                  Data Access & Persistence                  │
│  `backend/src/db/database.ts` (better-sqlite3 + SQLite DB)  │
└─────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| `createApp` | Express application factory, middleware configuration, health endpoint | `backend/src/app.ts` |
| `projectRouter` | HTTP routes for project resource CRUD operations | `backend/src/routes/projectRoutes.ts` |
| `taskRouter` | HTTP routes for tasks, tag association, dependency DAG, and blocker queries | `backend/src/routes/taskRoutes.ts` |
| `tagRouter` | HTTP routes for tag creation, listing, and deletion | `backend/src/routes/tagRoutes.ts` |
| `ProjectService` | Project queries, mutations, and database persistence | `backend/src/services/projectService.ts` |
| `TaskService` | Task lifecycle, query filtering, due date validation, transactional creation/updates | `backend/src/services/taskService.ts` |
| `TagService` | Tag registry, duplicate detection, batch hydration of tags for multiple tasks | `backend/src/services/tagService.ts` |
| `DependencyService` | Directed Acyclic Graph (DAG) validation, BFS cycle detection, status transition guards | `backend/src/services/dependencyService.ts` |
| `initDatabase` | SQLite table definitions, index creation, foreign key pragma, demo data seeding | `backend/src/db/database.ts` |
| `errorHandler` | Centralized Express error handler mapping Zod, custom domain errors, and DB constraints | `backend/src/middleware/errorHandler.ts` |
| `TaskFlowService` | Frontend Angular service encapsulating all HTTP interactions with the backend API | `frontend/src/app/services/taskflow.service.ts` |
| `App` | Standalone Angular component managing reactive signal state, Kanban, filters, modals | `frontend/src/app/app.ts` |

## Pattern Overview

**Overall:** Decoupled Client-Server Architecture (Angular SPA + Layered Express API)

**Key Characteristics:**
- **Synchronous Embedded Persistence:** SQLite accessed via `better-sqlite3` with strict foreign key pragma and transactions.
- **DAG Dependency Tracking:** Tasks model directed dependencies with cycle prevention via Breadth-First Search (BFS) and status transition guards.
- **Reactive Signals Frontend:** Angular 20 Standalone Component using `signal()` and `computed()` for reactive state without boilerplate state stores.

## Layers

**Frontend Layer:**
- Purpose: User interface, Kanban board, custom calendar datepicker, theme toggle, and task filtering
- Location: `frontend/src/app/`
- Contains: Standalone components, models, and HTTP client services
- Depends on: Backend REST API (`http://localhost:3000/api`)
- Used by: End user via web browser (`http://localhost:4200`)

**API / Routing Layer:**
- Purpose: HTTP endpoint definition, parameter extraction, and request dispatching
- Location: `backend/src/routes/`
- Contains: Express routers (`projectRoutes.ts`, `taskRoutes.ts`, `tagRoutes.ts`)
- Depends on: Service layer and validation schemas
- Used by: Frontend HTTP client or external API consumers

**Service Layer:**
- Purpose: Domain business rules, transactions, validation, DAG traversal, and query logic
- Location: `backend/src/services/`
- Contains: `ProjectService`, `TaskService`, `TagService`, `DependencyService`
- Depends on: Database layer (`backend/src/db/database.ts`), domain types (`backend/src/types/index.ts`)
- Used by: Route controllers

**Data Access Layer:**
- Purpose: SQLite database connection management, schema DDL, indexing, and seed execution
- Location: `backend/src/db/database.ts`
- Contains: `initDatabase`, `getDatabase`, `closeDatabase`, `seedInitialData`
- Depends on: `better-sqlite3`, Node.js `path` and `fs`
- Used by: All service classes

## Data Flow

### Primary Request Path (Task Creation with Tags and Dependencies)

1. Client sends `POST /api/tasks` payload (`frontend/src/app/services/taskflow.service.ts:48`)
2. Express routes to `taskRouter.post` (`backend/src/routes/taskRoutes.ts:44`)
3. `TaskService.create` validates body against `CreateTaskSchema` (`backend/src/services/taskService.ts:65`)
4. Verifies project exists, tag IDs exist, and prerequisite dependencies exist (`backend/src/services/taskService.ts:66-94`)
5. Executes SQLite transaction: inserts task record, inserts `task_tags`, inserts `task_dependencies` (`backend/src/services/taskService.ts:134-170`)
6. Rehydrates task tags and dependency IDs and returns 201 response (`backend/src/services/taskService.ts:173-176`)

### Status Transition Flow (Guarded by Prerequisites)

1. User moves task to `IN_PROGRESS` or `DONE` on Kanban board (`frontend/src/app/app.ts`)
2. Client sends `PUT /api/tasks/:id` with `{ status: 'IN_PROGRESS' }` (`backend/src/routes/taskRoutes.ts:54`)
3. `TaskService.update` invokes `DependencyService.validateStatusTransition` (`backend/src/services/taskService.ts:186`)
4. `DependencyService.getBlockers` executes query for prerequisite tasks where `status != 'DONE'` (`backend/src/services/dependencyService.ts:170-179`)
5. If blockers exist, throws `StatusGuardError` with list of blocking tasks
6. `errorHandler` catches `StatusGuardError` and responds with HTTP 400 and structured blocker details (`backend/src/middleware/errorHandler.ts:27-35`)

**State Management:**
- Backend: Ephemeral in memory during execution; persistent state in `taskflow.db` SQLite database.
- Frontend: Reactive client-side signals in `frontend/src/app/app.ts` (`projects`, `tasks`, `allTags`, `selectedProjectId`, `currentTheme`).

## Key Abstractions

**Task Dependency DAG:**
- Purpose: Models prerequisite relationships between tasks and prevents deadlocks or invalid transitions
- Examples: `backend/src/services/dependencyService.ts`, `backend/src/types/errors.ts`
- Pattern: Directed Acyclic Graph with BFS cycle detection (`DependencyService.findPath`)

**Centralized Error Handling:**
- Purpose: Uniform error serialization across all REST endpoints
- Examples: `backend/src/middleware/errorHandler.ts`, `backend/src/types/errors.ts`
- Pattern: Express error middleware with custom domain exception classes (`AppError`, `CircularDependencyError`, `StatusGuardError`)

**Reactive Signals Store:**
- Purpose: Granular UI reactivity without requiring NgRx or complex external state libraries
- Examples: `frontend/src/app/app.ts:54-72`
- Pattern: Angular Signals (`signal`, `computed`)

## Entry Points

**Backend HTTP Server:**
- Location: `backend/src/index.ts`
- Triggers: `npm run dev:backend` or `node dist/index.js`
- Responsibilities: Initializes SQLite database schema, creates Express app instance, starts HTTP listener on `PORT` (3000)

**Frontend Application:**
- Location: `frontend/src/main.ts`
- Triggers: Browser loading `index.html` via `npm run dev:frontend` (port 4200)
- Responsibilities: Bootstraps Angular standalone root component (`App`) with `appConfig`

## Architectural Constraints

- **Threading:** Single-threaded Node.js event loop with synchronous SQLite calls via `better-sqlite3`. Database access runs blocking on the main thread, optimal for low-latency local SQLite operations.
- **Global state:** Singleton SQLite database connection maintained in `backend/src/db/database.ts` (`dbInstance`).
- **Circular dependencies:** Enforced strictly at the domain layer; cyclic task dependencies are prohibited via BFS traversal before database insertion.

## Anti-Patterns

### Monolithic Single Component in Frontend

**What happens:** `frontend/src/app/app.ts` contains almost 1,000 lines of code handling the Kanban board, calendar view, task creation modal, project management modal, drag-and-drop mechanics, notifications, and filters.
**Why it's wrong:** Violates Single Responsibility Principle, makes testing difficult, and causes unnecessary template re-evaluation.
**Do this instead:** Decompose `App` into focused subcomponents: `KanbanBoardComponent`, `CalendarPickerComponent`, `TaskModalComponent`, and `ProjectHeaderComponent`.

### Direct Synchronous Database Calls in Services

**What happens:** Service methods execute `db.prepare(...).all()` synchronously on the request loop.
**Why it's wrong:** While acceptable for local SQLite with small datasets, synchronous I/O blocks the Node.js event loop under high concurrent loads.
**Do this instead:** For larger scale, isolate database operations behind asynchronous repository boundaries or worker pools.

## Error Handling

**Strategy:** Fail-fast validation with custom error classes and unified error translation middleware.

**Patterns:**
- Zod schema validation throws `ZodError`, formatted to `{ error: 'Validation Error', details: [...] }`
- Domain guard violations throw `StatusGuardError` / `CircularDependencyError`, returning HTTP 400 with cycle or blocker metadata
- SQLite constraint violations return HTTP 409 Conflict

## Cross-Cutting Concerns

**Logging:** Console logging with endpoint announcements on startup (`backend/src/index.ts`).
**Validation:** Zod schemas in `backend/src/types/index.ts` applied across all route bodies.
**CORS:** Enabled for all origins via `cors()` middleware in `backend/src/app.ts`.

---

*Architecture analysis: 2026-11-05*
