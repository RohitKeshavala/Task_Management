# Phase 2: Frontend User Profile & Role Context - Context

**Gathered:** 2026-11-05
**Status:** Ready for planning

<domain>
## Phase Boundary

Create a standalone Angular `ProfileComponent` isolated in `frontend/src/app/components/profile/` with dedicated template and styling to prevent monolithic bloat in `app.ts`. Integrate a profile trigger button in the main application header with a luminous role badge, implement simulated role switching (`ADMIN`, `MEMBER`, `VIEWER`) persisted to localStorage, automatically transmit the active `x-user-role` header via an Angular HTTP interceptor, and dynamically adapt UI permissions (disabling project deletion for MEMBER and all mutation actions for VIEWER).

</domain>

<decisions>
## Implementation Decisions

### Profile Component Placement & Trigger UX
- Header trigger appearance: Avatar with luminous role badge pill (`👤 [ADMIN]`) positioned in `nav-controls` with tactile hover effects.
- Presentation mode: Centered frosted-glass modal overlay (`backdrop-filter: blur(8px)`) matching existing TaskFlow modal design language.
- Profile details: Full user card featuring avatar, user name ("Alex Mercer"), email ("alex.mercer@taskflow.dev"), role badge, and role capability breakdown.
- Modularity: Standalone component in `frontend/src/app/components/profile/` (`profile.ts`, `profile.html`, `profile.css`), imported cleanly into `app.ts`.

### Role Switching & State Synchronization
- Role switcher control: Interactive 3-card selector with role icons (`👑 ADMIN`, `⚡ MEMBER`, `👁️ VIEWER`) and capability highlights.
- LocalStorage persistence: Active role saved to `localStorage.getItem('taskflow_active_role')` defaulting to `MEMBER`.
- Header transmission: Angular `HttpInterceptorFn` (`authRoleInterceptor`) registered in `app.config.ts` attaching `x-user-role` header to every outgoing HTTP request.
- Immediate reactivity: Switching roles updates the active role signal instantaneously, shows a confirmation toast notification, and dynamically updates button states across the Kanban board.

### Role-Aware UI Enforcement & Micro-Interactions
- Project deletion: Disabled for `MEMBER` and `VIEWER` with informational tooltip `title="Only ADMIN can delete projects"`.
- Action buttons: `+ New Project` and `+ New Task` disabled for `VIEWER` with `title="VIEWER role has read-only access"` and subdued opacity.
- Kanban drag-and-drop: Disabled when active role is `VIEWER` (`cdkDragDisabled: activeRole() === 'VIEWER'`) to prevent invalid mutations.
- Color tokens: Distinct semantic palette for role badges: `ADMIN` (Amber `#f59e0b`), `MEMBER` (Emerald `#10b981`), `VIEWER` (Sky Blue `#0ea5e9`).

### the agent's Discretion
- Exact CSS layout styling, micro-animations, and transition easing following `frontend-ui-architect` design tokens and 60-30-10 palette rules.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- Angular signals: `signal()`, `computed()` used throughout `app.ts`.
- Notification banner system: `activeNotification()` in `app.ts` displaying notifications/toasts.
- Theme tokens: Dark/light CSS custom properties in `frontend/src/styles.css` and `frontend/src/app/app.css`.

### Established Patterns
- Standalone components in Angular 20.
- Angular CDK drag-and-drop (`cdkDropList`, `cdkDrag`, `CdkDragDrop`).
- `TaskFlowService` injecting `HttpClient`.

### Integration Points
- `frontend/src/app/app.config.ts`: Register `authRoleInterceptor` via `provideHttpClient(withInterceptors([authRoleInterceptor]))`.
- `frontend/src/app/services/taskflow.service.ts` or new `auth.service.ts`: Manage `activeRole` signal and `setRole()` method.
- `frontend/src/app/components/profile/`: New standalone `ProfileComponent`.
- `frontend/src/app/app.html` & `frontend/src/app/app.ts`: Header profile trigger, modal binding, and role-disabled button bindings.

</code_context>

<specifics>
## Specific Ideas
- Adhere strictly to `.agents/skills/frontend-ui-architect/SKILL.md` for tactile micro-interactions (hover lifts, active button scales, luminous focus glows).
- Ensure existing Angular Jasmine tests in `frontend/src/app/app.spec.ts` continue passing and frontend build succeeds with zero bundle errors.

</specifics>

<deferred>
## Deferred Ideas
- Persistent user accounts table with hashed passwords in SQLite (v2 AUTH-01).
- JWT session tokens replacing plaintext header identity (v2 AUTH-02).
- Avatar photo uploads (v2 AUTH-03).

</deferred>
