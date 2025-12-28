import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { ShoppingService } from '../../shopping.service';
import { ShoppingHistoryService } from '../../shopping-history.service';

@Component({
  selector: 'app-completion-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="completion-dialog">
      <div class="dialog-header">
        <mat-icon class="success-icon">check_circle</mat-icon>
        <h2>סיום קניות</h2>
      </div>

      <div class="comparison-section">
        <div class="comparison-row">
          <span class="label">סה"כ משוער</span>
          <span class="value estimated">₪{{ shoppingService.estimatedTotal() | number:'1.0-0' }}</span>
        </div>
        <div class="comparison-row actual">
          <span class="label">סה"כ בפועל</span>
          <mat-form-field appearance="outline" class="actual-input">
            <span matPrefix>₪</span>
            <input
              matInput
              type="number"
              [(ngModel)]="actualTotal"
              [min]="0"
              placeholder="0"
              autofocus
            />
          </mat-form-field>
        </div>
      </div>

      @if (actualTotal > 0) {
        <div class="difference-section" [class.over]="difference() > 0" [class.under]="difference() < 0">
          <mat-icon>{{ difference() > 0 ? 'trending_up' : difference() < 0 ? 'trending_down' : 'trending_flat' }}</mat-icon>
          <span class="difference-text">
            @if (difference() > 0) {
              יותר ב-₪{{ difference() | number:'1.0-0' }}
            } @else if (difference() < 0) {
              פחות ב-₪{{ -difference() | number:'1.0-0' }}
            } @else {
              בדיוק כמו שהערכת!
            }
          </span>
        </div>
      }

      <div class="stats-section">
        <div class="stat">
          <span class="stat-value">{{ shoppingService.checkedCount() }}</span>
          <span class="stat-label">פריטים נקנו</span>
        </div>
        <div class="stat">
          <span class="stat-value">{{ shoppingService.totalCount() - shoppingService.checkedCount() }}</span>
          <span class="stat-label">פריטים לא נקנו</span>
        </div>
      </div>

      <div class="dialog-actions">
        <button mat-button (click)="cancel()" [disabled]="isCompleting()">
          ביטול
        </button>
        <button
          mat-flat-button
          color="primary"
          (click)="complete()"
          [disabled]="actualTotal <= 0 || isCompleting()"
        >
          @if (isCompleting()) {
            <mat-spinner diameter="20"></mat-spinner>
          } @else {
            <mat-icon>check</mat-icon>
            סיום
          }
        </button>
      </div>
    </div>
  `,
  styles: [`
    .completion-dialog {
      padding: 1.5rem;
      max-width: 400px;
    }

    .dialog-header {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 1.5rem;

      .success-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
        color: var(--color-success);
      }

      h2 {
        margin: 0;
        font-size: 1.25rem;
        color: var(--text-primary);
      }
    }

    .comparison-section {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .comparison-row {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .label {
        font-size: 0.9375rem;
        color: var(--text-secondary);
      }

      .value {
        font-size: 1.25rem;
        font-weight: 600;

        &.estimated {
          color: var(--text-secondary);
        }
      }

      &.actual {
        .actual-input {
          width: 140px;

          ::ng-deep {
            .mat-mdc-form-field-subscript-wrapper {
              display: none;
            }

            input {
              font-size: 1.25rem;
              font-weight: 600;
              text-align: end;
            }
          }
        }
      }
    }

    .difference-section {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.75rem;
      border-radius: 0.75rem;
      margin-bottom: 1rem;

      mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
      }

      .difference-text {
        font-size: 0.9375rem;
        font-weight: 500;
      }

      &.over {
        background: color-mix(in srgb, var(--color-error) 10%, transparent);
        color: var(--color-error);
      }

      &.under {
        background: color-mix(in srgb, var(--color-success) 10%, transparent);
        color: var(--color-success);
      }
    }

    .stats-section {
      display: flex;
      justify-content: center;
      gap: 2rem;
      padding: 1rem;
      background: var(--surface-secondary);
      border-radius: 0.75rem;
      margin-bottom: 1.5rem;
    }

    .stat {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.25rem;

      .stat-value {
        font-size: 1.5rem;
        font-weight: 700;
        color: var(--text-primary);
      }

      .stat-label {
        font-size: 0.75rem;
        color: var(--text-secondary);
      }
    }

    .dialog-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;

      button {
        min-width: 100px;

        mat-icon {
          margin-inline-end: 0.5rem;
        }

        mat-spinner {
          display: inline-block;
        }
      }
    }
  `]
})
export class CompletionDialogComponent {
  private dialogRef = inject(MatDialogRef<CompletionDialogComponent>);
  shoppingService = inject(ShoppingService);
  private historyService = inject(ShoppingHistoryService);

  actualTotal = 0;
  isCompleting = signal(false);

  difference = () => {
    if (this.actualTotal <= 0) return 0;
    return this.actualTotal - this.shoppingService.estimatedTotal();
  };

  async complete(): Promise<void> {
    if (this.actualTotal <= 0) return;

    this.isCompleting.set(true);
    try {
      const tripId = await this.shoppingService.completeShopping({
        actualTotal: this.actualTotal,
      });

      // Update patterns for smart suggestions
      const trip = await this.historyService.getTrip(tripId);
      if (trip) {
        await this.historyService.updatePatterns(trip);
      }

      this.dialogRef.close({ success: true, tripId });
    } catch (error: any) {
      console.error('Error completing shopping:', error);
      this.isCompleting.set(false);
    }
  }

  cancel(): void {
    this.dialogRef.close({ success: false });
  }
}
