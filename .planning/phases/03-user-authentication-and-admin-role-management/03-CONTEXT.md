# Phase 3: User Authentication and Admin Role Management - Context

**Gathered:** 2026-11-05
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 3 delivers a complete user authentication and admin-controlled role governance system for TaskFlow:
1. SQLite `users` table persisting usernames, emails, hashed passwords, and assigned roles (`ADMIN`, `MEMBER`, `VIEWER`).
2. Authentication endpoints: user registration (`POST /api/auth/register`), login (`POST /api/auth/login`), current user profile (`GET /api/auth/me`), and user listing/role update for admins (`GET /api/users`, `PUT /api/users/:id/role`).
3. Frontend dedicated Authentication Modal (Log In / Sign Up) required upfront before accessing the workspace if unauthenticated.
4. Admin-only User Role Management interface allowing users with `ADMIN` role to inspect all registered users and assign/change their roles via dropdown.
5. Removal of the client-side role switcher from the Profile modal, displaying only the authenticated user's real assigned role and a Logout button.

</domain>

<decisions>
## Implementation Decisions

### User Authentication & Credential Storage
- Password Hashing: Built-in Node.js `crypto` with `scryptSync` / `randomBytes` (zero extra dependencies, secure salted hashes).
- Auth Session Contract: Token & user identity stored in `localStorage` (`taskflow_auth_token`, `taskflow_auth_user`), transmitted via `Authorization: Bearer <token>` and `x-user-role`.
- Default Role on Sign Up: Newly registered users default to `MEMBER`. Database initial seed creates an `ADMIN` user (`admin@taskflow.dev` / `Admin123!`).
- Login / Signup UI: High-polish frosted-glass modal with tabs for "Log In" and "Sign Up", error validation messages, and smooth transitions.

### Admin User Role Management Interface
- Access Point: Prominent "Manage Users" button in the navbar header, visible only when active authenticated user has `ADMIN` role.
- User Role Management UI: High-polish modal displaying all registered users in a modern table with email, username, joined date, active role badge, and role dropdown (`ADMIN`, `MEMBER`, `VIEWER`) that triggers immediate backend update.
- Backend Endpoint: `GET /api/users` and `PUT /api/users/:id/role` strictly guarded by `requireRole(['ADMIN'])`. Returns HTTP 403 Forbidden if called by non-admin.
- Demotion Safeguard: Backend prevents demoting or removing the last remaining `ADMIN` in the database.

### Profile Modal & Session Management
- Profile Role Switcher Removal: 3 simulated role selector cards are completely removed from `ProfileComponent`. The modal displays the user's authentic assigned role badge, email, and capability summary.
- Logout Flow: Dedicated "Log Out" button in the Profile modal that clears auth credentials from `localStorage`, resets app state, and presents the Login modal.
- Workspace Access: Unauthenticated users are required to log in or register before accessing workspace projects and tasks (Auth modal is displayed on initial launch if not logged in).
- Header Identity: Main header displays authenticated user's name and actual role badge, with quick access to User Profile and (for admins) Manage Users.

### the agent's Discretion
- Database schema structure: `users` table columns (`id`, `username`, `email`, `password_hash`, `salt`, `role`, `created_at`, `updated_at`).
- Seed accounts: Seed one Admin (`admin@taskflow.dev` / password `admin123`) and optionally a demo Member.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `backend/src/middleware/auth.ts`: `authMiddleware` and `requireRole` already exist and can be extended to validate auth tokens/sessions.
- `frontend/src/app/components/profile/`: `ProfileComponent` can be edited to remove role switcher and add Logout.
- `frontend/src/app/services/taskflow.service.ts`: Exposes reactive signals and can be extended with `login`, `register`, `logout`, `getUsers`, and `updateUserRole`.

### Established Patterns
- Express route controllers returning typed JSON payloads with centralized `errorHandler`.
- Angular 20 Standalone Components with `signal()` and `computed()` reactive state.
- `frontend-ui-architect` design tokens: frosted glass (`backdrop-filter: blur(8px)`), layered slate cards (`#1e293b`), tactile button states (`scale(0.97)`).

### Integration Points
- `backend/src/app.ts`: Mount `/api/auth` and `/api/users` routes.
- `backend/src/db/database.ts`: Initialize `users` table and seed default admin user.
- `frontend/src/app/app.html`: Mount Auth Modal and Manage Users Modal, update header buttons.

</code_context>

<specifics>
## Specific Ideas
- User explicitly requested: "give permission to admin to select who can become member, viewer admin for each user by selecting from ui which can do only admin -remove that option selection fro role shown in profile".
- User explicitly chose: "Require login before accessing workspace (Auth modal shown on initial launch if not logged in)".

</specifics>

<deferred>
## Deferred Ideas
- Multi-tenancy and external OAuth2/SSO provider integrations deferred to future release.
- User profile avatars upload / image cropping deferred.

</deferred>

