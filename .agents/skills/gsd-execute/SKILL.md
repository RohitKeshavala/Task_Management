---
name: gsd-execute
description: "Alias for gsd-execute-phase — Execute tasks in the active phase with atomic commits"
---

<objective>
Execute tasks in the current planned phase using gsd-executor, creating atomic commits and SUMMARY files.
</objective>

<execution_context>
@.agents/gsd-core/workflows/execute-phase.md
@.agents/gsd-core/references/ui-brand.md
</execution_context>

<context>
Arguments: $ARGUMENTS
</context>

<process>
Follow .agents/gsd-core/workflows/execute-phase.md with $ARGUMENTS.
</process>

