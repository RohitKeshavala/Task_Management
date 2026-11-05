<!-- GSD:project-start source:PROJECT.md -->

## Project

**TaskFlow RBAC: Role-Based Access Control & User Profile**

TaskFlow is a full-stack task and workflow management system with Angular 20 frontend and Express 4 + SQLite backend. This milestone equips TaskFlow with Role-Based Access Control (RBAC) across backend endpoints and a dedicated User Profile interface in the frontend.

**Core Value:** Deterministic role enforcement: protecting sensitive project and task operations with strict permission guards while maintaining clean logic separation and 100% backward compatibility for existing workflows.

### Constraints

- **Security**: Must return HTTP 403 Forbidden with clear error message when a role attempts an unauthorized mutation or deletion.
- **Modularity**: Dedicated components must be separate (e.g., `ProfileComponent` in `frontend/src/app/components/profile/`) to prevent further bloat in `app.ts`.
- **Test Integrity**: Vitest suite must test all boundary conditions and keep existing test cases passing.

<!-- GSD:project-end -->

<!-- GSD:stack-start source:codebase/STACK.md -->

## Technology Stack

## Languages

- TypeScript 5.7.3 - Backend application logic, data access, services, routes, types (`backend/src/**/*.ts`, `backend/tests/**/*.ts`)
- TypeScript 5.8.2 - Frontend application logic, Angular signals, models, services (`frontend/src/app/**/*.ts`)
- HTML5 - Angular component templates (`frontend/src/app/app.html`, `frontend/src/index.html`)
- CSS3 - Modern custom CSS tokens, dark/light themes, animations, layouts (`frontend/src/styles.css`, `frontend/src/app/app.css`)
- SQL - SQLite schema definitions, queries, transactions, indices (`backend/src/db/database.ts`)

## Runtime

- Node.js (v20+ / v22+ target, `@types/node: ^22.13.4`)
- Browser (Modern evergreen browsers supporting ES2022+ and CSS custom properties)
- npm
- Lockfile: present (`package-lock.json`, `backend/package-lock.json`, `frontend/package-lock.json`)

## Frameworks

- Express 4.21.2 (`backend/package.json`) - REST API HTTP server and routing engine
- Angular 20.1.0 (`frontend/package.json`) - Frontend web framework using Standalone Components, Signals, and reactive UI
- Vitest 3.0.5 (`backend/package.json`, `backend/vitest.config.ts`) - Fast unit and integration test runner for backend
- Supertest 7.0.0 (`backend/package.json`) - HTTP assertions for Express API routes
- Jasmine 5.1.0 (`frontend/package.json`) - Behavioral testing framework for Angular
- Karma 6.4.0 (`frontend/package.json`) - Browser test runner for Angular unit tests
- tsx 4.19.3 (`backend/package.json`) - Real-time TypeScript execution with file watching for backend dev
- TypeScript Compiler (`tsc`) 5.7.3 (`backend/package.json`, `backend/tsconfig.json`) - Backend build step
- Angular CLI & Build Tools 20.1.4 (`@angular/cli`, `@angular/build`) (`frontend/package.json`, `frontend/angular.json`) - Frontend bundler (Vite/esbuild pipeline)

## Key Dependencies

- `better-sqlite3` 11.8.1 (`backend/package.json`) - Synchronous, zero-latency C++ bindings for embedded SQLite database operations
- `zod` 3.24.2 (`backend/package.json`) - Strict declarative schema validation for request payloads and input sanitation
- `cors` 2.8.5 (`backend/package.json`) - Cross-Origin Resource Sharing middleware enabling frontend-to-backend communication
- `rxjs` 7.8.0 (`frontend/package.json`) - Reactive extensions used for Angular HTTP client streams
- `dotenv` 16.4.7 (`backend/package.json`) - Loads environment variables from `.env` files into `process.env`
- `zone.js` 0.15.0 (`frontend/package.json`) - Change detection runtime support for Angular

## Configuration

- Configured via environment variables with fallback defaults (`backend/src/index.ts`, `backend/src/db/database.ts`)
- Key variables:
- Root workspace orchestration: `package.json` with multi-tier scripts
- Backend TypeScript configuration: `backend/tsconfig.json` (`NodeNext` module resolution, ES2022 target, strict mode)
- Frontend Angular configuration: `frontend/angular.json`, `frontend/tsconfig.json`, `frontend/tsconfig.app.json`, `frontend/tsconfig.spec.json`
- Backend test runner: `backend/vitest.config.ts`

## Platform Requirements

