import { Component, inject, Inject, Optional, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogModule,
} from '@angular/material/dialog';

import { TasksService } from '../../tasks.service';
import { FamilyService } from '../../../../core/family/family.service';
import {
  TopicTask,
  TopicPriority,
  CreateTaskData,
  TOPIC_PRIORITIES,
} from '../../topics.models';

export interface TaskFormData {
  topicId: string;
  task?: TopicTask;
}

@Component({
  selector: 'app-task-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatCheckboxModule,
    MatDialogModule,
  ],
  template: `
    <div class="task-form">
      <header class="form-header">
        <h2>{{ isEdit ? 'עריכת משימה' : 'משימה חדשה' }}</h2>
        <button mat-icon-button (click)="close()">
          <mat-icon>close</mat-icon>
        </button>
      </header>

      <form #taskForm="ngForm" (ngSubmit)="submit()">
        <div class="form-content">
          <!-- Title -->
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>כותרת</mat-label>
            <input
              matInput
              [(ngModel)]="formData.title"
              name="title"
              required
              placeholder="מה צריך לעשות?"
            />
          </mat-form-field>

          <!-- Description -->
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>תיאור (אופציונלי)</mat-label>
            <textarea
              matInput
              [(ngModel)]="formData.description"
              name="description"
              rows="2"
              placeholder="פרטים נוספים..."
            ></textarea>
          </mat-form-field>

          <!-- Priority & Due Date Row -->
          <div class="form-row">
            <mat-form-field appearance="outline" class="half-width">
              <mat-label>עדיפות</mat-label>
              <mat-select [(ngModel)]="formData.priority" name="priority">
                @for (pri of priorities; track pri.id) {
                  <mat-option [value]="pri.id">
                    <mat-icon [style.color]="pri.color">{{ pri.icon }}</mat-icon>
                    {{ pri.labelHe }}
                  </mat-option>
                }
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline" class="half-width">
              <mat-label>תאריך יעד</mat-label>
              <input
                matInput
                [matDatepicker]="duePicker"
                [(ngModel)]="formData.dueDate"
                name="dueDate"
              />
              <mat-datepicker-toggle matSuffix [for]="duePicker"></mat-datepicker-toggle>
              <mat-datepicker #duePicker></mat-datepicker>
            </mat-form-field>
          </div>

          <!-- Assignees -->
          @if (familyService.members().length > 0) {
            <div class="assignees-section">
              <label class="section-label">הקצה לחברי משפחה</label>
              <div class="assignees-chips">
                @for (member of familyService.members(); track member.id) {
                  <label class="assignee-chip" [class.selected]="isAssigned(member.id)">
                    <input
                      type="checkbox"
                      [checked]="isAssigned(member.id)"
                      (change)="toggleAssignee(member.id)"
                    />
                    <span class="avatar">
                      @if (member.photoURL) {
                        <img [src]="member.photoURL" [alt]="member.displayName" />
                      } @else {
                        {{ member.displayName.charAt(0) }}
                      }
                    </span>
                    {{ member.displayName }}
                  </label>
                }
              </div>
            </div>
          }
        </div>

        <footer class="form-footer">
          <button mat-button type="button" (click)="close()">ביטול</button>
          <button
            mat-flat-button
            color="primary"
            type="submit"
            [disabled]="!taskForm.valid || isSubmitting"
          >
            {{ isEdit ? 'שמור' : 'צור משימה' }}
          </button>
        </footer>
      </form>
    </div>
  `,
  styles: [`
    .task-form {
      display: flex;
      flex-direction: column;
      max-height: 90vh;
    }

    .form-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.5rem;
      border-bottom: 1px solid var(--border-subtle);

      h2 {
        margin: 0;
        font-size: 1.25rem;
        font-weight: 600;
      }
    }

    .form-content {
      padding: 1.5rem;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .full-width {
      width: 100%;
    }

    .form-row {
      display: flex;
      gap: 1rem;

      @media (max-width: 480px) {
        flex-direction: column;
        gap: 0.5rem;
      }
    }

    .half-width {
      flex: 1;
    }

    .section-label {
      display: block;
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--text-secondary);
      margin-bottom: 0.5rem;
    }

    .assignees-section {
      margin-top: 0.5rem;
    }

    .assignees-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .assignee-chip {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 0.75rem;
      background: var(--surface-secondary);
      border: 1px solid var(--border-subtle);
      border-radius: 9999px;
      cursor: pointer;
      transition: all 0.15s ease;

      input {
        display: none;
      }

      .avatar {
        width: 24px;
        height: 24px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.75rem;
        font-weight: 500;
        background: var(--color-primary);
        color: white;

        img {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          object-fit: cover;
        }
      }

      &:hover {
        background: var(--surface-hover);
      }

      &.selected {
        background: var(--color-primary);
        color: white;
        border-color: var(--color-primary);

        .avatar {
          background: white;
          color: var(--color-primary);
        }
      }
    }

    .form-footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      padding: 1rem 1.5rem;
      border-top: 1px solid var(--border-subtle);
    }
  `]
})
export class TaskFormComponent implements OnInit {
  private tasksService = inject(TasksService);
  familyService = inject(FamilyService);
  private dialogRef = inject(MatDialogRef<TaskFormComponent>);

  priorities = TOPIC_PRIORITIES;

  isEdit = false;
  isSubmitting = false;

  formData: {
    title: string;
    description: string;
    priority: TopicPriority;
    dueDate: Date | null;
    assignedTo: string[];
  } = {
    title: '',
    description: '',
    priority: 'medium',
    dueDate: null,
    assignedTo: [],
  };

  constructor(@Optional() @Inject(MAT_DIALOG_DATA) public data: TaskFormData) {}

  ngOnInit(): void {
    if (this.data?.task) {
      this.isEdit = true;
      const task = this.data.task;
      this.formData = {
        title: task.title,
        description: task.description || '',
        priority: task.priority,
        dueDate: task.dueDate?.toDate() || null,
        assignedTo: [...task.assignedTo],
      };
    }
  }

  isAssigned(userId: string): boolean {
    return this.formData.assignedTo.includes(userId);
  }

  toggleAssignee(userId: string): void {
    const index = this.formData.assignedTo.indexOf(userId);
    if (index >= 0) {
      this.formData.assignedTo.splice(index, 1);
    } else {
      this.formData.assignedTo.push(userId);
    }
  }

  async submit(): Promise<void> {
    if (this.isSubmitting) return;

    this.isSubmitting = true;

    try {
      const data: CreateTaskData = {
        title: this.formData.title.trim(),
        description: this.formData.description.trim(),
        priority: this.formData.priority,
        dueDate: this.formData.dueDate || undefined,
        assignedTo: this.formData.assignedTo,
      };

      if (this.isEdit && this.data?.task) {
        await this.tasksService.updateTask(this.data.topicId, this.data.task.id, data);
      } else {
        await this.tasksService.createTask(this.data.topicId, data);
      }

      this.dialogRef.close(true);
    } catch (error: any) {
      console.error('Error saving task:', error);
    } finally {
      this.isSubmitting = false;
    }
  }

  close(): void {
    this.dialogRef.close();
  }
}
