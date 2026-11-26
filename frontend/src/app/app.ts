import { Component, OnInit, OnDestroy, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TaskFlowService } from './services/taskflow.service';
import { Project, Task, TaskPriority, TaskStatus, Tag, UserRole, User, TaskSortField, SortDirection } from './models/taskflow.model';
import { ProfileComponent } from './components/profile/profile.component';
import { AuthModalComponent } from './components/auth/auth-modal.component';
import { UserManagementComponent } from './components/user-management/user-management.component';

export interface CalendarCell {
  day: number;
  dateString: string;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  isPast: boolean;
}

export interface AppNotification {
  type: 'danger' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  badgeText?: string;
  icon?: string;
  blockers?: string[];
  durationMs?: number;
}

export interface ConfirmDialogState {
  type: 'project' | 'task';
  id: string;
  title: string;
  itemName: string;
  message?: string;
  confirmButtonText?: string;
  isProcessing?: boolean;
}

export function formatDateToISO(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, ProfileComponent, AuthModalComponent, UserManagementComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit, OnDestroy {
  private service = inject(TaskFlowService);

  // Active Role & Permission State
  activeRole = this.service.activeRole;
  canDeleteProject = computed(() => this.activeRole() === 'ADMIN');
  canMutateTasks = computed(() => this.activeRole() !== 'VIEWER');
  canCreateProject = computed(() => this.activeRole() !== 'VIEWER');

  // Dual theme state ('dark' | 'light')
  currentTheme = signal<'dark' | 'light'>('dark');
  isDarkTheme = computed(() => this.currentTheme() === 'dark');

  // Core state
  projects = signal<Project[]>([]);
  selectedProjectId = signal<string>('');
  tasks = signal<Task[]>([]);
  allTags = signal<Tag[]>([]);
  selectedTagFilter = signal<string>('');
  selectedPriorityFilter = signal<TaskPriority | ''>('');
  searchQuery = signal<string>('');
  selectedSortField = signal<TaskSortField>('');
  sortDirection = signal<SortDirection>('asc');
  activeFilterCount = computed<number>(() => {
    let count = 0;
    if (this.selectedPriorityFilter()) count++;
    if (this.selectedTagFilter()) count++;
    if (this.searchQuery().trim()) count++;
    if (this.selectedSortField()) count++;
    return count;
  });
  loading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  // Drag and Drop state
  draggedTask = signal<Task | null>(null);
  draggedTaskId = computed(() => this.draggedTask()?.id || null);
  dragOverColumn = signal<TaskStatus | null>(null);
  dragCounts: Record<TaskStatus, number> = {
    TODO: 0,
    IN_PROGRESS: 0,
    DONE: 0,
  };

  // Modals state
  showNewTaskModal = signal<boolean>(false);
  showNewProjectModal = signal<boolean>(false);
  showDependencyModal = signal<boolean>(false);
  showProfileModal = signal<boolean>(false);
  showAuthModal = signal<boolean>(false);
  showUserManagementModal = signal<boolean>(false);

  currentUser = this.service.currentUser;
  isAuthenticated = this.service.isAuthenticated;

  // Top Floating Notification State (replaces native alert)
  activeNotification = signal<AppNotification | null>(null);
  private notificationTimer: any = null;

  // Custom Danger Confirmation Modal State (replaces native confirm)
  confirmDialog = signal<ConfirmDialogState | null>(null);

  // New task form fields
  newTaskTitle = signal<string>('');
  newTaskDescription = signal<string>('');
  newTaskPriority = signal<TaskPriority>('MEDIUM');
  newTaskDueDate = signal<string>('');
  selectedTagIds = signal<string[]>([]);
  selectedDependsOnTaskIds = signal<string[]>([]);

  // Validation state: disallow past dates for new tasks
  minSelectableDate = computed<string>(() => formatDateToISO(new Date()));
  dateValidationError = signal<string | null>(null);

  // Interactive Calendar Popover State
  showCalendarPicker = signal<boolean>(false);
  calendarViewDate = signal<Date>(new Date());

  calendarMonthYearLabel = computed<string>(() => {
    const d = this.calendarViewDate();
    return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  });

  calendarDays = computed<CalendarCell[]>(() => {
    const viewDate = this.calendarViewDate();
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const selectedDateStr = this.newTaskDueDate();
    const todayStr = formatDateToISO(new Date());

    const firstDayOfMonth = new Date(year, month, 1);
    // ISO weekday index: Monday=0, Sunday=6
    const startDayOfWeek = (firstDayOfMonth.getDay() + 6) % 7;

    const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const cells: CalendarCell[] = [];

    // Previous month padding days
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const day = daysInPrevMonth - i;
      const d = new Date(year, month - 1, day);
      const dateStr = formatDateToISO(d);
      cells.push({
        day,
        dateString: dateStr,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        isSelected: dateStr === selectedDateStr,
        isPast: dateStr < todayStr
      });
    }

    // Current month days
    for (let day = 1; day <= daysInCurrentMonth; day++) {
      const d = new Date(year, month, day);
      const dateStr = formatDateToISO(d);
      cells.push({
        day,
        dateString: dateStr,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
        isSelected: dateStr === selectedDateStr,
        isPast: dateStr < todayStr
      });
    }

    // Next month padding days (filling either 35 or 42 grid cells)
    const totalSlots = cells.length > 35 ? 42 : 35;
    const remaining = totalSlots - cells.length;
    for (let day = 1; day <= remaining; day++) {
      const d = new Date(year, month + 1, day);
      const dateStr = formatDateToISO(d);
      cells.push({
        day,
        dateString: dateStr,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        isSelected: dateStr === selectedDateStr,
        isPast: dateStr < todayStr
      });
    }

    return cells;
  });

  // Dependency modal state
  activeDependencyTask = signal<Task | null>(null);
  currentTaskDependencies = signal<Task[]>([]);
  currentTaskBlockers = signal<Task[]>([]);
  selectedNewDependencyId = signal<string>('');
  dependencyError = signal<string | null>(null);
  dependencyLoading = signal<boolean>(false);

  // Inline tag creation fields
  newTagName = signal<string>('');
  newTagColor = signal<string>('#3b82f6');
  colorPalette = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4'];

  // New project form fields
  newProjectName = signal<string>('');
  newProjectDescription = signal<string>('');

  // Computed columns
  selectedProject = computed(() => 
    this.projects().find(p => p.id === this.selectedProjectId()) || null
  );

  // Filtered tasks combining priority, tags, and live keyword search
  filteredTasks = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    if (!query) return this.tasks();

    return this.tasks().filter(task => {
      const matchTitle = (task.title || '').toLowerCase().includes(query);
      const matchDesc = (task.description || '').toLowerCase().includes(query);
      const matchTag = task.tags?.some(tag => tag.name.toLowerCase().includes(query)) ?? false;
      return matchTitle || matchDesc || matchTag;
    });
  });

  // Sorted and filtered tasks applying selected sort field and direction
  sortedTasks = computed(() => {
    const list = [...this.filteredTasks()];
    const field = this.selectedSortField();
    if (!field) return list;

    const modifier = this.sortDirection() === 'asc' ? 1 : -1;

    return list.sort((a, b) => {
      if (field === 'title') {
        return (a.title || '').localeCompare(b.title || '') * modifier;
      }

      if (field === 'priority') {
        const priorityWeight: Record<TaskPriority, number> = {
          LOW: 1,
          MEDIUM: 2,
          HIGH: 3,
        };
        const rankA = priorityWeight[a.priority] ?? 0;
        const rankB = priorityWeight[b.priority] ?? 0;
        return (rankA - rankB) * modifier;
      }

      if (field === 'dueDate') {
        const timeA = a.dueDate ? new Date(a.dueDate).getTime() : NaN;
        const timeB = b.dueDate ? new Date(b.dueDate).getTime() : NaN;
        const validA = !isNaN(timeA);
        const validB = !isNaN(timeB);

        // If one or both tasks lack a valid dueDate, push undated tasks to the end
        if (!validA && !validB) return 0;
        if (!validA) return 1;
        if (!validB) return -1;

        return (timeA - timeB) * modifier;
      }

      return 0;
    });
  });

  todoTasks = computed(() => 
    this.sortedTasks().filter(t => t.status === 'TODO')
  );

  inProgressTasks = computed(() => 
    this.sortedTasks().filter(t => t.status === 'IN_PROGRESS')
  );

  doneTasks = computed(() => 
    this.sortedTasks().filter(t => t.status === 'DONE')
  );

  // Candidate prerequisites available when creating a new task
  availableNewTaskPrerequisites = computed(() => 
    this.tasks()
  );

  // Candidate tasks available to add as prerequisites for activeDependencyTask
  availableDependencyCandidates = computed(() => {
    const active = this.activeDependencyTask();
    if (!active) return [];
    const currentDepIds = new Set(this.currentTaskDependencies().map(d => d.id));
    return this.tasks().filter(t => t.id !== active.id && !currentDepIds.has(t.id));
  });

  private keydownListener = (e: KeyboardEvent): void => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      const searchInput = document.getElementById('task-search-input');
      if (searchInput) {
        searchInput.focus();
      }
    }
  };

  ngOnInit(): void {
    this.initTheme();
    if (!this.service.isAuthenticated()) {
      this.showAuthModal.set(true);
    }
    this.loadProjects();
    this.loadTags();

    // Global keyboard listener for search quick focus (Ctrl+K / Cmd+K)
    window.addEventListener('keydown', this.keydownListener);
  }

  ngOnDestroy(): void {
    window.removeEventListener('keydown', this.keydownListener);
  }

  initTheme(): void {
    let savedTheme: 'dark' | 'light' = 'dark';
    try {
      const stored = localStorage.getItem('taskflow_theme');
      if (stored === 'light' || stored === 'dark') {
        savedTheme = stored;
      }
    } catch (e) {
      // localStorage may fail in restricted test contexts
    }
    this.setTheme(savedTheme);
  }

  toggleTheme(): void {
    const nextTheme: 'dark' | 'light' = this.currentTheme() === 'dark' ? 'light' : 'dark';
    this.setTheme(nextTheme);
  }

  setTheme(theme: 'dark' | 'light'): void {
    this.currentTheme.set(theme);
    try {
      localStorage.setItem('taskflow_theme', theme);
    } catch (e) {
      // ignore
    }
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme);
      if (theme === 'light') {
        document.body.classList.add('light-theme');
        document.body.classList.remove('dark-theme');
      } else {
        document.body.classList.add('dark-theme');
        document.body.classList.remove('light-theme');
      }
    }
  }

  loadProjects(): void {
    this.loading.set(true);
    this.errorMessage.set(null);
    this.service.getProjects().subscribe({
      next: (projs) => {
        this.projects.set(projs);
        if (projs.length > 0 && !this.selectedProjectId()) {
          this.selectedProjectId.set(projs[0].id);
          this.loadTasks();
        } else {
          this.loading.set(false);
        }
      },
      error: (err) => {
        this.errorMessage.set('Cannot connect to backend at http://localhost:3000. Is it running?');
        this.loading.set(false);
      }
    });
  }

  loadTags(): void {
    this.service.getTags().subscribe({
      next: (tags) => {
        this.allTags.set(tags);
      },
      error: (err) => {
        console.warn('Could not load tags:', err);
      }
    });
  }

  loadTasks(): void {
    const projId = this.selectedProjectId();
    if (!projId) return;

    this.loading.set(true);
    const filters: { projectId: string; tagId?: string; priority?: string } = { projectId: projId };
    if (this.selectedTagFilter()) {
      filters.tagId = this.selectedTagFilter();
    }
    if (this.selectedPriorityFilter()) {
      filters.priority = this.selectedPriorityFilter();
    }

    this.service.getTasks(filters).subscribe({
      next: (taskList) => {
        this.tasks.set(taskList);
        this.loading.set(false);
      },
      error: (err) => {
        this.errorMessage.set('Failed to load tasks.');
        this.loading.set(false);
      }
    });
  }

  onProjectChange(id: string): void {
    this.selectedProjectId.set(id);
    this.selectedTagFilter.set('');
    this.selectedPriorityFilter.set('');
    this.loadTasks();
  }

  setTagFilter(tagId: string): void {
    if (this.selectedTagFilter() === tagId) {
      this.selectedTagFilter.set('');
    } else {
      this.selectedTagFilter.set(tagId);
    }
    this.loadTasks();
  }

  setPriorityFilter(priority: TaskPriority | ''): void {
    if (this.selectedPriorityFilter() === priority) {
      this.selectedPriorityFilter.set('');
    } else {
      this.selectedPriorityFilter.set(priority);
    }
    this.loadTasks();
  }

  setSortField(field: TaskSortField): void {
    this.selectedSortField.set(field);
  }

  toggleSortDirection(): void {
    this.sortDirection.update(dir => dir === 'asc' ? 'desc' : 'asc');
  }

  clearAllFilters(): void {
    this.selectedPriorityFilter.set('');
    this.selectedTagFilter.set('');
    this.searchQuery.set('');
    this.selectedSortField.set('');
    this.sortDirection.set('asc');
    this.loadTasks();
  }

  onSearchInput(value: string): void {
    this.searchQuery.set(value);
  }

  clearSearch(): void {
    this.searchQuery.set('');
  }

  escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * Safely highlights search keyword occurrences in task cards:
   * 1. Splits unescaped text by captured query to match raw characters (e.g. '&', '<').
   * 2. HTML-escapes all parts individually to prevent XSS and entity corruption.
   * 3. Wraps matched parts in <mark> tags.
   */
  highlightSearchMatch(text: string): string {
    if (!text) return '';
    const query = this.searchQuery().trim();
    if (!query) return this.escapeHtml(text);

    const escapedQuery = query.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(`(${escapedQuery})`, 'gi');
    const parts = text.split(regex);

    return parts
      .map(part =>
        part.toLowerCase() === query.toLowerCase()
          ? `<mark class="search-highlight">${this.escapeHtml(part)}</mark>`
          : this.escapeHtml(part)
      )
      .join('');
  }

  /**
   * Safely escapes and neutralizes CSV values:
   * 1. Neutralizes formula injection (=, +, -, @, \t, \r) by prepending a single quote.
   * 2. Quotes fields containing commas, quotes, or newlines, and doubles embedded quotes.
   */
  escapeCsvField(field: unknown): string {
    if (field === null || field === undefined) return '';
    let str = String(field);
    if (/^[=+\-@\t\r]/.test(str)) {
      str = `'` + str;
    }
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }

  /**
   * Exports filtered tasks to CSV format with cell escaping and formula neutralization.
   */
  exportTasksToCsv(): void {
    const exportData = this.sortedTasks();
    if (!exportData || exportData.length === 0) {
      this.showNotification({
        type: 'warning',
        title: 'Export Skipped',
        message: 'No tasks to export in the current view.',
        badgeText: 'EXPORT'
      });
      return;
    }

    let csv = 'ID,Title,Description,Priority,Status,DueDate,Tags\n';
    exportData.forEach(t => {
      const tagList = t.tags ? t.tags.map(tag => tag.name).join(';') : '';
      const row = [
        this.escapeCsvField(t.id),
        this.escapeCsvField(t.title),
        this.escapeCsvField(t.description),
        this.escapeCsvField(t.priority),
        this.escapeCsvField(t.status),
        this.escapeCsvField(t.dueDate || ''),
        this.escapeCsvField(tagList)
      ].join(',') + '\n';
      csv += row;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `tasks-${this.selectedProjectId() || 'all'}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);

    this.showNotification({
      type: 'success',
      title: 'Tasks Exported',
      message: `Exported ${exportData.length} tasks to CSV successfully.`,
      badgeText: 'EXPORT',
      icon: '📥',
      durationMs: 3000
    });
  }

  openProfileModal(): void {
    this.showProfileModal.set(true);
  }

  closeProfileModal(): void {
    this.showProfileModal.set(false);
  }

  onRoleChange(newRole: UserRole): void {
    this.service.setRole(newRole);
    this.showNotification({
      type: 'info',
      title: 'Active Role Switched',
      message: `Simulated role changed to ${newRole}. Route guards and UI permissions updated.`,
      badgeText: 'ROLE CONTEXT',
      icon: newRole === 'ADMIN' ? '👑' : newRole === 'MEMBER' ? '⚡' : '👁️',
      durationMs: 3500,
    });
  }

  openNewTaskModal(): void {
    if (!this.canMutateTasks()) {
      this.showNotification({
        type: 'warning',
        title: 'Read-Only Mode',
        message: 'VIEWER role cannot create new tasks.',
        badgeText: 'RESTRICTION',
        icon: '👁️',
        durationMs: 3000,
      });
      return;
    }
    this.selectedTagIds.set([]);
    this.selectedDependsOnTaskIds.set([]);
    this.newTagName.set('');
    this.newTagColor.set('#3b82f6');
    this.showCalendarPicker.set(false);
    this.calendarViewDate.set(new Date());
    this.dateValidationError.set(null);
    this.showNewTaskModal.set(true);
  }

  // Interactive Calendar & Quick-Preset Methods
  toggleCalendarPicker(): void {
    const next = !this.showCalendarPicker();
    if (next && this.newTaskDueDate()) {
      const [y, m, d] = this.newTaskDueDate().split('-').map(Number);
      if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
        this.calendarViewDate.set(new Date(y, m - 1, d));
      }
    } else if (next) {
      this.calendarViewDate.set(new Date());
    }
    this.showCalendarPicker.set(next);
  }

  prevMonth(): void {
    const current = this.calendarViewDate();
    this.calendarViewDate.set(new Date(current.getFullYear(), current.getMonth() - 1, 1));
  }

  nextMonth(): void {
    const current = this.calendarViewDate();
    this.calendarViewDate.set(new Date(current.getFullYear(), current.getMonth() + 1, 1));
  }

  selectCalendarDate(dateStr: string): void {
    if (dateStr < this.minSelectableDate()) {
      this.dateValidationError.set('Due date cannot be in the past for new tasks.');
      return;
    }
    this.dateValidationError.set(null);
    this.newTaskDueDate.set(dateStr);
    const [y, m, d] = dateStr.split('-').map(Number);
    if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
      this.calendarViewDate.set(new Date(y, m - 1, d));
    }
  }

  setDatePreset(preset: 'today' | 'tomorrow' | 'nextWeek' | 'clear'): void {
    if (preset === 'clear') {
      this.newTaskDueDate.set('');
      this.dateValidationError.set(null);
      return;
    }
    const d = new Date();
    if (preset === 'tomorrow') {
      d.setDate(d.getDate() + 1);
    } else if (preset === 'nextWeek') {
      d.setDate(d.getDate() + 7);
    }
    const dateStr = formatDateToISO(d);
    this.newTaskDueDate.set(dateStr);
    this.dateValidationError.set(null);
    this.calendarViewDate.set(new Date(d));
  }

  onDueDateInput(val: string): void {
    this.newTaskDueDate.set(val);
    if (!val) {
      this.dateValidationError.set(null);
      return;
    }
    if (val < this.minSelectableDate()) {
      this.dateValidationError.set('Due date cannot be in the past for new tasks.');
    } else {
      this.dateValidationError.set(null);
    }
    const [y, m, d] = val.split('-').map(Number);
    if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
      this.calendarViewDate.set(new Date(y, m - 1, d));
    }
  }

  isPresetActive(preset: 'today' | 'tomorrow' | 'nextWeek'): boolean {
    const current = this.newTaskDueDate();
    if (!current) return false;
    const d = new Date();
    if (preset === 'tomorrow') {
      d.setDate(d.getDate() + 1);
    } else if (preset === 'nextWeek') {
      d.setDate(d.getDate() + 7);
    }
    return current === formatDateToISO(d);
  }

  toggleTagSelection(tagId: string): void {
    const current = this.selectedTagIds();
    if (current.includes(tagId)) {
      this.selectedTagIds.set(current.filter(id => id !== tagId));
    } else {
      this.selectedTagIds.set([...current, tagId]);
    }
  }

  isTagSelected(tagId: string): boolean {
    return this.selectedTagIds().includes(tagId);
  }

  toggleNewTaskDependency(taskId: string): void {
    const current = this.selectedDependsOnTaskIds();
    if (current.includes(taskId)) {
      this.selectedDependsOnTaskIds.set(current.filter(id => id !== taskId));
    } else {
      this.selectedDependsOnTaskIds.set([...current, taskId]);
    }
  }

  isNewTaskDependencySelected(taskId: string): boolean {
    return this.selectedDependsOnTaskIds().includes(taskId);
  }

  // Dependency Management Modal Methods
  openDependencyModal(task: Task): void {
    this.activeDependencyTask.set(task);
    this.dependencyError.set(null);
    this.selectedNewDependencyId.set('');
    this.showDependencyModal.set(true);
    this.loadDependenciesAndBlockers(task.id);
  }

  closeDependencyModal(): void {
    this.showDependencyModal.set(false);
    this.activeDependencyTask.set(null);
    this.dependencyError.set(null);
    this.selectedNewDependencyId.set('');
    this.currentTaskDependencies.set([]);
    this.currentTaskBlockers.set([]);
  }

  loadDependenciesAndBlockers(taskId: string): void {
    this.dependencyLoading.set(true);
    this.service.getTaskDependencies(taskId).subscribe({
      next: (deps) => {
        this.currentTaskDependencies.set(deps);
        this.service.getTaskBlockers(taskId).subscribe({
          next: (blockers) => {
            this.currentTaskBlockers.set(blockers);
            this.dependencyLoading.set(false);
          },
          error: (err) => {
            console.warn('Could not load blockers:', err);
            this.dependencyLoading.set(false);
          }
        });
      },
      error: (err) => {
        this.dependencyError.set('Failed to load dependencies: ' + (err.error?.error || err.message));
        this.dependencyLoading.set(false);
      }
    });
  }

  addDependencyToActiveTask(): void {
    const active = this.activeDependencyTask();
    const depId = this.selectedNewDependencyId();
    if (!active || !depId) return;

    this.dependencyLoading.set(true);
    this.dependencyError.set(null);

    this.service.addTaskDependency(active.id, depId).subscribe({
      next: () => {
        this.selectedNewDependencyId.set('');
        this.loadDependenciesAndBlockers(active.id);
        this.loadTasks(); // Refreshes task list & updated dependsOnTaskIds
      },
      error: (err) => {
        this.dependencyLoading.set(false);
        let errorMsg = 'Failed to add dependency';
        if (err.error?.cyclePath && Array.isArray(err.error.cyclePath)) {
          errorMsg = `Circular dependency detected: ${err.error.cyclePath.join(' → ')}`;
        } else if (err.error?.error) {
          errorMsg = err.error.error;
        } else if (err.error?.message) {
          errorMsg = err.error.message;
        } else if (err.message) {
          errorMsg = err.message;
        }
        this.dependencyError.set(errorMsg);
      }
    });
  }

  removeDependencyFromActiveTask(depId: string): void {
    const active = this.activeDependencyTask();
    if (!active) return;

    this.dependencyLoading.set(true);
    this.dependencyError.set(null);

    this.service.removeTaskDependency(active.id, depId).subscribe({
      next: () => {
        this.loadDependenciesAndBlockers(active.id);
        this.loadTasks(); // Refreshes task list & updated dependsOnTaskIds
      },
      error: (err) => {
        this.dependencyLoading.set(false);
        this.dependencyError.set('Failed to remove dependency: ' + (err.error?.error || err.message));
      }
    });
  }

  getBlockerCount(task: Task): number {
    if (!task.dependsOnTaskIds || task.dependsOnTaskIds.length === 0) return 0;
    const allTasks = this.tasks();
    return task.dependsOnTaskIds.filter(id => {
      const depTask = allTasks.find(t => t.id === id);
      return depTask ? depTask.status !== 'DONE' : false;
    }).length;
  }

  isPrereqBlocker(prereqId: string): boolean {
    return this.currentTaskBlockers().some(b => b.id === prereqId);
  }

  isTaskOverdue(task: Task): boolean {
    if (!task || task.status === 'DONE' || !task.dueDate) {
      return false;
    }

    const now = new Date();
    const dueDateStr = task.dueDate.trim();

    // If task.dueDate is in YYYY-MM-DD format (without time),
    // compare against the end of that local calendar day (23:59:59.999).
    if (/^\d{4}-\d{2}-\d{2}$/.test(dueDateStr)) {
      const [y, m, d] = dueDateStr.split('-').map(Number);
      if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
        const endOfDay = new Date(y, m - 1, d, 23, 59, 59, 999);
        return now.getTime() > endOfDay.getTime();
      }
    }

    // If task.dueDate contains ISO timestamp or other parseable date string
    const parsed = new Date(dueDateStr);
    if (isNaN(parsed.getTime())) {
      return false;
    }

    // If the due date falls on today in the user's local calendar,
    // it is not overdue while today is ongoing.
    const todayStr = formatDateToISO(now);
    if (formatDateToISO(parsed) === todayStr) {
      return false;
    }

    // Compare against the end of that local calendar day (23:59:59.999)
    const endOfDay = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate(), 23, 59, 59, 999);
    return now.getTime() > endOfDay.getTime();
  }

  isDueToday(task: Task): boolean {
    if (!task || task.status === 'DONE' || !task.dueDate || this.isTaskOverdue(task)) {
      return false;
    }

    const now = new Date();
    const dueDateStr = task.dueDate.trim();
    const todayStr = formatDateToISO(now);

    if (/^\d{4}-\d{2}-\d{2}$/.test(dueDateStr)) {
      return dueDateStr === todayStr;
    }

    const parsed = new Date(dueDateStr);
    if (isNaN(parsed.getTime())) {
      return false;
    }

    return formatDateToISO(parsed) === todayStr;
  }

  createNewTag(): void {
    const name = this.newTagName().trim();
    if (!name) return;
    const color = this.newTagColor() || '#3b82f6';

    const existing = this.allTags().find(t => t.name.toLowerCase() === name.toLowerCase());
    if (existing) {
      if (!this.selectedTagIds().includes(existing.id)) {
        this.selectedTagIds.update(ids => [...ids, existing.id]);
      }
      this.newTagName.set('');
      return;
    }

    this.service.createTag({ name, color }).subscribe({
      next: (tag) => {
        this.allTags.update(list => [...list, tag]);
        this.selectedTagIds.update(ids => [...ids, tag.id]);
        this.newTagName.set('');
      },
      error: (err) => {
        this.showNotification({
          type: 'danger',
          title: 'Tag Creation Failed',
          message: 'Failed to create tag: ' + (err.error?.error || err.message),
          durationMs: 5000
        });
      }
    });
  }

  createProject(): void {
    const name = this.newProjectName().trim();
    if (!name) return;

    this.service.createProject({
      name,
      description: this.newProjectDescription().trim(),
    }).subscribe({
      next: (created) => {
        this.projects.update(list => [created, ...list]);
        this.selectedProjectId.set(created.id);
        this.selectedTagFilter.set('');
        this.selectedPriorityFilter.set('');
        this.newProjectName.set('');
        this.newProjectDescription.set('');
        this.showNewProjectModal.set(false);
        this.loadTasks();
      },
      error: (err) => {
        this.showNotification({
          type: 'danger',
          title: 'Project Creation Failed',
          message: 'Failed to create project: ' + (err.error?.error || err.message),
          durationMs: 5000
        });
      }
    });
  }

  createTask(): void {
    const projId = this.selectedProjectId();
    const title = this.newTaskTitle().trim();
    if (!projId || !title) return;

    const dueDateVal = this.newTaskDueDate();
    if (dueDateVal && dueDateVal < this.minSelectableDate()) {
      this.dateValidationError.set('Due date cannot be in the past for new tasks.');
      return;
    }

    this.service.createTask({
      projectId: projId,
      title,
      description: this.newTaskDescription().trim(),
      priority: this.newTaskPriority(),
      status: 'TODO',
      dueDate: dueDateVal ? dueDateVal : null,
      tagIds: this.selectedTagIds(),
      dependsOnTaskIds: this.selectedDependsOnTaskIds(),
    }).subscribe({
      next: (created) => {
        const activeTag = this.selectedTagFilter();
        const activePriority = this.selectedPriorityFilter();
        const matchesTag = !activeTag || created.tags?.some(t => t.id === activeTag);
        const matchesPriority = !activePriority || created.priority === activePriority;

        if (matchesTag && matchesPriority) {
          this.tasks.update(list => [created, ...list]);
        } else {
          this.selectedTagFilter.set('');
          this.selectedPriorityFilter.set('');
          this.loadTasks();
        }
        this.newTaskTitle.set('');
        this.newTaskDescription.set('');
        this.newTaskPriority.set('MEDIUM');
        this.newTaskDueDate.set('');
        this.dateValidationError.set(null);
        this.selectedTagIds.set([]);
        this.selectedDependsOnTaskIds.set([]);
        this.newTagName.set('');
        this.showCalendarPicker.set(false);
        this.showNewTaskModal.set(false);
      },
      error: (err) => {
        this.showNotification({
          type: 'danger',
          title: 'Task Creation Failed',
          message: 'Failed to create task: ' + (err.error?.error || err.message),
          durationMs: 5000
        });
      }
    });
  }

  updateStatus(task: Task, newStatus: TaskStatus): void {
    const previousStatus = task.status;
    if (previousStatus === newStatus) return;

    // Optimistically update status in local signal state
    this.tasks.update(list => list.map(t => t.id === task.id ? { ...t, status: newStatus } : t));

    this.service.updateTaskStatus(task.id, newStatus).subscribe({
      next: (updated) => {
        this.tasks.update(list => list.map(t => t.id === updated.id ? updated : t));
      },
      error: (err) => {
        // Roll back optimistic update if request fails
        this.tasks.update(list => list.map(t => t.id === task.id ? { ...t, status: previousStatus } : t));
        const errorObj = err.error || {};
        const message = errorObj.message || errorObj.error || err.message || 'Unknown error';
        const blockerTasks = errorObj.blockingTasks || [];
        const blockerNames: string[] = blockerTasks.map((b: any) => 
          b.title ? `${b.title} (${b.status})` : `${b.id} (${b.status})`
        );

        this.showNotification({
          type: 'danger',
          title: 'Status Transition Blocked',
          message,
          badgeText: 'PREREQUISITE GUARD',
          icon: '🛑',
          blockers: blockerNames,
          durationMs: 7000
        });
      }
    });
  }

  // Drag and Drop handlers
  onDragStart(event: DragEvent, task: Task): void {
    if (event.dataTransfer) {
      event.dataTransfer.setData('text/plain', task.id);
      event.dataTransfer.effectAllowed = 'move';
    }
    this.draggedTask.set(task);
  }

  onDragEnter(event: DragEvent, status: TaskStatus): void {
    event.preventDefault();
    this.dragCounts[status] = (this.dragCounts[status] || 0) + 1;
    // Highlight only if dragging a task to a different status column
    if (this.draggedTask() && this.draggedTask()?.status !== status) {
      this.dragOverColumn.set(status);
    } else if (!this.draggedTask()) {
      this.dragOverColumn.set(status);
    }
  }

  onDragOver(event: DragEvent, status: TaskStatus): void {
    event.preventDefault();
    if (this.draggedTask() && this.draggedTask()?.status === status) {
      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = 'none';
      }
      return;
    }
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
    if (this.dragOverColumn() !== status) {
      this.dragOverColumn.set(status);
    }
  }

  onDragLeave(event: DragEvent, status: TaskStatus): void {
    const currentTarget = event.currentTarget as HTMLElement | null;
    const relatedTarget = event.relatedTarget as Node | null;
    if (currentTarget && relatedTarget && currentTarget.contains(relatedTarget)) {
      return;
    }
    this.dragCounts[status] = Math.max(0, (this.dragCounts[status] || 0) - 1);
    if (this.dragCounts[status] === 0 && this.dragOverColumn() === status) {
      this.dragOverColumn.set(null);
    }
  }

  onDragEnd(): void {
    this.draggedTask.set(null);
    this.dragOverColumn.set(null);
    this.dragCounts = { TODO: 0, IN_PROGRESS: 0, DONE: 0 };
  }

  onDrop(event: DragEvent, targetStatus: TaskStatus): void {
    event.preventDefault();
    this.dragCounts[targetStatus] = 0;
    this.dragOverColumn.set(null);

    const transferredId = event.dataTransfer?.getData('text/plain');
    let task: Task | null = null;
    if (transferredId) {
      task = this.tasks().find(t => t.id === transferredId) || null;
    }
    if (!task && this.draggedTask()) {
      task = this.draggedTask();
    }
    this.draggedTask.set(null);

    if (!task) return;
    if (task.status !== targetStatus) {
      this.updateStatus(task, targetStatus);
    }
  }

  showNotification(notif: AppNotification): void {
    if (this.notificationTimer) {
      clearTimeout(this.notificationTimer);
      this.notificationTimer = null;
    }
    const duration = notif.durationMs ?? 7000;
    this.activeNotification.set({ ...notif, durationMs: duration });

    if (duration > 0) {
      this.notificationTimer = setTimeout(() => {
        this.dismissNotification();
      }, duration);
    }
  }

  dismissNotification(): void {
    if (this.notificationTimer) {
      clearTimeout(this.notificationTimer);
      this.notificationTimer = null;
    }
    this.activeNotification.set(null);
  }

  openDeleteProjectConfirm(projectId?: string): void {
    if (!this.canDeleteProject()) {
      this.showNotification({
        type: 'danger',
        title: 'Permission Denied',
        message: 'Only ADMIN role is authorized to delete projects.',
        badgeText: 'RESTRICTION',
        icon: '🛑',
        durationMs: 4000,
      });
      return;
    }
    const id = projectId || this.selectedProjectId();
    if (!id) return;
    const project = this.projects().find(p => p.id === id);
    const name = project?.name || 'Current Project';

    this.confirmDialog.set({
      type: 'project',
      id,
      title: 'Delete Project',
      itemName: name,
      message: 'All tasks, tags, and dependencies associated with this project will be permanently removed.',
      confirmButtonText: 'Delete Project',
      isProcessing: false
    });
  }

  openDeleteTaskConfirm(task: Task): void {
    if (!this.canMutateTasks()) {
      this.showNotification({
        type: 'warning',
        title: 'Read-Only Mode',
        message: 'VIEWER role cannot delete tasks.',
        badgeText: 'RESTRICTION',
        icon: '👁️',
        durationMs: 3000,
      });
      return;
    }
    this.confirmDialog.set({
      type: 'task',
      id: task.id,
      title: 'Delete Task',
      itemName: task.title,
      message: 'This task will be permanently removed from the project board along with any dependent links.',
      confirmButtonText: 'Delete Task',
      isProcessing: false
    });
  }

  closeConfirmDialog(): void {
    this.confirmDialog.set(null);
  }

  executeConfirmAction(): void {
    const state = this.confirmDialog();
    if (!state || state.isProcessing) return;

    this.confirmDialog.update(s => s ? { ...s, isProcessing: true } : null);

    if (state.type === 'project') {
      this.service.deleteProject(state.id).subscribe({
        next: () => {
          this.closeConfirmDialog();
          const remaining = this.projects().filter(p => p.id !== state.id);
          this.projects.set(remaining);
          if (remaining.length > 0) {
            this.selectedProjectId.set(remaining[0].id);
            this.selectedTagFilter.set('');
            this.selectedPriorityFilter.set('');
            this.loadTasks();
          } else {
            this.selectedProjectId.set('');
            this.tasks.set([]);
          }
          this.showNotification({
            type: 'success',
            title: 'Project Deleted',
            message: `Project "${state.itemName}" was deleted successfully.`,
            icon: '✓',
            durationMs: 4000
          });
        },
        error: (err) => {
          this.closeConfirmDialog();
          this.showNotification({
            type: 'danger',
            title: 'Deletion Failed',
            message: 'Failed to delete project: ' + (err.error?.error || err.message),
            durationMs: 6000
          });
        }
      });
    } else if (state.type === 'task') {
      this.service.deleteTask(state.id).subscribe({
        next: () => {
          this.closeConfirmDialog();
          this.tasks.update(list => list.filter(t => t.id !== state.id));
          this.showNotification({
            type: 'success',
            title: 'Task Deleted',
            message: `Task "${state.itemName}" was removed successfully.`,
            icon: '✓',
            durationMs: 4000
          });
        },
        error: (err) => {
          this.closeConfirmDialog();
          this.showNotification({
            type: 'danger',
            title: 'Deletion Failed',
            message: 'Failed to delete task: ' + (err.error?.error || err.message),
            durationMs: 6000
          });
        }
      });
    }
  }

  deleteTask(id: string): void {
    const task = this.tasks().find(t => t.id === id);
    if (task) {
      this.openDeleteTaskConfirm(task);
    }
  }

  deleteProject(id?: string): void {
    this.openDeleteProjectConfirm(id);
  }

  openAuthModal(): void {
    this.showAuthModal.set(true);
  }

  closeAuthModal(): void {
    this.showAuthModal.set(false);
  }

  onAuthenticated(user: User): void {
    this.showAuthModal.set(false);
    this.showNotification({
      type: 'success',
      title: 'Welcome Back',
      message: `Signed in as ${user.username} (${user.role}).`,
      icon: '✓',
      durationMs: 4000
    });
    this.loadProjects();
    this.loadTags();
  }

  openUserManagementModal(): void {
    if (this.activeRole() !== 'ADMIN') {
      this.showNotification({
        type: 'danger',
        title: 'Permission Denied',
        message: 'Only administrators can access User Role Governance.',
        icon: '⚠️',
        durationMs: 5000
      });
      return;
    }
    this.showUserManagementModal.set(true);
  }

  closeUserManagementModal(): void {
    this.showUserManagementModal.set(false);
  }

  handleLogout(): void {
    this.service.logout();
    this.showProfileModal.set(false);
    this.showAuthModal.set(true);
    this.showNotification({
      type: 'info',
      title: 'Signed Out',
      message: 'You have been successfully logged out.',
      icon: 'ℹ️',
      durationMs: 4000
    });
  }

  onUserRoleChanged(event: { userId: string; role: UserRole }): void {
    this.showNotification({
      type: 'success',
      title: 'Role Updated',
      message: `User permissions updated to ${event.role}.`,
      icon: '✓',
      durationMs: 3000
    });
  }
}
