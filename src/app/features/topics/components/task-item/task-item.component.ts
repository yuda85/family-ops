import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { TopicTask, Subtask, getPriorityMeta } from '../../topics.models';
import { FamilyMember } from '../../../../core/family/family.models';

@Component({
  selector: 'app-task-item',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatCheckboxModule,
    MatMenuModule,
    MatTooltipModule,
    MatChipsModule,
  ],
  template: `
    <div
      class="task-item"
      [class.completed]="task.status === 'completed'"
      [class.in-progress]="task.status === 'in_progress'"
      [class.overdue]="isOverdue"
    >
      <!-- Main task row -->
      <div class="task-row">
        <mat-checkbox
          [checked]="task.status === 'completed'"
          (change)="onToggle()"
          color="primary"
        ></mat-checkbox>

        <div class="task-content" (click)="onEdit()">
          <span class="task-title">{{ task.title }}</span>

          <div class="task-meta">
            @if (task.priority !== 'medium') {
              <span class="priority" [style.color]="getPriorityMeta(task.priority).color">
                <mat-icon>{{ getPriorityMeta(task.priority).icon }}</mat-icon>
              </span>
            }

            @if (task.dueDate) {
              <span class="due-date" [class.overdue]="isOverdue">
                <mat-icon>schedule</mat-icon>
                {{ formatDueDate(task.dueDate.toDate()) }}
              </span>
            }

            @if (task.subtasks.length > 0) {
              <span class="subtask-count">
                <mat-icon>checklist</mat-icon>
                {{ completedSubtasks }}/{{ task.subtasks.length }}
              </span>
            }
          </div>
        </div>

        <!-- Assigned users -->
        @if (assignedMembers.length > 0) {
          <div class="assigned-users">
            @for (member of assignedMembers.slice(0, 2); track member.id) {
              <span class="avatar" [matTooltip]="member.displayName">
                @if (member.photoURL) {
                  <img [src]="member.photoURL" [alt]="member.displayName" />
                } @else {
                  {{ member.displayName.charAt(0) }}
                }
              </span>
            }
            @if (assignedMembers.length > 2) {
              <span class="avatar more">+{{ assignedMembers.length - 2 }}</span>
            }
          </div>
        }

        <!-- Actions menu -->
        <button mat-icon-button [matMenuTriggerFor]="taskMenu" class="menu-btn">
          <mat-icon>more_vert</mat-icon>
        </button>
        <mat-menu #taskMenu="matMenu">
          @if (task.status === 'pending') {
            <button mat-menu-item (click)="onStart()">
              <mat-icon>play_arrow</mat-icon>
              <span>התחל לעבוד</span>
            </button>
          }
          @if (task.status === 'in_progress') {
            <button mat-menu-item (click)="onToggle()">
              <mat-icon>check</mat-icon>
              <span>סיים משימה</span>
            </button>
          }
          <button mat-menu-item (click)="onEdit()">
            <mat-icon>edit</mat-icon>
            <span>ערוך</span>
          </button>
          <button mat-menu-item (click)="toggleSubtasks()">
            <mat-icon>{{ showSubtasks ? 'expand_less' : 'expand_more' }}</mat-icon>
            <span>{{ showSubtasks ? 'הסתר' : 'הצג' }} תתי-משימות</span>
          </button>
          <button mat-menu-item class="delete-item" (click)="onDelete()">
            <mat-icon>delete</mat-icon>
            <span>מחק</span>
          </button>
        </mat-menu>
      </div>

      <!-- Subtasks (expandable) -->
      @if (showSubtasks && (task.subtasks.length > 0 || task.status !== 'completed')) {
        <div class="subtasks">
          @for (subtask of task.subtasks; track subtask.id) {
            <div class="subtask-item">
              <mat-checkbox
                [checked]="subtask.isCompleted"
                (change)="onToggleSubtask(subtask)"
                [disabled]="task.status === 'completed'"
              ></mat-checkbox>
              <span class="subtask-text" [class.completed]="subtask.isCompleted">
                {{ subtask.text }}
              </span>
              <button
                mat-icon-button
                class="delete-subtask"
                (click)="onDeleteSubtask(subtask)"
                [disabled]="task.status === 'completed'"
              >
                <mat-icon>close</mat-icon>
              </button>
            </div>
          }

          @if (task.status !== 'completed') {
            <div class="add-subtask">
              <mat-icon>add</mat-icon>
              <input
                class="add-input"
                [(ngModel)]="newSubtaskText"
                (keydown.enter)="addSubtask()"
                placeholder="הוסף תת-משימה..."
              />
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .task-item {
      background: var(--surface-primary);
      border: 1px solid var(--border-subtle);
      border-radius: 0.75rem;
      transition: all 0.2s ease;

      &:hover {
        border-color: var(--border-default);
      }

      &.completed {
        opacity: 0.7;

        .task-title {
          text-decoration: line-through;
          color: var(--text-tertiary);
        }
      }

      &.in-progress {
        border-color: var(--color-primary);
        border-inline-start-width: 3px;
      }

      &.overdue:not(.completed) {
        border-color: var(--color-error);
      }
    }

    .task-row {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
    }

    .task-content {
      flex: 1;
      min-width: 0;
      cursor: pointer;
    }

    .task-title {
      display: block;
      font-weight: 500;
      color: var(--text-primary);
      margin-bottom: 0.25rem;
    }

    .task-meta {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-wrap: wrap;
    }

    .priority, .due-date, .subtask-count {
      display: inline-flex;
      align-items: center;
      gap: 0.125rem;
      font-size: 0.75rem;

      mat-icon {
        font-size: 14px;
        width: 14px;
        height: 14px;
      }
    }

    .due-date {
      color: var(--text-secondary);

      &.overdue {
        color: var(--color-error);
      }
    }

    .subtask-count {
      color: var(--text-secondary);
    }

    .assigned-users {
      display: flex;
      margin-inline-start: auto;

      .avatar {
        width: 28px;
        height: 28px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.75rem;
        font-weight: 500;
        background: var(--color-primary);
        color: white;
        border: 2px solid var(--surface-primary);
        margin-inline-start: -8px;

        &:first-child {
          margin-inline-start: 0;
        }

        img {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          object-fit: cover;
        }

        &.more {
          background: var(--surface-tertiary);
          color: var(--text-secondary);
        }
      }
    }

    .menu-btn {
      flex-shrink: 0;
      color: var(--text-tertiary);
    }

    /* Subtasks */
    .subtasks {
      padding: 0 1rem 1rem 3rem;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .subtask-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;

      .subtask-text {
        flex: 1;
        font-size: 0.875rem;

        &.completed {
          text-decoration: line-through;
          color: var(--text-tertiary);
        }
      }

      .delete-subtask {
        opacity: 0;
        color: var(--text-tertiary);
        transform: scale(0.8);

        &:hover {
          color: var(--color-error);
        }
      }

      &:hover .delete-subtask {
        opacity: 1;
      }
    }

    .add-subtask {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.25rem 0;
      color: var(--text-tertiary);

      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }

      .add-input {
        flex: 1;
        border: none;
        background: transparent;
        font-size: 0.875rem;
        outline: none;
        color: var(--text-primary);

        &::placeholder {
          color: var(--text-tertiary);
        }
      }
    }

    .delete-item {
      color: var(--color-error);
    }
  `]
})
export class TaskItemComponent {
  @Input({ required: true }) task!: TopicTask;
  @Input() members: FamilyMember[] = [];

