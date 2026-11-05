import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Project, Task, CreateProjectDto, CreateTaskDto, TaskStatus, Tag, CreateTagDto } from '../models/taskflow.model';

@Injectable({
  providedIn: 'root'
})
export class TaskFlowService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api';

  // Projects
  getProjects(): Observable<Project[]> {
    return this.http.get<Project[]>(`${this.apiUrl}/projects`);
  }

  getProject(id: string): Observable<Project> {
    return this.http.get<Project>(`${this.apiUrl}/projects/${id}`);
  }

  createProject(dto: CreateProjectDto): Observable<Project> {
    return this.http.post<Project>(`${this.apiUrl}/projects`, dto);
  }

  deleteProject(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/projects/${id}`);
  }

  // Tasks
  getTasks(filters?: { projectId?: string; status?: string; priority?: string; tagId?: string }): Observable<Task[]> {
    let params = new HttpParams();
    if (filters?.projectId) {
      params = params.set('projectId', filters.projectId);
    }
    if (filters?.status) {
      params = params.set('status', filters.status);
    }
    if (filters?.priority) {
      params = params.set('priority', filters.priority);
    }
    if (filters?.tagId) {
      params = params.set('tagId', filters.tagId);
    }
    return this.http.get<Task[]>(`${this.apiUrl}/tasks`, { params });
  }

  createTask(dto: CreateTaskDto): Observable<Task> {
    return this.http.post<Task>(`${this.apiUrl}/tasks`, dto);
  }

  updateTaskStatus(id: string, status: TaskStatus): Observable<Task> {
    return this.http.put<Task>(`${this.apiUrl}/tasks/${id}`, { status });
  }

  updateTask(id: string, data: Partial<Task>): Observable<Task> {
    return this.http.put<Task>(`${this.apiUrl}/tasks/${id}`, data);
  }

  deleteTask(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/tasks/${id}`);
  }

  // Tags
  getTags(): Observable<Tag[]> {
    return this.http.get<Tag[]>(`${this.apiUrl}/tags`);
  }

  createTag(dto: CreateTagDto): Observable<Tag> {
    return this.http.post<Tag>(`${this.apiUrl}/tags`, dto);
  }

  addTagToTask(taskId: string, tagId: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/tasks/${taskId}/tags`, { tagId });
  }

  removeTagFromTask(taskId: string, tagId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/tasks/${taskId}/tags/${tagId}`);
  }

  // Task Dependencies & Blockers
  getTaskDependencies(taskId: string): Observable<Task[]> {
    return this.http.get<Task[]>(`${this.apiUrl}/tasks/${taskId}/dependencies`);
  }

  addTaskDependency(taskId: string, dependsOnTaskId: string): Observable<{ taskId: string; dependsOnTaskId: string }> {
    return this.http.post<{ taskId: string; dependsOnTaskId: string }>(`${this.apiUrl}/tasks/${taskId}/dependencies`, { dependsOnTaskId });
  }

  removeTaskDependency(taskId: string, dependsOnTaskId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/tasks/${taskId}/dependencies/${dependsOnTaskId}`);
  }

  getTaskBlockers(taskId: string): Observable<Task[]> {
    return this.http.get<Task[]>(`${this.apiUrl}/tasks/${taskId}/blockers`);
  }
}
