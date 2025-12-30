import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { BudgetService } from '../budget.service';
import {
  MonthlyBudget,
  formatMonthLabel,
  formatAmount,
  getBudgetStatus,
  getBudgetStatusMeta,
} from '../budget.models';

@Component({
  selector: 'app-budget-history',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    EmptyStateComponent,
  ],
  template: `
    <div class="history-page">
      <header class="page-header">
        <div class="header-content">
          <button mat-icon-button routerLink="../" class="back-btn">
            <mat-icon>arrow_forward</mat-icon>
          </button>
          <h1>היסטוריית תקציב</h1>
        </div>
      </header>

      @if (isLoading()) {
        <div class="loading-container">
          <mat-spinner diameter="40"></mat-spinner>
          <p>טוען היסטוריה...</p>
        </div>
      } @else if (closedMonths().length > 0) {
        <div class="history-list">
          @for (month of closedMonths(); track month.id) {
            <div class="month-card" [class.current]="month.status === 'active'">
              <div class="month-header">
                <div class="month-info">
                  <h3 class="month-name">{{ formatMonthLabel(month.yearMonth) }}</h3>
                  <div class="month-status" [class]="getStatus(month).id">
                    <mat-icon>{{ getStatus(month).icon }}</mat-icon>
                    <span>{{ getStatus(month).labelHe }}</span>
                  </div>
                </div>
                @if (month.status === 'active') {
                  <div class="active-badge">
                    <mat-icon>schedule</mat-icon>
                    פתוח
                  </div>
                }
              </div>

              <div class="month-stats">
                <div class="stat">
                  <span class="stat-label">יעד</span>
                  <span class="stat-value">{{ formatAmount(month.totalPlanned) }}</span>
                </div>
                <div class="stat-divider"></div>
                <div class="stat">
                  <span class="stat-label">בפועל</span>
                  <span class="stat-value">{{ formatAmount(month.totalActual + month.totalOccasional) }}</span>
                </div>
                <div class="stat-divider"></div>
                <div class="stat" [class.positive]="getDiff(month) >= 0" [class.negative]="getDiff(month) < 0">
                  <span class="stat-label">הפרש</span>
                  <span class="stat-value">
                    {{ getDiff(month) >= 0 ? '+' : '' }}{{ formatAmount(getDiff(month)) }}
                  </span>
                </div>
              </div>

              <div class="month-breakdown">
                <div class="breakdown-item">
                  <div class="breakdown-icon fixed">
                    <mat-icon>lock</mat-icon>
                  </div>
                  <span class="breakdown-label">קבוע</span>
                  <span class="breakdown-value">{{ formatAmount(getFixedTotal(month)) }}</span>
                </div>
                <div class="breakdown-item">
                  <div class="breakdown-icon variable">
                    <mat-icon>trending_up</mat-icon>
                  </div>
                  <span class="breakdown-label">משתנה</span>
                  <span class="breakdown-value">{{ formatAmount(getVariableTotal(month)) }}</span>
                </div>
                <div class="breakdown-item">
                  <div class="breakdown-icon occasional">
                    <mat-icon>shopping_bag</mat-icon>
                  </div>
                  <span class="breakdown-label">חד פעמי</span>
                  <span class="breakdown-value">{{ formatAmount(month.totalOccasional) }}</span>
                </div>
              </div>

              <div class="progress-bar">
                <div
                  class="progress-fill"
                  [style.width.%]="getProgressPercent(month)"
                  [class]="getStatus(month).id"
                ></div>
              </div>
            </div>
          }
        </div>

        <!-- Summary Stats -->
        <div class="summary-section">
          <h2>סיכום כללי</h2>
          <div class="summary-cards">
            <div class="summary-card">
              <mat-icon>calendar_month</mat-icon>
              <span class="summary-value">{{ closedMonths().length }}</span>
              <span class="summary-label">חודשים</span>
            </div>
            <div class="summary-card">
              <mat-icon>account_balance_wallet</mat-icon>
              <span class="summary-value">{{ formatAmount(averageMonthly()) }}</span>
              <span class="summary-label">ממוצע חודשי</span>
            </div>
            <div class="summary-card" [class.positive]="totalSaved() >= 0">
              <mat-icon>{{ totalSaved() >= 0 ? 'savings' : 'money_off' }}</mat-icon>
              <span class="summary-value">{{ formatAmount(Math.abs(totalSaved())) }}</span>
              <span class="summary-label">{{ totalSaved() >= 0 ? 'נחסך' : 'חריגה' }}</span>
            </div>
          </div>
        </div>
      } @else {
        <app-empty-state
          icon="history"
          title="אין היסטוריה עדיין"
          description="לאחר סגירת החודש הראשון, תוכלו לראות כאן את ההיסטוריה"
        ></app-empty-state>
      }
    </div>
  `,
  styles: [`
    .history-page {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .page-header {
      .header-content {
        display: flex;
        align-items: center;
        gap: 0.75rem;
      }

      .back-btn {
        color: var(--text-secondary);
      }

      h1 {
        font-size: 1.5rem;
        font-weight: 700;
        margin: 0;
        color: var(--text-primary);
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

    .history-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .month-card {
      background: var(--surface-primary);
      border: 1px solid var(--border-subtle);
      border-radius: 1rem;
      padding: 1.25rem;
      transition: all 0.2s ease;

      &:hover {
        border-color: var(--border-default);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
      }

      &.current {
        border-color: var(--color-primary);
        background: color-mix(in srgb, var(--color-primary) 5%, var(--surface-primary));
      }
    }

    .month-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1rem;
    }

    .month-info {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .month-name {
      font-size: 1.125rem;
      font-weight: 600;
      color: var(--text-primary);
      margin: 0;
    }

    .month-status {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      padding: 0.25rem 0.5rem;
      border-radius: 0.5rem;
      font-size: 0.75rem;
      font-weight: 500;

      mat-icon {
        font-size: 14px;
        width: 14px;
        height: 14px;
      }

      &.good {
        background: #d3f9d8;
        color: #2f9e44;
      }

      &.close {
        background: #fff3bf;
        color: #e67700;
      }

      &.over {
        background: #ffe3e3;
        color: #e03131;
      }
    }

    .active-badge {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      padding: 0.375rem 0.75rem;
      background: var(--color-primary);
      color: white;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 500;

      mat-icon {
        font-size: 14px;
        width: 14px;
        height: 14px;
      }
    }

    .month-stats {
      display: flex;
      align-items: center;
      justify-content: space-around;
      padding: 1rem;
      background: var(--surface-secondary);
      border-radius: 0.75rem;
      margin-bottom: 1rem;
    }

    .stat {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.25rem;

      &.positive .stat-value {
        color: #40c057;
      }

      &.negative .stat-value {
        color: #fa5252;
      }
    }

    .stat-label {
      font-size: 0.75rem;
      color: var(--text-tertiary);
    }

    .stat-value {
      font-size: 1rem;
      font-weight: 600;
      color: var(--text-primary);
    }

    .stat-divider {
      width: 1px;
      height: 30px;
      background: var(--border-subtle);
    }

    .month-breakdown {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 1rem;
    }

    .breakdown-item {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.25rem;
      padding: 0.75rem 0.5rem;
      background: var(--surface-secondary);
      border-radius: 0.75rem;
    }

    .breakdown-icon {
      width: 28px;
      height: 28px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;

      mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
        color: white;
      }

      &.fixed { background: linear-gradient(135deg, #5c7cfa, #4263eb); }
      &.variable { background: linear-gradient(135deg, #fab005, #f59f00); }
      &.occasional { background: linear-gradient(135deg, #20c997, #12b886); }
    }

    .breakdown-label {
      font-size: 0.625rem;
      color: var(--text-tertiary);
    }

    .breakdown-value {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--text-primary);
    }

    .progress-bar {
      height: 6px;
      background: var(--surface-secondary);
      border-radius: 3px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      border-radius: 3px;
      transition: width 0.3s ease;

      &.good { background: linear-gradient(90deg, #40c057, #2f9e44); }
      &.close { background: linear-gradient(90deg, #fab005, #f59f00); }
      &.over { background: linear-gradient(90deg, #fa5252, #e03131); }
    }

    .summary-section {
      margin-top: 1rem;

      h2 {
        font-size: 1.125rem;
        font-weight: 600;
        color: var(--text-primary);
        margin: 0 0 1rem;
      }
    }

    .summary-cards {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0.75rem;
    }

    .summary-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.25rem;
      padding: 1rem;
      background: var(--surface-primary);
      border: 1px solid var(--border-subtle);
      border-radius: 1rem;
      text-align: center;

      mat-icon {
        font-size: 24px;
        width: 24px;
        height: 24px;
        color: var(--color-primary);
      }

      &.positive mat-icon {
        color: #40c057;
      }
    }

    .summary-value {
      font-size: 1.125rem;
      font-weight: 700;
      color: var(--text-primary);
    }

    .summary-label {
      font-size: 0.75rem;
      color: var(--text-secondary);
    }

    @media (max-width: 480px) {
      .summary-cards {
        grid-template-columns: 1fr;
      }

      .summary-card {
        flex-direction: row;
        justify-content: space-between;
        padding: 1rem 1.25rem;

        .summary-value {
          order: 2;
        }

        .summary-label {
          order: 1;
        }

        mat-icon {
          order: 0;
        }
      }
    }
  `]
})
export class BudgetHistoryComponent implements OnInit {
  budgetService = inject(BudgetService);

