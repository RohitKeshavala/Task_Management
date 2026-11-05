# Antigravity `/gsd` (Get Shit Done) Core Guide & Command Reference

Welcome to **GSD Core** in TaskFlow — a spec-driven development, context engineering, and subagent orchestration system designed to eliminate **context rot** and deliver high-reliability full-stack implementations.

---

## 1. What is GSD (Get Shit Done) Core?

In standard long AI sessions, context window saturation (>50–70%) causes **context rot**: hallucinations, skipped edge cases, forgotten constraints, and regressed tests.

**GSD Core** solves this by:
1. **Spec-Driven Development**: Upfront requirements, architecture assumptions, and roadmaps are tracked in `.planning/`.
2. **Subagent Delegation**: Heavy multi-file planning, code execution, and verification run in dedicated, isolated subagents with fresh contexts (`gsd-planner`, `gsd-executor`, `gsd-verifier`).
3. **Atomic Verification Loops**: No task is marked complete without automated tests passing and state files updated.

```
                      User: /gsd [command | task]
                                 │
                                 ▼
                     [GSD Core Master Router]
                                 │
        ┌────────────────────────┼────────────────────────┐
        ▼                        ▼                        ▼
  /gsd next (Entry)         /gsd quick              /gsd auto
  Detects project state     Runs isolated quick     Runs full phased loop:
  & recommends next step    task with atomic        Discuss ─► Plan ─► Exec ─► Verify
                            commits & test gates    across all roadmap milestones
```

---

## 2. Command Reference

All GSD operations are accessible directly via **`/gsd`** slash commands:

### Operational & Execution Modes

| Command | Action | Description |
| :--- | :--- | :--- |
| **`/gsd`** or **`/gsd next`** | Smart Entry | Detects current repository state and recommends the next best action |
| **`/gsd auto`** | Autonomous Loop | Runs remaining phases end-to-end: Discuss → Plan → Execute → Verify |
| **`/gsd quick "<task>"`** | Quick Task | Fast execution with full atomic commits and verification (skips full roadmap overhead) |
| **`/gsd plan`** | Plan Phase | Dispatches `gsd-planner` to create atomic task plans for the active phase |
| **`/gsd execute`** | Execute Phase | Dispatches `gsd-executor` to write code, pass tests, and commit |
| **`/gsd verify`** | Verify Work | Dispatches `gsd-verifier` to audit deliverables against acceptance criteria |
| **`/gsd discuss`** | Architecture Discussion | Surfaces grey areas and locks decisions into `CONTEXT.md` |

### Project Setup & Management

| Command | Action | Description |
| :--- | :--- | :--- |
| **`/gsd onboard`** | Codebase Onboarding | Analyzes existing TaskFlow code and generates initial `.planning/` specs |
| **`/gsd new-project`** | Greenfield Init | Interactive interview to define a new project roadmap |
| **`/gsd status`** / **`progress`** | Progress Dashboard | Displays milestone metrics, completed tasks, and current phase |
| **`/gsd review`** | Code Review | Dispatches `gsd-code-reviewer` for quality, security, and standards checks |
| **`/gsd ship`** | Ship / Archive | Completes the current milestone, archives state, and prepares delivery |
| **`/gsd debug`** | Debug Session | Launches persistent root-cause debugging session |
| **`/gsd help`** | Help Tour | Shows usage guide and command reference |

> [!TIP]
> You can also use hyphenated aliases directly in chat:
> `/gsd-quick`, `/gsd-auto`, `/gsd-status`, `/gsd-plan`, `/gsd-execute`, `/gsd-verify`, `/gsd-onboard`.

---

## 3. Dedicated GSD Subagents

GSD comes equipped with specialized subagents located in `.agents/agents/`:

- **`gsd-planner`**: Deconstructs requirements into bite-sized, deterministic execution plans.
- **`gsd-executor`**: Implements code across frontend and backend with atomic git commits.
- **`gsd-verifier`**: Executes test suites (`npm run test:backend`, `npm run build:frontend`) and confirms acceptance criteria.
- **`gsd-code-reviewer`**: Rigorously inspects code for defects, anti-patterns, and security leaks.
- **`gsd-debugger`**: Systematic bug reproduction and diagnostic traces.
- **`frontend-ui-designer`**: Project's UI/UX architect for modern component styling, glassmorphism, and micro-interactions.

---

## 4. Ready-to-Test `/gsd` Missions on TaskFlow

Copy and paste these commands into the chat to see GSD Core in action:

### 🌟 Mission 1: Codebase Onboarding
> Map TaskFlow into GSD specs and generate the baseline `.planning/` documentation.

```text
/gsd onboard
```

---

### ⚡ Mission 2: Quick Feature Implementation
> Test how GSD executes an ad-hoc feature with atomic tracking and automated test verification.

```text
/gsd quick "Add a priority indicator pill (High/Medium/Low) to task cards in the frontend"
```

---

### 🚀 Mission 3: Autonomous Feature Loop
> Let GSD plan, execute, and verify a complete milestone autonomously.

```text
/gsd auto
```

---

### 🔍 Mission 4: Check Project Health & Status
> View current phase metrics and completed tasks table.

```text
/gsd status
```

