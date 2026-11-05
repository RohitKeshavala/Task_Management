import { Component, input, output, signal, computed, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TaskFlowService } from '../../services/taskflow.service';
import { User, UserRole, ALL_ROLES } from '../../models/taskflow.model';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.css']
})
export class UserManagementComponent {
  private taskflowService = inject(TaskFlowService);

  isOpen = input<boolean>(false);
  close = output<void>();
  roleChanged = output<{ userId: string; role: UserRole }>();

  roles = ALL_ROLES;
  users = signal<User[]>([]);
  isLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  searchQuery = signal<string>('');

  filteredUsers = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    if (!q) return this.users();
    return this.users().filter(
      (u) =>
        u.username.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q)
    );
  });

  constructor() {
    effect(() => {
      if (this.isOpen()) {
        this.loadUsers();
      }
    });
  }

  loadUsers(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.taskflowService.getUsers().subscribe({
      next: (data) => {
        this.users.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(
          err.error?.message || err.error?.error || 'Failed to load users.'
        );
      },
    });
  }

  onRoleChange(user: User, event: Event): void {
    const newRole = (event.target as HTMLSelectElement).value as UserRole;
    if (user.role === newRole) return;

    this.errorMessage.set(null);
    this.successMessage.set(null);

    this.taskflowService.updateUserRole(user.id, newRole).subscribe({
      next: (updatedUser) => {
        this.users.update((list) =>
          list.map((u) => (u.id === user.id ? updatedUser : u))
        );
        this.successMessage.set(
          `Updated role for ${user.username} to ${newRole}.`
        );
        this.roleChanged.emit({ userId: user.id, role: newRole });
        setTimeout(() => this.successMessage.set(null), 3000);
      },
      error: (err) => {
        // Revert select display
        (event.target as HTMLSelectElement).value = user.role;
        this.errorMessage.set(
          err.error?.message || err.error?.error || 'Failed to update user role.'
        );
        setTimeout(() => this.errorMessage.set(null), 4000);
      },
    });
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.close.emit();
    }
  }
}

