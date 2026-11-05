# Requirements: TaskFlow RBAC

**Defined:** 2026-11-05
**Core Value:** Deterministic role enforcement: protecting sensitive project and task operations with strict permission guards while maintaining clean logic separation and 100% backward compatibility for existing workflows.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Role-Based Access Control (RBAC) & Middleware

- [ ] **RBAC-01**: Middleware extracts and parses `x-user-role` request header (`ADMIN`, `MEMBER`, `VIEWER`), defaulting to `MEMBER` if omitted.
- [ ] **RBAC-02**: Middleware validates role values and rejects unrecognized roles with HTTP 400 Bad Request.
- [ ] **RBAC-03**: Permission guard grants `ADMIN` role full unrestricted access to all endpoints (GET, POST, PUT, DELETE).
- [ ] **RBAC-04**: Permission guard allows `MEMBER` role to read all resources and create/modify tasks, but blocks project deletion (`DELETE /api/projects/:id`) with HTTP 403 Forbidden.
- [ ] **RBAC-05**: Permission guard restricts `VIEWER` role to read-only access (GET only); any mutation (POST, PUT, DELETE) on projects, tasks, or tags returns HTTP 403 Forbidden.

### Frontend User Profile & Role Context

- [ ] **PROF-01**: Dedicated standalone `ProfileComponent` in `frontend/src/app/components/profile/` maintaining clean architectural separation from `app.ts`.
- [ ] **PROF-02**: Profile trigger button in the main application header displaying the active role badge and opening the profile modal/page.
- [ ] **PROF-03**: Role switcher control in the profile view allowing testing and simulating requests as `ADMIN`, `MEMBER`, or `VIEWER`.
- [ ] **PROF-04**: Angular HTTP interceptor / service updates to transmit the current active `x-user-role` header with every outgoing API request.
- [ ] **PROF-05**: Role-aware UI elements (e.g., hiding or disabling delete actions for `MEMBER` and edit/create buttons for `VIEWER` with informational tooltip).

### Testing & Regression Safety

- [ ] **TEST-01**: Automated Vitest test suite (`backend/tests/rbac.test.ts`) validating all allowed and forbidden endpoint permutations across all 3 roles.
- [ ] **TEST-02**: Ensure all existing tests in `backend/tests/api.test.ts`, `backend/tests/tags.test.ts`, and `backend/tests/dependencies.test.ts` pass cleanly with zero regressions.

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Authentication & Multi-Tenancy

- **AUTH-01**: Persistent user accounts table with hashed passwords in SQLite.
- **AUTH-02**: JWT session tokens replacing plaintext header identity.
- **AUTH-03**: Custom user avatars and bio editing in profile.

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| External OAuth2 / SSO | Out of scope for local TaskFlow RBAC demonstration |
| Persistent credential database | Milestone focuses specifically on role authorization logic and UI profile |
| Per-task ACL assignment | Coarse-grained role hierarchy meets project requirements |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| RBAC-01 | Phase 1 | Pending |
| RBAC-02 | Phase 1 | Pending |
| RBAC-03 | Phase 1 | Pending |
| RBAC-04 | Phase 1 | Pending |
| RBAC-05 | Phase 1 | Pending |
| TEST-01 | Phase 1 | Pending |
| TEST-02 | Phase 1 | Pending |
| PROF-01 | Phase 2 | Pending |
| PROF-02 | Phase 2 | Pending |
| PROF-03 | Phase 2 | Pending |
| PROF-04 | Phase 2 | Pending |
| PROF-05 | Phase 2 | Pending |

**Coverage:**
- v1 requirements: 12 total
- Mapped to phases: 12
- Unmapped: 0 ⚠️

---
*Requirements defined: 2026-11-05*
*Last updated: 2026-11-05 after initialization*
