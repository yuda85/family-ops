import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { BudgetService } from '../budget.service';
import {
  BudgetCategory,
  BudgetCategoryConfig,
  ExpenseType,
  BUDGET_CATEGORIES,
  EXPENSE_TYPES,
  getBudgetCategoryMeta,
} from '../budget.models';

@Component({
  selector: 'app-category-config-dialog',
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
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="dialog-container">
      <h2 mat-dialog-title>{{ isEditing ? 'עריכת קטגוריה' : 'הוספת קטגוריה' }}</h2>

      <mat-dialog-content>
        @if (!isEditing) {
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>קטגוריה</mat-label>
            <mat-select [(ngModel)]="selectedCategory" required>
              @for (cat of availableCategories; track cat.id) {
                <mat-option [value]="cat.id">
                  <div class="category-option">
                    <mat-icon [style.color]="cat.color">{{ cat.icon }}</mat-icon>
                    <span>{{ cat.labelHe }}</span>
                  </div>
                </mat-option>
              }
            </mat-select>
          </mat-form-field>
        } @else {
          <div class="current-category">
            <mat-icon [style.color]="getCategoryColor()">{{ getCategoryIcon() }}</mat-icon>
            <span>{{ getCategoryLabel() }}</span>
          </div>
        }

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>סוג הוצאה</mat-label>
          <mat-select [(ngModel)]="expenseType" required>
            @for (type of expenseTypes; track type.id) {
              @if (type.id !== 'occasional') {
                <mat-option [value]="type.id">
                  <div class="type-option">
                    <mat-icon [style.color]="type.color">{{ type.icon }}</mat-icon>
                    <span>{{ type.labelHe }}</span>
                  </div>
                </mat-option>
              }
            }
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>יעד חודשי</mat-label>
          <span matPrefix>₪&nbsp;</span>
          <input matInput type="number" [(ngModel)]="targetAmount" min="0" step="100" required>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>הערות (אופציונלי)</mat-label>
          <textarea matInput [(ngModel)]="notes" rows="2"></textarea>
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
            {{ isEditing ? 'עדכון' : 'הוספה' }}
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

    ::ng-deep .category-option, ::ng-deep .type-option {
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

    .current-category {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem;
      background: var(--surface-secondary);
      border-radius: 0.75rem;
      margin-bottom: 1rem;

      mat-icon {
        font-size: 24px;
        width: 24px;
        height: 24px;
      }

      span {
        font-weight: 600;
        color: var(--text-primary);
      }
    }

    mat-dialog-actions {
      padding: 1rem 0 0 0;
      margin: 0;
    }
  `]
})
export class CategoryConfigDialogComponent implements OnInit {
  private budgetService = inject(BudgetService);
  private dialogRef = inject(MatDialogRef<CategoryConfigDialogComponent>);
  private data = inject(MAT_DIALOG_DATA, { optional: true }) as { config?: BudgetCategoryConfig } | null;

  expenseTypes = EXPENSE_TYPES;
  availableCategories = BUDGET_CATEGORIES.filter(c => c.defaultType !== 'occasional');

  selectedCategory: BudgetCategory | null = null;
  expenseType: ExpenseType = 'variable';
  targetAmount: number = 500;
  notes: string = '';

  isSaving = signal(false);

  get isEditing(): boolean {
    return !!this.data?.config;
  }

  ngOnInit(): void {
    if (this.data?.config) {
      const config = this.data.config;
      this.selectedCategory = config.category as BudgetCategory;
      this.expenseType = config.expenseType;
      this.targetAmount = config.targetAmount;
      this.notes = config.notes || '';
    }

    // Filter out already configured categories
    if (!this.isEditing) {
      const existingCategories = this.budgetService.categoryConfigs().map(c => c.category);
      this.availableCategories = BUDGET_CATEGORIES.filter(
        c => c.defaultType !== 'occasional' && !existingCategories.includes(c.id)
      );
    }
  }

  getCategoryLabel(): string {
    return getBudgetCategoryMeta(this.selectedCategory as any)?.labelHe || '';
  }

  getCategoryIcon(): string {
    return getBudgetCategoryMeta(this.selectedCategory as any)?.icon || 'category';
  }

  getCategoryColor(): string {
    return getBudgetCategoryMeta(this.selectedCategory as any)?.color || '#868e96';
  }

  isValid(): boolean {
    return !!this.selectedCategory && !!this.expenseType && this.targetAmount > 0;
  }

  cancel(): void {
    this.dialogRef.close();
  }

  async save(): Promise<void> {
    if (!this.isValid()) return;

    this.isSaving.set(true);

    try {
      if (this.isEditing && this.data?.config) {
        await this.budgetService.updateCategoryConfig(this.data.config.id, {
          expenseType: this.expenseType,
          targetAmount: this.targetAmount,
          notes: this.notes || undefined,
        });
      } else {
        await this.budgetService.createCategoryConfig({
          category: this.selectedCategory!,
          expenseType: this.expenseType,
          targetAmount: this.targetAmount,
          notes: this.notes || undefined,
        });
      }

      this.dialogRef.close(true);
    } catch (error: any) {
      console.error('Error saving config:', error);
    } finally {
      this.isSaving.set(false);
    }
  }
}
