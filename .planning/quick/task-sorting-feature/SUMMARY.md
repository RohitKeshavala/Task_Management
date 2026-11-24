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
1. **Bug 1 (Priority Alphabetical Ordering Flaw)** — **ACTIVE (Re-introduced)**:
   - Compares priority strings via `a.priority.localeCompare(b.priority) * modifier`.
   - Alphabetical comparison causes Descending sort to order `MEDIUM` → `LOW` → `HIGH` instead of `HIGH` → `MEDIUM` → `LOW`.
2. **Bug 2 (Unhandled Missing Due Date / NaN Comparator)** — **RESOLVED**:
   - Added validation guards for `null`, `undefined`, or invalid dates via `isNaN(time)`.
   - Undated tasks are deterministically placed at the bottom of the column without returning `NaN`, ensuring strict weak ordering and stable sorting.
3. **Bug 3 (Title Sort Direction Ignored / Missing Modifier)** — **RESOLVED**:
   - Added `* modifier` to Title comparator, properly reversing order when switching between Ascending and Descending.
