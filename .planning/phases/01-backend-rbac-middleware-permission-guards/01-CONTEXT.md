# Phase 1: Backend RBAC Middleware & Permission Guards - Context

**Gathered:** 2026-11-05
**Status:** Ready for planning

<domain>
## Phase Boundary

Enforce role-based access control across all project, task, and tag backend endpoints using the `x-user-role` header with zero regressions. Delivers authentication middleware to extract and validate roles (`ADMIN`, `MEMBER`, `VIEWER`), route permission guards to restrict mutation and deletion access, custom `ForbiddenError` / HTTP 403 response contracts, and a comprehensive test suite in `backend/tests/rbac.test.ts` while keeping all existing 53 unit/integration tests passing.

</domain>

<decisions>
## Implementation Decisions

### Header Handling & Role Normalization
- Case-insensitive trimmed to uppercase: `x-user-role` accepts values like `admin`, `Admin`, `ADMIN ` and normalizes to uppercase enum.
- Default fallback to `MEMBER`: Missing header or empty string resolves to `MEMBER` to preserve backward compatibility for existing tests and client calls.
- Unrecognized role validation: Invalid or unsupported role strings return HTTP 400 Bad Request with a clear error listing valid roles (`ADMIN`, `MEMBER`, `VIEWER`).
- Express request context: Augment Express `Request` type with `req.userRole: 'ADMIN' | 'MEMBER' | 'VIEWER'`.

### Permission Guard Logic & Route Protection
- Project deletion: Restricted to `ADMIN` only. `MEMBER` and `VIEWER` receive HTTP 403 Forbidden on `DELETE /api/projects/:id`.
- Project creation & update: `ADMIN` and `MEMBER` can create and edit projects. `VIEWER` receives HTTP 403 Forbidden.
- Task & dependency operations: `ADMIN` and `MEMBER` can create, update, and delete tasks and manage dependencies. `VIEWER` receives HTTP 403 Forbidden on all task mutations.
- Tag operations: `ADMIN` and `MEMBER` can create and delete tags. `VIEWER` receives HTTP 403 Forbidden on tag mutations.

### Error Responses & Test Strategy
- HTTP 403 payload format: JSON object `{ error: 'Forbidden', message: 'Role <ROLE> is not authorized to perform this action' }`.
- Domain error hierarchy: Introduce `ForbiddenError` extending `AppError` with `statusCode = 403` in `backend/src/types/errors.ts`.
- Guard middleware structure: Flexible route-level guard helper `requireRole(allowedRoles: UserRole[])` placed on protected route definitions.
- Test suite structure: Dedicated test suite in `backend/tests/rbac.test.ts` validating all allowed and forbidden permutations across `ADMIN`, `MEMBER`, and `VIEWER`, plus missing and invalid header handling. Existing `api.test.ts`, `tags.test.ts`, and `dependencies.test.ts` remain untouched.

### the agent's Discretion
- Exact naming and organization of auth middleware and guard files (`backend/src/middleware/auth.ts` or `rbac.ts`).
- Middleware wiring in `backend/src/app.ts`.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `AppError` base class in `backend/src/types/errors.ts` providing structured HTTP errors (`statusCode`, `extra`, `message`).
- `errorHandler` middleware in `backend/src/middleware/errorHandler.ts` catching custom error instances and formatting JSON responses.
- Express app factory `createApp()` in `backend/src/app.ts` with route mounting.

### Established Patterns
- Express routers with async handlers calling service methods.
- Zod schema validation in route handlers throwing errors caught by `errorHandler`.
- In-memory database initialization in Vitest integration tests using Supertest (`request(createApp())`).

### Integration Points
- `backend/src/app.ts`: Global middleware for role extraction (`authMiddleware`).
- `backend/src/routes/projectRoutes.ts`: Route-level guards on `DELETE /:id`, `POST /`, `PUT /:id`.
- `backend/src/routes/taskRoutes.ts`: Route-level guards on task create, update, delete, status change, tag link/unlink, and dependency endpoints.
- `backend/src/routes/tagRoutes.ts`: Route-level guards on `POST /` and `DELETE /:id`.
- `backend/src/types/errors.ts`: Export `ForbiddenError`.

</code_context>

<specifics>
## Specific Ideas
- Zero regressions on existing test suites (`backend/tests/api.test.ts`, `tags.test.ts`, `dependencies.test.ts`) must be verified at every step.
- Ensure Express TypeScript typings are augmented properly so `req.userRole` is strictly typed throughout route handlers and guards.

</specifics>

<deferred>
## Deferred Ideas
- Persistent user accounts table with password hashing in SQLite (deferred to Phase 2 or v2 AUTH-01).
- JWT tokens replacing plain headers (deferred to v2 AUTH-02).
- Granular per-item ACL permissions (deferred to future milestone).

</deferred>
