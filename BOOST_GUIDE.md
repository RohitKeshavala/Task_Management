# Antigravity `/boost` Mastery & Testing Guide

Welcome to **TaskFlow** — a full-stack demo application built specifically for mastering Antigravity's **`/boost`** slash command.

---

## 1. What is the `/boost` Action?

In Antigravity, normal prompts execute tasks directly. However, when you prefix your request with **`/boost`**, the agent enters **Autonomous Orchestrator Mode**:

1. **Strategic Decomposition**: Rather than jumping directly into shallow edits, `/boost` evaluates whether the task is an **Implementation/Coding** task or an **Investigation/Debugging** task.
2. **Specialized Deep Subagents**:
   - **`DeepCoder`**: Dedicated subagent specializing in multi-file architecture, schema migrations, backend service contracts, frontend components, and automated test writing.
   - **`DeepInvestigator`**: Dedicated subagent specializing in reproducing bugs, diagnosing root causes, writing regression tests, and resolving elusive errors.
3. **Automated Verification Loop**: Boost doesn't stop after writing code. It runs tests (e.g. `npm test`) and typechecks. If a test fails or an edge case breaks, it automatically initiates follow-up rounds until all criteria are satisfied.

```
User: /boost <Task Description>
   │
   ▼
[Orchestrator Decision]
   ├── Coding / Feature ──────► [DeepCoder Subagent]
   └── Bug / Investigation ───► [DeepInvestigator Subagent]
         │
         ▼
   [Automated Verification: Vitest / ng build / Linter]
         │
         ├── Fails / Edge Case Unhandled ──► [Auto-Retry Round with Delta]
         └── Passes All Criteria ──────────► [Verified Solution Delivered]
```

---

## 2. When to Use `/boost` vs Standard Prompts

| Task Type | Standard Prompt | `/boost` Prompt |
| :--- | :--- | :--- |
| **Simple Fix** (Typo, 1-line CSS adjustment) | ✅ Ideal (fast, lightweight) | ❌ Overkill |
| **Questions / Explanations** | ✅ Ideal | ❌ Not needed |
| **New Full-Stack Feature** (DB + API + UI + Tests) | ⚠️ Often misses edge cases | ✅ **Primary Use Case** |
| **Complex Business Logic** (DAG cycles, states) | ⚠️ Prone to shallow logic | ✅ **Deep algorithmic design** |
| **Debugging Subtle Issues / Race Conditions** | ⚠️ Guesswork edits | ✅ **DeepInvestigator diagnostic loops** |
| **Refactoring with Zero Regressions** | ⚠️ Can break existing tests | ✅ **Automated regression verification** |

---

## 3. The 4-Pillar `/boost` Prompting Formula

To get the most out of `/boost`, structure your prompt with these 4 pillars:

```markdown
/boost
1. Objective: [What do you want to accomplish?]
2. Technical Requirements:
   - [Schema / Database changes]
   - [API routes, methods, and status codes]
   - [Frontend UI updates or new components]
3. Edge Cases to Guard Against:
   - [e.g. circular loops, duplicate records, unauthorized transitions]
4. Verification:
   - [Commands to run: e.g. `npm test` in backend, `ng build` in frontend]
```

---

## 4. Ready-to-Test `/boost` Missions on TaskFlow

Here are 5 concrete missions you can copy and test right now in this chat:

---

### 🌟 Mission 1: Feature Implementation (Tags & Color Labels)
> **Goal**: Test how `DeepCoder` builds a full feature spanning SQLite schema, Express API, Angular UI, and Vitest tests.

**Copy & Paste this into Chat:**
```markdown
/boost Add a complete "Tags & Labels" system to TaskFlow:
1. Backend:
   - Create a `tags` table (id, name, color, createdAt) and a `task_tags` join table.
   - Endpoints: GET /api/tags, POST /api/tags, POST /api/tasks/:id/tags, DELETE /api/tasks/:id/tags/:tagId.
   - Filtering: Support GET /api/tasks?tagId=:tagId.
2. Frontend (Angular):
   - Display colorful tag pills on task cards.
   - Allow selecting or creating tags in the "Create Task" modal.
3. Verification:
   - Write integration tests in `backend/tests/tags.test.ts` covering tag creation, association, and filtering.
   - Ensure `npm test` passes in backend and `npm run build` passes in frontend.
```