- Node.js >= 20.x, npm >= 9.x
- Supported platforms: Windows, macOS, Linux
- Concurrent ports required: `3000` (backend API) and `4200` (frontend web app)
- Backend: Standard Node.js container or virtual machine running `node dist/index.js`
- Frontend: Static web host (Nginx, Caddy, Cloudflare Pages, S3/CloudFront) serving `frontend/dist/frontend` or reverse-proxied via Express

<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->

## Conventions

## Naming Patterns

- TypeScript modules: camelCase with category suffix: `taskService.ts`, `projectRoutes.ts`, `errorHandler.ts`, `taskflow.service.ts`, `taskflow.model.ts`
- Templates and styles: component-scoped names: `app.html`, `app.css`, `styles.css`
- Tests: `[name].test.ts` for backend tests (`api.test.ts`, `dependencies.test.ts`), `[name].spec.ts` for frontend tests (`app.spec.ts`)
- PascalCase for classes, services, and components: `TaskService`, `DependencyService`, `TagService`, `AppError`, `App`
- camelCase for functions and static/instance methods: `createApp()`, `initDatabase()`, `validateStatusTransition()`, `formatDateToISO()`
- camelCase for standard variables: `taskIds`, `resolvedTagId`, `dueDateTime`
- UPPER_SNAKE_CASE for environment configurations or module-level constants: `PORT`, `CHUNK_SIZE`
- Angular Signals: camelCase nouns, descriptors, or boolean predicates: `projects`, `selectedProjectId`, `isDarkTheme`, `draggedTask`
- PascalCase for TypeScript interfaces and type aliases: `Project`, `Task`, `Tag`, `TaskStatus`, `TaskPriority`
- PascalCase with `Schema` suffix for Zod validators: `CreateProjectSchema`, `UpdateTaskSchema`, `CreateTagSchema`, `AddDependencySchema`
- PascalCase with `Dto` suffix for frontend data transfer objects: `CreateTaskDto`, `UpdateTaskDto`, `CreateProjectDto`

## Code Style

- 2-space indentation across TypeScript, HTML, CSS, and JSON
- Prettier configured for Angular HTML formatting in `frontend/package.json`
- Semicolons used consistently in TypeScript source files
- TypeScript strict mode enabled (`"strict": true` in `backend/tsconfig.json` and `frontend/tsconfig.json`)
- Target ECMAScript: `ES2022`
- ESM module resolution with `.js` extensions on local relative imports in backend (`import { createApp } from './app.js';`)

## Import Organization

- Standard relative paths (`../`, `./`) used across both backend and frontend.

## Error Handling

- Custom typed domain error hierarchy extending `AppError`:
- Centralized Express error handler (`backend/src/middleware/errorHandler.ts`):
- Transactions: Database state operations use `db.transaction(() => { ... })()` to ensure atomic commits and rollback on error (`backend/src/services/taskService.ts:134`).

## Logging

- Standard Node.js `console.log` and `console.error`
- Emits structured informational messages at application startup in `backend/src/index.ts`:
- Avoids verbose noise during automated unit and integration test runs.

## Comments

- Method documentation docstrings explaining contract, parameters, and invariants (e.g. `DependencyService.addDependency`, `DependencyService.findPath`)
- Clarification comments on edge case handling (e.g., date normalization for YYYY-MM-DD vs ISO strings, case-insensitive NOCASE SQL collation)
- Concise block comments above complex algorithm functions and service methods.

## Function Design

- Single responsibility: service methods typically 15–40 lines; route handlers 5–25 lines.
- Complex inputs accept structured objects or DTOs validated via Zod schemas.
- Explicit return types declared on service methods (`Task[]`, `Task | null`, `boolean`).

## Module Design

- Named exports preferred throughout codebase (`export class TaskService`, `export function createApp()`, `export const taskRouter`).
- Re-exports centralized in `backend/src/types/index.ts` (`export * from './errors.js'`).
- `backend/src/types/index.ts` acts as the single type barrel for backend domain models and schemas.

<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->

## Architecture

## System Overview

