import { Component, Input, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { TasksService } from '../../tasks.service';
import { FamilyService } from '../../../../core/family/family.service';
import { TaskItemComponent } from '../task-item/task-item.component';
import { TaskFormComponent } from '../task-form/task-form.component';
import { TopicTask, Subtask } from '../../topics.models';

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatDialogModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    TaskItemComponent,
  ],
  template: `
    <div class="task-list">
      <!-- Header -->
      <div class="list-header">
        <h3>משימות</h3>
        <div class="header-actions">
          @if (tasksService.totalCount() > 0) {
            <span class="task-count">
              {{ tasksService.completedCount() }}/{{ tasksService.totalCount() }}
            </span>
          }
          <button mat-stroked-button (click)="openCreateDialog()">
            <mat-icon>add</mat-icon>
            משימה חדשה
          </button>
        </div>
      </div>

      <!-- Quick add -->
      <div class="quick-add">
        <mat-icon>add_task</mat-icon>
        <input
          class="quick-input"
          [(ngModel)]="quickTaskTitle"
          (keydown.enter)="quickAddTask()"
          placeholder="הוסף משימה מהירה..."
        />
      </div>

      @if (tasksService.isLoading()) {
        <div class="loading">
          <mat-spinner diameter="32"></mat-spinner>
        </div>
      } @else if (tasksService.totalCount() > 0) {
        <!-- Progress bar -->
        <div class="progress-section">
          <div class="progress-bar">
            <div class="progress" [style.width.%]="tasksService.progress()"></div>
          </div>
          <span class="progress-text">{{ tasksService.progress() | number:'1.0-0' }}%</span>
        </div>

        <!-- Task groups -->
        <div class="task-groups">
          <!-- In Progress -->
          @if (tasksService.groupedTasks().inProgress.length > 0) {
            <div class="task-group">
              <h4 class="group-title in-progress">
                <mat-icon>pending</mat-icon>
                בביצוע ({{ tasksService.groupedTasks().inProgress.length }})
              </h4>
              <div class="tasks">
                @for (task of tasksService.groupedTasks().inProgress; track task.id) {
                  <app-task-item
                    [task]="task"
                    [members]="familyService.members()"
                    (toggle)="toggleTask(task)"
                    (start)="startTask(task)"
                    (edit)="openEditDialog(task)"
                    (delete)="deleteTask(task)"
                    (toggleSubtask)="toggleSubtask(task, $event)"
                    (addSubtaskEvent)="addSubtask(task, $event)"
                    (deleteSubtask)="deleteSubtask(task, $event)"
                  ></app-task-item>
                }
              </div>
            </div>
          }

          <!-- Pending -->
          @if (tasksService.groupedTasks().pending.length > 0) {
            <div class="task-group">
              <h4 class="group-title pending">
                <mat-icon>radio_button_unchecked</mat-icon>
                ממתינות ({{ tasksService.groupedTasks().pending.length }})
              </h4>
              <div class="tasks">
                @for (task of tasksService.groupedTasks().pending; track task.id) {
                  <app-task-item
                    [task]="task"
                    [members]="familyService.members()"
                    (toggle)="toggleTask(task)"
                    (start)="startTask(task)"
                    (edit)="openEditDialog(task)"
                    (delete)="deleteTask(task)"
                    (toggleSubtask)="toggleSubtask(task, $event)"
                    (addSubtaskEvent)="addSubtask(task, $event)"
                    (deleteSubtask)="deleteSubtask(task, $event)"
                  ></app-task-item>
                }
              </div>
            </div>
          }

          <!-- Completed (collapsible) -->
          @if (tasksService.groupedTasks().completed.length > 0) {
            <div class="task-group">
              <button class="group-header-btn" (click)="toggleCompleted()">
                <h4 class="group-title completed">
                  <mat-icon>check_circle</mat-icon>
                  הושלמו ({{ tasksService.groupedTasks().completed.length }})
                </h4>
                <mat-icon class="chevron">
                  {{ showCompleted() ? 'expand_less' : 'expand_more' }}
                </mat-icon>
              </button>

              @if (showCompleted()) {
                <div class="tasks">
                  @for (task of tasksService.groupedTasks().completed; track task.id) {
                    <app-task-item
                      [task]="task"
                      [members]="familyService.members()"
                      (toggle)="toggleTask(task)"
                      (edit)="openEditDialog(task)"
                      (delete)="deleteTask(task)"
                    ></app-task-item>
                  }
                </div>
              }
            </div>
          }
        </div>
      } @else {
        <div class="empty-state">
          <mat-icon>task_alt</mat-icon>
          <p>אין משימות עדיין</p>
          <span>השתמשו בשורה למעלה להוספה מהירה</span>
        </div>
      }
    </div>
  `,
  styles: [`
    .task-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .list-header {
      display: flex;
      justify-content: space-between;
      align-items: center;

      h3 {
        margin: 0;
        font-size: 1.125rem;
        font-weight: 600;
      }

      .header-actions {
        display: flex;
        align-items: center;
        gap: 0.75rem;
      }

      .task-count {
        font-size: 0.875rem;
        color: var(--text-secondary);
        font-weight: 500;
      }
    }

    .quick-add {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      background: var(--surface-secondary);
      border: 1px dashed var(--border-subtle);
      border-radius: 0.75rem;

      mat-icon {
        color: var(--text-tertiary);
      }

      .quick-input {
        flex: 1;
        border: none;
        background: transparent;
        font-size: 0.9375rem;
        outline: none;
        color: var(--text-primary);

        &::placeholder {
          color: var(--text-tertiary);
        }
      }
    }

    .loading {
      display: flex;
      justify-content: center;
      padding: 2rem;
    }

    .progress-section {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .progress-bar {
      flex: 1;
      height: 6px;
      background: var(--surface-tertiary);
      border-radius: 3px;
      overflow: hidden;

      .progress {
        height: 100%;
        background: var(--color-success);
        transition: width 0.3s ease;
        border-radius: 3px;
      }
    }

    .progress-text {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--color-success);
      min-width: 36px;
    }

    .task-groups {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .task-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .group-title {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin: 0;
      font-size: 0.875rem;
      font-weight: 600;

      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }

      &.in-progress {
        color: var(--color-primary);
      }

      &.pending {
        color: var(--text-secondary);
      }

      &.completed {
        color: var(--color-success);
      }
    }

    .group-header-btn {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
      background: none;
      border: none;
      cursor: pointer;
      padding: 0.25rem 0;

      .chevron {
        color: var(--text-tertiary);
      }
    }

    .tasks {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 2rem;
      text-align: center;
      gap: 0.5rem;

      mat-icon {
        font-size: 40px;
        width: 40px;
        height: 40px;
        color: var(--text-tertiary);
      }

      p {
        margin: 0;
        font-weight: 500;
        color: var(--text-secondary);
      }

      span {
        font-size: 0.875rem;
        color: var(--text-tertiary);
      }
    }
  `]
})
export class TaskListComponent {
  @Input({ required: true }) topicId!: string;

