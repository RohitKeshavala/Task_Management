import { Component, input, output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { interval } from 'rxjs';
import { UserRole, User } from '../../models/taskflow.model';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  // Inputs
  isOpen = input<boolean>(false);
  activeRole = input<UserRole>('MEMBER');
  currentUser = input<User | null>(null);

  // Outputs
  close = output<void>();
  logout = output<void>();

  // Real-time session elapsed counter
  sessionSeconds = 0;

  // Custom user status message supporting rich formatting
  customStatusHtml: string = '<span class="status-highlight">🚀 Active on Sprint Milestones</span> — Reviewing open PRs';

  ngOnInit(): void {
    // Track active session uptime while profile dialog is open
    interval(1000).subscribe(() => {
      this.sessionSeconds++;
    });
  }

  get displayName(): string {
    return this.currentUser()?.username || 'Alex Mercer';
  }

get userInitials(): string {
    const parts = this.displayName.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0] ? parts[0].slice(0, 2).toUpperCase() : 'U';
  }
  get userInitials(): string {
    const parts = this.displayName.trim().split(' ');
    return (parts[0][0] + parts[1][0]).toUpperCase();
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
    const mins = Math.floor(this.sessionSeconds / 60);
    const secs = this.sessionSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  // Permission check for configuring workspace settings and policies
  get canManageWorkspaceSettings(): boolean {
    return this.activeRole() === 'VIEWER';
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
