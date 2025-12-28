import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { TransportationService } from '../transportation.service';
import { FamilyService } from '../../../core/family/family.service';
import {
  CreateTransportationTaskData,
  EVENT_CATEGORIES,
  EventCategory,
} from '../../../core/family/family.models';

export interface AddTaskDialogData {
  date?: Date;
}

@Component({
  selector: 'app-add-task-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
  ],
  template: `
    <div class="dialog-container">
      <div class="dialog-header">
        <h2>הוספת משימת הסעה</h2>
        <button mat-icon-button (click)="close()">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <div class="dialog-content">
        <!-- Title -->
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>כותרת</mat-label>
          <input matInput [(ngModel)]="title" required placeholder="למשל: איסוף מכדורגל">
        </mat-form-field>

        <!-- Date -->
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>תאריך</mat-label>
          <input matInput [matDatepicker]="datePicker" [(ngModel)]="date" required>
          <mat-datepicker-toggle matIconSuffix [for]="datePicker"></mat-datepicker-toggle>
          <mat-datepicker #datePicker></mat-datepicker>
        </mat-form-field>

        <!-- Time -->
        <div class="time-row">
          <mat-form-field appearance="outline">
            <mat-label>שעת התחלה</mat-label>
            <input matInput type="time" [(ngModel)]="startTime" required>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>שעת סיום (אופציונלי)</mat-label>
            <input matInput type="time" [(ngModel)]="endTime">
          </mat-form-field>
        </div>

        <!-- Category -->
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>קטגוריה</mat-label>
          <mat-select [(ngModel)]="category">
            @for (cat of categories; track cat.id) {
              <mat-option [value]="cat.id">
                <div class="category-option">
                  <span class="category-dot" [style.background]="cat.color"></span>
                  {{ cat.labelHe }}
                </div>
              </mat-option>
            }
          </mat-select>
        </mat-form-field>

        <!-- Children -->
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>ילדים</mat-label>
          <mat-select [(ngModel)]="selectedChildrenIds" multiple>
            @for (child of children(); track child.id) {
              <mat-option [value]="child.id">
                <div class="child-option">
                  <span class="child-dot" [style.background]="child.color"></span>
                  {{ child.name }}
                </div>
              </mat-option>
            }
          </mat-select>
        </mat-form-field>

        <!-- Location -->
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>מיקום (אופציונלי)</mat-label>
          <input matInput [(ngModel)]="location" placeholder="כתובת או שם מקום">
          <mat-icon matPrefix>place</mat-icon>
        </mat-form-field>

        <!-- Driver -->
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>נהג (אופציונלי)</mat-label>
          <mat-select [(ngModel)]="driverUserId">
            <mat-option [value]="null">ללא שיבוץ</mat-option>
            @for (member of members(); track member.id) {
              <mat-option [value]="member.id">{{ member.displayName }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <!-- Notes -->
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>הערות (אופציונלי)</mat-label>
          <textarea matInput [(ngModel)]="notes" rows="2"></textarea>
        </mat-form-field>
      </div>

      <div class="dialog-actions">
        <button mat-button (click)="close()">ביטול</button>
        <button
          mat-flat-button
          color="primary"
          (click)="save()"
          [disabled]="!isValid() || isSaving()"
        >
          @if (isSaving()) {
            <mat-icon class="spin">sync</mat-icon>
          }
          שמור
        </button>
      </div>
    </div>
  `,
  styles: [`
    .dialog-container {
      min-width: 400px;
      max-width: 500px;

      @media (max-width: 600px) {
        min-width: auto;
        width: 100%;
      }
    }

    .dialog-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem 1.5rem;
      border-bottom: 1px solid var(--border-subtle);

      h2 {
        margin: 0;
        font-family: 'Rubik', var(--font-family-display);
        font-size: 1.1rem;
        font-weight: 600;
        color: var(--text-primary);
      }
    }

    .dialog-content {
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .full-width {
      width: 100%;
    }

    .time-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    .category-option,
    .child-option {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .category-dot,
    .child-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
    }

    .dialog-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
      padding: 1rem 1.5rem;
      border-top: 1px solid var(--border-subtle);
    }

    .spin {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `],
})
export class AddTaskDialogComponent {
  private dialogRef = inject(MatDialogRef<AddTaskDialogComponent>);
  private data = inject<AddTaskDialogData>(MAT_DIALOG_DATA, { optional: true });
  private transportationService = inject(TransportationService);
  private familyService = inject(FamilyService);

  readonly categories = EVENT_CATEGORIES;
  readonly children = this.familyService.sortedChildren;
  readonly members = this.familyService.members;

  // Form fields
  title = '';
  date = this.data?.date ?? new Date();
  startTime = '16:00';
  endTime = '';
  category: EventCategory = 'activity';
  selectedChildrenIds: string[] = [];
  location = '';
  driverUserId: string | null = null;
  notes = '';

  private _isSaving = signal(false);
  readonly isSaving = this._isSaving.asReadonly();

  isValid(): boolean {
    return this.title.trim().length > 0 && !!this.date && this.startTime.length > 0;
  }

  close(): void {
    this.dialogRef.close();
  }

  async save(): Promise<void> {
    if (!this.isValid()) return;

    this._isSaving.set(true);

    try {
      // Parse time strings
      const [startHour, startMinute] = this.startTime.split(':').map(Number);
      const startTimeDate = new Date(this.date);
      startTimeDate.setHours(startHour, startMinute, 0, 0);

      let endTimeDate: Date | undefined;
      if (this.endTime) {
        const [endHour, endMinute] = this.endTime.split(':').map(Number);
        endTimeDate = new Date(this.date);
        endTimeDate.setHours(endHour, endMinute, 0, 0);
      }

      const data: CreateTransportationTaskData = {
        title: this.title.trim(),
        date: this.date,
        startTime: startTimeDate,
        endTime: endTimeDate,
        category: this.category,
        childrenIds: this.selectedChildrenIds,
        location: this.location.trim() || undefined,
        driverUserId: this.driverUserId || undefined,
        notes: this.notes.trim() || undefined,
      };

      const taskId = await this.transportationService.createStandaloneTask(data);
      this.dialogRef.close({ success: true, taskId });
    } catch (error) {
      console.error('Error creating task:', error);
    } finally {
      this._isSaving.set(false);
    }
  }
}
