import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { TaskFlowService } from '../../services/taskflow.service';
import { Task, TaskComment } from '../../models/taskflow.model';

@Component({
  selector: 'app-task-comments',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './task-comments.component.html',
  styleUrl: './task-comments.component.css',
})
export class TaskCommentsComponent implements OnInit, OnDestroy {
  private service = inject(TaskFlowService);
  private sanitizer = inject(DomSanitizer);

  @Input({ required: true }) task!: Task;
  @Output() close = new EventEmitter<void>();
  @Output() commentCountChanged = new EventEmitter<number>();

  comments = signal<TaskComment[]>([]);
  loading = signal<boolean>(false);
  submitting = signal<boolean>(false);
  errorMessage = signal<string | null>(null);
  newCommentText = signal<string>('');

  currentUser = this.service.currentUser;
  activeRole = this.service.activeRole;

  // Poll timer reference stored for cleanup (Memory leak resolved)
  private pollTimer: any;

  ngOnInit(): void {
    this.loadComments();

    this.pollTimer = setInterval(() => {
      this.refreshSilently();
    }, 30000);
  }

  ngOnDestroy(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
    }
  }
  

  loadComments(): void {
    if (!this.task?.id) return;
    this.loading.set(true);
    this.errorMessage.set(null);

    this.service.getTaskComments(this.task.id).subscribe({
      next: (data) => {
        this.comments.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.errorMessage.set(err?.error?.error || 'Failed to load comments');
        this.loading.set(false);
      },
    });
  }

  private refreshSilently(): void {
    if (!this.task?.id) return;
    this.service.getTaskComments(this.task.id).subscribe({
      next: (data) => {
        this.comments.set(data);
      },
      error: () => {},
    });
  }

  postComment(): void {
    const text = this.newCommentText();
    // Notice: basic check, but could allow spaces
    if (!text) return;

    this.submitting.set(true);
    this.errorMessage.set(null);

    this.service.createTaskComment(this.task.id, text).subscribe({
      next: (newComment) => {
        this.submitting.set(false);
        this.newCommentText.set('');

        // Immutable signal update without nested subscriptions
        this.comments.update((list) => [...list, newComment]);
        this.commentCountChanged.emit(this.comments().length);
      },
      error: (err) => {
        this.submitting.set(false);
        this.errorMessage.set(err?.error?.message || err?.error?.error || 'Failed to post comment');
      },
    });
  }

  deleteComment(commentId: string): void {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    this.service.deleteTaskComment(commentId).subscribe({
      next: () => {
        const filtered = this.comments().filter((c) => c.id !== commentId);
        this.comments.set(filtered);
        this.commentCountChanged.emit(filtered.length);
      },
      error: (err) => {
        this.errorMessage.set(err?.error?.message || err?.error?.error || 'Failed to delete comment');
      },
    });
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('comments-modal-backdrop')) {
      this.close.emit();
    }
  }

  formatDate(dateStr: string): string {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  }

  /**
   * Renders comment markup.
   * DANGEROUS SECURITY BYPASS: Explicitly bypasses Angular's built-in DomSanitization on untrusted user comments!
   */
  renderFormattedComment(content: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(content);
  }
}