---

### 🧠 Mission 2: Algorithmic Business Logic (Dependency Engine)
> **Goal**: See how `DeepCoder` implements graph algorithms (DAG cycle detection) and rule-based status transitions.

**Copy & Paste this into Chat:**
```markdown
/boost Implement a "Task Dependency Engine" in TaskFlow:
1. Requirements:
   - Add a `task_dependencies` table (taskId, dependsOnTaskId).
   - Cycle Prevention: Prevent circular dependencies (A depends on B, B depends on C, C cannot depend on A). If detected, reject with 400 Bad Request and explain the cycle path in the response.
   - Status Guard: A task cannot transition to IN_PROGRESS or DONE if any prerequisite task is not in DONE status.
   - API: GET /api/tasks/:id/blockers returning all unfinished prerequisite tasks.
2. Verification:
   - Write Vitest tests verifying: valid dependency creation, rejection of direct/indirect circular dependencies, and rejection of unauthorized status transitions.
```

---

### 🔍 Mission 3: Deep Bug Investigation (Timezone Due-Date Drift)
> **Goal**: See how `DeepInvestigator` reproduces a bug, identifies the root cause, and resolves it cleanly.

**Copy & Paste this into Chat:**
```markdown
/boost Investigate and fix task due-date overdue calculation:
1. Problem:
   - Tasks due at 23:59:00 UTC are showing as overdue prematurely for users in timezones east of UTC (e.g. UTC+5:30), while showing active for users in UTC-5.
2. Investigation:
   - Reproduce the timezone drift with a failing test case in backend/tests/due_date.test.ts.
   - Diagnose root cause in date parsing/comparison.
   - Implement a robust ISO-8601 UTC-normalized comparison utility.
   - Verify all tests pass without timezone-dependent flakiness.
```

---

### 🛡️ Mission 4: Architectural Refactoring & RBAC
> **Goal**: Test how `/boost` adds cross-cutting authorization across all existing endpoints with zero regression.

**Copy & Paste this into Chat:**
```markdown
/boost Refactor TaskFlow to support Role-Based Access Control (RBAC):
1. Roles:
   - ADMIN: Full access to all endpoints.
   - MEMBER: Can create/update tasks and view projects, but cannot delete projects.
   - VIEWER: Read-only access (GET only). Any POST/PUT/DELETE returns 403 Forbidden.
2. Implementation:
   - Auth middleware reading `x-user-role` header (defaulting to MEMBER if omitted).
   - Enforce permission guards across all project and task routes.
3. Verification:
   - Add unit tests verifying permission boundaries for each role.
   - Ensure all existing 11 test cases in `backend/tests/api.test.ts` still pass without regressions.
```

---

### ⚡ Mission 5: Outbound Webhook Dispatcher
> **Goal**: Test how `/boost` creates asynchronous event processing with retry and error handling.

**Copy & Paste this into Chat:**
```markdown
/boost Build an outbound Webhook Dispatcher in TaskFlow:
1. Requirements:
   - Register webhook URLs listening to events (`task.created`, `task.status_changed`, `project.created`).
   - When an event occurs, dispatch an HTTP POST request to registered webhook URLs with event payload and HMAC-SHA256 signature in `x-taskflow-signature`.
   - Implement exponential backoff retry (up to 3 attempts) on network/HTTP 5xx failure.
   - Maintain delivery history in `webhook_deliveries` table.
2. Verification:
   - Write comprehensive tests using mock HTTP handlers in Vitest verifying dispatch, retry backoff, and signature verification.
```

---

## 5. How to Run TaskFlow Locally

### Quick Start (Separate Terminals)

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
# Running on http://localhost:3000
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm start
# Running on http://localhost:4200
```

### Running Backend Tests
```bash
cd backend
npm test
```

### Building the Entire Stack
```bash
npm run build:backend
npm run build:frontend
```

