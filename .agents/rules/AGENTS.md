# Workspace Agent Rules & Guidelines

## 1. GSD (Get Shit Done) Core Framework Guidelines

When executing tasks via `/gsd` or any `/gsd-*` command in this repository:

1. **Spec-Driven Architecture**:
   - Always maintain and consult `.planning/` state files (`PROJECT.md`, `ROADMAP.md`, `STATE.md`).
   - Every phase follows the strict life-cycle loop: **Discuss → Plan → Execute → Verify → Ship**.

2. **Prevent Context Rot via Subagent Delegation**:
   - Do NOT execute long multi-phase tasks in a single bloated context.
   - Spawn and coordinate specialized GSD subagents:
     - `gsd-planner`: For breaking phase requirements into atomic tasks.
     - `gsd-executor`: For executing implementation waves with atomic commits.
     - `gsd-verifier`: For validating tests, typechecks, and requirements.
     - `gsd-code-reviewer`: For code quality, security, and standards review.
     - `frontend-ui-designer`: For dedicated UI/UX and styling tasks.

3. **Atomic Execution & Verification Gates**:
   - Quick tasks (`/gsd quick`) must update `.planning/STATE.md` and make atomic commits.
   - Always run verification (`npm run test:backend` and `npm run build:frontend`) before marking a phase or quick task complete.

---

## 2. Frontend UI & Design Guidelines

When working on any frontend, UI, styling, or component task in this repository:

1. **Activate the `frontend-ui-architect` Skill**:
   - Refer to [.agents/skills/frontend-ui-architect/SKILL.md](../skills/frontend-ui-architect/SKILL.md) for the 6-step UI Decision Framework.
   - Use tokens from [.agents/skills/frontend-ui-architect/references/design-tokens.md](../skills/frontend-ui-architect/references/design-tokens.md).
   - Use component patterns from [.agents/skills/frontend-ui-architect/references/component-patterns.md](../skills/frontend-ui-architect/references/component-patterns.md).

2. **Engage the `frontend-ui-designer` Agent**:
   - For new views, complex layout redesigns, or visual polish overhauls, invoke or collaborate with the `frontend-ui-designer` subagent.

3. **Enforce Visual Polish Standards**:
   - Avoid flat single-tone gray boxes; always incorporate depth, layered slate surfaces, 1px subtle translucent borders, and soft ambient shadows.
   - Enforce the 60-30-10 color harmony rule with purposeful luminous accents.
   - Include tactile micro-interactions: card hover lifts (`translateY(-2px)`), button active states (`scale(0.97)`), and glowing focus rings.
   - Always run the 10-point audit from [.agents/skills/frontend-ui-architect/references/visual-polish-checklist.md](../skills/frontend-ui-architect/references/visual-polish-checklist.md) before finishing.


