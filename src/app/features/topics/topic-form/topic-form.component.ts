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

import { TopicsService } from '../topics.service';
import { FamilyService } from '../../../core/family/family.service';
import {
  Topic,
  TopicCategory,
  TopicPriority,
  CreateTopicData,
  TOPIC_CATEGORIES,
  TOPIC_PRIORITIES,
} from '../topics.models';

export interface TopicFormData {
  topic?: Topic;
}

@Component({
  selector: 'app-topic-form',
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
    <div class="topic-form">
      <header class="form-header">
        <h2>{{ isEdit ? 'עריכת נושא' : 'נושא חדש' }}</h2>
        <button mat-icon-button (click)="close()">
          <mat-icon>close</mat-icon>
        </button>
      </header>

      <form #topicForm="ngForm" (ngSubmit)="submit()">
        <div class="form-content">
          <!-- Title -->
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>כותרת</mat-label>
            <input
              matInput
              [(ngModel)]="formData.title"
              name="title"
              required
              placeholder="לדוגמה: חופשה לאילת"
            />
          </mat-form-field>

          <!-- Category & Priority Row -->
          <div class="form-row">
            <mat-form-field appearance="outline" class="half-width">
              <mat-label>קטגוריה</mat-label>
              <mat-select [(ngModel)]="formData.category" name="category" required>
                @for (cat of categories; track cat.id) {
                  <mat-option [value]="cat.id">
                    <mat-icon [style.color]="cat.color">{{ cat.icon }}</mat-icon>
                    {{ cat.labelHe }}
                  </mat-option>
                }
              </mat-select>
            </mat-form-field>

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
          </div>

          <!-- Description -->
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>תיאור</mat-label>
            <textarea
              matInput
              [(ngModel)]="formData.description"
              name="description"
              rows="3"
              placeholder="במה מדובר? מה המטרות?"
            ></textarea>
          </mat-form-field>

          <!-- Target Date & Deadline -->
          <div class="form-row">
            <mat-form-field appearance="outline" class="half-width">
              <mat-label>תאריך יעד</mat-label>
              <input
                matInput
                [matDatepicker]="targetPicker"
                [(ngModel)]="formData.targetDate"
                name="targetDate"
              />
              <mat-datepicker-toggle matSuffix [for]="targetPicker"></mat-datepicker-toggle>
              <mat-datepicker #targetPicker></mat-datepicker>
            </mat-form-field>

            <mat-form-field appearance="outline" class="half-width">
              <mat-label>דדליין</mat-label>
              <input
                matInput
                [matDatepicker]="deadlinePicker"
                [(ngModel)]="formData.deadline"
                name="deadline"
              />
              <mat-datepicker-toggle matSuffix [for]="deadlinePicker"></mat-datepicker-toggle>
              <mat-datepicker #deadlinePicker></mat-datepicker>
            </mat-form-field>
          </div>

          <!-- Children -->
          @if (familyService.children().length > 0) {
            <div class="children-section">
              <label class="section-label">ילדים קשורים</label>
              <div class="children-chips">
                @for (child of familyService.children(); track child.id) {
                  <label class="child-chip" [class.selected]="isChildSelected(child.id)">
                    <input
                      type="checkbox"
                      [checked]="isChildSelected(child.id)"
                      (change)="toggleChild(child.id)"
                    />
                    <span class="chip-dot" [style.background]="child.color"></span>
                    {{ child.name }}
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
            [disabled]="!topicForm.valid || isSubmitting"
          >
            {{ isEdit ? 'שמור' : 'צור נושא' }}
          </button>
        </footer>
      </form>
    </div>
  `,
  styles: [`
    .topic-form {
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

    .children-section {
      margin-top: 0.5rem;
    }

    .children-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .child-chip {
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

      .chip-dot {
        width: 12px;
        height: 12px;
        border-radius: 50%;
      }

      &:hover {
        background: var(--surface-hover);
      }

      &.selected {
        background: var(--color-primary);
        color: white;
        border-color: var(--color-primary);
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
export class TopicFormComponent implements OnInit {
  private topicsService = inject(TopicsService);
  familyService = inject(FamilyService);
  private dialogRef = inject(MatDialogRef<TopicFormComponent>);

  categories = TOPIC_CATEGORIES;
  priorities = TOPIC_PRIORITIES;

  isEdit = false;
  isSubmitting = false;

  formData: {
    title: string;
    description: string;
    category: TopicCategory;
    priority: TopicPriority;
    targetDate: Date | null;
    deadline: Date | null;
    linkedChildrenIds: string[];
  } = {
    title: '',
    description: '',
    category: 'general',
    priority: 'medium',
    targetDate: null,
    deadline: null,
    linkedChildrenIds: [],
  };

  constructor(@Optional() @Inject(MAT_DIALOG_DATA) public data: TopicFormData) {}

  ngOnInit(): void {
    if (this.data?.topic) {
      this.isEdit = true;
      const topic = this.data.topic;
      this.formData = {
        title: topic.title,
        description: topic.description,
        category: topic.category,
        priority: topic.priority,
        targetDate: topic.targetDate?.toDate() || null,
        deadline: topic.deadline?.toDate() || null,
        linkedChildrenIds: [...topic.linkedChildrenIds],
      };
    }
  }

  isChildSelected(childId: string): boolean {
    return this.formData.linkedChildrenIds.includes(childId);
  }

  toggleChild(childId: string): void {
    const index = this.formData.linkedChildrenIds.indexOf(childId);
    if (index >= 0) {
      this.formData.linkedChildrenIds.splice(index, 1);
    } else {
      this.formData.linkedChildrenIds.push(childId);
    }
  }

  async submit(): Promise<void> {
    if (this.isSubmitting) return;

    this.isSubmitting = true;

    try {
      const data: CreateTopicData = {
        title: this.formData.title.trim(),
        description: this.formData.description.trim(),
        category: this.formData.category,
        priority: this.formData.priority,
        targetDate: this.formData.targetDate || undefined,
        deadline: this.formData.deadline || undefined,
        linkedChildrenIds: this.formData.linkedChildrenIds,
      };

      if (this.isEdit && this.data?.topic) {
        await this.topicsService.updateTopic(this.data.topic.id, data);
      } else {
        await this.topicsService.createTopic(data);
      }

      this.dialogRef.close(true);
    } catch (error: any) {
      console.error('Error saving topic:', error);
      // TODO: Show error to user
    } finally {
      this.isSubmitting = false;
    }
  }

  close(): void {
    this.dialogRef.close();
  }
}
