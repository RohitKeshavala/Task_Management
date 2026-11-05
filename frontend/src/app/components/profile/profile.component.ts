import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserRole, User } from '../../models/taskflow.model';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent {
  // Inputs
  isOpen = input<boolean>(false);
  activeRole = input<UserRole>('MEMBER');
  currentUser = input<User | null>(null);

  // Outputs
  close = output<void>();
  logout = output<void>();

  get displayName(): string {
    return this.currentUser()?.username || 'Alex Mercer';
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
