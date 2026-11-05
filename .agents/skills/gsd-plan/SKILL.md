---
name: gsd-plan
description: "Alias for gsd-plan-phase — Plan the current phase by breaking requirements into atomic tasks"
---

<objective>
Plan the active milestone phase using gsd-planner, checking boundaries and creating actionable PLAN files.
</objective>

<execution_context>
@.agents/gsd-core/workflows/plan-phase.md
@.agents/gsd-core/references/ui-brand.md
</execution_context>

<context>
Arguments: $ARGUMENTS
</context>

<process>
Follow .agents/gsd-core/workflows/plan-phase.md with $ARGUMENTS.
</process>

