# Codebase Concerns

**Analysis Date:** 2026-11-05

## Tech Debt

**Frontend Monolithic Component Architecture:**
- Issue: `frontend/src/app/app.ts` (986 lines) acts as a monolithic controller managing all application concerns: Kanban board drag-and-drop, calendar generation, filter computations, project and task modals, delete confirmation dialogs, and toast notifications.
- Files: `frontend/src/app/app.ts`, `frontend/src/app/app.html`, `frontend/src/app/app.css`
- Impact: Decreased maintainability, heightened risk of regressions when modifying UI state, and lack of component-level unit testability.
- Fix approach: Refactor into modular Angular standalone components: `KanbanBoardComponent`, `CalendarDatePickerComponent`, `TaskModalComponent`, `ProjectModalComponent`, and `NotificationToastComponent`.

**Hardcoded Backend API Endpoint in Frontend Service:**
- Issue: The API URL is hardcoded as `http://localhost:3000/api`.
- Files: `frontend/src/app/services/taskflow.service.ts:11`
- Impact: Prevents easy deployment across staging/production environments or alternate local ports without manually editing source code.
- Fix approach: Migrate to Angular environment configuration (`src/environments/environment.ts`) or configure an Angular CLI dev-server proxy (`proxy.conf.json`).

**Synchronous SQLite Driver on Main Event Loop:**
- Issue: `better-sqlite3` operations run synchronously on Node's main thread.
- Files: `backend/src/db/database.ts`, `backend/src/services/taskService.ts`, `backend/src/services/dependencyService.ts`
- Impact: Acceptable for desktop/local workloads, but synchronous disk I/O will block the Node.js event loop under high concurrent request volumes.
- Fix approach: Maintain existing setup for lightweight local use, or wrap high-latency queries / migrate to an asynchronous driver (or worker threads) if scaled to multi-user workloads.

## Known Bugs & Edge Cases

**Array-type Query Parameters for Tag Filtering:**
- Symptoms: Passing multiple `tagId` query parameters (e.g., `?tagId=a&tagId=b`) causes Express to pass an array instead of a string, which falls through the `typeof tagId === 'string'` check.
- Files: `backend/src/routes/taskRoutes.ts:12-14`
- Trigger: Multiple query parameters in the URL query string.
- Workaround: Client currently sends a single scalar string parameter.
- Fix approach: Normalize query parameters with Zod schema validation on route query objects (`z.string().or(z.array(z.string()))`).

**Timezone Offset Edge Cases in Due Date Validation:**
- Symptoms: Due dates formatted as strings may shift date boundaries depending on the server's local midnight versus UTC.
- Files: `backend/src/services/taskService.ts:98-115`
- Trigger: Creating a task with a due date near midnight across different UTC offsets.
- Workaround: Dates formatted with `YYYY-MM-DD` have special-case date normalization.
- Fix approach: Standardize all internal comparison logic using UTC timestamps (`Date.UTC(...)`).

## Security Considerations

**Open Cross-Origin Resource Sharing (CORS):**
- Risk: `cors()` is mounted without restrictions (`backend/src/app.ts:11`), allowing requests from any origin.
- Files: `backend/src/app.ts`
- Current mitigation: Standard local development setup; server runs on localhost.
- Recommendations: Restrict allowed origins to specific trusted domains/ports in production via CORS options (`{ origin: ['http://localhost:4200'] }`).

**Lack of Authentication and Authorization:**
- Risk: All project and task endpoints are publicly accessible without authentication, RBAC, or user tenancy isolation.
- Files: `backend/src/routes/*.ts`
- Current mitigation: Single-user local demonstration and learning application.
- Recommendations: Introduce JWT / session middleware and add `userId` columns to `projects` and `tasks` before deploying in shared environments.

## Performance Bottlenecks

**BFS Cycle Detection Query Loop (N+1 Queries):**
- Problem: The cycle detection algorithm `DependencyService.findPath()` executes a database query `SELECT dependsOnTaskId FROM task_dependencies WHERE taskId = ?` inside the BFS while-loop for every visited task node.
- Files: `backend/src/services/dependencyService.ts:185-215`
- Cause: Repeated individual SQLite queries during graph traversal.
- Improvement path: Fetch the relevant adjacency list in a single batch query or use an SQLite recursive Common Table Expression (CTE) to determine path reachability in a single database round-trip.

## Fragile Areas

**Full Dependency Overwrite on Task Update:**
- Files: `backend/src/services/taskService.ts:233-239`
- Why fragile: Updating dependencies executes `DELETE FROM task_dependencies WHERE taskId = ?` followed by inserting the new dependencies. If a cycle check fails halfway through or if another operation reads during the transaction, intermediate state could be inconsistent.
- Safe modification: Enclose dependency modification in dedicated atomic helper methods and validate the complete graph state prior to deleting existing rows.
- Test coverage: Covered in `backend/tests/dependencies.test.ts`.

## Scaling Limits

**SQLite Single-Writer Concurrency:**
- Current capacity: Fast for single-user read/write operations (thousands of queries/sec locally).
- Limit: SQLite file locking allows only one concurrent write transaction at a time.
- Scaling path: Enable WAL mode (`PRAGMA journal_mode = WAL;`) for concurrent readers and a writer, or migrate to PostgreSQL for multi-tenant concurrent writes.

## Dependencies at Risk

**None Critical:**
- Core dependencies (`express 4.21.2`, `better-sqlite3 11.8.1`, `zod 3.24.2`, `angular 20.1.0`, `vitest 3.0.5`) are actively maintained modern versions without known vulnerabilities.

## Missing Critical Features

**Task Comments and Activity Log:**
- Problem: No mechanism to add comments, notes, or view audit trails of changes made to tasks.
- Blocks: Collaborative team discussions within tasks.

**User Tenancy & Authentication:**
- Problem: No login or multi-user separation.
- Blocks: Deploying as a shared team service.

## Test Coverage Gaps

**Frontend Component Interaction Tests:**
- What's not tested: Angular component drag-and-drop state transitions, custom calendar date selection, modal submissions, and notification dismissals.
- Files: `frontend/src/app/app.spec.ts`
- Risk: Visual regressions or broken form bindings in frontend might pass automated testing unnoticed.
- Priority: High

**Adjacency Graph Recursive CTE Stress Tests:**
- What's not tested: Deep cyclic graphs with 100+ nodes to test BFS performance under heavy loads.
- Files: `backend/tests/dependencies.test.ts`
- Risk: Performance degradation with extensive dependency chains.
- Priority: Medium

---

*Concerns audit: 2026-11-05*
