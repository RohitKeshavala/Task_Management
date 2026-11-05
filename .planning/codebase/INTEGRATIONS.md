# External Integrations

**Analysis Date:** 2026-11-05

## APIs & External Services

**Local Backend API:**
- Express REST API (`backend/src/app.ts`) - Serves tasks, projects, tags, blockers, and dependencies to frontend client
  - SDK/Client: Angular `HttpClient` (`frontend/src/app/services/taskflow.service.ts`)
  - Endpoint Base: `http://localhost:3000/api`
  - Auth: None (open local development environment)

## Data Storage

**Databases:**
- SQLite (`backend/src/db/database.ts`)
  - Connection: Local disk path configured via `DATABASE_URL` environment variable (defaults to `taskflow.db` in process working directory, or `:memory:` during automated testing)
  - Client: `better-sqlite3` native synchronous driver
  - PRAGMAs: `foreign_keys = ON` enforced on every database connection
  - Schema:
    - `projects`: `id`, `name`, `description`, `createdAt`, `updatedAt`
    - `tasks`: `id`, `projectId`, `title`, `description`, `priority`, `status`, `dueDate`, `createdAt`, `updatedAt`
    - `tags`: `id`, `name`, `color`, `createdAt` (with case-insensitive unique index)
    - `task_tags`: `taskId`, `tagId` (composite primary key with cascade deletion)
    - `task_dependencies`: `taskId`, `dependsOnTaskId` (composite primary key with cycle prevention & cascade deletion)

**File Storage:**
- Local filesystem only (`backend/taskflow.db`)

**Caching:**
- None required (in-memory SQLite prepared statement cache handled natively by `better-sqlite3`)

## Authentication & Identity

**Auth Provider:**
- Custom / None
  - Implementation: Open local development service; user identity is not currently partitioned or gated by token authentication.

## Monitoring & Observability

**Error Tracking:**
- None (centralized in-app error handling middleware)
  - Implementation: `backend/src/middleware/errorHandler.ts` translates errors into structured JSON responses (`ZodError` -> 400, `CircularDependencyError` / `StatusGuardError` -> 400, UNIQUE constraint conflict -> 409, missing records -> 404, unexpected errors -> 500).

**Logs:**
- Console logging:
  - Startup telemetry in `backend/src/index.ts` logs listening URLs and endpoints
  - Diagnostic logs emitted via `console.log` / `console.error`

## CI/CD & Deployment

**Hosting:**
- Development local runner (Express on `localhost:3000`, Angular CLI on `localhost:4200`)
- Production ready: Node.js server for `backend/dist/index.js`, static file hosting for `frontend/dist/frontend`

**CI Pipeline:**
- Configurable via standard npm scripts in `package.json`:
  - `npm run test:backend` (Vitest test suite)
  - `npm run build:backend` (`tsc`)
  - `npm run build:frontend` (`ng build`)

## Environment Configuration

**Required env vars:**
- `PORT`: Optional, defaults to `3000`
- `DATABASE_URL`: Optional, defaults to `taskflow.db`

**Secrets location:**
- No external third-party API secrets or private tokens are required for core operations. `.env` file loading is supported via `dotenv` in `backend/package.json`.

## Webhooks & Callbacks

**Incoming:**
- None

**Outgoing:**
- None

---

*Integration audit: 2026-11-05*
