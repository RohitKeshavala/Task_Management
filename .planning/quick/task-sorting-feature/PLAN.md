# Quick Task Plan: Task Sorting & Order Control Feature

## Overview
Add a Task Sorting and Ordering feature to the Kanban board in TaskFlow.
Users can sort tasks across board columns by Priority, Due Date, and Title with Ascending/Descending direction toggling.
Intentionally keep 2 realistic bugs for testing and code review.

## Planned Changes
1. `frontend/src/app/models/taskflow.model.ts`:
   - Add `TaskSortField` ('', 'priority', 'dueDate', 'title') and `SortDirection` ('asc', 'desc').
2. `frontend/src/app/app.ts`:
   - Add `selectedSortField` and `sortDirection` signals.
   - Implement `sortedTasks` computed signal taking `filteredTasks()` and applying sort.
   - Update `todoTasks`, `inProgressTasks`, `doneTasks`, and `exportTasksToCsv` to use `sortedTasks()`.
   - Add `setSortField(field)` and `toggleSortDirection()`.
   - Update `activeFilterCount` and `clearAllFilters()`.
3. `frontend/src/app/app.html`:
   - Add Sort filter group to the Frosted Filter Control Bar with field select and direction toggle button.
4. `frontend/src/app/app.css`:
   - Style `.sort-controls-wrap`, `.sort-select-container`, `.sort-select-input`, `.btn-sort-direction`, `.sort-dir-icon`, and light-theme overrides.

## Included Bugs
- **Bug 1**: Alphabetical priority sorting with `localeCompare` instead of priority rank hierarchy.
- **Bug 2**: Missing empty/null check for `dueDate`, causing `NaN` in date comparator arithmetic.
