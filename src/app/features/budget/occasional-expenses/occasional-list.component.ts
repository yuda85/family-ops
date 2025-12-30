import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';

import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { BudgetService } from '../budget.service';
import {
  OccasionalExpense,
  BudgetCategory,
  BUDGET_CATEGORIES,
  getBudgetCategoryMeta,
  formatAmount,
  getCurrentYearMonth,
  formatMonthLabel,
} from '../budget.models';
import { AddOccasionalDialogComponent } from './add-occasional-dialog.component';

@Component({
  selector: 'app-occasional-list',
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
    MatSnackBarModule,
    MatChipsModule,
    EmptyStateComponent,
  ],
  template: `
    <div class="occasional-page">
      <header class="page-header">
        <div class="header-content">
          <button mat-icon-button routerLink="../" class="back-btn">
            <mat-icon>arrow_forward</mat-icon>
          </button>
          <div class="header-text">
            <h1>הוצאות חד פעמיות</h1>
            <p class="subtitle">{{ currentMonthLabel }}</p>
          </div>
        </div>
        <button mat-flat-button color="primary" (click)="openAddDialog()">
          <mat-icon>add</mat-icon>
          הוספה
        </button>
      </header>

      <!-- Month Total -->
      <div class="month-total-card">
        <div class="total-icon">
          <mat-icon>shopping_bag</mat-icon>
        </div>
        <div class="total-info">
          <span class="total-label">סה"כ החודש</span>
          <span class="total-amount">{{ formatAmount(monthTotal()) }}</span>
        </div>
        <div class="expense-count">{{ expenses().length }} הוצאות</div>
      </div>

      <!-- Filters -->
      <div class="filters-row">
        <mat-form-field appearance="outline" class="category-filter">
          <mat-label>סינון לפי קטגוריה</mat-label>
          <mat-select [(ngModel)]="selectedCategory" (ngModelChange)="filterExpenses()">
            <mat-option [value]="null">הכל</mat-option>
            @for (cat of occasionalCategories; track cat.id) {
              <mat-option [value]="cat.id">
                <div class="category-option">
                  <mat-icon [style.color]="cat.color">{{ cat.icon }}</mat-icon>
                  {{ cat.labelHe }}
                </div>
              </mat-option>
            }
          </mat-select>
        </mat-form-field>
      </div>

      @if (budgetService.isLoading()) {
        <div class="loading-container">
          <mat-spinner diameter="40"></mat-spinner>
          <p>טוען הוצאות...</p>
        </div>
      } @else if (filteredExpenses().length > 0) {
        <div class="expenses-list">
          @for (expense of filteredExpenses(); track expense.id) {
            <div class="expense-card" [class.linked]="expense.linkedShoppingTripId">
              <div class="expense-icon" [style.background]="getCategoryColor(expense.category) + '20'">
                <mat-icon [style.color]="getCategoryColor(expense.category)">
                  {{ getCategoryIcon(expense.category) }}
                </mat-icon>
              </div>
              <div class="expense-content">
                <span class="expense-description">{{ expense.description }}</span>
                <div class="expense-meta">
                  <span class="expense-category">{{ getCategoryLabel(expense.category) }}</span>
                  <span class="expense-date">{{ formatDate(expense.date) }}</span>
                </div>
              </div>
              <div class="expense-amount">{{ formatAmount(expense.amount) }}</div>
              <button mat-icon-button class="delete-btn" (click)="deleteExpense(expense)">
                <mat-icon>delete_outline</mat-icon>
              </button>
            </div>
          }
        </div>
      } @else {
        <app-empty-state
          icon="shopping_bag"
          title="אין הוצאות חד פעמיות"
          [description]="selectedCategory ? 'אין הוצאות בקטגוריה זו' : 'לחצו על הוספה כדי להוסיף הוצאה'"
        ></app-empty-state>
      }

      <!-- Floating Add Button for mobile -->
      <button mat-fab color="primary" class="fab-add" (click)="openAddDialog()">
        <mat-icon>add</mat-icon>
      </button>
    </div>
  `,
  styles: [`
    .occasional-page {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      padding-bottom: 5rem;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;

      .header-content {
        display: flex;
        align-items: center;
        gap: 0.75rem;
      }

      .back-btn {
        color: var(--text-secondary);
      }

      .header-text {
        h1 {
          font-size: 1.5rem;
          font-weight: 700;
          margin: 0;
          color: var(--text-primary);
        }

        .subtitle {
          font-size: 0.875rem;
          color: var(--text-secondary);
          margin: 0.25rem 0 0 0;
        }
      }
    }

    .month-total-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1.25rem;
      background: linear-gradient(135deg, #20c997 0%, #12b886 100%);
      border-radius: 1rem;
      color: white;

      .total-icon {
        width: 48px;
        height: 48px;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;

        mat-icon {
          font-size: 28px;
          width: 28px;
          height: 28px;
        }
      }

      .total-info {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 0.25rem;

        .total-label {
          font-size: 0.875rem;
          opacity: 0.9;
        }

        .total-amount {
          font-size: 1.5rem;
          font-weight: 700;
        }
      }

      .expense-count {
        background: rgba(255, 255, 255, 0.2);
        padding: 0.375rem 0.75rem;
        border-radius: 9999px;
        font-size: 0.75rem;
        font-weight: 500;
      }
    }

    .filters-row {
      display: flex;
      gap: 0.75rem;

      .category-filter {
        flex: 1;
        max-width: 300px;
      }
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

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3rem;
      gap: 1rem;

      p {
        color: var(--text-secondary);
        margin: 0;
      }
    }

    .expenses-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .expense-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background: var(--surface-primary);
      border: 1px solid var(--border-subtle);
      border-radius: 1rem;
      transition: all 0.2s ease;

      &:hover {
        border-color: var(--border-default);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);

        .delete-btn {
          opacity: 1;
        }
      }

      &.linked {
        border-right: 3px solid #40c057;
      }
    }

    .expense-icon {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;

      mat-icon {
        font-size: 24px;
        width: 24px;
        height: 24px;
      }
    }

    .expense-content {
      flex: 1;
      min-width: 0;

      .expense-description {
        display: block;
        font-weight: 500;
        color: var(--text-primary);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .expense-meta {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin-top: 0.25rem;
        font-size: 0.75rem;
        color: var(--text-secondary);

        .expense-category {
          background: var(--surface-secondary);
          padding: 0.125rem 0.5rem;
          border-radius: 0.5rem;
        }
      }
    }

    .expense-amount {
      font-size: 1rem;
      font-weight: 600;
      color: var(--text-primary);
      white-space: nowrap;
    }

    .delete-btn {
      opacity: 0;
      transition: opacity 0.15s ease;
      color: var(--text-tertiary);

      @media (max-width: 767px) {
        opacity: 1;
      }

      &:hover {
        color: var(--color-error);
      }
    }

    .fab-add {
      position: fixed;
      bottom: 5rem;
      left: 1.5rem;
      z-index: 100;

      @media (min-width: 768px) {
        display: none;
      }
    }

    @media (max-width: 767px) {
      .page-header {
        button[mat-flat-button] {
          display: none;
        }
      }
    }
  `]
})
export class OccasionalListComponent {
  budgetService = inject(BudgetService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  selectedCategory: BudgetCategory | null = null;
  occasionalCategories = BUDGET_CATEGORIES.filter(c => c.defaultType === 'occasional');

  currentYearMonth = getCurrentYearMonth();
  currentMonthLabel = formatMonthLabel(this.currentYearMonth);

  expenses = computed(() => this.budgetService.occasionalExpenses());

  filteredExpenses = computed(() => {
    const all = this.expenses();
    if (!this.selectedCategory) return all;
    return all.filter(e => e.category === this.selectedCategory);
  });

  monthTotal = computed(() => {
    return this.filteredExpenses().reduce((sum, e) => sum + e.amount, 0);
  });

  formatAmount = formatAmount;

  filterExpenses(): void {
    // Triggers recomputation via signal
  }

  getCategoryLabel(category: string): string {
    return getBudgetCategoryMeta(category as BudgetCategory)?.labelHe || 'אחר';
  }

  getCategoryIcon(category: string): string {
    return getBudgetCategoryMeta(category as BudgetCategory)?.icon || 'more_horiz';
  }

  getCategoryColor(category: string): string {
    return getBudgetCategoryMeta(category as BudgetCategory)?.color || '#868e96';
  }

  formatDate(date: any): string {
    if (!date) return '';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('he-IL', { day: 'numeric', month: 'short' });
  }

  openAddDialog(): void {
    const dialogRef = this.dialog.open(AddOccasionalDialogComponent, {
      width: '100%',
      maxWidth: '450px',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.snackBar.open('הוצאה נוספה בהצלחה', '', { duration: 2000 });
      }
    });
  }

  async deleteExpense(expense: OccasionalExpense): Promise<void> {
    try {
      await this.budgetService.deleteOccasionalExpense(expense.id);
      this.snackBar.open('הוצאה נמחקה', '', { duration: 2000 });
    } catch (error: any) {
      this.snackBar.open(error.message || 'שגיאה במחיקה', 'סגור', { duration: 3000 });
    }
  }
}
