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
2. **Bug 2 (Unhandled Missing Due Date / NaN Comparator)** — **RESOLVED**:
   - Added validation guards for `null`, `undefined`, or invalid dates via `isNaN(time)`.
   - Undated tasks are deterministically placed at the bottom of the column without returning `NaN`, ensuring strict weak ordering and stable sorting.
3. **Bug 3 (Title Sort Direction Ignored / Missing Modifier)** — **ACTIVE**:
   - Omitted `* modifier` in the Title comparator: `(a.title || '').localeCompare(b.title || '')`.
   - Toggling sort direction (`▲ Asc` / `▼ Desc`) has no effect on Title sorting, leaving it permanently locked in ascending (A-Z) order.
