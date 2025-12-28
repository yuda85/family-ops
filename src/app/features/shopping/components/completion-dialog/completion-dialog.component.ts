import { Component, inject, signal, computed, OnInit } from '@angular/core';
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
    <div class="completion-dialog" [class.revealed]="isRevealed">
      <!-- Decorative top edge -->
      <div class="receipt-edge top"></div>

      <!-- Success badge -->
      <div class="success-badge">
        <div class="badge-ring">
          <svg class="checkmark" viewBox="0 0 52 52">
            <circle class="checkmark-circle" cx="26" cy="26" r="25" fill="none"/>
            <path class="checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
          </svg>
        </div>
      </div>

      <h2 class="dialog-title">סיום הקניות</h2>
      <p class="dialog-subtitle">בואו נסכם את הסיבוב!</p>

      <!-- Stats cards -->
      <div class="stats-row">
        <div class="stat-card purchased">
          <div class="stat-icon">
            <mat-icon>shopping_basket</mat-icon>
          </div>
          <div class="stat-info">
            <span class="stat-number">{{ shoppingService.checkedCount() }}</span>
            <span class="stat-label">נקנו</span>
          </div>
        </div>
        <div class="stat-card skipped">
          <div class="stat-icon">
            <mat-icon>remove_shopping_cart</mat-icon>
          </div>
          <div class="stat-info">
            <span class="stat-number">{{ shoppingService.totalCount() - shoppingService.checkedCount() }}</span>
            <span class="stat-label">דילגנו</span>
          </div>
        </div>
      </div>

      <!-- Price comparison section -->
      <div class="price-section">
        <div class="price-row estimated">
          <div class="price-label">
            <mat-icon>calculate</mat-icon>
            <span>הערכה</span>
          </div>
          <div class="price-value">
            <span class="currency">₪</span>
            <span class="amount">{{ shoppingService.estimatedTotal() | number:'1.0-0' }}</span>
          </div>
        </div>

        <div class="divider-fancy">
          <span class="divider-dot"></span>
          <span class="divider-line"></span>
          <span class="divider-dot"></span>
        </div>

        <div class="price-row actual">
          <div class="price-label">
            <mat-icon>receipt_long</mat-icon>
            <span>בפועל</span>
          </div>
          <div class="actual-input-wrapper">
            <span class="currency-prefix">₪</span>
            <input
              type="number"
              class="actual-input"
              [(ngModel)]="actualTotal"
              [min]="0"
              placeholder="0"
              autofocus
            />
          </div>
        </div>
      </div>

      <!-- Difference indicator -->
      @if (actualTotal > 0) {
        <div class="difference-badge"
             [class.over]="difference() > 0"
             [class.under]="difference() < 0"
             [class.exact]="difference() === 0">
          <div class="diff-icon">
            @if (difference() > 0) {
              <mat-icon>arrow_upward</mat-icon>
            } @else if (difference() < 0) {
              <mat-icon>arrow_downward</mat-icon>
            } @else {
              <mat-icon>check</mat-icon>
            }
          </div>
          <div class="diff-content">
            @if (difference() > 0) {
              <span class="diff-amount">+₪{{ difference() | number:'1.0-0' }}</span>
              <span class="diff-text">מעל ההערכה</span>
            } @else if (difference() < 0) {
              <span class="diff-amount">-₪{{ -difference() | number:'1.0-0' }}</span>
              <span class="diff-text">מתחת להערכה</span>
            } @else {
              <span class="diff-amount">מושלם!</span>
              <span class="diff-text">בדיוק כמו שהערכת</span>
            }
          </div>
        </div>
      }

      <!-- Action buttons -->
      <div class="dialog-actions">
        <button class="btn-cancel" (click)="cancel()" [disabled]="isCompleting()">
          ביטול
        </button>
        <button
          class="btn-complete"
          (click)="complete()"
          [disabled]="actualTotal <= 0 || isCompleting()"
          [class.loading]="isCompleting()"
        >
          @if (isCompleting()) {
            <div class="spinner"></div>
            <span>שומר...</span>
          } @else {
            <mat-icon>celebration</mat-icon>
            <span>סיום!</span>
          }
        </button>
      </div>

      <!-- Decorative bottom edge -->
      <div class="receipt-edge bottom"></div>
    </div>
  `,
  styles: [`
    @keyframes fadeSlideIn {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @keyframes scaleIn {
      from {
        opacity: 0;
        transform: scale(0.8);
      }
      to {
        opacity: 1;
        transform: scale(1);
      }
    }

    @keyframes checkmarkStroke {
      100% {
        stroke-dashoffset: 0;
      }
    }

    @keyframes pulse {
      0%, 100% {
        transform: scale(1);
      }
      50% {
        transform: scale(1.05);
      }
    }

    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }

    .completion-dialog {
      position: relative;
      padding: 2rem 1.75rem;
      background: linear-gradient(
        180deg,
        var(--surface-primary) 0%,
        color-mix(in srgb, var(--color-primary) 3%, var(--surface-primary)) 100%
      );
      min-width: 340px;
      max-width: 420px;
      overflow: hidden;

      // Subtle texture overlay
      &::before {
        content: '';
        position: absolute;
        inset: 0;
        background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%' height='100%' filter='url(%23noise)'/%3E%3C/svg%3E");
        opacity: 0.02;
        pointer-events: none;
      }
    }

    // Receipt edges - decorative zigzag
    .receipt-edge {
      position: absolute;
      left: 0;
      right: 0;
      height: 12px;
      background: linear-gradient(
        135deg,
        var(--surface-app) 25%,
        transparent 25%
      ),
      linear-gradient(
        225deg,
        var(--surface-app) 25%,
        transparent 25%
      );
      background-size: 12px 12px;

      &.top {
        top: 0;
        background-position: 0 0, 6px 0;
      }

      &.bottom {
        bottom: 0;
        transform: rotate(180deg);
        background-position: 0 0, 6px 0;
      }
    }

    // Success badge
    .success-badge {
      position: relative;
      width: 72px;
      height: 72px;
      margin: 0.5rem auto 1.25rem;
      animation: scaleIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s both;
    }

    .badge-ring {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      background: linear-gradient(
        135deg,
        var(--color-success) 0%,
        color-mix(in srgb, var(--color-success) 80%, var(--color-secondary)) 100%
      );
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow:
        0 4px 12px color-mix(in srgb, var(--color-success) 30%, transparent),
        0 2px 4px color-mix(in srgb, var(--color-success) 20%, transparent),
        inset 0 2px 0 rgba(255, 255, 255, 0.2);
    }

    .checkmark {
      width: 36px;
      height: 36px;
    }

    .checkmark-circle {
      stroke: rgba(255, 255, 255, 0.3);
      stroke-width: 2;
      stroke-linecap: round;
    }

    .checkmark-check {
      stroke: white;
      stroke-width: 3;
      stroke-linecap: round;
      stroke-linejoin: round;
      stroke-dasharray: 48;
      stroke-dashoffset: 48;
      animation: checkmarkStroke 0.4s cubic-bezier(0.65, 0, 0.45, 1) 0.4s forwards;
    }

    // Title
    .dialog-title {
      font-family: var(--font-family-display);
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--text-primary);
      text-align: center;
      margin: 0 0 0.25rem;
      animation: fadeSlideIn 0.4s ease-out 0.2s both;
    }

    .dialog-subtitle {
      font-size: 0.875rem;
      color: var(--text-secondary);
      text-align: center;
      margin: 0 0 1.5rem;
      animation: fadeSlideIn 0.4s ease-out 0.25s both;
    }

    // Stats row
    .stats-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.75rem;
      margin-bottom: 1.5rem;
      animation: fadeSlideIn 0.4s ease-out 0.3s both;
    }

    .stat-card {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.875rem;
      border-radius: 12px;
      background: var(--surface-secondary);
      border: 1px solid var(--border-subtle);
      transition: transform 0.2s ease, box-shadow 0.2s ease;

      &:hover {
        transform: translateY(-2px);
        box-shadow: var(--shadow-md);
      }

      &.purchased {
        .stat-icon {
          background: color-mix(in srgb, var(--color-success) 15%, transparent);
          color: var(--color-success);
        }
      }

      &.skipped {
        .stat-icon {
          background: color-mix(in srgb, var(--text-tertiary) 15%, transparent);
          color: var(--text-tertiary);
        }
      }
    }

    .stat-icon {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;

      mat-icon {
        font-size: 22px;
        width: 22px;
        height: 22px;
      }
    }

    .stat-info {
      display: flex;
      flex-direction: column;
    }

    .stat-number {
      font-family: var(--font-family-display);
      font-size: 1.375rem;
      font-weight: 700;
      color: var(--text-primary);
      line-height: 1.2;
    }

    .stat-label {
      font-size: 0.75rem;
      color: var(--text-secondary);
    }

    // Price section
    .price-section {
      background: var(--surface-secondary);
      border-radius: 16px;
      padding: 1.25rem;
      margin-bottom: 1rem;
      border: 1px solid var(--border-subtle);
      animation: fadeSlideIn 0.4s ease-out 0.35s both;
    }

    .price-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .price-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: var(--text-secondary);
      font-size: 0.9375rem;

      mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
        opacity: 0.7;
      }
    }

    .price-value {
      display: flex;
      align-items: baseline;
      gap: 0.125rem;

      .currency {
        font-size: 1rem;
        color: var(--text-secondary);
        font-weight: 500;
      }

      .amount {
        font-family: var(--font-family-display);
        font-size: 1.5rem;
        font-weight: 700;
        color: var(--text-secondary);
      }
    }

    .divider-fancy {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin: 1rem 0;
    }

    .divider-line {
      flex: 1;
      height: 1px;
      background: repeating-linear-gradient(
        90deg,
        var(--border-default) 0,
        var(--border-default) 4px,
        transparent 4px,
        transparent 8px
      );
    }

    .divider-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--border-default);
    }

    .actual-input-wrapper {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      background: var(--surface-primary);
      border: 2px solid var(--color-primary);
      border-radius: 12px;
      padding: 0.5rem 0.75rem;
      transition: box-shadow 0.2s ease;

      &:focus-within {
        box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary) 20%, transparent);
      }
    }

    .currency-prefix {
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--color-primary);
    }

    .actual-input {
      width: 100px;
      border: none;
      background: transparent;
      font-family: var(--font-family-display);
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--color-primary);
      text-align: end;
      outline: none;

      &::placeholder {
        color: var(--text-tertiary);
      }

      // Hide spinner arrows
      &::-webkit-outer-spin-button,
      &::-webkit-inner-spin-button {
        -webkit-appearance: none;
        margin: 0;
      }
      -moz-appearance: textfield;
    }

    // Difference badge
    .difference-badge {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.875rem 1rem;
      border-radius: 12px;
      margin-bottom: 1.5rem;
      animation: scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);

      &.over {
        background: linear-gradient(
          135deg,
          color-mix(in srgb, var(--color-error) 12%, transparent) 0%,
          color-mix(in srgb, var(--color-error) 8%, transparent) 100%
        );
        border: 1px solid color-mix(in srgb, var(--color-error) 25%, transparent);

        .diff-icon {
          background: var(--color-error);
        }

        .diff-amount {
          color: var(--color-error);
        }
      }

      &.under {
        background: linear-gradient(
          135deg,
          color-mix(in srgb, var(--color-success) 12%, transparent) 0%,
          color-mix(in srgb, var(--color-success) 8%, transparent) 100%
        );
        border: 1px solid color-mix(in srgb, var(--color-success) 25%, transparent);

        .diff-icon {
          background: var(--color-success);
        }

        .diff-amount {
          color: var(--color-success);
        }
      }

      &.exact {
        background: linear-gradient(
          135deg,
          color-mix(in srgb, var(--color-primary) 12%, transparent) 0%,
          color-mix(in srgb, var(--color-secondary) 8%, transparent) 100%
        );
        border: 1px solid color-mix(in srgb, var(--color-primary) 25%, transparent);

        .diff-icon {
          background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
          animation: pulse 1.5s ease-in-out infinite;
        }

        .diff-amount {
          color: var(--color-primary);
        }
      }
    }

    .diff-icon {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;

      mat-icon {
        color: white;
        font-size: 20px;
        width: 20px;
        height: 20px;
      }
    }

    .diff-content {
      display: flex;
      flex-direction: column;
      gap: 0.125rem;
    }

    .diff-amount {
      font-family: var(--font-family-display);
      font-size: 1.125rem;
      font-weight: 700;
    }

    .diff-text {
      font-size: 0.75rem;
      color: var(--text-secondary);
    }

    // Actions
    .dialog-actions {
      display: flex;
      gap: 0.75rem;
      animation: fadeSlideIn 0.4s ease-out 0.4s both;
    }

    .btn-cancel,
    .btn-complete {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.875rem 1.25rem;
      border-radius: 12px;
      font-family: var(--font-family-hebrew);
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      border: none;

      mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
      }
    }

    .btn-cancel {
      background: var(--surface-secondary);
      color: var(--text-secondary);
      border: 1px solid var(--border-default);

      &:hover:not(:disabled) {
        background: var(--surface-hover);
        color: var(--text-primary);
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }

    .btn-complete {
      background: linear-gradient(
        135deg,
        var(--color-primary) 0%,
        color-mix(in srgb, var(--color-primary) 85%, var(--color-secondary)) 100%
      );
      color: white;
      box-shadow:
        0 4px 12px color-mix(in srgb, var(--color-primary) 35%, transparent),
        0 2px 4px color-mix(in srgb, var(--color-primary) 25%, transparent);

      &:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow:
          0 6px 16px color-mix(in srgb, var(--color-primary) 40%, transparent),
          0 3px 6px color-mix(in srgb, var(--color-primary) 30%, transparent);
      }

      &:active:not(:disabled) {
        transform: translateY(0);
      }

      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
        transform: none;
      }

      &.loading {
        pointer-events: none;
      }
    }

    .spinner {
      width: 20px;
      height: 20px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
  `]
})
export class CompletionDialogComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<CompletionDialogComponent>);
  shoppingService = inject(ShoppingService);
  private historyService = inject(ShoppingHistoryService);

  actualTotal = 0;
  isCompleting = signal(false);
  isRevealed = false;

  difference = computed(() => {
    if (this.actualTotal <= 0) return 0;
    return this.actualTotal - this.shoppingService.estimatedTotal();
  });

  ngOnInit(): void {
    // Trigger reveal animation
    setTimeout(() => {
      this.isRevealed = true;
    }, 50);
  }

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
