---
status: complete
date: "2026-11-23"
slug: task-sorting-feature
---

# Quick Task Summary: Task Sorting & Order Controls

## Delivered Feature
Added an interactive **Task Sorting & Ordering System** to TaskFlow's Kanban board.
- Sort tasks across columns (TO DO, IN PROGRESS, DONE) by:
  - **Priority**
  - **Due Date**
  - **Title (Alphabetical)**
- Ascending (↑) and Descending (↓) toggle controls.
- Clean integration with Frosted Filter Bar, active filter counter, and "Clear Filters".
- Export CSV automatically exports tasks in the selected sorted order.

## Planted Bugs for Review / Debugging
1. **Bug 1 (Priority Alphabetical Ordering Flaw)** — **RESOLVED**:
   - Replaced `localeCompare` with `priorityWeight` numeric mapping (`LOW: 1, MEDIUM: 2, HIGH: 3`).
   - Ascending now orders `LOW` → `MEDIUM` → `HIGH`; Descending orders `HIGH` → `MEDIUM` → `LOW`.
2. **Bug 2 (Unhandled Missing Due Date / NaN Comparator)** — **ACTIVE (Re-introduced)**:
   - Evaluates `new Date(a.dueDate || '').getTime()`, producing `NaN` for missing due dates.
   - Returning `NaN` violates strict weak ordering in `Array.prototype.sort()`, causing erratic task placement.
