import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import {
  Project,
  Task,
  CreateProjectDto,
  CreateTaskDto,
  TaskStatus,
  Tag,
  CreateTagDto,
  UserRole,
  User,
  AuthResponse,
  LoginDto,
  RegisterDto,
  TaskComment,
} from '../models/taskflow.model';

@Injectable({
  providedIn: 'root'
})
export class TaskFlowService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api';

  private readonly ROLE_STORAGE_KEY = 'taskflow_active_role';
  private readonly TOKEN_STORAGE_KEY = 'taskflow_auth_token';
  private readonly USER_STORAGE_KEY = 'taskflow_auth_user';

  authToken = signal<string | null>(this.getInitialToken());
  currentUser = signal<User | null>(this.getInitialUser());
  isAuthenticated = computed(() => this.currentUser() !== null);

  /**
   * Active user role (ADMIN, MEMBER, VIEWER).
   * Synchronized with currentUser role, with fallback to stored role or MEMBER.
   */
  activeRole = signal<UserRole>(this.getInitialRole());

  private getInitialToken(): string | null {
    try {
      return localStorage.getItem(this.TOKEN_STORAGE_KEY);
    } catch {
      return null;
    }
  }

  private getInitialUser(): User | null {
    try {
      const raw = localStorage.getItem(this.USER_STORAGE_KEY);
      if (raw) {
        return JSON.parse(raw) as User;
      }
    } catch {
      return null;
    }
    return null;
  }

  private getInitialRole(): UserRole {
    try {
      const user = this.getInitialUser();
      if (user && user.role) {
        return user.role;
      }
      const stored = localStorage.getItem(this.ROLE_STORAGE_KEY);
      if (stored && (stored === 'ADMIN' || stored === 'MEMBER' || stored === 'VIEWER')) {
        return stored as UserRole;
      }
    } catch {
      // In SSR or restricted environments, fallback gracefully
    }
    return 'MEMBER';
  }

  /**
   * Updates active simulated role and persists to localStorage.
   */
  setRole(role: UserRole): void {
    this.activeRole.set(role);
    try {
      localStorage.setItem(this.ROLE_STORAGE_KEY, role);
    } catch {
      // Ignore localStorage write restrictions
    }
  }

  // Authentication
  register(dto: RegisterDto): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/register`, dto).pipe(
      tap((res) => this.handleAuthSuccess(res))
    );
  }

  login(dto: LoginDto): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, dto).pipe(
      tap((res) => this.handleAuthSuccess(res))
    );
  }

  logout(): void {
    this.authToken.set(null);
    this.currentUser.set(null);
    this.activeRole.set('MEMBER');
    try {
      localStorage.removeItem(this.TOKEN_STORAGE_KEY);
      localStorage.removeItem(this.USER_STORAGE_KEY);
      localStorage.removeItem(this.ROLE_STORAGE_KEY);
    } catch {
      // Ignore storage errors
    }
  }

  private handleAuthSuccess(res: AuthResponse): void {
    this.authToken.set(res.token);
    this.currentUser.set(res.user);
    this.activeRole.set(res.user.role);
    try {
      localStorage.setItem(this.TOKEN_STORAGE_KEY, res.token);
      localStorage.setItem(this.USER_STORAGE_KEY, JSON.stringify(res.user));
      localStorage.setItem(this.ROLE_STORAGE_KEY, res.user.role);
    } catch {
      // Ignore storage errors
    }
  }

  // User Management (Admin Only)
  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/users`);
  }

  updateUserRole(userId: string, role: UserRole): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/users/${userId}/role`, { role }).pipe(
      tap((updatedUser) => {
        // If current user had their role updated, synchronize currentUser state
        if (this.currentUser()?.id === userId) {
          const current = this.currentUser()!;
          const updated = { ...current, role };
          this.currentUser.set(updated);
          this.activeRole.set(role);
          try {
            localStorage.setItem(this.USER_STORAGE_KEY, JSON.stringify(updated));
            localStorage.setItem(this.ROLE_STORAGE_KEY, role);
          } catch {}
        }
      })
    );
  }

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

  // Task Comments
  getTaskComments(taskId: string): Observable<TaskComment[]> {
    return this.http.get<TaskComment[]>(`${this.apiUrl}/tasks/${taskId}/comments`);
  }

  createTaskComment(taskId: string, content: string): Observable<TaskComment> {
    return this.http.post<TaskComment>(`${this.apiUrl}/tasks/${taskId}/comments`, { content });
  }

  updateTaskComment(commentId: string, content: string): Observable<TaskComment> {
    return this.http.put<TaskComment>(`${this.apiUrl}/comments/${commentId}`, { content });
  }

  deleteTaskComment(commentId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/comments/${commentId}`);
  }
}
