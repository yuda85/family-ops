import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatStepperModule } from '@angular/material/stepper';

import { BudgetService } from '../budget.service';
import {
  BudgetCategory,
  BudgetCategoryMeta,
  ExpenseType,
  BUDGET_CATEGORIES,
  EXPENSE_TYPES,
  getBudgetCategoryMeta,
  getExpenseTypeMeta,
  getDefaultCategories,
} from '../budget.models';

interface SetupCategory {
  category: BudgetCategory;
  meta: BudgetCategoryMeta;
  isSelected: boolean;
  expenseType: ExpenseType;
  targetAmount: number;
}

@Component({
  selector: 'app-budget-setup',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatInputModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatStepperModule,
  ],
  template: `
    <div class="setup-page">
      <header class="setup-header">
        <mat-icon class="setup-icon">account_balance_wallet</mat-icon>
        <h1>הגדרת תקציב</h1>
        <p class="subtitle">בואו נגדיר את הקטגוריות והיעדים שלכם</p>
      </header>

      @if (isLoading()) {
        <div class="loading-container">
          <mat-spinner diameter="40"></mat-spinner>
          <p>טוען...</p>
        </div>
      } @else {
        <div class="setup-steps">
          <!-- Step indicator -->
          <div class="step-indicator">
            <div class="step" [class.active]="currentStep() === 1" [class.completed]="currentStep() > 1">
              <div class="step-number">1</div>
              <span>בחירת קטגוריות</span>
            </div>
            <div class="step-divider"></div>
            <div class="step" [class.active]="currentStep() === 2" [class.completed]="currentStep() > 2">
              <div class="step-number">2</div>
              <span>הגדרת יעדים</span>
            </div>
            <div class="step-divider"></div>
            <div class="step" [class.active]="currentStep() === 3">
              <div class="step-number">3</div>
              <span>סיכום</span>
            </div>
          </div>

          <!-- Step 1: Select Categories -->
          @if (currentStep() === 1) {
            <div class="step-content">
              <h2>בחרו את הקטגוריות שברצונכם לעקוב אחריהן</h2>
              <p class="step-description">תוכלו להוסיף עוד קטגוריות בהמשך</p>

              @for (type of expenseTypes; track type.id) {
                @if (type.id !== 'occasional') {
                  <div class="type-section">
                    <h3>
                      <mat-icon [style.color]="type.color">{{ type.icon }}</mat-icon>
                      {{ type.labelHe }}
                    </h3>
                    <p class="type-description">{{ type.description }}</p>

                    <div class="categories-grid">
                      @for (cat of getCategoriesByType(type.id); track cat.category) {
                        <div
                          class="category-card"
                          [class.selected]="cat.isSelected"
                          (click)="toggleCategory(cat)"
                        >
                          <mat-icon [style.color]="cat.meta.color">{{ cat.meta.icon }}</mat-icon>
                          <span class="category-name">{{ cat.meta.labelHe }}</span>
                          @if (cat.isSelected) {
                            <mat-icon class="check-icon">check_circle</mat-icon>
                          }
                        </div>
                      }
                    </div>
                  </div>
                }
              }

              <div class="step-actions">
                <button mat-stroked-button routerLink="/app/dashboard">
                  ביטול
                </button>
                <button
                  mat-flat-button
                  color="primary"
                  (click)="nextStep()"
                  [disabled]="selectedCategories().length === 0"
                >
                  הבא
                  <mat-icon>arrow_back</mat-icon>
                </button>
              </div>
            </div>
          }

          <!-- Step 2: Set Targets -->
          @if (currentStep() === 2) {
            <div class="step-content">
              <h2>הגדירו יעד חודשי לכל קטגוריה</h2>
              <p class="step-description">זה הסכום שאתם מתכננים להוציא כל חודש</p>

              <div class="targets-list">
                @for (cat of selectedCategories(); track cat.category) {
                  <div class="target-card">
                    <div class="target-header">
                      <mat-icon [style.color]="cat.meta.color">{{ cat.meta.icon }}</mat-icon>
                      <span class="category-name">{{ cat.meta.labelHe }}</span>
                      <span class="expense-type" [style.color]="getExpenseTypeMeta(cat.expenseType).color">
                        {{ getExpenseTypeMeta(cat.expenseType).labelHe }}
                      </span>
                    </div>
                    <mat-form-field appearance="outline" class="amount-field">
                      <mat-label>יעד חודשי</mat-label>
                      <span matPrefix>₪&nbsp;</span>
                      <input
                        matInput
                        type="number"
                        [(ngModel)]="cat.targetAmount"
                        min="0"
                        step="100"
                      >
                    </mat-form-field>
                  </div>
                }
              </div>

              <div class="step-actions">
                <button mat-stroked-button (click)="prevStep()">
                  <mat-icon>arrow_forward</mat-icon>
                  הקודם
                </button>
                <button
                  mat-flat-button
                  color="primary"
                  (click)="nextStep()"
                  [disabled]="!hasValidTargets()"
                >
                  הבא
                  <mat-icon>arrow_back</mat-icon>
                </button>
              </div>
            </div>
          }

          <!-- Step 3: Summary -->
          @if (currentStep() === 3) {
            <div class="step-content">
              <h2>סיכום התקציב</h2>
              <p class="step-description">בדקו שהכל נכון לפני השמירה</p>

              <div class="summary-card">
                <div class="summary-header">
                  <h3>יעד חודשי כולל</h3>
                  <span class="total-amount">₪{{ totalBudget() | number:'1.0-0' }}</span>
                </div>

                <div class="summary-breakdown">
                  @for (type of expenseTypes; track type.id) {
                    @if (type.id !== 'occasional' && getTotalByType(type.id) > 0) {
                      <div class="type-summary">
                        <div class="type-label">
                          <mat-icon [style.color]="type.color">{{ type.icon }}</mat-icon>
                          <span>{{ type.labelHe }}</span>
                        </div>
                        <span class="type-total">₪{{ getTotalByType(type.id) | number:'1.0-0' }}</span>
                      </div>
                    }
                  }
                </div>

                <div class="categories-summary">
                  @for (cat of selectedCategories(); track cat.category) {
                    <div class="category-row">
                      <div class="category-info">
                        <mat-icon [style.color]="cat.meta.color">{{ cat.meta.icon }}</mat-icon>
                        <span>{{ cat.meta.labelHe }}</span>
                      </div>
                      <span class="category-amount">₪{{ cat.targetAmount | number:'1.0-0' }}</span>
                    </div>
                  }
                </div>
              </div>

              <div class="step-actions">
                <button mat-stroked-button (click)="prevStep()">
                  <mat-icon>arrow_forward</mat-icon>
                  הקודם
                </button>
                <button
                  mat-flat-button
                  color="primary"
                  (click)="saveSetup()"
                  [disabled]="isSaving()"
                >
                  @if (isSaving()) {
                    <mat-spinner diameter="20"></mat-spinner>
                  } @else {
                    <mat-icon>check</mat-icon>
                    סיום הגדרה
                  }
                </button>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .setup-page {
      max-width: 800px;
      margin: 0 auto;
      padding: 1rem;
    }

    .setup-header {
      text-align: center;
      padding: 2rem 1rem;

      .setup-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
        color: var(--color-primary);
        margin-bottom: 1rem;
      }

      h1 {
        font-size: 1.75rem;
        font-weight: 700;
        margin: 0 0 0.5rem 0;
        color: var(--text-primary);
      }

      .subtitle {
        font-size: 1rem;
        color: var(--text-secondary);
        margin: 0;
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

    .step-indicator {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      margin-bottom: 2rem;
      flex-wrap: wrap;

      .step {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        opacity: 0.5;
        transition: opacity 0.2s ease;

        &.active, &.completed {
          opacity: 1;
        }

        &.completed .step-number {
          background: var(--color-success);
        }

        &.active .step-number {
          background: var(--color-primary);
        }

        .step-number {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: var(--surface-tertiary);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 0.875rem;
        }

        span {
          font-size: 0.875rem;
          color: var(--text-secondary);

          @media (max-width: 480px) {
            display: none;
          }
        }
      }

      .step-divider {
        width: 40px;
        height: 2px;
        background: var(--border-subtle);

        @media (max-width: 480px) {
          width: 20px;
        }
      }
    }

    .step-content {
      h2 {
        font-size: 1.25rem;
        font-weight: 600;
        margin: 0 0 0.5rem 0;
        color: var(--text-primary);
        text-align: center;
      }

      .step-description {
        text-align: center;
        color: var(--text-secondary);
        margin: 0 0 1.5rem 0;
      }
    }

    .type-section {
      margin-bottom: 2rem;

      h3 {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 1rem;
        font-weight: 600;
        margin: 0 0 0.25rem 0;
        color: var(--text-primary);

        mat-icon {
          font-size: 20px;
          width: 20px;
          height: 20px;
        }
      }

      .type-description {
        font-size: 0.875rem;
        color: var(--text-secondary);
        margin: 0 0 1rem 0;
      }
    }

    .categories-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
      gap: 0.75rem;
    }

    .category-card {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      padding: 1rem;
      background: var(--surface-primary);
      border: 2px solid var(--border-subtle);
      border-radius: 1rem;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover {
        border-color: var(--color-primary);
        background: var(--surface-hover);
      }

      &.selected {
        border-color: var(--color-primary);
        background: color-mix(in srgb, var(--color-primary) 10%, var(--surface-primary));
      }

      mat-icon {
        font-size: 32px;
        width: 32px;
        height: 32px;
      }

      .category-name {
        font-size: 0.875rem;
        font-weight: 500;
        color: var(--text-primary);
        text-align: center;
      }

      .check-icon {
        position: absolute;
        top: 0.5rem;
        left: 0.5rem;
        font-size: 20px;
        width: 20px;
        height: 20px;
        color: var(--color-primary);
      }
    }

    .targets-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .target-card {
      background: var(--surface-primary);
      border: 1px solid var(--border-subtle);
      border-radius: 1rem;
      padding: 1rem;

      .target-header {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin-bottom: 1rem;

        mat-icon {
          font-size: 24px;
          width: 24px;
          height: 24px;
        }

        .category-name {
          font-weight: 600;
          color: var(--text-primary);
          flex: 1;
        }

        .expense-type {
          font-size: 0.75rem;
          font-weight: 500;
          padding: 0.25rem 0.5rem;
          background: var(--surface-secondary);
          border-radius: 0.5rem;
        }
      }

      .amount-field {
        width: 100%;
      }
    }

    .summary-card {
      background: var(--surface-primary);
      border: 1px solid var(--border-subtle);
      border-radius: 1rem;
      padding: 1.5rem;

      .summary-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-bottom: 1rem;
        border-bottom: 1px solid var(--border-subtle);
        margin-bottom: 1rem;

        h3 {
          font-size: 1rem;
          font-weight: 600;
          margin: 0;
          color: var(--text-primary);
        }

        .total-amount {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--color-primary);
        }
      }

      .summary-breakdown {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        padding-bottom: 1rem;
        border-bottom: 1px solid var(--border-subtle);
        margin-bottom: 1rem;
      }

      .type-summary {
        display: flex;
        justify-content: space-between;
        align-items: center;

        .type-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;

          mat-icon {
            font-size: 18px;
            width: 18px;
            height: 18px;
          }

          span {
            font-size: 0.875rem;
            color: var(--text-secondary);
          }
        }

        .type-total {
          font-weight: 600;
          color: var(--text-primary);
        }
      }

      .categories-summary {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .category-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.5rem 0;

        .category-info {
          display: flex;
          align-items: center;
          gap: 0.5rem;

          mat-icon {
            font-size: 18px;
            width: 18px;
            height: 18px;
          }

          span {
            font-size: 0.875rem;
            color: var(--text-primary);
          }
        }

        .category-amount {
          font-size: 0.875rem;
          color: var(--text-secondary);
        }
      }
    }

    .step-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      margin-top: 2rem;
      padding-top: 1rem;
      border-top: 1px solid var(--border-subtle);

      button {
        display: flex;
        align-items: center;
        gap: 0.5rem;

        mat-icon {
          font-size: 18px;
          width: 18px;
          height: 18px;
        }

        mat-spinner {
          margin-inline-end: 0.5rem;
        }
      }
    }
  `]
})
export class BudgetSetupComponent implements OnInit {
  private budgetService = inject(BudgetService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  expenseTypes = EXPENSE_TYPES;

  // State
  currentStep = signal(1);
  isLoading = signal(true);
  isSaving = signal(false);

  // Setup data
  private _setupCategories = signal<SetupCategory[]>([]);

  // Computed
  selectedCategories = computed(() =>
    this._setupCategories().filter((c) => c.isSelected)
  );

  totalBudget = computed(() =>
    this.selectedCategories().reduce((sum, c) => sum + (c.targetAmount || 0), 0)
  );

  async ngOnInit(): Promise<void> {
    try {
      await this.budgetService.initializeBudget();

      // If setup is already complete, redirect to dashboard
      if (this.budgetService.isSetupComplete()) {
        this.router.navigate(['/app/budget']);
        return;
      }

      // Initialize setup categories
      this.initializeCategories();
    } catch (error) {
      console.error('Error initializing setup:', error);
      this.snackBar.open('שגיאה בטעינת הגדרות', 'סגור', { duration: 3000 });
    } finally {
      this.isLoading.set(false);
    }
  }

  private initializeCategories(): void {
    const defaultCategories = getDefaultCategories();
    const setupCategories: SetupCategory[] = BUDGET_CATEGORIES
      .filter((c) => c.defaultType !== 'occasional')
      .map((meta) => ({
        category: meta.id,
        meta,
        isSelected: defaultCategories.some((d) => d.id === meta.id),
        expenseType: meta.defaultType,
        targetAmount: this.getDefaultTarget(meta.id),
      }));

    this._setupCategories.set(setupCategories);
  }

  private getDefaultTarget(category: BudgetCategory): number {
    // Suggested default amounts based on Israeli averages
    const defaults: Partial<Record<BudgetCategory, number>> = {
      rent: 5000,
      utilities: 800,
      phone: 300,
      insurance: 500,
      subscriptions: 200,
      education: 1500,
      loans: 0,
      groceries: 3500,
      fuel: 800,
      transportation: 400,
      dining: 600,
      health: 300,
      clothing: 400,
      kids: 500,
      entertainment: 500,
      pets: 200,
    };
    return defaults[category] || 500;
  }

  getCategoriesByType(type: ExpenseType): SetupCategory[] {
    return this._setupCategories().filter((c) => c.meta.defaultType === type);
  }

  getTotalByType(type: ExpenseType): number {
    return this.selectedCategories()
      .filter((c) => c.expenseType === type)
      .reduce((sum, c) => sum + (c.targetAmount || 0), 0);
  }

  getExpenseTypeMeta(type: ExpenseType) {
    return getExpenseTypeMeta(type);
  }

  toggleCategory(cat: SetupCategory): void {
    this._setupCategories.update((categories) =>
      categories.map((c) =>
        c.category === cat.category ? { ...c, isSelected: !c.isSelected } : c
      )
    );
  }

  hasValidTargets(): boolean {
    return this.selectedCategories().every((c) => c.targetAmount > 0);
  }

  nextStep(): void {
    if (this.currentStep() < 3) {
      this.currentStep.update((s) => s + 1);
    }
  }

  prevStep(): void {
    if (this.currentStep() > 1) {
      this.currentStep.update((s) => s - 1);
    }
  }

  async saveSetup(): Promise<void> {
    this.isSaving.set(true);

    try {
      // Create category configs
      for (const cat of this.selectedCategories()) {
        await this.budgetService.createCategoryConfig({
          category: cat.category,
          expenseType: cat.expenseType,
          targetAmount: cat.targetAmount,
        });
      }

      // Mark setup as complete
      await this.budgetService.completeSetup();

      this.snackBar.open('התקציב הוגדר בהצלחה!', '', { duration: 3000 });
      this.router.navigate(['/app/budget']);
    } catch (error: any) {
      console.error('Error saving setup:', error);
      this.snackBar.open(error.message || 'שגיאה בשמירת הגדרות', 'סגור', { duration: 3000 });
    } finally {
      this.isSaving.set(false);
    }
  }
}