  isLoading = signal(true);
  allMonths = signal<MonthlyBudget[]>([]);

  closedMonths = computed(() => {
    return this.allMonths().sort((a, b) => {
      // Sort by yearMonth descending (newest first)
      return b.yearMonth.localeCompare(a.yearMonth);
    });
  });

  averageMonthly = computed(() => {
    const months = this.closedMonths().filter(m => m.status === 'closed');
    if (months.length === 0) return 0;
    const total = months.reduce((sum, m) => sum + m.totalActual + m.totalOccasional, 0);
    return Math.round(total / months.length);
  });

  totalSaved = computed(() => {
    const months = this.closedMonths().filter(m => m.status === 'closed');
    return months.reduce((sum, m) => {
      return sum + (m.totalPlanned - m.totalActual - m.totalOccasional);
    }, 0);
  });

  Math = Math;
  formatMonthLabel = formatMonthLabel;
  formatAmount = formatAmount;

  async ngOnInit(): Promise<void> {
    try {
      // Load all months - in real implementation this would be a service method
      // For now, we use the current month data
      const currentMonth = this.budgetService.currentMonth();
      if (currentMonth) {
        this.allMonths.set([currentMonth]);
      }
    } finally {
      this.isLoading.set(false);
    }
  }

  getStatus(month: MonthlyBudget) {
    const total = month.totalActual + month.totalOccasional;
    const status = getBudgetStatus(total, month.totalPlanned);
    return getBudgetStatusMeta(status);
  }

  getDiff(month: MonthlyBudget): number {
    const total = month.totalActual + month.totalOccasional;
    return month.totalPlanned - total;
  }

  getProgressPercent(month: MonthlyBudget): number {
    if (month.totalPlanned === 0) return 0;
    const total = month.totalActual + month.totalOccasional;
    return Math.min(100, (total / month.totalPlanned) * 100);
  }

  getFixedTotal(month: MonthlyBudget): number {
    // This would come from entries - for now estimate
    return Math.round(month.totalActual * 0.5);
  }

  getVariableTotal(month: MonthlyBudget): number {
    // This would come from entries - for now estimate
    return Math.round(month.totalActual * 0.5);
  }
}
