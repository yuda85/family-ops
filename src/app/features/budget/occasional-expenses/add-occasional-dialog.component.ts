import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { BudgetService } from '../budget.service';
import {
  BudgetCategory,
  BUDGET_CATEGORIES,
} from '../budget.models';

@Component({
  selector: 'app-add-occasional-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="dialog-container">
      <h2 mat-dialog-title>הוספת הוצאה חד פעמית</h2>

      <mat-dialog-content>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>תיאור</mat-label>
          <input matInput [(ngModel)]="description" placeholder="למשל: מתנה ליום הולדת" required>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>סכום</mat-label>
          <span matPrefix>₪&nbsp;</span>
          <input matInput type="number" [(ngModel)]="amount" min="1" step="10" required>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>קטגוריה</mat-label>
          <mat-select [(ngModel)]="category" required>
            @for (cat of occasionalCategories; track cat.id) {
              <mat-option [value]="cat.id">
                <div class="category-option">
                  <mat-icon [style.color]="cat.color">{{ cat.icon }}</mat-icon>
                  <span>{{ cat.labelHe }}</span>
                </div>
              </mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>תאריך</mat-label>
          <input matInput [matDatepicker]="picker" [(ngModel)]="expenseDate" required>
          <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
          <mat-datepicker #picker></mat-datepicker>
        </mat-form-field>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-button (click)="cancel()">ביטול</button>
        <button
          mat-flat-button
          color="primary"
          (click)="save()"
          [disabled]="isSaving() || !isValid()"
        >
          @if (isSaving()) {
            <mat-spinner diameter="20"></mat-spinner>
          } @else {
            הוספה
          }
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .dialog-container {
      min-width: 300px;
    }

    .full-width {
      width: 100%;
      margin-bottom: 0.5rem;
    }

    ::ng-deep .category-option {
      display: flex;
      align-items: center;
      gap: 0.5rem;

      .mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
        font-family: 'Material Icons' !important;
        font-feature-settings: 'liga';
      }
    }

    mat-dialog-actions {
      padding: 1rem 0 0 0;
      margin: 0;
    }
  `]
})
export class AddOccasionalDialogComponent {
  private budgetService = inject(BudgetService);
  private dialogRef = inject(MatDialogRef<AddOccasionalDialogComponent>);

  occasionalCategories = BUDGET_CATEGORIES.filter(c => c.defaultType === 'occasional');

  description: string = '';
  amount: number = 0;
  category: BudgetCategory = 'other';
  expenseDate: Date = new Date();

  isSaving = signal(false);

  isValid(): boolean {
    return this.description.trim().length > 0 && this.amount > 0 && !!this.category && !!this.expenseDate;
  }

  cancel(): void {
    this.dialogRef.close();
  }

  async save(): Promise<void> {
    if (!this.isValid()) return;

    this.isSaving.set(true);

    try {
      await this.budgetService.addOccasionalExpense({
        description: this.description.trim(),
        amount: this.amount,
        category: this.category,
        date: this.expenseDate,
      });

      this.dialogRef.close(true);
    } catch (error: any) {
      console.error('Error adding expense:', error);
    } finally {
      this.isSaving.set(false);
    }
  }
}
