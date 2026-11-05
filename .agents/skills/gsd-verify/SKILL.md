---
name: gsd-verify
description: "Alias for gsd-verify-work — Verify phase completion, tests, and quality criteria"
---

<objective>
Verify phase deliverables using gsd-verifier, checking test suites, builds, and requirements conformance.
</objective>

<execution_context>
@.agents/gsd-core/workflows/verify-work.md
@.agents/gsd-core/references/ui-brand.md
</execution_context>

<context>
Arguments: $ARGUMENTS
</context>

<process>
Follow .agents/gsd-core/workflows/verify-work.md with $ARGUMENTS.
</process>

