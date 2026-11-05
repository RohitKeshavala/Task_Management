# Coding Conventions

**Analysis Date:** 2026-11-05

## Naming Patterns

**Files:**
- TypeScript modules: camelCase with category suffix: `taskService.ts`, `projectRoutes.ts`, `errorHandler.ts`, `taskflow.service.ts`, `taskflow.model.ts`
- Templates and styles: component-scoped names: `app.html`, `app.css`, `styles.css`
- Tests: `[name].test.ts` for backend tests (`api.test.ts`, `dependencies.test.ts`), `[name].spec.ts` for frontend tests (`app.spec.ts`)

**Classes & Components:**
- PascalCase for classes, services, and components: `TaskService`, `DependencyService`, `TagService`, `AppError`, `App`

**Functions & Methods:**
- camelCase for functions and static/instance methods: `createApp()`, `initDatabase()`, `validateStatusTransition()`, `formatDateToISO()`

**Variables & Properties:**
- camelCase for standard variables: `taskIds`, `resolvedTagId`, `dueDateTime`
- UPPER_SNAKE_CASE for environment configurations or module-level constants: `PORT`, `CHUNK_SIZE`
- Angular Signals: camelCase nouns, descriptors, or boolean predicates: `projects`, `selectedProjectId`, `isDarkTheme`, `draggedTask`

**Types & Schemas:**
- PascalCase for TypeScript interfaces and type aliases: `Project`, `Task`, `Tag`, `TaskStatus`, `TaskPriority`
- PascalCase with `Schema` suffix for Zod validators: `CreateProjectSchema`, `UpdateTaskSchema`, `CreateTagSchema`, `AddDependencySchema`
- PascalCase with `Dto` suffix for frontend data transfer objects: `CreateTaskDto`, `UpdateTaskDto`, `CreateProjectDto`

## Code Style

**Formatting:**
- 2-space indentation across TypeScript, HTML, CSS, and JSON
- Prettier configured for Angular HTML formatting in `frontend/package.json`
- Semicolons used consistently in TypeScript source files

**Linting & Typing:**
- TypeScript strict mode enabled (`"strict": true` in `backend/tsconfig.json` and `frontend/tsconfig.json`)
- Target ECMAScript: `ES2022`
- ESM module resolution with `.js` extensions on local relative imports in backend (`import { createApp } from './app.js';`)

## Import Organization

**Order:**
1. Third-party library and framework imports (`express`, `better-sqlite3`, `zod`, `@angular/core`, `rxjs`)
2. Node.js built-in modules (`crypto`, `path`, `fs`)
3. Internal domain models, types, and schemas (`../types/index.js`, `../models/taskflow.model`)
4. Internal services, database, and middleware (`../db/database.js`, `./services/tagService.js`)

**Path Aliases:**
- Standard relative paths (`../`, `./`) used across both backend and frontend.

## Error Handling

**Patterns:**
- Custom typed domain error hierarchy extending `AppError`:
  - `CircularDependencyError`: Raised by `DependencyService` when a cycle is detected during DAG path discovery; carries `cyclePath`.
  - `StatusGuardError`: Raised when transitioning a task to `IN_PROGRESS` or `DONE` while prerequisites remain incomplete; carries `blockingTasks`.
- Centralized Express error handler (`backend/src/middleware/errorHandler.ts`):
  - `ZodError` -> 400 Bad Request with field-level details array
  - `AppError` subclasses -> mapped status code (400) with custom error payload
  - `UNIQUE constraint failed` -> 409 Conflict
  - `not found` message substring -> 404 Not Found
  - Unhandled exceptions -> 500 Internal Server Error
- Transactions: Database state operations use `db.transaction(() => { ... })()` to ensure atomic commits and rollback on error (`backend/src/services/taskService.ts:134`).

## Logging

**Framework:**
- Standard Node.js `console.log` and `console.error`

**Patterns:**
- Emits structured informational messages at application startup in `backend/src/index.ts`:
  - Port assignment and health check URL
  - Primary API route URLs
- Avoids verbose noise during automated unit and integration test runs.

## Comments

**When to Comment:**
- Method documentation docstrings explaining contract, parameters, and invariants (e.g. `DependencyService.addDependency`, `DependencyService.findPath`)
- Clarification comments on edge case handling (e.g., date normalization for YYYY-MM-DD vs ISO strings, case-insensitive NOCASE SQL collation)

**JSDoc/TSDoc:**
- Concise block comments above complex algorithm functions and service methods.

## Function Design

**Size:**
- Single responsibility: service methods typically 15–40 lines; route handlers 5–25 lines.

**Parameters:**
- Complex inputs accept structured objects or DTOs validated via Zod schemas.

**Return Values:**
- Explicit return types declared on service methods (`Task[]`, `Task | null`, `boolean`).

## Module Design

**Exports:**
- Named exports preferred throughout codebase (`export class TaskService`, `export function createApp()`, `export const taskRouter`).
- Re-exports centralized in `backend/src/types/index.ts` (`export * from './errors.js'`).

**Barrel Files:**
- `backend/src/types/index.ts` acts as the single type barrel for backend domain models and schemas.

---

*Convention analysis: 2026-11-05*