```text

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

- **Synchronous Embedded Persistence:** SQLite accessed via `better-sqlite3` with strict foreign key pragma and transactions.
- **DAG Dependency Tracking:** Tasks model directed dependencies with cycle prevention via Breadth-First Search (BFS) and status transition guards.
- **Reactive Signals Frontend:** Angular 20 Standalone Component using `signal()` and `computed()` for reactive state without boilerplate state stores.

## Layers

- Purpose: User interface, Kanban board, custom calendar datepicker, theme toggle, and task filtering
- Location: `frontend/src/app/`
- Contains: Standalone components, models, and HTTP client services
- Depends on: Backend REST API (`http://localhost:3000/api`)
- Used by: End user via web browser (`http://localhost:4200`)
- Purpose: HTTP endpoint definition, parameter extraction, and request dispatching
- Location: `backend/src/routes/`
- Contains: Express routers (`projectRoutes.ts`, `taskRoutes.ts`, `tagRoutes.ts`)
- Depends on: Service layer and validation schemas
- Used by: Frontend HTTP client or external API consumers
- Purpose: Domain business rules, transactions, validation, DAG traversal, and query logic
- Location: `backend/src/services/`
- Contains: `ProjectService`, `TaskService`, `TagService`, `DependencyService`
- Depends on: Database layer (`backend/src/db/database.ts`), domain types (`backend/src/types/index.ts`)
- Used by: Route controllers
- Purpose: SQLite database connection management, schema DDL, indexing, and seed execution
- Location: `backend/src/db/database.ts`
- Contains: `initDatabase`, `getDatabase`, `closeDatabase`, `seedInitialData`
- Depends on: `better-sqlite3`, Node.js `path` and `fs`
- Used by: All service classes

## Data Flow

### Primary Request Path (Task Creation with Tags and Dependencies)

### Status Transition Flow (Guarded by Prerequisites)

- Backend: Ephemeral in memory during execution; persistent state in `taskflow.db` SQLite database.
- Frontend: Reactive client-side signals in `frontend/src/app/app.ts` (`projects`, `tasks`, `allTags`, `selectedProjectId`, `currentTheme`).

## Key Abstractions

- Purpose: Models prerequisite relationships between tasks and prevents deadlocks or invalid transitions
- Examples: `backend/src/services/dependencyService.ts`, `backend/src/types/errors.ts`
- Pattern: Directed Acyclic Graph with BFS cycle detection (`DependencyService.findPath`)
- Purpose: Uniform error serialization across all REST endpoints
- Examples: `backend/src/middleware/errorHandler.ts`, `backend/src/types/errors.ts`
- Pattern: Express error middleware with custom domain exception classes (`AppError`, `CircularDependencyError`, `StatusGuardError`)
- Purpose: Granular UI reactivity without requiring NgRx or complex external state libraries
- Examples: `frontend/src/app/app.ts:54-72`
- Pattern: Angular Signals (`signal`, `computed`)

## Entry Points

- Location: `backend/src/index.ts`
- Triggers: `npm run dev:backend` or `node dist/index.js`
- Responsibilities: Initializes SQLite database schema, creates Express app instance, starts HTTP listener on `PORT` (3000)
- Location: `frontend/src/main.ts`
- Triggers: Browser loading `index.html` via `npm run dev:frontend` (port 4200)
- Responsibilities: Bootstraps Angular standalone root component (`App`) with `appConfig`

## Architectural Constraints

- **Threading:** Single-threaded Node.js event loop with synchronous SQLite calls via `better-sqlite3`. Database access runs blocking on the main thread, optimal for low-latency local SQLite operations.
- **Global state:** Singleton SQLite database connection maintained in `backend/src/db/database.ts` (`dbInstance`).
- **Circular dependencies:** Enforced strictly at the domain layer; cyclic task dependencies are prohibited via BFS traversal before database insertion.

## Anti-Patterns

### Monolithic Single Component in Frontend

### Direct Synchronous Database Calls in Services

## Error Handling

- Zod schema validation throws `ZodError`, formatted to `{ error: 'Validation Error', details: [...] }`
- Domain guard violations throw `StatusGuardError` / `CircularDependencyError`, returning HTTP 400 with cycle or blocker metadata
- SQLite constraint violations return HTTP 409 Conflict

## Cross-Cutting Concerns

<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->

## Project Skills

| Skill | Description | Path |
|-------|-------------|------|
| frontend-ui-architect | >- Framework and decision-making runbook for designing attractive, high-polish frontend user interfaces. Use this skill whenever working on UI components, templates, styling, animations, layouts, typography, color palettes, or visual polish to make the application look modern, captivating, and cohesive. | `.agents/skills/frontend-ui-architect/SKILL.md` |
| gsd | "Master router and dispatcher for Get Shit Done (GSD) commands. Use for /gsd, /gsd auto, /gsd quick, /gsd next, /gsd plan, /gsd execute, /gsd verify, /gsd status, /gsd onboard, /gsd discuss, /gsd ship, /gsd review, or any spec-driven development task." | `.agents/skills/gsd/SKILL.md` |
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->

## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:

- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->

## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
