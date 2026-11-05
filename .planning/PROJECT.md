# TaskFlow RBAC: Role-Based Access Control & User Profile

## What This Is

TaskFlow is a full-stack task and workflow management system with Angular 20 frontend and Express 4 + SQLite backend. This milestone equips TaskFlow with Role-Based Access Control (RBAC) across backend endpoints and a dedicated User Profile interface in the frontend.

## Core Value

Deterministic role enforcement: protecting sensitive project and task operations with strict permission guards while maintaining clean logic separation and 100% backward compatibility for existing workflows.

## Requirements

### Validated

- ✓ Project management CRUD endpoints and database persistence — existing
- ✓ Task lifecycle management (TODO, IN_PROGRESS, DONE) with priorities and due dates — existing
- ✓ Tag taxonomy, task association, and tag filtering — existing
- ✓ Directed acyclic graph (DAG) dependencies with BFS cycle prevention and status guards — existing
- ✓ Full-stack Angular reactive UI with Kanban drag-and-drop — existing
- ✓ Automated Vitest test suite with in-memory database isolation — existing
- ✓ **Role Hierarchy Definition**: Support three explicit roles (`ADMIN`, `MEMBER`, `VIEWER`) — Phase 1
- ✓ **Auth Middleware**: Middleware in `backend/src/middleware/` that extracts and validates the `x-user-role` request header, defaulting to `MEMBER` if omitted — Phase 1
- ✓ **Route Permission Guards**: Enforce role permission checks across all project (`/api/projects`), task (`/api/tasks`), and tag (`/api/tags`) routes — Phase 1
- ✓ **Permission Boundary Unit Tests**: Automated Vitest test suite verifying allowed and forbidden actions for `ADMIN`, `MEMBER`, and `VIEWER` roles — Phase 1
- ✓ **Regression Safety**: All existing tests in `backend/tests/api.test.ts` and related test suites continue passing without regressions — Phase 1
- ✓ **User Profile Component**: Dedicated standalone Angular component for the user profile page/modal with clean logic separation from `app.ts` — Phase 2
- ✓ **Header Profile Trigger**: Header action/button to open the Profile component, view current user info/role, and switch active role for testing — Phase 2
- ✓ **Role-Aware UI Interactions**: Disable or hide unauthorized actions (e.g. project delete for MEMBER, all edits/deletions for VIEWER) and inject active `x-user-role` header in HTTP requests — Phase 2
- ✓ **User Authentication System**: SQLite `users` table, salted scrypt password hashing, registration (`/api/auth/register`), and login (`/api/auth/login`) with JWT tokens — Phase 3
- ✓ **Frontend Auth Modal**: Standalone login/signup modal with validation, demo auto-fill, and unauthenticated workspace gating — Phase 3
- ✓ **Admin User Role Governance UI**: Standalone modal visible only to `ADMIN` users to inspect accounts and reassign roles (`PUT /api/users/:id/role`) with demotion guard — Phase 3
- ✓ **Profile Role Switcher Removal**: Removed client-side role switcher from profile, displaying authentic role and `Log Out` action — Phase 3

### Active

*All milestone requirements delivered and validated.*

### Out of Scope

- External OAuth2 / OpenID Connect provider integration — keeping architecture lightweight via `x-user-role` header contract.
- Persistent user password hashing and user credential registration tables — deferred to full auth provider milestone.
- Granular per-item ACL permissions (e.g. task-specific assignee locks) — roles apply across resource endpoints.

## Context

- **Backend Architecture**: Express 4 with TypeScript (`backend/src/app.ts`), route controllers, and centralized error handling (`backend/src/middleware/errorHandler.ts`).
- **Frontend Architecture**: Angular 20 with standalone components and reactive signals (`frontend/src/app/`).
- **Header Protocol**: Client transmits role identity via `x-user-role` HTTP header (`ADMIN`, `MEMBER`, or `VIEWER`).

## Constraints

- **Security**: Must return HTTP 403 Forbidden with clear error message when a role attempts an unauthorized mutation or deletion.
- **Modularity**: Dedicated components must be separate (e.g., `ProfileComponent` in `frontend/src/app/components/profile/`) to prevent further bloat in `app.ts`.
- **Test Integrity**: Vitest suite must test all boundary conditions and keep existing test cases passing.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| `x-user-role` header authentication | Provides immediate, testable RBAC without credential database overhead | ✓ Implemented in Phase 1 |
| Default role to `MEMBER` when header is missing | Preserves backward compatibility for existing tests and client calls | ✓ Implemented in Phase 1 |
| Dedicated Angular component for Profile | Enforces clean logic separation and addresses monolithic component tech debt in `app.ts` | — Pending Phase 2 |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-11-05 after Phase 1*
