export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';

export interface Tag {
  id: string;
  name: string;
  color: string;
  createdAt: string;
}

export interface CreateTagDto {
  name: string;
  color?: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
  tags?: Tag[];
  dependsOnTaskIds?: string[];
}

export interface TaskDependency {
  taskId: string;
  dependsOnTaskId: string;
}

export interface CreateProjectDto {
  name: string;
  description?: string;
}

export interface CreateTaskDto {
  projectId: string;
  title: string;
  description?: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate?: string | null;
  tagIds?: string[];
  dependsOnTaskIds?: string[];
}

export interface UpdateTaskDto {
  title?: string;
  description?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  dueDate?: string | null;
  tagIds?: string[];
  dependsOnTaskIds?: string[];
}