  tasksService = inject(TasksService);
  familyService = inject(FamilyService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  quickTaskTitle = '';
  showCompleted = signal(false);

  toggleCompleted(): void {
    this.showCompleted.update((v) => !v);
  }

  async quickAddTask(): Promise<void> {
    if (!this.quickTaskTitle.trim()) return;

    try {
      await this.tasksService.createTask(this.topicId, {
        title: this.quickTaskTitle.trim(),
      });
      this.quickTaskTitle = '';
    } catch (error: any) {
      this.snackBar.open(error.message || 'שגיאה', 'סגור', { duration: 3000 });
    }
  }

  openCreateDialog(): void {
    const dialogRef = this.dialog.open(TaskFormComponent, {
      width: '100%',
      maxWidth: '500px',
      data: { topicId: this.topicId },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.snackBar.open('המשימה נוצרה', '', { duration: 2000 });
      }
    });
  }

  openEditDialog(task: TopicTask): void {
    const dialogRef = this.dialog.open(TaskFormComponent, {
      width: '100%',
      maxWidth: '500px',
      data: { topicId: this.topicId, task },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.snackBar.open('המשימה עודכנה', '', { duration: 2000 });
      }
    });
  }

  async toggleTask(task: TopicTask): Promise<void> {
    try {
      await this.tasksService.toggleTaskStatus(this.topicId, task.id);
    } catch (error: any) {
      this.snackBar.open(error.message || 'שגיאה', 'סגור', { duration: 3000 });
    }
  }

  async startTask(task: TopicTask): Promise<void> {
    try {
      await this.tasksService.startTask(this.topicId, task.id);
    } catch (error: any) {
      this.snackBar.open(error.message || 'שגיאה', 'סגור', { duration: 3000 });
    }
  }

  async deleteTask(task: TopicTask): Promise<void> {
    try {
      await this.tasksService.deleteTask(this.topicId, task.id);
      this.snackBar.open('המשימה נמחקה', '', { duration: 2000 });
    } catch (error: any) {
      this.snackBar.open(error.message || 'שגיאה', 'סגור', { duration: 3000 });
    }
  }

  async toggleSubtask(task: TopicTask, subtask: Subtask): Promise<void> {
    try {
      await this.tasksService.toggleSubtask(this.topicId, task.id, subtask.id);
    } catch (error: any) {
      this.snackBar.open(error.message || 'שגיאה', 'סגור', { duration: 3000 });
    }
  }

  async addSubtask(task: TopicTask, text: string): Promise<void> {
    try {
      await this.tasksService.addSubtask(this.topicId, task.id, text);
    } catch (error: any) {
      this.snackBar.open(error.message || 'שגיאה', 'סגור', { duration: 3000 });
    }
  }

  async deleteSubtask(task: TopicTask, subtask: Subtask): Promise<void> {
    try {
      await this.tasksService.deleteSubtask(this.topicId, task.id, subtask.id);
    } catch (error: any) {
      this.snackBar.open(error.message || 'שגיאה', 'סגור', { duration: 3000 });
    }
  }
}
