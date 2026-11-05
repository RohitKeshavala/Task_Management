---
name: gsd-auto
description: "Alias for gsd-autonomous — Run all remaining phases autonomously (discuss→plan→execute→verify)"
---

<objective>
Execute remaining milestone phases autonomously. Pauses only for user decisions or blockers.
</objective>

<execution_context>
@.agents/gsd-core/workflows/autonomous.md
@.agents/gsd-core/references/ui-brand.md
</execution_context>

<context>
Arguments: $ARGUMENTS
</context>

<process>
Follow .agents/gsd-core/workflows/autonomous.md with $ARGUMENTS.
</process>

