# Milestones

## v1.0 v1.0 (Shipped: 2026-11-05)

**Phases completed:** 2 phases, 4 plans, 0 tasks

**Key accomplishments:**

- Role-Based Access Control (RBAC) middleware for Express extracting `x-user-role` (`ADMIN`, `MEMBER`, `VIEWER`) with safe default to `MEMBER`.
- `ForbiddenError` (HTTP 403) and route permission guards across projects, tasks, and tags.
- 17 automated Vitest boundary tests in `backend/tests/rbac.test.ts` (70 total backend tests passing).
- Standalone Angular 20 `ProfileComponent` in `frontend/src/app/components/profile/` following `frontend-ui-architect` design tokens and 60-30-10 color balance.
- Header profile trigger button with avatar and dynamic active role pill badge.
- Interactive role switcher persisted to `localStorage` key `taskflow_active_role`.
- `authRoleInterceptor` transmitting active role on all outgoing HTTP requests.
- Dynamic role-aware UI controls: project deletion disabled for non-admins, task/project mutations and drag-and-drop disabled for viewers.
- 77 Jasmine unit tests passing cleanly in frontend suite.

---
