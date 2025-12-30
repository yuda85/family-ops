import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

import { BudgetService } from '../budget.service';
import {
  BudgetCategoryConfig,
  getBudgetCategoryMeta,
  getExpenseTypeMeta,
} from '../budget.models';
import { CategoryConfigDialogComponent } from './category-config-dialog.component';

@Component({
  selector: 'app-category-config-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatSlideToggleModule,
  ],
  template: `
    <div class="config-page">
      <header class="page-header">
        <div class="header-top">
          <button mat-icon-button routerLink="/app/budget">
            <mat-icon>arrow_forward</mat-icon>
          </button>
          <h1>קטגוריות תקציב</h1>
        </div>
        <p class="subtitle">נהלו את הקטגוריות והיעדים החודשיים</p>
      </header>

      @if (budgetService.isLoading()) {
        <div class="loading-container">
          <mat-spinner diameter="40"></mat-spinner>
        </div>
      } @else {
        <div class="categories-list">
          @for (config of budgetService.categoryConfigs(); track config.id) {
            <div class="category-card" [class.inactive]="!config.isActive">
              <div class="category-main">
                <div class="category-icon" [style.background]="getCategoryColor(config.category) + '20'" [style.color]="getCategoryColor(config.category)">
                  <mat-icon>{{ getCategoryIcon(config.category) }}</mat-icon>
                </div>

                <div class="category-info">
                  <span class="category-name">{{ getCategoryLabel(config.category) }}</span>
                  <div class="category-meta">
                    <span class="expense-type" [style.color]="getExpenseTypeMeta(config.expenseType).color">
                      {{ getExpenseTypeMeta(config.expenseType).labelHe }}
                    </span>
                    <span class="target-amount">יעד: ₪{{ config.targetAmount | number:'1.0-0' }}</span>
                  </div>
                </div>

                <div class="category-actions">
                  <mat-slide-toggle
                    [checked]="config.isActive"
                    (change)="toggleActive(config)"
                    color="primary"
                  ></mat-slide-toggle>
                  <button mat-icon-button (click)="editConfig(config)">
                    <mat-icon>edit</mat-icon>
                  </button>
                  <button mat-icon-button (click)="deleteConfig(config)" class="delete-btn">
                    <mat-icon>delete</mat-icon>
                  </button>
                </div>
              </div>
            </div>
          }
        </div>

        <button mat-fab color="primary" class="add-fab" (click)="addConfig()">
          <mat-icon>add</mat-icon>
        </button>
      }
    </div>
  `,
  styles: [`
    .config-page {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      padding-bottom: 5rem;
    }

    .page-header {
      .header-top {
        display: flex;
        align-items: center;
        gap: 0.5rem;

        h1 {
          font-size: 1.5rem;
          font-weight: 700;
          margin: 0;
          color: var(--text-primary);
        }
      }

      .subtitle {
        font-size: 0.875rem;
        color: var(--text-secondary);
        margin: 0.5rem 0 0 0;
      }
    }

    .loading-container {
      display: flex;
      justify-content: center;
      padding: 3rem;
    }

    .categories-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .category-card {
      background: var(--surface-primary);
      border: 1px solid var(--border-subtle);
      border-radius: 1rem;
      padding: 1rem;
      transition: all 0.2s ease;

      &.inactive {
        opacity: 0.6;
      }

      .category-main {
        display: flex;
        align-items: center;
        gap: 1rem;
      }

      .category-icon {
        width: 44px;
        height: 44px;
        border-radius: 0.75rem;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;

        mat-icon {
          font-size: 22px;
          width: 22px;
          height: 22px;
        }
      }

      .category-info {
        flex: 1;
        min-width: 0;

        .category-name {
          font-size: 1rem;
          font-weight: 600;
          color: var(--text-primary);
          display: block;
        }

        .category-meta {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-top: 0.25rem;

          .expense-type {
            font-size: 0.75rem;
            font-weight: 500;
          }

          .target-amount {
            font-size: 0.75rem;
            color: var(--text-secondary);
          }
        }
      }

      .category-actions {
        display: flex;
        align-items: center;
        gap: 0.25rem;

        .delete-btn {
          color: var(--text-tertiary);

          &:hover {
            color: var(--color-error);
          }
        }
      }
    }

    .add-fab {
      position: fixed;
      bottom: 5rem;
      left: 1.5rem;
    }
  `]
})
export class CategoryConfigListComponent implements OnInit {
  budgetService = inject(BudgetService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  async ngOnInit(): Promise<void> {
    await this.budgetService.initializeBudget();
  }

  getCategoryLabel(category: string): string {
    return getBudgetCategoryMeta(category as any)?.labelHe || category;
  }

  getCategoryIcon(category: string): string {
    return getBudgetCategoryMeta(category as any)?.icon || 'category';
  }

  getCategoryColor(category: string): string {
    return getBudgetCategoryMeta(category as any)?.color || '#868e96';
  }

  getExpenseTypeMeta(type: string) {
    return getExpenseTypeMeta(type as any);
  }

  async toggleActive(config: BudgetCategoryConfig): Promise<void> {
    try {
      await this.budgetService.toggleCategoryConfig(config.id, !config.isActive);
    } catch (error: any) {
      this.snackBar.open(error.message || 'שגיאה', 'סגור', { duration: 3000 });
    }
  }

  addConfig(): void {
    const dialogRef = this.dialog.open(CategoryConfigDialogComponent, {
      width: '100%',
      maxWidth: '450px',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.snackBar.open('קטגוריה נוספה בהצלחה', '', { duration: 2000 });
      }
    });
  }

  editConfig(config: BudgetCategoryConfig): void {
    const dialogRef = this.dialog.open(CategoryConfigDialogComponent, {
      width: '100%',
      maxWidth: '450px',
      data: { config },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.snackBar.open('קטגוריה עודכנה בהצלחה', '', { duration: 2000 });
      }
    });
  }

  async deleteConfig(config: BudgetCategoryConfig): Promise<void> {
    if (confirm(`האם למחוק את הקטגוריה "${this.getCategoryLabel(config.category)}"?`)) {
      try {
        await this.budgetService.deleteCategoryConfig(config.id);
        this.snackBar.open('קטגוריה נמחקה', '', { duration: 2000 });
      } catch (error: any) {
        this.snackBar.open(error.message || 'שגיאה', 'סגור', { duration: 3000 });
      }
    }
  }
}
