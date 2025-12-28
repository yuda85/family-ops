import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { ShoppingHistoryService } from '../shopping-history.service';
import { ShoppingTrip } from '../shopping.models';

@Component({
  selector: 'app-history-view',
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
        <div class="header-top">
          <button mat-icon-button routerLink="../">
            <mat-icon>arrow_forward</mat-icon>
          </button>
          <h1>היסטוריית קניות</h1>
        </div>
      </header>

      @if (historyService.isLoading()) {
        <div class="loading-container">
          <mat-spinner diameter="40"></mat-spinner>
          <p>טוען היסטוריה...</p>
        </div>
      } @else if (historyService.history().length > 0) {
        <!-- Summary Stats -->
        <div class="summary-section">
          <div class="stat-card">
            <mat-icon>receipt_long</mat-icon>
            <div class="stat-content">
              <span class="stat-value">{{ historyService.totalStats().totalTrips }}</span>
              <span class="stat-label">סיבובי קניות</span>
            </div>
          </div>
          <div class="stat-card">
            <mat-icon>payments</mat-icon>
            <div class="stat-content">
              <span class="stat-value">₪{{ historyService.totalStats().totalActual | number:'1.0-0' }}</span>
              <span class="stat-label">סה"כ הוצאות</span>
            </div>
          </div>
          <div class="stat-card">
            <mat-icon>analytics</mat-icon>
            <div class="stat-content">
              <span class="stat-value">₪{{ historyService.totalStats().averageTrip | number:'1.0-0' }}</span>
              <span class="stat-label">ממוצע לקניה</span>
            </div>
          </div>
        </div>

        <!-- Accuracy Indicator -->
        <div class="accuracy-section">
          <div class="accuracy-bar">
            <div class="accuracy-label">דיוק הערכות</div>
            <div class="accuracy-value" [class.over]="historyService.estimateAccuracy() > 100" [class.under]="historyService.estimateAccuracy() < 100">
              {{ historyService.estimateAccuracy() }}%
            </div>
          </div>
          <p class="accuracy-hint">
            @if (historyService.estimateAccuracy() > 100) {
              הערכות שלך נמוכות מהמחיר בפועל
            } @else if (historyService.estimateAccuracy() < 100) {
              הערכות שלך גבוהות מהמחיר בפועל
            } @else {
              הערכות מדויקות!
            }
          </p>
        </div>

        <!-- Monthly Spending -->
        @if (historyService.monthlySpending().length > 0) {
          <div class="monthly-section">
            <h2>הוצאות חודשיות</h2>
            <div class="monthly-table">
              <div class="table-header">
                <span>חודש</span>
                <span>משוער</span>
                <span>בפועל</span>
                <span>קניות</span>
              </div>
              @for (month of historyService.monthlySpending(); track month.month) {
                <div class="table-row">
                  <span class="month-label">{{ month.monthLabel }}</span>
                  <span class="estimated">₪{{ month.totalEstimated | number:'1.0-0' }}</span>
                  <span class="actual">₪{{ month.totalActual | number:'1.0-0' }}</span>
                  <span class="count">{{ month.tripCount }}</span>
                </div>
              }
            </div>
          </div>
        }

        <!-- Recent Trips -->
        <div class="trips-section">
          <h2>קניות אחרונות</h2>
          <div class="trips-list">
            @for (trip of historyService.history(); track trip.id) {
              <div class="trip-card">
                <div class="trip-date">
                  {{ formatDate(trip.completedAt.toDate()) }}
                </div>
                <div class="trip-details">
                  <div class="trip-row">
                    <span class="trip-label">פריטים</span>
                    <span class="trip-value">{{ trip.checkedItems }}/{{ trip.totalItems }}</span>
                  </div>
                  <div class="trip-row">
                    <span class="trip-label">משוער</span>
                    <span class="trip-value estimated">₪{{ trip.estimatedTotal | number:'1.0-0' }}</span>
                  </div>
                  <div class="trip-row">
                    <span class="trip-label">בפועל</span>
                    <span class="trip-value actual">₪{{ trip.actualTotal | number:'1.0-0' }}</span>
                  </div>
                </div>
                <div class="trip-diff" [class.over]="trip.actualTotal > trip.estimatedTotal" [class.under]="trip.actualTotal < trip.estimatedTotal">
                  @if (trip.actualTotal > trip.estimatedTotal) {
                    +₪{{ trip.actualTotal - trip.estimatedTotal | number:'1.0-0' }}
                  } @else if (trip.actualTotal < trip.estimatedTotal) {
                    -₪{{ trip.estimatedTotal - trip.actualTotal | number:'1.0-0' }}
                  } @else {
                    =
                  }
                </div>
              </div>
            }
          </div>
        </div>
      } @else {
        <app-empty-state
          icon="history"
          title="אין היסטוריה"
          description="סיימו קניות כדי לראות את היסטוריית ההוצאות שלכם"
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

    .summary-section {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0.75rem;

      @media (max-width: 480px) {
        grid-template-columns: 1fr;
      }
    }

    .stat-card {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem;
      background: var(--surface-primary);
      border: 1px solid var(--border-subtle);
      border-radius: 0.75rem;

      mat-icon {
        font-size: 24px;
        width: 24px;
        height: 24px;
        color: var(--color-primary);
      }

      .stat-content {
        display: flex;
        flex-direction: column;
      }

      .stat-value {
        font-size: 1.125rem;
        font-weight: 700;
        color: var(--text-primary);
      }

      .stat-label {
        font-size: 0.75rem;
        color: var(--text-secondary);
      }
    }

    .accuracy-section {
      padding: 1rem;
      background: var(--surface-primary);
      border: 1px solid var(--border-subtle);
      border-radius: 0.75rem;

      .accuracy-bar {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .accuracy-label {
        font-weight: 500;
        color: var(--text-primary);
      }

      .accuracy-value {
        font-size: 1.25rem;
        font-weight: 700;

        &.over {
          color: var(--color-error);
        }

        &.under {
          color: var(--color-success);
        }
      }

      .accuracy-hint {
        margin: 0.5rem 0 0;
        font-size: 0.8125rem;
        color: var(--text-secondary);
      }
    }

    .monthly-section, .trips-section {
      h2 {
        font-size: 1rem;
        font-weight: 600;
        margin: 0 0 0.75rem;
        color: var(--text-primary);
      }
    }

    .monthly-table {
      background: var(--surface-primary);
      border: 1px solid var(--border-subtle);
      border-radius: 0.75rem;
      overflow: hidden;
    }

    .table-header, .table-row {
      display: grid;
      grid-template-columns: 1fr repeat(3, 80px);
      padding: 0.75rem 1rem;
      gap: 0.5rem;
      text-align: end;

      span:first-child {
        text-align: start;
      }
    }

    .table-header {
      background: var(--surface-secondary);
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--text-secondary);
      text-transform: uppercase;
    }

    .table-row {
      border-top: 1px solid var(--border-subtle);

      .month-label {
        font-weight: 500;
        color: var(--text-primary);
      }

      .estimated {
        color: var(--text-secondary);
      }

      .actual {
        font-weight: 600;
        color: var(--color-primary);
      }

      .count {
        color: var(--text-secondary);
      }
    }

    .trips-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .trip-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background: var(--surface-primary);
      border: 1px solid var(--border-subtle);
      border-radius: 0.75rem;

      .trip-date {
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--text-primary);
        min-width: 80px;
      }

      .trip-details {
        flex: 1;
        display: flex;
        gap: 1rem;
        flex-wrap: wrap;
      }

      .trip-row {
        display: flex;
        flex-direction: column;
        gap: 0.125rem;

        .trip-label {
          font-size: 0.6875rem;
          color: var(--text-tertiary);
        }

        .trip-value {
          font-size: 0.875rem;
          color: var(--text-primary);

          &.estimated {
            color: var(--text-secondary);
          }

          &.actual {
            font-weight: 600;
            color: var(--color-primary);
          }
        }
      }

      .trip-diff {
        font-size: 0.875rem;
        font-weight: 600;
        padding: 0.25rem 0.5rem;
        border-radius: 0.375rem;

        &.over {
          background: color-mix(in srgb, var(--color-error) 10%, transparent);
          color: var(--color-error);
        }

        &.under {
          background: color-mix(in srgb, var(--color-success) 10%, transparent);
          color: var(--color-success);
        }
      }
    }
  `]
})
export class HistoryViewComponent implements OnInit {
  historyService = inject(ShoppingHistoryService);

  ngOnInit(): void {
    this.historyService.loadHistory();
  }

  formatDate(date: Date): string {
    return date.toLocaleDateString('he-IL', {
      day: 'numeric',
      month: 'short',
    });
  }
}
