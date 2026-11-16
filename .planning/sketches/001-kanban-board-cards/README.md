---
sketch: "001"
name: kanban-board-cards
question: "How should the core Kanban board columns and task cards look and behave to feel like a modern, production-grade Linear / Raycast desktop app?"
winner: null
tags: [kanban, cards, micro-interactions, density]
---

# Sketch 001: Kanban Board & Task Cards

## Design Question
How should the core Kanban board columns and task cards look and behave to feel like a modern, production-grade Linear / Raycast desktop app?

## How to View
Open `.planning/sketches/001-kanban-board-cards/index.html` in your browser.

## Variants
- **A: Linear Minimal** — Razor-thin 1px borders, deep slate background (`#162032`), compact metadata pills, and hover-revealed action icons (`🔗`, `✕`).
- **B: Raycast Tactile Glass** — Frosted glass cards (`backdrop-filter: blur(12px)`), luminous border accents, pulsing blocker badges (`🛑 Blocked by #T-103`), and prominent action docks.
- **C: High-Density Monolith** — Structured enterprise card with dedicated top metadata strips, prerequisite checklist status, and keyboard shortcut hints (`↵ Start`, `D Done`).

## What to Look For
1. **Due Date & Deadline Precision**: Note how tasks due today are labeled `⏰ Due Today (Nov 5)` and NOT marked overdue while today is ongoing.
2. **Card Elevation**: Hover over cards to feel the subtle `translateY(-2px)` lift and ambient glow.
3. **DAG Blocker Visibility**: Notice how Variant B and Variant A present blocker dependencies cleanly.
