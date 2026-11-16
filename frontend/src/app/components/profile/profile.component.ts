import { Component, input, output, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { interval, switchMap, EMPTY } from 'rxjs';
import { UserRole, User } from '../../models/taskflow.model';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent {
  private destroyRef = inject(DestroyRef);

  // Inputs
  isOpen = input<boolean>(false);
  activeRole = input<UserRole>('MEMBER');
  currentUser = input<User | null>(null);

  // Outputs
  close = output<void>();
  logout = output<void>();
  configureGovernance = output<void>();

  // Real-time session elapsed counter tracked via reactive signal
  readonly sessionSeconds = signal<number>(0);

  // User status message and focus tagline (safe text properties)
  statusHeadline = 'Active on Sprint Milestones';
  statusMessage = 'Reviewing open PRs';

  constructor() {
    // Only tick when modal is actively open and reset timer to 0 on each modal opening
    toObservable(this.isOpen)
      .pipe(
        switchMap(open => {
          if (open) {
            this.sessionSeconds.set(0);
            return interval(1000);
          }
          return EMPTY;
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {
        this.sessionSeconds.update(s => s + 1);
      });
  }

  get displayName(): string {
    return this.currentUser()?.username || 'Alex Mercer';
  }
  

  get userInitials(): string {
    const parts = this.displayName.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      const first = Array.from(parts[0])[0] || '';
      const second = Array.from(parts[1])[0] || '';
      return (first + second).toUpperCase();
    }
    return parts[0] ? Array.from(parts[0]).slice(0, 2).join('').toUpperCase() : 'U';
  }

  get displayEmail(): string {
    return this.currentUser()?.email || 'alex.mercer@taskflow.dev';
  }

  get joinedDate(): string {
    if (this.currentUser()?.createdAt) {
      return new Date(this.currentUser()!.createdAt).toLocaleDateString(undefined, {
        month: 'short',
        year: 'numeric',
      });
    }
    return 'March 2024';
  }

  // Format session uptime into mm:ss display
  get sessionDurationDisplay(): string {
    const total = this.sessionSeconds();
    const mins = Math.floor(total / 60);
    const secs = total % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  // Permission check for configuring workspace settings and policies (Admin only)
  get canManageWorkspaceSettings(): boolean {
    return this.activeRole() === 'ADMIN';
  }

  get roleCapabilities(): string[] {
    switch (this.activeRole()) {
      case 'ADMIN':
        return [
          'Full unrestricted administrative access across all workspace resources',
          'Create, update, and delete projects',
          'Create, update, and delete tasks and dependencies',
          'User Role Governance: Assign and modify member roles'
        ];
      case 'MEMBER':
        return [
          'Full read access across all workspace projects and tasks',
          'Create and update tasks, tags, and dependencies',
          'Restricted from deleting projects (Admin only)',
          'Cannot alter user role assignments'
        ];
      case 'VIEWER':
        return [
          'Read-only observation access across projects and Kanban board',
          'Inspect tasks, dependencies, tags, and progress metrics',
          'All create, update, delete, and drag-and-drop operations disabled'
        ];
    }
  }

  onClose(): void {
    this.close.emit();
  }

  onLogout(): void {
    this.logout.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('profile-modal-backdrop')) {
      this.onClose();
    }
  }
}
