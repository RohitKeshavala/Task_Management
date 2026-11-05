# Roadmap: TaskFlow RBAC

## Overview

This roadmap delivers Role-Based Access Control (RBAC) to TaskFlow across backend routes and a modular frontend User Profile component. Phase 1 establishes the backend role boundary, permission guards, and comprehensive Vitest boundary tests. Phase 2 introduces a dedicated standalone User Profile component in the Angular frontend with header integration, role simulation, and role-reactive UI interactions.

## Phases

**Phase Numbering:**
- Integer phases (1, 2): Planned milestone work
- Decimal phases (1.1, 2.1): Urgent insertions if needed

- [ ] **Phase 1: Backend RBAC Middleware & Permission Guards** - Role extraction, permission checks, route protection, and boundary testing.
- [ ] **Phase 2: Frontend User Profile & Role Context** - Dedicated Profile component, header trigger, role switcher, and UI adaptation.

## Phase Details

### Phase 1: Backend RBAC Middleware & Permission Guards
**Goal**: Enforce role-based access control across all project and task endpoints using `x-user-role` header with zero regressions.
**Mode:** mvp
**UI hint**: no
**Depends on**: Nothing (first phase)
**Requirements**: RBAC-01, RBAC-02, RBAC-03, RBAC-04, RBAC-05, TEST-01, TEST-02
**Success Criteria** (what must be TRUE):
  1. Requests with `x-user-role: ADMIN` can execute all GET, POST, PUT, DELETE operations on `/api/projects` and `/api/tasks`.
  2. Requests with `x-user-role: MEMBER` (or without header) can view projects/tasks and create/update tasks, but receive HTTP 403 Forbidden on `DELETE /api/projects/:id`.
  3. Requests with `x-user-role: VIEWER` can only execute GET requests; any POST, PUT, or DELETE request returns HTTP 403 Forbidden.
  4. Supplying an invalid or unsupported role string returns HTTP 400 Bad Request.
  5. All 11 existing test cases in `backend/tests/api.test.ts` pass without regressions.
**Plans**: 2 plans

Plans:
- [ ] 01-01: Create auth middleware and permission guard helper to extract and validate `x-user-role` with default `MEMBER`.
- [ ] 01-02: Mount permission guards on project and task routes, and build `backend/tests/rbac.test.ts` verifying all role boundaries.

### Phase 2: Frontend User Profile & Role Context
**Goal**: Create a standalone User Profile component separated from `app.ts`, integrate it into the header, and adapt the UI to the active role.
**Mode:** mvp
**UI hint**: yes
**Depends on**: Phase 1
**Requirements**: PROF-01, PROF-02, PROF-03, PROF-04, PROF-05
**Success Criteria** (what must be TRUE):
  1. Standalone `ProfileComponent` is isolated in `frontend/src/app/components/profile/` with dedicated template and styling.
  2. Main application header contains a profile trigger displaying the active role badge and opening the Profile component.
  3. User can switch active simulated role (ADMIN, MEMBER, VIEWER) inside Profile, injecting the header into `TaskFlowService`.
  4. UI dynamically updates permissions (e.g. disables project delete for MEMBER, disables editing/creation for VIEWER).
**Plans**: 2 plans

Plans:
- [ ] 02-01: Scaffold standalone `ProfileComponent` and wire header trigger button with role badge.
- [ ] 02-02: Implement active role state and HTTP header transmission in `TaskFlowService`, plus role-aware UI button states.

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Backend RBAC Middleware & Permission Guards | 0/2 | Ready to plan | - |
| 2. Frontend User Profile & Role Context | 0/2 | Not started | - |
