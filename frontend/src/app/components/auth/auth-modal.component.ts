import { Component, input, output, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TaskFlowService } from '../../services/taskflow.service';
import { User } from '../../models/taskflow.model';

@Component({
  selector: 'app-auth-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './auth-modal.component.html',
  styleUrls: ['./auth-modal.component.css']
})
export class AuthModalComponent {
  private taskflowService = inject(TaskFlowService);

  isOpen = input<boolean>(false);
  authenticated = output<User>();
  close = output<void>();

  isSignUp = signal<boolean>(false);
  email = signal<string>('');
  username = signal<string>('');
  password = signal<string>('');
  errorMessage = signal<string | null>(null);
  isLoading = signal<boolean>(false);

  switchTab(signUp: boolean): void {
    this.isSignUp.set(signUp);
    this.errorMessage.set(null);
  }

  useDemoAdmin(): void {
    this.isSignUp.set(false);
    this.email.set('admin@taskflow.dev');
    this.password.set('Admin123!');
    this.errorMessage.set(null);
  }

  onSubmit(): void {
    this.errorMessage.set(null);

    if (!this.email().trim()) {
      this.errorMessage.set('Email is required');
      return;
    }
    if (!this.password()) {
      this.errorMessage.set('Password is required');
      return;
    }
    if (this.isSignUp() && !this.username().trim()) {
      this.errorMessage.set('Username is required');
      return;
    }

    this.isLoading.set(true);

    if (this.isSignUp()) {
      this.taskflowService
        .register({
          username: this.username().trim(),
          email: this.email().trim(),
          password: this.password(),
        })
        .subscribe({
          next: (res) => {
            this.isLoading.set(false);
            this.authenticated.emit(res.user);
          },
          error: (err) => {
            this.isLoading.set(false);
            this.errorMessage.set(
              err.error?.message || err.error?.error || 'Registration failed. Please try again.'
            );
          },
        });
    } else {
      this.taskflowService
        .login({
          email: this.email().trim(),
          password: this.password(),
        })
        .subscribe({
          next: (res) => {
            this.isLoading.set(false);
            this.authenticated.emit(res.user);
          },
          error: (err) => {
            this.isLoading.set(false);
            this.errorMessage.set(
              err.error?.message || err.error?.error || 'Invalid email or password.'
            );
          },
        });
    }
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      // If user is not authenticated, modal cannot be simply dismissed to access workspace
      if (this.taskflowService.isAuthenticated()) {
        this.close.emit();
      }
    }
  }
}

