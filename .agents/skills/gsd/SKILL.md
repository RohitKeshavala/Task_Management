---
name: gsd
description: "Master router and dispatcher for Get Shit Done (GSD) commands. Use for /gsd, /gsd auto, /gsd quick, /gsd next, /gsd plan, /gsd execute, /gsd verify, /gsd status, /gsd onboard, /gsd discuss, /gsd ship, /gsd review, or any spec-driven development task."
---

<objective>
Master entry point for Get Shit Done (GSD). GSD is a spec-driven development, context engineering, and subagent orchestration system designed to prevent context rot.

This skill dispatches `/gsd` invocations to the appropriate GSD workflow based on subcommands and arguments, or launches smart entry when invoked without arguments.
</objective>

<execution_context>
@.agents/gsd-core/workflows/smart-entry.md
@.agents/gsd-core/workflows/autonomous.md
@.agents/gsd-core/workflows/quick.md
@.agents/gsd-core/workflows/plan-phase.md
@.agents/gsd-core/workflows/execute-phase.md
@.agents/gsd-core/workflows/verify-work.md
@.agents/gsd-core/workflows/progress.md
@.agents/gsd-core/workflows/discuss-phase.md
@.agents/gsd-core/workflows/onboard.md
@.agents/gsd-core/workflows/new-project.md
@.agents/gsd-core/workflows/review.md
@.agents/gsd-core/workflows/ship.md
@.agents/gsd-core/workflows/debug.md
@.agents/gsd-core/workflows/help.md
@.agents/gsd-core/references/ui-brand.md
</execution_context>

<context>
User Arguments: $ARGUMENTS
</context>

<process>
### 1. Parse Subcommand from $ARGUMENTS

Inspect `$ARGUMENTS` (case-insensitive):

1. **Empty or `next`**:
   - Route to **Smart Entry** (`@.agents/gsd-core/workflows/smart-entry.md`).
   - Run `node .agents/gsd-core/bin/gsd-tools.cjs smart-entry --json` to inspect project state and display the recommended next action.

2. **`auto` or `autonomous`**:
   - Strip the `auto`/`autonomous` prefix and pass remaining flags (`--from`, `--to`, `--only`, `--interactive`) to **Autonomous Phase Loop** (`@.agents/gsd-core/workflows/autonomous.md`).
   - Orchestrates remaining milestone phases: Discuss → Plan → Execute → Verify in sequence.

3. **`quick [task]`**:
   - Strip the `quick` prefix and pass the task and flags (`--full`, `--validate`, `--discuss`, `--research`) to **Quick Task Workflow** (`@.agents/gsd-core/workflows/quick.md`).
   - Executes small tasks with atomic commits and `.planning/STATE.md` tracking while skipping full milestone overhead.

4. **`plan` or `plan-phase`**:
   - Route to **Plan Phase** (`@.agents/gsd-core/workflows/plan-phase.md`).
   - Invokes `gsd-planner` to decompose the phase scope into atomic, verifiable tasks.

5. **`execute` or `execute-phase` or `exec`**:
   - Route to **Execute Phase** (`@.agents/gsd-core/workflows/execute-phase.md`).
   - Spawns `gsd-executor` to implement tasks with atomic git commits and write `SUMMARY.md`.

6. **`verify` or `verify-work`**:
   - Route to **Verify Work** (`@.agents/gsd-core/workflows/verify-work.md`).
   - Runs `gsd-verifier` against acceptance criteria, typechecks, and automated tests.

7. **`status` or `progress` or `stats`**:
   - Route to **Progress & Status** (`@.agents/gsd-core/workflows/progress.md`).
   - Displays milestone completion, active phases, and quick tasks table.

8. **`discuss`**:
   - Route to **Discuss Phase** (`@.agents/gsd-core/workflows/discuss-phase.md`).
   - Clarifies architecture, requirements, and surfaces assumptions before planning.

9. **`onboard`**:
   - Route to **Codebase Onboarding** (`@.agents/gsd-core/workflows/onboard.md`).
   - Analyzes this existing codebase, generates `.planning/PROJECT.md`, architecture context, and roadmap.

10. **`new-project` or `init`**:
    - Route to **New Project** (`@.agents/gsd-core/workflows/new-project.md`).
    - Questions user on project goals and sets up initial roadmap.

11. **`review` or `code-review`**:
    - Route to **Code Review** (`@.agents/gsd-core/workflows/review.md`).
    - Dispatches `gsd-code-reviewer` to audit code quality, security, and standards.

12. **`ship` or `complete`**:
    - Route to **Ship / Complete Milestone** (`@.agents/gsd-core/workflows/ship.md`).
    - Runs final audits, archives phase state, and prepares delivery.

13. **`debug`**:
    - Route to **Debug Session** (`@.agents/gsd-core/workflows/debug.md`).
    - Creates and manages persistent debugging sessions with root-cause traces.

14. **`help`**:
    - Route to **GSD Help** (`@.agents/gsd-core/workflows/help.md`).
    - Displays full command guide and usage examples.

15. **Direct Task Description** (e.g., `/gsd implement tag filtering on task list`):
    - Check if `.planning/ROADMAP.md` exists and has an active phase:
      - If no active phase exists: Automatically execute as a **Quick Task** (`@.agents/gsd-core/workflows/quick.md`).
      - If active phase exists: Match to the active phase or prompt user if this should be executed as a quick task or planned into the roadmap.

### 2. Subagent Delegation Guarantee

When executing planned phases or quick tasks, always delegate heavy multi-file code writing, planning, and verification to the specialized GSD subagents (`gsd-planner`, `gsd-executor`, `gsd-verifier`, `gsd-code-reviewer`, `frontend-ui-designer`) to preserve clean context and prevent context rot.
</process>

