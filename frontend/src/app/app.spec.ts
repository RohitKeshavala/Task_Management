import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { App, formatDateToISO } from './app';
import { TaskFlowService } from './services/taskflow.service';
import { Task, Project } from './models/taskflow.model';

describe('App Component', () => {
  let fixture: ComponentFixture<App>;
  let app: App;
  let service: TaskFlowService;

  const sampleProject: Project = {
    id: 'proj-1',
    name: 'Sample Project',
    description: 'Sample description',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const sampleTodoTask: Task = {
    id: 'task-todo-1',
    projectId: 'proj-1',
    title: 'Design UI',
    description: 'Create Kanban UI',
    priority: 'HIGH',
    status: 'TODO',
    dueDate: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tags: [],
  };

  const sampleProgressTask: Task = {
    id: 'task-prog-1',
    projectId: 'proj-1',
    title: 'Implement DND',
    description: 'Add drag and drop handlers',
    priority: 'MEDIUM',
    status: 'IN_PROGRESS',
    dueDate: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tags: [],
  };

  const sampleDoneTask: Task = {
    id: 'task-done-1',
    projectId: 'proj-1',
    title: 'Write Docs',
    description: 'Update BOOST_GUIDE',
    priority: 'LOW',
    status: 'DONE',
    dueDate: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tags: [],
  };

  function createMockDataTransfer() {
    const store: Record<string, string> = {};
    return {
      setData: jasmine.createSpy('setData').and.callFake((k: string, v: string) => {
        store[k] = v;
      }),
      getData: jasmine.createSpy('getData').and.callFake((k: string) => store[k] || ''),
      effectAllowed: 'uninitialized',
      dropEffect: 'none',
    };
  }

  function createMockDragEvent(dataTransfer: any = null, relatedTarget: Node | null = null, currentTarget: HTMLElement | null = null): DragEvent {
    return {
      preventDefault: jasmine.createSpy('preventDefault'),
      stopPropagation: jasmine.createSpy('stopPropagation'),
      dataTransfer,
      relatedTarget,
      currentTarget,
    } as unknown as DragEvent;
  }

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(App);
    app = fixture.componentInstance;
    service = TestBed.inject(TaskFlowService);
    app.onRoleChange('ADMIN');
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should create the TaskFlow app component', () => {
    expect(app).toBeTruthy();
  });

  it('should render TaskFlow branding in navbar', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.logo-title')?.textContent).toContain('TaskFlow');
  });

  it('should toggle new task modal visibility', () => {
    expect(app.showNewTaskModal()).toBe(false);
    app.showNewTaskModal.set(true);
    expect(app.showNewTaskModal()).toBe(true);
  });

  describe('Drag and Drop Functionality', () => {
    beforeEach(() => {
      app.projects.set([sampleProject]);
      app.selectedProjectId.set(sampleProject.id);
      app.tasks.set([sampleTodoTask, sampleProgressTask, sampleDoneTask]);
      fixture.detectChanges();
    });

    it('should initialize with null drag states', () => {
      expect(app.draggedTask()).toBeNull();
      expect(app.draggedTaskId()).toBeNull();
      expect(app.dragOverColumn()).toBeNull();
    });

    it('should set draggedTask and populate dataTransfer on dragstart', () => {
      const mockDT = createMockDataTransfer();
      const event = createMockDragEvent(mockDT);

      app.onDragStart(event, sampleTodoTask);

      expect(app.draggedTask()).toEqual(sampleTodoTask);
      expect(app.draggedTaskId()).toBe(sampleTodoTask.id);
      expect(mockDT.setData).toHaveBeenCalledWith('text/plain', sampleTodoTask.id);
      expect(mockDT.effectAllowed).toBe('move');
    });

    it('should handle dragstart when dataTransfer is null', () => {
      const event = createMockDragEvent(null);

      app.onDragStart(event, sampleTodoTask);

      expect(app.draggedTask()).toEqual(sampleTodoTask);
      expect(app.draggedTaskId()).toBe(sampleTodoTask.id);
    });

    it('should set dropEffect and update dragOverColumn on dragover', () => {
      const mockDT = createMockDataTransfer();
      const event = createMockDragEvent(mockDT);

      app.onDragOver(event, 'IN_PROGRESS');

      expect(event.preventDefault).toHaveBeenCalled();
      expect(mockDT.dropEffect).toBe('move');
      expect(app.dragOverColumn()).toBe('IN_PROGRESS');
    });

    it('should clear dragOverColumn on dragleave when leaving the column', () => {
      app.dragOverColumn.set('TODO');
      const columnEl = document.createElement('div');
      const outsideEl = document.createElement('div');
      const event = createMockDragEvent(null, outsideEl, columnEl);

      app.onDragLeave(event, 'TODO');

      expect(app.dragOverColumn()).toBeNull();
    });

    it('should NOT clear dragOverColumn on dragleave when moving to a child element inside column', () => {
      app.dragOverColumn.set('TODO');
      const columnEl = document.createElement('div');
      const childCard = document.createElement('div');
      columnEl.appendChild(childCard);
      const event = createMockDragEvent(null, childCard, columnEl);

      app.onDragLeave(event, 'TODO');

      expect(app.dragOverColumn()).toBe('TODO');
    });

    it('should reset draggedTask and dragOverColumn on dragend', () => {
      app.draggedTask.set(sampleTodoTask);
      app.dragOverColumn.set('IN_PROGRESS');

      app.onDragEnd();

      expect(app.draggedTask()).toBeNull();
      expect(app.draggedTaskId()).toBeNull();
      expect(app.dragOverColumn()).toBeNull();
    });

    it('should call updateTaskStatus and update task list when dropped onto a different status column', () => {
      const updatedTask: Task = { ...sampleTodoTask, status: 'IN_PROGRESS' };
      spyOn(service, 'updateTaskStatus').and.returnValue(of(updatedTask));

      const mockDT = createMockDataTransfer();
      mockDT.setData('text/plain', sampleTodoTask.id);
      const event = createMockDragEvent(mockDT);

      app.draggedTask.set(sampleTodoTask);
      app.dragOverColumn.set('IN_PROGRESS');

      app.onDrop(event, 'IN_PROGRESS');

      expect(service.updateTaskStatus).toHaveBeenCalledWith(sampleTodoTask.id, 'IN_PROGRESS');
      expect(app.dragOverColumn()).toBeNull();
      expect(app.draggedTask()).toBeNull();

      // Check task status updated in signal and computed columns
      const found = app.tasks().find(t => t.id === sampleTodoTask.id);
      expect(found?.status).toBe('IN_PROGRESS');
      expect(app.inProgressTasks().some(t => t.id === sampleTodoTask.id)).toBe(true);
      expect(app.todoTasks().some(t => t.id === sampleTodoTask.id)).toBe(false);
    });

    it('should transition task from IN_PROGRESS to DONE via drop', () => {
      const updatedTask: Task = { ...sampleProgressTask, status: 'DONE' };
      spyOn(service, 'updateTaskStatus').and.returnValue(of(updatedTask));

      const mockDT = createMockDataTransfer();
      mockDT.setData('text/plain', sampleProgressTask.id);
      const event = createMockDragEvent(mockDT);

      app.draggedTask.set(sampleProgressTask);
      app.onDrop(event, 'DONE');

      expect(service.updateTaskStatus).toHaveBeenCalledWith(sampleProgressTask.id, 'DONE');
      expect(app.doneTasks().some(t => t.id === sampleProgressTask.id)).toBe(true);
      expect(app.inProgressTasks().some(t => t.id === sampleProgressTask.id)).toBe(false);
    });

    it('should transition task from DONE back to TODO via drop', () => {
      const updatedTask: Task = { ...sampleDoneTask, status: 'TODO' };
      spyOn(service, 'updateTaskStatus').and.returnValue(of(updatedTask));

      const mockDT = createMockDataTransfer();
      mockDT.setData('text/plain', sampleDoneTask.id);
      const event = createMockDragEvent(mockDT);

      app.draggedTask.set(sampleDoneTask);
      app.onDrop(event, 'TODO');

      expect(service.updateTaskStatus).toHaveBeenCalledWith(sampleDoneTask.id, 'TODO');
      expect(app.todoTasks().some(t => t.id === sampleDoneTask.id)).toBe(true);
      expect(app.doneTasks().some(t => t.id === sampleDoneTask.id)).toBe(false);
    });

    it('should NOT call updateTaskStatus if dropped into the same status column', () => {
      spyOn(service, 'updateTaskStatus');

      const mockDT = createMockDataTransfer();
      mockDT.setData('text/plain', sampleTodoTask.id);
      const event = createMockDragEvent(mockDT);

      app.draggedTask.set(sampleTodoTask);
      app.onDrop(event, 'TODO');

      expect(service.updateTaskStatus).not.toHaveBeenCalled();
      expect(app.draggedTask()).toBeNull();
      expect(app.dragOverColumn()).toBeNull();
    });

    it('should safely fall back to draggedTask when dataTransfer getData is empty', () => {
      const updatedTask: Task = { ...sampleTodoTask, status: 'DONE' };
      spyOn(service, 'updateTaskStatus').and.returnValue(of(updatedTask));

      const event = createMockDragEvent(null);
      app.draggedTask.set(sampleTodoTask);

      app.onDrop(event, 'DONE');

      expect(service.updateTaskStatus).toHaveBeenCalledWith(sampleTodoTask.id, 'DONE');
      expect(app.draggedTask()).toBeNull();
    });

    it('should safely do nothing if onDrop is invoked with no active task', () => {
      spyOn(service, 'updateTaskStatus');
      const event = createMockDragEvent(null);

      app.onDrop(event, 'IN_PROGRESS');

      expect(service.updateTaskStatus).not.toHaveBeenCalled();
    });

    it('should mark task cards with draggable="true" and render drag-handle in DOM', () => {
      const cardElements = fixture.nativeElement.querySelectorAll('.task-card');
      expect(cardElements.length).toBe(3);

      cardElements.forEach((card: HTMLElement) => {
        expect(card.getAttribute('draggable')).toBe('true');
        expect(card.querySelector('.drag-handle')).toBeTruthy();
      });
    });

    it('should apply .dragging class to the card matching draggedTaskId', () => {
      app.draggedTask.set(sampleTodoTask);
      fixture.detectChanges();

      const todoCard = fixture.nativeElement.querySelector(`[data-task-id="${sampleTodoTask.id}"]`);
      expect(todoCard).toBeTruthy();
      expect(todoCard.classList.contains('dragging')).toBe(true);

      const progCard = fixture.nativeElement.querySelector(`[data-task-id="${sampleProgressTask.id}"]`);
      expect(progCard.classList.contains('dragging')).toBe(false);
    });

    it('should apply .drag-over class to the column matching dragOverColumn', () => {
      app.dragOverColumn.set('IN_PROGRESS');
      fixture.detectChanges();

      const colProg = fixture.nativeElement.querySelector('.col-progress');
      expect(colProg.classList.contains('drag-over')).toBe(true);

      const colTodo = fixture.nativeElement.querySelector('.col-todo');
      expect(colTodo.classList.contains('drag-over')).toBe(false);
    });

    it('should increment counter and set dragOverColumn on dragenter for valid destination column', () => {
      const event = createMockDragEvent();
      app.draggedTask.set(sampleTodoTask);

      app.onDragEnter(event, 'IN_PROGRESS');

      expect(event.preventDefault).toHaveBeenCalled();
      expect(app.dragCounts['IN_PROGRESS']).toBe(1);
      expect(app.dragOverColumn()).toBe('IN_PROGRESS');
    });

    it('should NOT set dragOverColumn or allow move on dragenter/dragover when hovering over same status column', () => {
      const mockDT = createMockDataTransfer();
      const event = createMockDragEvent(mockDT);
      app.draggedTask.set(sampleTodoTask); // status is TODO

      app.onDragEnter(event, 'TODO');
      expect(app.dragOverColumn()).toBeNull();

      app.onDragOver(event, 'TODO');
      expect(mockDT.dropEffect).toBe('none');
      expect(app.dragOverColumn()).toBeNull();
    });

    it('should NOT clear dragOverColumn when relatedTarget is null if nested child dragenter occurred', () => {
      app.draggedTask.set(sampleTodoTask);
      const enterEvent = createMockDragEvent();

      // Enter column (count 1)
      app.onDragEnter(enterEvent, 'IN_PROGRESS');
      expect(app.dragOverColumn()).toBe('IN_PROGRESS');

      // Enter child element inside column (count 2)
      app.onDragEnter(enterEvent, 'IN_PROGRESS');
      expect(app.dragCounts['IN_PROGRESS']).toBe(2);

      // Leave event with null relatedTarget (common browser quirk on child transitions)
      const leaveEvent = createMockDragEvent(null, null, null);
      app.onDragLeave(leaveEvent, 'IN_PROGRESS');

      // Count is now 1, dragOverColumn is still IN_PROGRESS (no flicker!)
      expect(app.dragCounts['IN_PROGRESS']).toBe(1);
      expect(app.dragOverColumn()).toBe('IN_PROGRESS');

      // Leave the entire column (count 0)
      app.onDragLeave(leaveEvent, 'IN_PROGRESS');
      expect(app.dragCounts['IN_PROGRESS']).toBe(0);
      expect(app.dragOverColumn()).toBeNull();
    });

    it('should optimistically update task status and roll back if updateTaskStatus fails', () => {
      spyOn(service, 'updateTaskStatus').and.returnValue(throwError(() => ({
        error: { 
          error: 'Blocker task must be completed first',
          blockingTasks: [{ id: 'task-b1', title: 'Prereq Task', status: 'IN_PROGRESS' }]
        }
      })));

      const mockDT = createMockDataTransfer();
      mockDT.setData('text/plain', sampleTodoTask.id);
      const event = createMockDragEvent(mockDT);

      app.draggedTask.set(sampleTodoTask);
      app.onDrop(event, 'IN_PROGRESS');

      // Service was called
      expect(service.updateTaskStatus).toHaveBeenCalledWith(sampleTodoTask.id, 'IN_PROGRESS');

      // Showed notification banner instead of window.alert
      expect(app.activeNotification()).toBeTruthy();
      expect(app.activeNotification()?.title).toBe('Status Transition Blocked');
      expect(app.activeNotification()?.message).toBe('Blocker task must be completed first');
      expect(app.activeNotification()?.blockers).toContain('Prereq Task (IN_PROGRESS)');

      // Rolled back to original TODO status
      const task = app.tasks().find(t => t.id === sampleTodoTask.id);
      expect(task?.status).toBe('TODO');
      expect(app.todoTasks().some(t => t.id === sampleTodoTask.id)).toBe(true);
      expect(app.inProgressTasks().some(t => t.id === sampleTodoTask.id)).toBe(false);
    });

    it('should ignore external drops with unrecognized text', () => {
      spyOn(service, 'updateTaskStatus');
      const mockDT = createMockDataTransfer();
      mockDT.setData('text/plain', 'unknown-external-id');
      const event = createMockDragEvent(mockDT);

      app.onDrop(event, 'DONE');

      expect(service.updateTaskStatus).not.toHaveBeenCalled();
      expect(app.dragOverColumn()).toBeNull();
    });

    it('should reset all dragCounts on dragend', () => {
      app.dragCounts['TODO'] = 2;
      app.dragCounts['IN_PROGRESS'] = 1;
      app.dragOverColumn.set('IN_PROGRESS');
      app.draggedTask.set(sampleTodoTask);

      app.onDragEnd();

      expect(app.dragCounts['TODO']).toBe(0);
      expect(app.dragCounts['IN_PROGRESS']).toBe(0);
      expect(app.dragCounts['DONE']).toBe(0);
      expect(app.dragOverColumn()).toBeNull();
      expect(app.draggedTask()).toBeNull();
    });
  });

  describe('Task Dependency Management Workflow', () => {
    const taskA: Task = {
      id: 'task-a',
      projectId: 'proj-1',
      title: 'Foundation Setup',
      description: 'Setup DB and API',
      priority: 'HIGH',
      status: 'DONE',
      dueDate: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: [],
      dependsOnTaskIds: [],
    };

    const taskB: Task = {
      id: 'task-b',
      projectId: 'proj-1',
      title: 'Feature Implementation',
      description: 'Build feature logic',
      priority: 'MEDIUM',
      status: 'TODO',
      dueDate: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: [],
      dependsOnTaskIds: [],
    };

    const taskC: Task = {
      id: 'task-c',
      projectId: 'proj-1',
      title: 'End to End Testing',
      description: 'Run integration test suite',
      priority: 'HIGH',
      status: 'TODO',
      dueDate: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: [],
      dependsOnTaskIds: ['task-a', 'task-b'],
    };

    beforeEach(() => {
      app.projects.set([sampleProject]);
      app.selectedProjectId.set(sampleProject.id);
      app.tasks.set([taskA, taskB, taskC]);
      fixture.detectChanges();
    });

    it('should compute blocker count accurately based on unfinished prerequisite status', () => {
      // taskC depends on taskA (DONE) and taskB (TODO).
      // Since taskB is not DONE, blocker count should be 1.
      expect(app.getBlockerCount(taskC)).toBe(1);

      // If taskB transitions to DONE, blocker count should become 0
      app.tasks.set([taskA, { ...taskB, status: 'DONE' }, taskC]);
      expect(app.getBlockerCount(taskC)).toBe(0);

      // taskA has no dependencies
      expect(app.getBlockerCount(taskA)).toBe(0);
    });

    it('should open dependency modal and load dependencies & blockers from service', () => {
      spyOn(service, 'getTaskDependencies').and.returnValue(of([taskA, taskB]));
      spyOn(service, 'getTaskBlockers').and.returnValue(of([taskB]));

      app.openDependencyModal(taskC);

      expect(app.showDependencyModal()).toBe(true);
      expect(app.activeDependencyTask()).toEqual(taskC);
      expect(service.getTaskDependencies).toHaveBeenCalledWith(taskC.id);
      expect(service.getTaskBlockers).toHaveBeenCalledWith(taskC.id);
      expect(app.currentTaskDependencies()).toEqual([taskA, taskB]);
      expect(app.currentTaskBlockers()).toEqual([taskB]);
      expect(app.isPrereqBlocker(taskB.id)).toBe(true);
      expect(app.isPrereqBlocker(taskA.id)).toBe(false);
    });

    it('should close dependency modal and reset active task state', () => {
      app.showDependencyModal.set(true);
      app.activeDependencyTask.set(taskC);
      app.dependencyError.set('Some error');
      app.selectedNewDependencyId.set('task-a');

      app.closeDependencyModal();

      expect(app.showDependencyModal()).toBe(false);
      expect(app.activeDependencyTask()).toBeNull();
      expect(app.dependencyError()).toBeNull();
      expect(app.selectedNewDependencyId()).toBe('');
      expect(app.currentTaskDependencies().length).toBe(0);
    });

    it('should add dependency to active task and refresh task dependencies and task list', () => {
      spyOn(service, 'addTaskDependency').and.returnValue(of({ taskId: taskB.id, dependsOnTaskId: taskA.id }));
      spyOn(service, 'getTaskDependencies').and.returnValue(of([taskA]));
      spyOn(service, 'getTaskBlockers').and.returnValue(of([]));
      spyOn(service, 'getTasks').and.returnValue(of([taskA, { ...taskB, dependsOnTaskIds: [taskA.id] }, taskC]));

      app.activeDependencyTask.set(taskB);
      app.selectedNewDependencyId.set(taskA.id);

      app.addDependencyToActiveTask();

      expect(service.addTaskDependency).toHaveBeenCalledWith(taskB.id, taskA.id);
      expect(app.selectedNewDependencyId()).toBe('');
      expect(service.getTaskDependencies).toHaveBeenCalledWith(taskB.id);
      expect(service.getTasks).toHaveBeenCalled();
    });

    it('should display circular dependency error with cycle path if cycle is detected', () => {
      const cycleError = {
        error: {
          error: 'Circular dependency detected',
          cyclePath: ['task-a', 'task-b', 'task-a'],
        }
      };
      spyOn(service, 'addTaskDependency').and.returnValue(throwError(() => cycleError));

      app.activeDependencyTask.set(taskA);
      app.selectedNewDependencyId.set(taskB.id);

      app.addDependencyToActiveTask();

      expect(app.dependencyLoading()).toBe(false);
      expect(app.dependencyError()).toBe('Circular dependency detected: task-a → task-b → task-a');
    });

    it('should remove dependency from active task and refresh', () => {
      spyOn(service, 'removeTaskDependency').and.returnValue(of(undefined as unknown as void));
      spyOn(service, 'getTaskDependencies').and.returnValue(of([taskA]));
      spyOn(service, 'getTaskBlockers').and.returnValue(of([]));
      spyOn(service, 'getTasks').and.returnValue(of([taskA, taskB, { ...taskC, dependsOnTaskIds: [taskA.id] }]));

      app.activeDependencyTask.set(taskC);
      app.removeDependencyFromActiveTask(taskB.id);

      expect(service.removeTaskDependency).toHaveBeenCalledWith(taskC.id, taskB.id);
      expect(service.getTaskDependencies).toHaveBeenCalledWith(taskC.id);
      expect(service.getTasks).toHaveBeenCalled();
    });

    it('should allow toggling candidate prerequisites in New Task modal and include in createTask call', () => {
      const createdTask: Task = {
        id: 'task-new',
        projectId: 'proj-1',
        title: 'New Deployment Task',
        description: 'Deploy to cloud',
        priority: 'MEDIUM',
        status: 'TODO',
        dueDate: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tags: [],
        dependsOnTaskIds: ['task-a', 'task-b'],
      };
      spyOn(service, 'createTask').and.returnValue(of(createdTask));

      app.openNewTaskModal();
      expect(app.selectedDependsOnTaskIds()).toEqual([]);

      app.toggleNewTaskDependency('task-a');
      expect(app.isNewTaskDependencySelected('task-a')).toBe(true);

      app.toggleNewTaskDependency('task-b');
      expect(app.selectedDependsOnTaskIds()).toEqual(['task-a', 'task-b']);

      // Toggle off task-a
      app.toggleNewTaskDependency('task-a');
      expect(app.selectedDependsOnTaskIds()).toEqual(['task-b']);

      // Toggle back on
      app.toggleNewTaskDependency('task-a');

      app.newTaskTitle.set('New Deployment Task');
      app.createTask();

      expect(service.createTask).toHaveBeenCalledWith(jasmine.objectContaining({
        title: 'New Deployment Task',
        dependsOnTaskIds: ['task-b', 'task-a'],
      }));
      expect(app.selectedDependsOnTaskIds()).toEqual([]);
      expect(app.showNewTaskModal()).toBe(false);
    });

    it('should render blocker warning badge and manage dependencies button on task card', () => {
      fixture.detectChanges();

      const cardC = fixture.nativeElement.querySelector(`[data-task-id="${taskC.id}"]`);
      expect(cardC).toBeTruthy();

      const blockedBadge = cardC.querySelector('.dep-pill-blocked');
      expect(blockedBadge).toBeTruthy();
      expect(blockedBadge.textContent).toContain('1 Blocked');

      const manageBtn = cardC.querySelector('.btn-card-dep');
      expect(manageBtn).toBeTruthy();
      expect(manageBtn.getAttribute('title')).toContain('Manage Dependencies');
    });
  });

  describe('Date Selector & Interactive Calendar Popover', () => {
    beforeEach(() => {
      app.projects.set([sampleProject]);
      app.selectedProjectId.set(sampleProject.id);
      fixture.detectChanges();
    });

    it('should set today preset correctly and update calendar view', () => {
      app.setDatePreset('today');
      const expected = formatDateToISO(new Date());
      expect(app.newTaskDueDate()).toBe(expected);
      expect(app.isPresetActive('today')).toBe(true);
      expect(app.isPresetActive('tomorrow')).toBe(false);
      expect(app.isPresetActive('nextWeek')).toBe(false);
    });

    it('should set tomorrow preset correctly', () => {
      app.setDatePreset('tomorrow');
      const d = new Date();
      d.setDate(d.getDate() + 1);
      const expected = formatDateToISO(d);
      expect(app.newTaskDueDate()).toBe(expected);
      expect(app.isPresetActive('tomorrow')).toBe(true);
      expect(app.isPresetActive('today')).toBe(false);
    });

    it('should set next week preset correctly (+7 days)', () => {
      app.setDatePreset('nextWeek');
      const d = new Date();
      d.setDate(d.getDate() + 7);
      const expected = formatDateToISO(d);
      expect(app.newTaskDueDate()).toBe(expected);
      expect(app.isPresetActive('nextWeek')).toBe(true);
    });

    it('should clear due date when setDatePreset is clear', () => {
      app.setDatePreset('today');
      expect(app.newTaskDueDate()).toBeTruthy();

      app.setDatePreset('clear');
      expect(app.newTaskDueDate()).toBe('');
      expect(app.isPresetActive('today')).toBe(false);
    });

    it('should toggle calendar popover open and closed', () => {
      expect(app.showCalendarPicker()).toBe(false);

      app.toggleCalendarPicker();
      expect(app.showCalendarPicker()).toBe(true);

      app.toggleCalendarPicker();
      expect(app.showCalendarPicker()).toBe(false);
    });

    it('should navigate months backwards and forwards with prevMonth and nextMonth', () => {
      app.calendarViewDate.set(new Date(2026, 10, 1)); // November 2026
      expect(app.calendarMonthYearLabel()).toContain('November 2026');

      app.prevMonth();
      expect(app.calendarMonthYearLabel()).toContain('October 2026');

      app.nextMonth();
      app.nextMonth();
      expect(app.calendarMonthYearLabel()).toContain('December 2026');
    });

    it('should generate 35 or 42 calendar grid cells with selection and today flags', () => {
      app.calendarViewDate.set(new Date(2026, 10, 1)); // Nov 2026 has 30 days starting on Sunday -> 42 cells
      const cells = app.calendarDays();
      expect(cells.length === 35 || cells.length === 42).toBe(true);

      const todayStr = formatDateToISO(new Date());
      const todayCell = cells.find(c => c.dateString === todayStr);
      if (todayCell) {
        expect(todayCell.isToday).toBe(true);
      }

      // Select a specific date
      app.selectCalendarDate('2026-11-15');
      expect(app.newTaskDueDate()).toBe('2026-11-15');
      const selectedCell = app.calendarDays().find(c => c.dateString === '2026-11-15');
      expect(selectedCell?.isSelected).toBe(true);
    });

    it('should sync calendarViewDate on manual onDueDateInput', () => {
      app.onDueDateInput('2027-04-20');
      expect(app.newTaskDueDate()).toBe('2027-04-20');
      expect(app.calendarViewDate().getFullYear()).toBe(2027);
      expect(app.calendarViewDate().getMonth()).toBe(3); // April is index 3
    });

    it('should render preset chips and calendar trigger when new task modal is open', () => {
      app.openNewTaskModal();
      fixture.detectChanges();

      const modalEl = fixture.nativeElement as HTMLElement;
      const presetsRow = modalEl.querySelector('.date-presets-row');
      expect(presetsRow).toBeTruthy();

      const chips = modalEl.querySelectorAll('.preset-chip');
      expect(chips.length).toBeGreaterThanOrEqual(3);

      const calTrigger = modalEl.querySelector('.calendar-open-trigger');
      expect(calTrigger).toBeTruthy();

      // Open custom calendar
      app.showCalendarPicker.set(true);
      fixture.detectChanges();

      const popover = modalEl.querySelector('.calendar-popover');
      expect(popover).toBeTruthy();
      expect(popover?.querySelector('.cal-month-title')).toBeTruthy();
      expect(popover?.querySelectorAll('.cal-day-cell').length).toBeGreaterThanOrEqual(35);
    });

    it('should render elevated task-date pill capsule on task cards with due dates', () => {
      const taskWithDate: Task = {
        id: 'task-dated-1',
        projectId: 'proj-1',
        title: 'Task With Due Date',
        description: 'Test pill capsule',
        priority: 'HIGH',
        status: 'TODO',
        dueDate: '2026-11-30',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tags: [],
      };
      app.tasks.set([taskWithDate]);
      fixture.detectChanges();

      const card = fixture.nativeElement.querySelector(`[data-task-id="${taskWithDate.id}"]`);
      expect(card).toBeTruthy();

      const datePill = card.querySelector('.task-date');
      expect(datePill).toBeTruthy();
      expect(datePill.querySelector('.task-date-icon')).toBeTruthy();
      expect(datePill.textContent).toContain('Nov 30, 2026');
    });
  });

  describe('Dual-Theme System (Dark and Light Mode)', () => {
    let originalTheme: string | null;

    beforeEach(() => {
      originalTheme = localStorage.getItem('taskflow_theme');
    });

    afterEach(() => {
      if (originalTheme !== null) {
        localStorage.setItem('taskflow_theme', originalTheme);
      } else {
        localStorage.removeItem('taskflow_theme');
      }
      // Reset document state
      document.documentElement.setAttribute('data-theme', 'dark');
      document.body.classList.remove('light-theme');
      document.body.classList.add('dark-theme');
    });

    it('should initialize with default dark theme when localStorage is empty', () => {
      localStorage.removeItem('taskflow_theme');
      app.initTheme();
      expect(app.currentTheme()).toBe('dark');
      expect(app.isDarkTheme()).toBe(true);
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
      expect(document.body.classList.contains('dark-theme')).toBe(true);
      expect(document.body.classList.contains('light-theme')).toBe(false);
    });

    it('should initialize with light theme when saved in localStorage', () => {
      localStorage.setItem('taskflow_theme', 'light');
      app.initTheme();
      expect(app.currentTheme()).toBe('light');
      expect(app.isDarkTheme()).toBe(false);
      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
      expect(document.body.classList.contains('light-theme')).toBe(true);
      expect(document.body.classList.contains('dark-theme')).toBe(false);
    });

    it('should toggle theme between dark and light, persisting to localStorage', () => {
      app.setTheme('dark');
      expect(app.currentTheme()).toBe('dark');
      expect(app.isDarkTheme()).toBe(true);
      expect(localStorage.getItem('taskflow_theme')).toBe('dark');

      app.toggleTheme();
      expect(app.currentTheme()).toBe('light');
      expect(app.isDarkTheme()).toBe(false);
      expect(localStorage.getItem('taskflow_theme')).toBe('light');
      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
      expect(document.body.classList.contains('light-theme')).toBe(true);

      app.toggleTheme();
      expect(app.currentTheme()).toBe('dark');
      expect(app.isDarkTheme()).toBe(true);
      expect(localStorage.getItem('taskflow_theme')).toBe('dark');
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
      expect(document.body.classList.contains('dark-theme')).toBe(true);
    });

    it('should render theme toggle button in navbar with appropriate icon and label', () => {
      app.setTheme('dark');
      fixture.detectChanges();

      const btn = fixture.nativeElement.querySelector('.btn-theme-toggle') as HTMLButtonElement;
      expect(btn).toBeTruthy();
      expect(btn.querySelector('.theme-icon')?.textContent?.trim()).toBe('🌙');
      expect(btn.querySelector('.theme-label')?.textContent?.trim()).toBe('Dark');
      expect(btn.getAttribute('aria-label')).toBe('Switch to light mode');

      // Click to toggle
      btn.click();
      fixture.detectChanges();

      expect(app.currentTheme()).toBe('light');
      expect(btn.querySelector('.theme-icon')?.textContent?.trim()).toBe('☀️');
      expect(btn.querySelector('.theme-label')?.textContent?.trim()).toBe('Light');
      expect(btn.getAttribute('aria-label')).toBe('Switch to dark mode');
    });
  });

  describe('Overdue Badge and Deadline Indicators', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = formatDateToISO(yesterday);

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = formatDateToISO(tomorrow);

    const todayStr = formatDateToISO(new Date());

    it('should return true for past due dates when status is TODO', () => {
      const task: Task = {
        ...sampleTodoTask,
        dueDate: yesterdayStr,
        status: 'TODO',
      };
      expect(app.isTaskOverdue(task)).toBe(true);
    });

    it('should return true for past due dates when status is IN_PROGRESS', () => {
      const task: Task = {
        ...sampleProgressTask,
        dueDate: yesterdayStr,
        status: 'IN_PROGRESS',
      };
      expect(app.isTaskOverdue(task)).toBe(true);
    });

    it('should return false for future dates', () => {
      const task: Task = {
        ...sampleTodoTask,
        dueDate: tomorrowStr,
        status: 'TODO',
      };
      expect(app.isTaskOverdue(task)).toBe(false);
    });

    it('should return false when status is DONE even if dueDate is in the past', () => {
      const task: Task = {
        ...sampleDoneTask,
        dueDate: yesterdayStr,
        status: 'DONE',
      };
      expect(app.isTaskOverdue(task)).toBe(false);
    });

    it('should return false when dueDate is null or empty', () => {
      const nullDueTask: Task = { ...sampleTodoTask, dueDate: null };
      const emptyDueTask: Task = { ...sampleTodoTask, dueDate: '' };
      expect(app.isTaskOverdue(nullDueTask)).toBe(false);
      expect(app.isTaskOverdue(emptyDueTask)).toBe(false);
    });

    it('should handle YYYY-MM-DD date format with end-of-day comparison (not overdue on today)', () => {
      const taskToday: Task = {
        ...sampleTodoTask,
        dueDate: todayStr,
        status: 'TODO',
      };
      expect(app.isTaskOverdue(taskToday)).toBe(false);
      expect(app.isDueToday(taskToday)).toBe(true);
    });

    it('should handle ISO timestamp format correctly for past and future days', () => {
      const pastIso = new Date(Date.now() - 86400000 * 2).toISOString();
      const futureIso = new Date(Date.now() + 86400000 * 2).toISOString();

      const pastIsoTask: Task = {
        ...sampleTodoTask,
        dueDate: pastIso,
        status: 'TODO',
      };
      const futureIsoTask: Task = {
        ...sampleTodoTask,
        dueDate: futureIso,
        status: 'TODO',
      };

      expect(app.isTaskOverdue(pastIsoTask)).toBe(true);
      expect(app.isTaskOverdue(futureIsoTask)).toBe(false);
    });

    it('should not mark ISO timestamp on today as overdue while today is ongoing', () => {
      const todayIso = new Date().toISOString();
      const todayIsoTask: Task = {
        ...sampleTodoTask,
        dueDate: todayIso,
        status: 'TODO',
      };
      expect(app.isTaskOverdue(todayIsoTask)).toBe(false);
      expect(app.isDueToday(todayIsoTask)).toBe(true);
    });

    it('should render .overdue-badge and .task-date-overdue in DOM when a task is overdue', () => {
      const overdueTask: Task = {
        id: 'task-overdue-1',
        projectId: sampleProject.id,
        title: 'Urgent Bug Fix',
        description: 'Fix critical production crash',
        priority: 'HIGH',
        status: 'TODO',
        dueDate: yesterdayStr,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tags: [],
      };

      app.projects.set([sampleProject]);
      app.selectedProjectId.set(sampleProject.id);
      app.tasks.set([overdueTask]);
      fixture.detectChanges();

      const card = fixture.nativeElement.querySelector(`[data-task-id="${overdueTask.id}"]`);
      expect(card).toBeTruthy();
      expect(card.classList.contains('task-overdue')).toBe(true);

      const overdueBadge = card.querySelector('.overdue-badge');
      expect(overdueBadge).toBeTruthy();
      expect(overdueBadge.textContent).toContain('OVERDUE');
      expect(overdueBadge.querySelector('.overdue-dot')).toBeTruthy();

      const datePill = card.querySelector('.task-date');
      expect(datePill).toBeTruthy();
      expect(datePill.classList.contains('task-date-overdue')).toBe(true);
      expect(datePill.querySelector('.task-date-icon')?.textContent).toContain('⚠️');
    });

    it('should not render .overdue-badge when task is not overdue', () => {
      const futureTask: Task = {
        id: 'task-future-1',
        projectId: sampleProject.id,
        title: 'Plan Q1 Roadmap',
        description: 'Outline quarterly initiatives',
        priority: 'MEDIUM',
        status: 'TODO',
        dueDate: tomorrowStr,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tags: [],
      };

      app.projects.set([sampleProject]);
      app.selectedProjectId.set(sampleProject.id);
      app.tasks.set([futureTask]);
      fixture.detectChanges();

      const card = fixture.nativeElement.querySelector(`[data-task-id="${futureTask.id}"]`);
      expect(card).toBeTruthy();
      expect(card.classList.contains('task-overdue')).toBe(false);

      const overdueBadge = card.querySelector('.overdue-badge');
      expect(overdueBadge).toBeNull();

      const datePill = card.querySelector('.task-date');
      expect(datePill).toBeTruthy();
      expect(datePill.classList.contains('task-date-overdue')).toBe(false);
      expect(datePill.querySelector('.task-date-icon')?.textContent).toContain('📅');
    });
  });

  describe('Due Date Validation for New Tasks', () => {
    it('should compute minSelectableDate as today in YYYY-MM-DD format', () => {
      const todayISO = formatDateToISO(new Date());
      expect(app.minSelectableDate()).toBe(todayISO);
    });

    it('should reject selecting a past calendar date in selectCalendarDate()', () => {
      app.selectCalendarDate('2020-01-01');
      expect(app.dateValidationError()).toContain('Due date cannot be in the past');
      expect(app.newTaskDueDate()).toBe('');
    });

    it('should allow selecting today or future calendar date in selectCalendarDate()', () => {
      const todayISO = formatDateToISO(new Date());
      app.selectCalendarDate(todayISO);
      expect(app.dateValidationError()).toBeNull();
      expect(app.newTaskDueDate()).toBe(todayISO);

      const futureDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
      const futureISO = formatDateToISO(futureDate);
      app.selectCalendarDate(futureISO);
      expect(app.dateValidationError()).toBeNull();
      expect(app.newTaskDueDate()).toBe(futureISO);
    });

    it('should validate manual input in onDueDateInput()', () => {
      app.onDueDateInput('2020-05-10');
      expect(app.dateValidationError()).toContain('Due date cannot be in the past');

      const todayISO = formatDateToISO(new Date());
      app.onDueDateInput(todayISO);
      expect(app.dateValidationError()).toBeNull();

      app.onDueDateInput('');
      expect(app.dateValidationError()).toBeNull();
    });

    it('should clear dateValidationError when setDatePreset is used', () => {
      app.dateValidationError.set('Some past error');
      app.setDatePreset('today');
      expect(app.dateValidationError()).toBeNull();

      app.dateValidationError.set('Some past error');
      app.setDatePreset('clear');
      expect(app.dateValidationError()).toBeNull();
    });

    it('should block createTask() when due date is in the past', () => {
      spyOn(service, 'createTask');
      app.selectedProjectId.set(sampleProject.id);
      app.newTaskTitle.set('Test Past Task');
      app.newTaskDueDate.set('2020-01-01');

      app.createTask();

      expect(service.createTask).not.toHaveBeenCalled();
      expect(app.dateValidationError()).toContain('Due date cannot be in the past');
    });

    it('should render [min] attribute on native date input and disable past calendar cells in UI', () => {
      app.showNewTaskModal.set(true);
      app.showCalendarPicker.set(true);
      fixture.detectChanges();

      const dateInput = fixture.nativeElement.querySelector('.date-picker-input');
      expect(dateInput).toBeTruthy();
      expect(dateInput.getAttribute('min')).toBe(app.minSelectableDate());

      const disabledCells = fixture.nativeElement.querySelectorAll('.cal-day-cell:disabled');
      expect(disabledCells.length).toBeGreaterThan(0);
    });

    it('should render inline validation error banner and disable submit button when dateValidationError is set', () => {
      app.showNewTaskModal.set(true);
      app.newTaskTitle.set('Task Title');
      app.dateValidationError.set('Due date cannot be in the past for new tasks.');
      fixture.detectChanges();

      const errorBanner = fixture.nativeElement.querySelector('.field-validation-error');
      expect(errorBanner).toBeTruthy();
      expect(errorBanner.textContent).toContain('Due date cannot be in the past');

      const submitBtn = fixture.nativeElement.querySelector('.modal-footer .btn-primary');
      expect(submitBtn.disabled).toBe(true);
    });
  });

  describe('Combined Priority & Tag Filter Bar', () => {
    const mockTags = [
      { id: 'tag-1', name: 'Frontend', color: '#3b82f6', createdAt: new Date().toISOString() },
      { id: 'tag-2', name: 'Bug', color: '#ef4444', createdAt: new Date().toISOString() }
    ];

    beforeEach(() => {
      app.projects.set([sampleProject]);
      app.selectedProjectId.set(sampleProject.id);
      app.allTags.set(mockTags);
      fixture.detectChanges();
    });

    it('should set priority filter and call loadTasks with priority', () => {
      const getTasksSpy = spyOn(service, 'getTasks').and.returnValue(of([]));
      app.setPriorityFilter('HIGH');

      expect(app.selectedPriorityFilter()).toBe('HIGH');
      expect(getTasksSpy).toHaveBeenCalledWith({ projectId: sampleProject.id, priority: 'HIGH' });
      expect(app.activeFilterCount()).toBe(1);
    });

    it('should toggle priority filter off when clicked again', () => {
      const getTasksSpy = spyOn(service, 'getTasks').and.returnValue(of([]));
      app.selectedPriorityFilter.set('HIGH');

      app.setPriorityFilter('HIGH');

      expect(app.selectedPriorityFilter()).toBe('');
      expect(getTasksSpy).toHaveBeenCalledWith({ projectId: sampleProject.id });
      expect(app.activeFilterCount()).toBe(0);
    });

    it('should combine priority and tag filters simultaneously', () => {
      const getTasksSpy = spyOn(service, 'getTasks').and.returnValue(of([]));

      app.setTagFilter('tag-1');
      expect(getTasksSpy).toHaveBeenCalledWith({ projectId: sampleProject.id, tagId: 'tag-1' });
      expect(app.activeFilterCount()).toBe(1);

      app.setPriorityFilter('MEDIUM');
      expect(getTasksSpy).toHaveBeenCalledWith({ projectId: sampleProject.id, tagId: 'tag-1', priority: 'MEDIUM' });
      expect(app.activeFilterCount()).toBe(2);
    });

    it('should reset both priority and tag filters when clearAllFilters is called', () => {
      const getTasksSpy = spyOn(service, 'getTasks').and.returnValue(of([]));
      app.selectedPriorityFilter.set('LOW');
      app.selectedTagFilter.set('tag-2');
      expect(app.activeFilterCount()).toBe(2);

      app.clearAllFilters();

      expect(app.selectedPriorityFilter()).toBe('');
      expect(app.selectedTagFilter()).toBe('');
      expect(app.activeFilterCount()).toBe(0);
      expect(getTasksSpy).toHaveBeenCalledWith({ projectId: sampleProject.id });
    });

    it('should render filter control bar with priority and tag chips', () => {
      fixture.detectChanges();
      const controlBar = fixture.nativeElement.querySelector('.filter-control-bar');
      expect(controlBar).toBeTruthy();

      const priorityChips = controlBar.querySelectorAll('.filter-pills-wrap button');
      expect(priorityChips.length).toBeGreaterThanOrEqual(4);

      const highChip = controlBar.querySelector('.priority-chip-high');
      expect(highChip).toBeTruthy();
      expect(highChip.querySelector('.dot-high')).toBeTruthy();
    });

    it('should render active filter summary and clear button when filter is active', () => {
      app.selectedPriorityFilter.set('HIGH');
      app.selectedTagFilter.set('tag-1');
      fixture.detectChanges();

      const summary = fixture.nativeElement.querySelector('.active-filter-summary');
      expect(summary).toBeTruthy();
      expect(summary.textContent).toContain('2 Active Filters');

      const clearBtn = fixture.nativeElement.querySelector('.btn-clear-filters');
      expect(clearBtn).toBeTruthy();

      spyOn(app, 'clearAllFilters').and.callThrough();
      clearBtn.click();
      expect(app.clearAllFilters).toHaveBeenCalled();
      expect(app.activeFilterCount()).toBe(0);
    });
  });

  describe('Custom Notification Toast & Confirmation Modal', () => {
    it('should show and dismiss top notification banner', () => {
      app.showNotification({
        type: 'danger',
        title: 'Status Transition Blocked',
        message: 'Prerequisite task not in DONE status',
        badgeText: 'PREREQUISITE GUARD',
        icon: '🛑',
        blockers: ['Task 1 (IN_PROGRESS)'],
        durationMs: 0
      });
      fixture.detectChanges();

      const banner = fixture.nativeElement.querySelector('.top-notification-banner');
      expect(banner).toBeTruthy();
      expect(banner.textContent).toContain('Status Transition Blocked');
      expect(banner.textContent).toContain('Prerequisite task not in DONE status');
      expect(banner.textContent).toContain('Task 1 (IN_PROGRESS)');

      const closeBtn = banner.querySelector('.banner-close-btn');
      expect(closeBtn).toBeTruthy();
      closeBtn.click();
      fixture.detectChanges();

      expect(app.activeNotification()).toBeNull();
      expect(fixture.nativeElement.querySelector('.top-notification-banner')).toBeNull();
    });

    it('should open delete project confirmation modal and execute deletion on confirm', () => {
      const deleteSpy = spyOn(service, 'deleteProject').and.returnValue(of(undefined));
      app.projects.set([sampleProject]);
      app.selectedProjectId.set(sampleProject.id);

      app.openDeleteProjectConfirm();
      fixture.detectChanges();

      const modal = fixture.nativeElement.querySelector('.confirm-modal-box');
      expect(modal).toBeTruthy();
      expect(modal.textContent).toContain('Delete Project');
      expect(modal.textContent).toContain(sampleProject.name);

      const confirmBtn = modal.querySelector('.btn-danger-solid');
      expect(confirmBtn).toBeTruthy();
      confirmBtn.click();

      expect(deleteSpy).toHaveBeenCalledWith(sampleProject.id);
      expect(app.confirmDialog()).toBeNull();
      expect(app.activeNotification()?.title).toBe('Project Deleted');
    });

    it('should open delete task confirmation modal and cancel cleanly', () => {
      const deleteSpy = spyOn(service, 'deleteTask');
      app.tasks.set([sampleTodoTask]);

      app.openDeleteTaskConfirm(sampleTodoTask);
      fixture.detectChanges();

      const modal = fixture.nativeElement.querySelector('.confirm-modal-box');
      expect(modal).toBeTruthy();
      expect(modal.textContent).toContain('Delete Task');
      expect(modal.textContent).toContain(sampleTodoTask.title);

      const cancelBtn = modal.querySelector('.btn-cancel');
      cancelBtn.click();
      fixture.detectChanges();

      expect(deleteSpy).not.toHaveBeenCalled();
      expect(app.confirmDialog()).toBeNull();
      expect(fixture.nativeElement.querySelector('.confirm-modal-box')).toBeNull();
    });

    it('should manage profile modal open and close states', () => {
      expect(app.showProfileModal()).toBeFalse();

      app.openProfileModal();
      expect(app.showProfileModal()).toBeTrue();

      app.closeProfileModal();
      expect(app.showProfileModal()).toBeFalse();
    });

    it('should update active role and notify when onRoleChange is called', () => {
      app.onRoleChange('ADMIN');
      expect(app.activeRole()).toBe('ADMIN');
      expect(app.canDeleteProject()).toBeTrue();
      expect(app.canMutateTasks()).toBeTrue();
      expect(app.canCreateProject()).toBeTrue();
      expect(app.activeNotification()?.title).toBe('Active Role Switched');

      app.onRoleChange('VIEWER');
      expect(app.activeRole()).toBe('VIEWER');
      expect(app.canDeleteProject()).toBeFalse();
      expect(app.canMutateTasks()).toBeFalse();
      expect(app.canCreateProject()).toBeFalse();

      app.onRoleChange('MEMBER');
      expect(app.activeRole()).toBe('MEMBER');
      expect(app.canDeleteProject()).toBeFalse();
      expect(app.canMutateTasks()).toBeTrue();
      expect(app.canCreateProject()).toBeTrue();
    });

    it('should guard delete project when role is MEMBER or VIEWER', () => {
      app.projects.set([sampleProject]);
      app.selectedProjectId.set(sampleProject.id);

      app.onRoleChange('MEMBER');
      app.deleteProject(sampleProject.id);
      expect(app.confirmDialog()).toBeNull();
      expect(app.activeNotification()?.title).toBe('Permission Denied');

      app.onRoleChange('VIEWER');
      app.deleteProject(sampleProject.id);
      expect(app.confirmDialog()).toBeNull();
      expect(app.activeNotification()?.title).toBe('Permission Denied');
    });

    it('should guard task actions when role is VIEWER', () => {
      app.tasks.set([sampleTodoTask]);
      app.onRoleChange('VIEWER');

      app.openNewTaskModal();
      expect(app.showNewTaskModal()).toBeFalse();
      expect(app.activeNotification()?.title).toBe('Read-Only Mode');

      app.deleteTask(sampleTodoTask.id);
      expect(app.confirmDialog()).toBeNull();
      expect(app.activeNotification()?.title).toBe('Read-Only Mode');
    });

    it('should manage authentication modal, login success, and logout', () => {
      const sampleUser: any = {
        id: 'u-123',
        username: 'testadmin',
        email: 'testadmin@example.com',
        role: 'ADMIN',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      app.openAuthModal();
      expect(app.showAuthModal()).toBeTrue();

      app.closeAuthModal();
      expect(app.showAuthModal()).toBeFalse();

      app.onAuthenticated(sampleUser);
      expect(app.showAuthModal()).toBeFalse();
      expect(app.activeNotification()?.title).toBe('Welcome Back');

      app.handleLogout();
      expect(app.showAuthModal()).toBeTrue();
      expect(app.showProfileModal()).toBeFalse();
      expect(app.activeNotification()?.title).toBe('Signed Out');
    });

    it('should guard admin user management modal access', () => {
      app.onRoleChange('ADMIN');
      app.openUserManagementModal();
      expect(app.showUserManagementModal()).toBeTrue();

      app.closeUserManagementModal();
      expect(app.showUserManagementModal()).toBeFalse();

      app.onRoleChange('MEMBER');
      app.openUserManagementModal();
      expect(app.showUserManagementModal()).toBeFalse();
      expect(app.activeNotification()?.title).toBe('Permission Denied');
    });

    it('should completely remove unauthorized action buttons from the DOM based on role', () => {
      app.projects.set([sampleProject]);
      app.selectedProjectId.set(sampleProject.id);
      app.tasks.set([sampleTodoTask]);

      // ADMIN role: can see delete project, create project, create task
      app.onRoleChange('ADMIN');
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.btn-icon-danger')).toBeTruthy();
      expect(fixture.nativeElement.querySelector('.task-card-actions')).toBeTruthy();

      // MEMBER role: delete project button is completely removed from DOM
      app.onRoleChange('MEMBER');
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.btn-icon-danger')).toBeNull();
      expect(fixture.nativeElement.querySelector('.task-card-actions')).toBeTruthy();

      // VIEWER role: delete project, card action buttons, and status buttons are removed
      app.onRoleChange('VIEWER');
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.btn-icon-danger')).toBeNull();
      expect(fixture.nativeElement.querySelector('.task-card-actions')).toBeNull();
      expect(fixture.nativeElement.querySelector('.btn-action')).toBeNull();
    });

    describe('Task Sorting and Order Controls', () => {
      it('should initialize with no active sort field and ascending direction', () => {
        expect(app.selectedSortField()).toBe('');
        expect(app.sortDirection()).toBe('asc');
      });

      it('should sort tasks alphabetically by title when sort field is title', () => {
        const taskA: Task = { ...sampleTodoTask, id: 't1', title: 'Bravo Task' };
        const taskB: Task = { ...sampleTodoTask, id: 't2', title: 'Alpha Task' };
        const taskC: Task = { ...sampleTodoTask, id: 't3', title: 'Charlie Task' };
        app.tasks.set([taskA, taskB, taskC]);

        app.setSortField('title');
        const sortedAsc = app.todoTasks();
        expect(sortedAsc.map(t => t.title)).toEqual(['Alpha Task', 'Bravo Task', 'Charlie Task']);

        app.toggleSortDirection();
        expect(app.sortDirection()).toBe('desc');
        const sortedDesc = app.todoTasks();
        expect(sortedDesc.map(t => t.title)).toEqual(['Charlie Task', 'Bravo Task', 'Alpha Task']);
      });

      it('should sort tasks by priority hierarchy (HIGH > MEDIUM > LOW)', () => {
        const lowTask: Task = { ...sampleTodoTask, id: 't-low', priority: 'LOW', title: 'Low Priority' };
        const medTask: Task = { ...sampleTodoTask, id: 't-med', priority: 'MEDIUM', title: 'Med Priority' };
        const highTask: Task = { ...sampleTodoTask, id: 't-high', priority: 'HIGH', title: 'High Priority' };
        app.tasks.set([medTask, lowTask, highTask]);

        app.setSortField('priority');
        // asc: LOW -> MEDIUM -> HIGH
        const sortedAsc = app.todoTasks();
        expect(sortedAsc.map(t => t.priority)).toEqual(['LOW', 'MEDIUM', 'HIGH']);

        // desc: HIGH -> MEDIUM -> LOW
        app.toggleSortDirection();
        const sortedDesc = app.todoTasks();
        expect(sortedDesc.map(t => t.priority)).toEqual(['HIGH', 'MEDIUM', 'LOW']);
      });

      it('should sort tasks by due date stably pushing tasks without due dates to the end', () => {
        const taskNoDate: Task = { ...sampleTodoTask, id: 't1', title: 'Undated Task', dueDate: null };
        const taskEarly: Task = { ...sampleTodoTask, id: 't2', title: 'Early Task', dueDate: '2026-11-20' };
        const taskLate: Task = { ...sampleTodoTask, id: 't3', title: 'Late Task', dueDate: '2026-11-30' };
        app.tasks.set([taskNoDate, taskLate, taskEarly]);

        app.setSortField('dueDate');
        // Ascending: Early -> Late -> Undated
        expect(app.todoTasks().map(t => t.id)).toEqual(['t2', 't3', 't1']);

        // Descending: Late -> Early -> Undated
        app.toggleSortDirection();
        expect(app.sortDirection()).toBe('desc');
        expect(app.todoTasks().map(t => t.id)).toEqual(['t3', 't2', 't1']);
      });

      it('should reset sort field and direction when clearAllFilters is called', () => {
        app.setSortField('title');
        app.toggleSortDirection();
        expect(app.selectedSortField()).toBe('title');
        expect(app.sortDirection()).toBe('desc');

        app.clearAllFilters();
        expect(app.selectedSortField()).toBe('');
        expect(app.sortDirection()).toBe('asc');
      });
    });
  });
});
