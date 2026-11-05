---
name: gsd-status
description: "Alias for gsd-progress — Check project progress, milestone completion, and task metrics"
---

<objective>
Display project progress, active phase status, and completed quick tasks from .planning/STATE.md.
</objective>

<execution_context>
@.agents/gsd-core/workflows/progress.md
@.agents/gsd-core/references/ui-brand.md
</execution_context>

<context>
Arguments: $ARGUMENTS
</context>

<process>
Follow .agents/gsd-core/workflows/progress.md with $ARGUMENTS.
</process>