  @Output() toggle = new EventEmitter<void>();
  @Output() start = new EventEmitter<void>();
  @Output() edit = new EventEmitter<void>();
  @Output() delete = new EventEmitter<void>();
  @Output() toggleSubtask = new EventEmitter<Subtask>();
  @Output() addSubtaskEvent = new EventEmitter<string>();
  @Output() deleteSubtask = new EventEmitter<Subtask>();

  showSubtasks = false;
  newSubtaskText = '';

  getPriorityMeta = getPriorityMeta;

  get isOverdue(): boolean {
    if (!this.task.dueDate) return false;
    return this.task.dueDate.toDate() < new Date() && this.task.status !== 'completed';
  }

  get completedSubtasks(): number {
    return this.task.subtasks.filter((s) => s.isCompleted).length;
  }

  get assignedMembers(): FamilyMember[] {
    return this.members.filter((m) => this.task.assignedTo.includes(m.id));
  }

  formatDueDate(date: Date): string {
    const now = new Date();
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'היום';
    if (diffDays === 1) return 'מחר';
    if (diffDays === -1) return 'אתמול';
    if (diffDays < 0) return `לפני ${Math.abs(diffDays)} ימים`;
    if (diffDays <= 7) return `בעוד ${diffDays} ימים`;

    return date.toLocaleDateString('he-IL', { day: 'numeric', month: 'short' });
  }

  toggleSubtasks(): void {
    this.showSubtasks = !this.showSubtasks;
  }

  onToggle(): void {
    this.toggle.emit();
  }

  onStart(): void {
    this.start.emit();
  }

  onEdit(): void {
    this.edit.emit();
  }

  onDelete(): void {
    this.delete.emit();
  }

  onToggleSubtask(subtask: Subtask): void {
    this.toggleSubtask.emit(subtask);
  }

  addSubtask(): void {
    if (!this.newSubtaskText.trim()) return;
    this.addSubtaskEvent.emit(this.newSubtaskText.trim());
    this.newSubtaskText = '';
  }

  onDeleteSubtask(subtask: Subtask): void {
    this.deleteSubtask.emit(subtask);
  }
}
