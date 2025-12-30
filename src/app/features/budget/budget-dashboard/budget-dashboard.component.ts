import { Component, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatRippleModule } from '@angular/material/core';

import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { BudgetService } from '../budget.service';
import {
  BudgetGroupedByType,
  BudgetCategorySummary,
  BudgetStatus,
  ExpenseType,
  getBudgetStatusMeta,
} from '../budget.models';

@Component({
  selector: 'app-budget-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatRippleModule,
    EmptyStateComponent,
  ],
  template: `
    <div class="budget-dashboard">
      <!-- Loading State -->
      @if (budgetService.isLoading()) {
        <div class="loading-container">
          <div class="loading-pulse"></div>
          <p>טוען תקציב...</p>
        </div>
      } @else if (!budgetService.isSetupComplete()) {
        <!-- First-time Setup -->
        <div class="setup-prompt" @fadeIn>
          <div class="setup-illustration">
            <div class="coin coin-1"></div>
            <div class="coin coin-2"></div>
            <div class="coin coin-3"></div>
            <mat-icon class="wallet-icon">account_balance_wallet</mat-icon>
          </div>
          <h1>ברוכים הבאים לתקציב המשפחתי</h1>
          <p>בואו נגדיר את הקטגוריות והיעדים שלכם</p>
          <button mat-flat-button color="primary" routerLink="setup" class="setup-btn">
            <mat-icon>rocket_launch</mat-icon>
            התחילו עכשיו
          </button>
        </div>
      } @else {
        <!-- Month Navigation Header -->
        <header class="month-header">
          <button
            mat-icon-button
            class="nav-arrow"
            (click)="navigatePrev()"
            matTooltip="חודש קודם"
          >
            <mat-icon>chevron_right</mat-icon>
          </button>

          <div class="month-title">
            <span class="month-label">{{ budgetService.currentMonthLabel() }}</span>
            @if (!budgetService.isViewingCurrentMonth()) {
              <button mat-button class="today-btn" (click)="navigateToToday()">
                היום
              </button>
            }
          </div>

          <button
            mat-icon-button
            class="nav-arrow"
            (click)="navigateNext()"
            matTooltip="חודש הבא"
            [disabled]="budgetService.isViewingCurrentMonth()"
          >
            <mat-icon>chevron_left</mat-icon>
          </button>
        </header>

        @if (summary(); as s) {
          <!-- Main Summary Card -->
          <div class="summary-card" [class.status-good]="s.status === 'good'" [class.status-close]="s.status === 'close'" [class.status-over]="s.status === 'over'">
            <div class="summary-header">
              <div class="status-indicator" [style.--status-color]="getStatusColor(s.status)">
                <mat-icon>{{ getStatusIcon(s.status) }}</mat-icon>
                <span>{{ getStatusLabel(s.status) }}</span>
              </div>

              @if (s.needsClosing) {
                <button mat-flat-button class="close-month-btn" routerLink="close-month">
                  <mat-icon>task_alt</mat-icon>
                  סגירת חודש
                </button>
              }
            </div>

            <div class="summary-amounts">
              <div class="amount-block primary">
                <span class="amount-label">הוצאות בפועל</span>
                <span class="amount-value">{{ s.grandTotal | number:'1.0-0' }}</span>
                <span class="currency">₪</span>
              </div>

              <div class="amount-divider">
                <span class="divider-text">מתוך</span>
              </div>

              <div class="amount-block secondary">
                <span class="amount-label">יעד חודשי</span>
                <span class="amount-value">{{ s.totalPlanned | number:'1.0-0' }}</span>
                <span class="currency">₪</span>
              </div>
            </div>

            <!-- Progress Ring -->
            <div class="progress-ring-container">
              <svg class="progress-ring" viewBox="0 0 120 120">
                <circle
                  class="progress-bg"
                  cx="60"
                  cy="60"
                  r="52"
                  fill="none"
                  stroke-width="12"
                />
                <circle
                  class="progress-fill"
                  cx="60"
                  cy="60"
                  r="52"
                  fill="none"
                  stroke-width="12"
                  [style.--progress]="Math.min(s.percentUsed, 100)"
                  [style.stroke]="getStatusColor(s.status)"
                />
              </svg>
              <div class="progress-center">
                <span class="progress-percent">{{ s.percentUsed | number:'1.0-0' }}%</span>
                <span class="progress-label">ניצול</span>
              </div>
            </div>

            <!-- Comparison Chips -->
            @if (s.comparisonToLastMonth !== 0 || s.comparisonToAverage !== 0) {
              <div class="comparison-chips">
                @if (s.comparisonToLastMonth !== 0) {
                  <div class="chip" [class.positive]="s.comparisonToLastMonth < 0" [class.negative]="s.comparisonToLastMonth > 0">
                    <mat-icon>{{ s.comparisonToLastMonth > 0 ? 'trending_up' : 'trending_down' }}</mat-icon>
                    <span>{{ Math.abs(s.comparisonToLastMonth) | number:'1.0-0' }}% מחודש שעבר</span>
                  </div>
                }
              </div>
            }
          </div>

          <!-- Quick Actions -->
          <div class="quick-actions">
            <button
              mat-stroked-button
              class="action-btn"
              routerLink="occasional"
            >
              <mat-icon>add_shopping_cart</mat-icon>
              <span class="action-text">הוצאה חד פעמית</span>
              @if (budgetService.occasionalExpenses().length > 0) {
                <span class="action-badge">{{ budgetService.occasionalExpenses().length }}</span>
              }
            </button>

            <button
              mat-stroked-button
              class="action-btn"
              routerLink="categories"
            >
              <mat-icon>tune</mat-icon>
              <span class="action-text">קטגוריות</span>
            </button>

            <button
              mat-stroked-button
              class="action-btn"
              routerLink="history"
            >
              <mat-icon>history</mat-icon>
              <span class="action-text">היסטוריה</span>
            </button>
          </div>

          <!-- Expense Type Groups -->
          <div class="expense-groups">
            @for (group of budgetService.groupedByType(); track group.expenseType) {
              @if (group.categories.length > 0) {
                <div class="expense-group">
                  <button
                    class="group-header"
                    (click)="toggleGroup(group.expenseType)"
                    matRipple
                  >
                    <div class="group-info">
                      <div class="group-icon" [style.--group-color]="group.meta.color">
                        <mat-icon>{{ group.meta.icon }}</mat-icon>
                      </div>
                      <div class="group-text">
                        <span class="group-name">{{ group.meta.labelHe }}</span>
                        <span class="group-count">{{ group.categories.length }} קטגוריות</span>
                      </div>
                    </div>

                    <div class="group-amounts">
                      <span class="group-actual">₪{{ group.totalActual | number:'1.0-0' }}</span>
                      <span class="group-planned">/ ₪{{ group.totalPlanned | number:'1.0-0' }}</span>
                    </div>

                    <mat-icon class="expand-icon" [class.expanded]="!group.isCollapsed">
                      expand_more
                    </mat-icon>
                  </button>

                  @if (!group.isCollapsed) {
                    <div class="categories-list">
                      @for (cat of group.categories; track cat.category) {
                        <div
                          class="category-item"
                          [class.status-good]="cat.status === 'good'"
                          [class.status-close]="cat.status === 'close'"
                          [class.status-over]="cat.status === 'over'"
                        >
                          <div class="category-icon" [style.background]="cat.categoryColor + '20'" [style.color]="cat.categoryColor">
                            <mat-icon>{{ cat.categoryIcon }}</mat-icon>
                          </div>

                          <div class="category-details">
                            <div class="category-row">
                              <span class="category-name">{{ cat.categoryLabel }}</span>
                              <div class="category-amounts">
                                <span class="cat-actual">₪{{ cat.actual | number:'1.0-0' }}</span>
                                <span class="cat-planned">/ ₪{{ cat.planned | number:'1.0-0' }}</span>
                              </div>
                            </div>

                            <div class="category-progress">
                              <div class="progress-track">
                                <div
                                  class="progress-fill"
                                  [style.width.%]="Math.min(cat.percentUsed, 100)"
                                  [style.background]="getStatusColor(cat.status)"
                                ></div>
                                @if (cat.percentUsed > 100) {
                                  <div class="overflow-indicator" [style.left.%]="100"></div>
                                }
                              </div>
                            </div>
                          </div>

                          <div class="category-status">
                            <mat-icon [style.color]="getStatusColor(cat.status)">
                              {{ getStatusIcon(cat.status) }}
                            </mat-icon>
                          </div>
                        </div>
                      }
                    </div>
                  }
                </div>
              }
            }
          </div>

          <!-- Occasional Expenses Section -->
          @if (budgetService.occasionalExpenses().length > 0) {
            <div class="occasional-section">
              <div class="section-header">
                <div class="section-title">
                  <mat-icon>shopping_bag</mat-icon>
                  <span>הוצאות חד פעמיות</span>
                </div>
                <span class="section-total">₪{{ s.totalOccasional | number:'1.0-0' }}</span>
              </div>

              <div class="occasional-preview">
                @for (expense of budgetService.occasionalExpenses().slice(0, 3); track expense.id) {
                  <div class="expense-chip">
                    <span class="expense-desc">{{ expense.description }}</span>
                    <span class="expense-amount">₪{{ expense.amount | number:'1.0-0' }}</span>
                  </div>
                }
                @if (budgetService.occasionalExpenses().length > 3) {
                  <button mat-button class="view-all-btn" routerLink="occasional">
                    עוד {{ budgetService.occasionalExpenses().length - 3 }}
                    <mat-icon>arrow_back</mat-icon>
                  </button>
                }
              </div>
            </div>
          }

          <!-- Closed Month Banner -->
          @if (s.isClosed) {
            <div class="closed-banner">
              <mat-icon>verified</mat-icon>
              <span>חודש זה נסגר</span>
            </div>
          }
        }
      }
    </div>
  `,
  styles: [`
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    @keyframes float {
      0%, 100% { transform: translateY(0) rotate(0deg); }
      50% { transform: translateY(-8px) rotate(5deg); }
    }

    @keyframes coinFloat1 {
      0%, 100% { transform: translate(0, 0) rotate(0deg); }
      50% { transform: translate(-5px, -12px) rotate(-10deg); }
    }

    @keyframes coinFloat2 {
      0%, 100% { transform: translate(0, 0) rotate(0deg); }
      50% { transform: translate(8px, -15px) rotate(15deg); }
    }

    @keyframes coinFloat3 {
      0%, 100% { transform: translate(0, 0) rotate(0deg); }
      50% { transform: translate(-3px, -10px) rotate(-5deg); }
    }

    @keyframes pulse {
      0%, 100% { transform: scale(1); opacity: 0.6; }
      50% { transform: scale(1.05); opacity: 1; }
    }

    @keyframes progressFill {
      from { stroke-dashoffset: 327; }
    }

    .budget-dashboard {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
      animation: fadeIn 0.4s ease-out;
    }

    // Loading State
    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 4rem 2rem;
      gap: 1.5rem;

      .loading-pulse {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark, #4a6cf7));
        animation: pulse 1.5s ease-in-out infinite;
      }

      p {
        color: var(--text-secondary);
        font-size: 0.9375rem;
        margin: 0;
      }
    }

    // Setup Prompt
    .setup-prompt {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding: 3rem 1.5rem;
      background: linear-gradient(145deg, var(--surface-primary) 0%, var(--surface-secondary) 100%);
      border-radius: 1.5rem;
      border: 1px solid var(--border-subtle);

      .setup-illustration {
        position: relative;
        width: 100px;
        height: 100px;
        margin-bottom: 1.5rem;

        .wallet-icon {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-size: 56px;
          width: 56px;
          height: 56px;
          color: var(--color-primary);
        }

        .coin {
          position: absolute;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: linear-gradient(135deg, #ffd43b 0%, #fab005 100%);
          box-shadow: inset 0 -2px 4px rgba(0,0,0,0.15);

          &.coin-1 {
            top: 5px;
            right: 10px;
            animation: coinFloat1 3s ease-in-out infinite;
          }
          &.coin-2 {
            top: 15px;
            left: 5px;
            width: 16px;
            height: 16px;
            animation: coinFloat2 3.5s ease-in-out infinite 0.5s;
          }
          &.coin-3 {
            bottom: 20px;
            right: 5px;
            width: 14px;
            height: 14px;
            animation: coinFloat3 2.8s ease-in-out infinite 1s;
          }
        }
      }

      h1 {
        font-size: 1.5rem;
        font-weight: 700;
        color: var(--text-primary);
        margin: 0 0 0.5rem 0;
      }

      p {
        font-size: 1rem;
        color: var(--text-secondary);
        margin: 0 0 1.5rem 0;
      }

      .setup-btn {
        padding: 0.75rem 2rem;
        font-size: 1rem;
        border-radius: 0.75rem;

        mat-icon {
          margin-inline-end: 0.5rem;
        }
      }
    }

    // Month Navigation
    .month-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.5rem 0;

      .nav-arrow {
        color: var(--text-secondary);
        transition: color 0.2s ease, transform 0.2s ease;

        &:hover:not(:disabled) {
          color: var(--color-primary);
          transform: scale(1.1);
        }

        &:disabled {
          opacity: 0.3;
        }
      }

      .month-title {
        display: flex;
        align-items: center;
        gap: 0.75rem;

        .month-label {
          font-size: 1.375rem;
          font-weight: 700;
          color: var(--text-primary);
          letter-spacing: -0.01em;
        }

        .today-btn {
          font-size: 0.75rem;
          padding: 0.25rem 0.75rem;
          min-width: auto;
          border-radius: 1rem;
          background: var(--surface-secondary);
          color: var(--color-primary);
        }
      }
    }

    // Summary Card
    .summary-card {
      background: var(--surface-primary);
      border: 1px solid var(--border-subtle);
      border-radius: 1.25rem;
      padding: 1.5rem;
      position: relative;
      overflow: hidden;

      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 4px;
        background: var(--status-color, var(--color-primary));
        transition: background 0.3s ease;
      }

      &.status-good { --status-color: #40c057; }
      &.status-close { --status-color: #fab005; }
      &.status-over { --status-color: #fa5252; }

      .summary-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.25rem;

        .status-indicator {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.375rem 0.875rem;
          background: color-mix(in srgb, var(--status-color) 12%, transparent);
          border-radius: 2rem;
          color: var(--status-color);
          font-weight: 600;
          font-size: 0.875rem;

          mat-icon {
            font-size: 18px;
            width: 18px;
            height: 18px;
          }
        }

        .close-month-btn {
          background: linear-gradient(135deg, #40c057 0%, #2f9e44 100%);
          color: white;
          border-radius: 0.75rem;
          padding: 0.5rem 1rem;
          font-weight: 600;

          mat-icon {
            margin-inline-end: 0.375rem;
            font-size: 18px;
          }
        }
      }

      .summary-amounts {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 1rem;
        margin-bottom: 1.5rem;

        @media (max-width: 480px) {
          flex-direction: column;
          gap: 0.5rem;
        }

        .amount-block {
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;

          .amount-label {
            font-size: 0.75rem;
            color: var(--text-secondary);
            margin-bottom: 0.25rem;
          }

          .amount-value {
            font-size: 2rem;
            font-weight: 800;
            color: var(--text-primary);
            letter-spacing: -0.02em;
            line-height: 1;
          }

          .currency {
            position: absolute;
            top: 1.25rem;
            right: -1rem;
            font-size: 0.875rem;
            color: var(--text-tertiary);
            font-weight: 500;

            @media (max-width: 480px) {
              right: -0.75rem;
            }
          }

          &.secondary .amount-value {
            font-size: 1.5rem;
            color: var(--text-secondary);
          }
        }

        .amount-divider {
          .divider-text {
            font-size: 0.75rem;
            color: var(--text-tertiary);
            padding: 0 0.5rem;
          }
        }
      }

      .progress-ring-container {
        display: flex;
        justify-content: center;
        position: relative;
        margin: 1rem 0;

        .progress-ring {
          width: 120px;
          height: 120px;
          transform: rotate(-90deg);

          .progress-bg {
            stroke: var(--surface-tertiary);
          }

          .progress-fill {
            stroke: var(--status-color, var(--color-primary));
            stroke-linecap: round;
            stroke-dasharray: 327;
            stroke-dashoffset: calc(327 - (327 * min(var(--progress), 100) / 100));
            transition: stroke-dashoffset 0.6s ease-out, stroke 0.3s ease;
            animation: progressFill 0.8s ease-out;
          }
        }

        .progress-center {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          display: flex;
          flex-direction: column;
          align-items: center;

          .progress-percent {
            font-size: 1.5rem;
            font-weight: 800;
            color: var(--text-primary);
            line-height: 1;
          }

          .progress-label {
            font-size: 0.6875rem;
            color: var(--text-tertiary);
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-top: 0.25rem;
          }
        }
      }

      .comparison-chips {
        display: flex;
        justify-content: center;
        gap: 0.5rem;
        flex-wrap: wrap;

        .chip {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          padding: 0.25rem 0.625rem;
          border-radius: 1rem;
          font-size: 0.75rem;
          font-weight: 500;
          background: var(--surface-secondary);
          color: var(--text-secondary);

          mat-icon {
            font-size: 14px;
            width: 14px;
            height: 14px;
          }

          &.positive {
            background: color-mix(in srgb, #40c057 12%, transparent);
            color: #2f9e44;
          }

          &.negative {
            background: color-mix(in srgb, #fa5252 12%, transparent);
            color: #e03131;
          }
        }
      }
    }

    // Quick Actions
    .quick-actions {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0.75rem;

      @media (max-width: 400px) {
        grid-template-columns: 1fr;
      }

      .action-btn {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        padding: 0.875rem 1rem;
        border-radius: 1rem;
        border: 1px solid var(--border-subtle);
        background: var(--surface-primary);
        color: var(--text-primary);
        position: relative;
        transition: all 0.2s ease;

        &:hover {
          border-color: var(--color-primary);
          background: color-mix(in srgb, var(--color-primary) 5%, var(--surface-primary));
          transform: translateY(-2px);
        }

        mat-icon {
          font-size: 20px;
          width: 20px;
          height: 20px;
          color: var(--color-primary);
        }

        .action-text {
          font-size: 0.8125rem;
          font-weight: 500;
        }

        .action-badge {
          position: absolute;
          top: 0.5rem;
          left: 0.5rem;
          min-width: 20px;
          height: 20px;
          padding: 0 0.375rem;
          border-radius: 10px;
          background: var(--color-primary);
          color: white;
          font-size: 0.6875rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
        }
      }
    }

    // Expense Groups
    .expense-groups {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .expense-group {
      background: var(--surface-primary);
      border: 1px solid var(--border-subtle);
      border-radius: 1rem;
      overflow: hidden;

      .group-header {
        display: flex;
        align-items: center;
        gap: 1rem;
        width: 100%;
        padding: 1rem;
        background: transparent;
        border: none;
        cursor: pointer;
        transition: background 0.15s ease;
        text-align: start;

        &:hover {
          background: var(--surface-hover);
        }

        .group-info {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex: 1;

          .group-icon {
            width: 40px;
            height: 40px;
            border-radius: 0.75rem;
            background: color-mix(in srgb, var(--group-color) 15%, transparent);
            color: var(--group-color);
            display: flex;
            align-items: center;
            justify-content: center;

            mat-icon {
              font-size: 22px;
              width: 22px;
              height: 22px;
            }
          }

          .group-text {
            display: flex;
            flex-direction: column;

            .group-name {
              font-size: 0.9375rem;
              font-weight: 600;
              color: var(--text-primary);
            }

            .group-count {
              font-size: 0.75rem;
              color: var(--text-tertiary);
            }
          }
        }

        .group-amounts {
          display: flex;
          align-items: baseline;
          gap: 0.25rem;

          .group-actual {
            font-size: 1rem;
            font-weight: 700;
            color: var(--text-primary);
          }

          .group-planned {
            font-size: 0.8125rem;
            color: var(--text-tertiary);
          }
        }

        .expand-icon {
          color: var(--text-tertiary);
          transition: transform 0.2s ease;

          &.expanded {
            transform: rotate(180deg);
          }
        }
      }
    }

    .categories-list {
      border-top: 1px solid var(--border-subtle);
    }

    .category-item {
      display: flex;
      align-items: center;
      gap: 0.875rem;
      padding: 0.875rem 1rem;
      transition: background 0.15s ease;

      &:not(:last-child) {
        border-bottom: 1px solid var(--border-subtle);
      }

      &:hover {
        background: var(--surface-hover);
      }

      .category-icon {
        width: 36px;
        height: 36px;
        border-radius: 0.625rem;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;

        mat-icon {
          font-size: 18px;
          width: 18px;
          height: 18px;
        }
      }

      .category-details {
        flex: 1;
        min-width: 0;

        .category-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.375rem;

          .category-name {
            font-size: 0.875rem;
            font-weight: 500;
            color: var(--text-primary);
          }

          .category-amounts {
            display: flex;
            align-items: baseline;
            gap: 0.25rem;

            .cat-actual {
              font-size: 0.875rem;
              font-weight: 600;
              color: var(--text-primary);
            }

            .cat-planned {
              font-size: 0.75rem;
              color: var(--text-tertiary);
            }
          }
        }

        .category-progress {
          .progress-track {
            height: 6px;
            background: var(--surface-tertiary);
            border-radius: 3px;
            overflow: visible;
            position: relative;

            .progress-fill {
              height: 100%;
              border-radius: 3px;
              transition: width 0.4s ease-out, background 0.3s ease;
            }

            .overflow-indicator {
              position: absolute;
              top: -2px;
              width: 2px;
              height: 10px;
              background: #fa5252;
              border-radius: 1px;
            }
          }
        }
      }

      .category-status {
        flex-shrink: 0;

        mat-icon {
          font-size: 20px;
          width: 20px;
          height: 20px;
        }
      }
    }

    // Occasional Section
    .occasional-section {
      background: var(--surface-primary);
      border: 1px solid var(--border-subtle);
      border-radius: 1rem;
      padding: 1rem;

      .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.75rem;

        .section-title {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.9375rem;
          font-weight: 600;
          color: var(--text-primary);

          mat-icon {
            font-size: 20px;
            width: 20px;
            height: 20px;
            color: #20c997;
          }
        }

        .section-total {
          font-size: 1rem;
          font-weight: 700;
          color: #20c997;
        }
      }

      .occasional-preview {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;

        .expense-chip {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          padding: 0.375rem 0.75rem;
          background: var(--surface-secondary);
          border-radius: 0.625rem;
          font-size: 0.8125rem;

          .expense-desc {
            color: var(--text-primary);
          }

          .expense-amount {
            color: var(--text-secondary);
            font-weight: 500;
          }
        }

        .view-all-btn {
          font-size: 0.8125rem;
          color: var(--color-primary);
          padding: 0.375rem 0.625rem;

          mat-icon {
            font-size: 16px;
            width: 16px;
            height: 16px;
            margin-inline-start: 0.25rem;
          }
        }
      }
    }

    // Closed Banner
    .closed-banner {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.75rem;
      background: color-mix(in srgb, #40c057 10%, var(--surface-primary));
      border: 1px solid color-mix(in srgb, #40c057 30%, transparent);
      border-radius: 0.75rem;
      color: #2f9e44;
      font-size: 0.875rem;
      font-weight: 500;

      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }
    }
  `]
})
export class BudgetDashboardComponent implements OnInit {
  budgetService = inject(BudgetService);
  private router = inject(Router);

  Math = Math;

  summary = computed(() => this.budgetService.monthSummary());

  async ngOnInit(): Promise<void> {
    await this.budgetService.initializeBudget();
  }

  async navigatePrev(): Promise<void> {
    await this.budgetService.goToPreviousMonth();
  }

  async navigateNext(): Promise<void> {
    await this.budgetService.goToNextMonth();
  }

  async navigateToToday(): Promise<void> {
    await this.budgetService.loadOrCreateMonth(this.budgetService.currentYearMonth());
  }

  toggleGroup(type: ExpenseType): void {
    this.budgetService.toggleTypeCollapsed(type);
  }

  getStatusColor(status: BudgetStatus): string {
    const colors: Record<BudgetStatus, string> = {
      good: '#40c057',
      close: '#fab005',
      over: '#fa5252',
    };
    return colors[status];
  }

  getStatusIcon(status: BudgetStatus): string {
    return getBudgetStatusMeta(status).icon;
  }

  getStatusLabel(status: BudgetStatus): string {
    return getBudgetStatusMeta(status).labelHe;
  }
}
