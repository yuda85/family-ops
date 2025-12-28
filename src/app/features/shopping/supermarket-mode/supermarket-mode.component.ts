import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { ShoppingService } from '../shopping.service';
import { CatalogService } from '../catalog.service';
import { ConfettiService } from '../confetti.service';
import { ConfettiComponent } from '../components/confetti/confetti.component';
import { CompletionDialogComponent } from '../components/completion-dialog/completion-dialog.component';
import { ShoppingListItem, CategoryGroup, getCategoryMeta, getUnitMeta } from '../shopping.models';

@Component({
  selector: 'app-supermarket-mode',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    EmptyStateComponent,
    ConfettiComponent,
  ],
  template: `
    <app-confetti></app-confetti>
    <div class="supermarket-page" [class.complete]="shoppingService.isListComplete()">
      <!-- Header -->
      <header class="super-header">
        <button mat-icon-button class="exit-btn" (click)="exitSupermarketMode()">
          <mat-icon>close</mat-icon>
        </button>
        <div class="header-center">
          <h1>מצב סופר</h1>
          <span class="progress-text">
            {{ shoppingService.checkedCount() }}/{{ shoppingService.totalCount() }}
          </span>
        </div>
        <button
          mat-icon-button
          class="undo-btn"
          [disabled]="!shoppingService.canUndo()"
          (click)="undo()"
        >
          <mat-icon>undo</mat-icon>
        </button>
      </header>

      <!-- Progress Bar -->
      <div class="super-progress">
        <div class="progress-fill" [style.width.%]="shoppingService.progress()"></div>
      </div>

      @if (shoppingService.isLoading()) {
        <div class="loading-container">
          <mat-spinner diameter="48"></mat-spinner>
        </div>
      } @else if (shoppingService.hasItems()) {
        <!-- Category Groups -->
        <div class="super-categories">
          @for (group of shoppingService.groupedItems(); track group.category) {
            <div class="super-category" [class.complete]="group.isComplete">
              <div class="category-header" [style.border-color]="group.categoryMeta.color">
                <mat-icon [style.color]="group.categoryMeta.color">{{ group.categoryMeta.icon }}</mat-icon>
                <span class="category-name">{{ group.categoryMeta.labelHe }}</span>
                <span class="category-progress">{{ getCheckedCount(group) }}/{{ group.items.length }}</span>
              </div>

              <div class="super-items">
                @for (item of group.items; track item.id) {
                  <button
                    class="super-item"
                    [class.checked]="item.checked"
                    (click)="quickCheck(item)"
                    [disabled]="isChecking"
                  >
                    <div class="item-check">
                      @if (item.checked) {
                        <mat-icon>check_circle</mat-icon>
                      } @else {
                        <mat-icon>radio_button_unchecked</mat-icon>
                      }
                    </div>
                    <div class="item-content">
                      <span class="item-name">{{ item.name }}</span>
                      @if (item.quantity > 0) {
                        <span class="item-qty">{{ item.quantity }} {{ getUnitLabel(item.unit) }}</span>
                      }
                    </div>
                    @if (item.estimatedPrice > 0) {
                      <span class="item-price">₪{{ item.estimatedPrice * item.quantity | number:'1.0-0' }}</span>
                    }
                  </button>
                }
              </div>
            </div>
          }
        </div>

        <!-- Bottom Bar -->
        <div class="super-bottom">
          <div class="total-section">
            <span class="total-label">סה"כ משוער</span>
            <span class="total-amount">₪{{ shoppingService.estimatedTotal() | number:'1.0-0' }}</span>
          </div>
          @if (shoppingService.isListComplete()) {
            <button mat-flat-button color="primary" class="complete-btn" (click)="completeShopping()">
              <mat-icon>check</mat-icon>
              סיום קניות
            </button>
          }
        </div>

        @if (shoppingService.isListComplete()) {
          <div class="completion-overlay">
            <div class="completion-content">
              <mat-icon class="check-icon">check_circle</mat-icon>
              <h2>כל הפריטים נקנו!</h2>
              <p>סה"כ משוער: ₪{{ shoppingService.estimatedTotal() | number:'1.0-0' }}</p>
              <button mat-flat-button color="primary" (click)="completeShopping()">
                סיום קניות
              </button>
            </div>
          </div>
        }
      } @else {
        <app-empty-state
          icon="shopping_basket"
          title="הרשימה ריקה"
          description="אין פריטים ברשימת הקניות"
          actionLabel="חזור לרשימה"
          actionIcon="arrow_forward"
          (action)="exitSupermarketMode()"
        ></app-empty-state>
      }
    </div>
  `,
  styles: [`
    .supermarket-page {
      position: fixed;
      inset: 0;
      background: var(--surface-primary);
      display: flex;
      flex-direction: column;
      z-index: 1000;
      overflow: hidden;

      &.complete {
        background: color-mix(in srgb, var(--color-success) 5%, var(--surface-primary));
      }
    }

    .super-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem 1rem;
      background: var(--surface-secondary);
      border-bottom: 1px solid var(--border-subtle);

      .header-center {
        display: flex;
        flex-direction: column;
        align-items: center;

        h1 {
          margin: 0;
          font-size: 1.125rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .progress-text {
          font-size: 0.875rem;
          color: var(--text-secondary);
        }
      }

      .exit-btn, .undo-btn {
        width: 48px;
        height: 48px;
      }

      .undo-btn:disabled {
        opacity: 0.3;
      }
    }

    .super-progress {
      height: 6px;
      background: var(--surface-secondary);

      .progress-fill {
        height: 100%;
        background: var(--color-primary);
        transition: width 0.3s ease;
      }
    }

    .loading-container {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .super-categories {
      flex: 1;
      overflow-y: auto;
      padding: 1rem;
      padding-bottom: 100px;
    }

    .super-category {
      margin-bottom: 1.5rem;

      &.complete {
        opacity: 0.7;

        .category-header {
          background: color-mix(in srgb, var(--color-success) 10%, var(--surface-secondary));
        }
      }
    }

    .category-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      background: var(--surface-secondary);
      border-radius: 0.75rem;
      border-inline-start: 4px solid;
      margin-bottom: 0.75rem;

      mat-icon {
        font-size: 24px;
        width: 24px;
        height: 24px;
      }

      .category-name {
        flex: 1;
        font-weight: 600;
        color: var(--text-primary);
      }

      .category-progress {
        font-size: 0.875rem;
        color: var(--text-secondary);
      }
    }

    .super-items {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .super-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      width: 100%;
      padding: 1rem;
      background: var(--surface-primary);
      border: 2px solid var(--border-subtle);
      border-radius: 1rem;
      cursor: pointer;
      transition: all 0.15s ease;
      text-align: start;
      min-height: 64px; /* Large touch target */

      &:active:not(:disabled) {
        transform: scale(0.98);
        background: var(--surface-hover);
      }

      &.checked {
        background: color-mix(in srgb, var(--color-success) 10%, var(--surface-primary));
        border-color: var(--color-success);

        .item-check mat-icon {
          color: var(--color-success);
        }

        .item-name {
          text-decoration: line-through;
          color: var(--text-tertiary);
        }
      }

      &:disabled {
        opacity: 0.7;
      }

      .item-check {
        mat-icon {
          font-size: 28px;
          width: 28px;
          height: 28px;
          color: var(--text-tertiary);
        }
      }

      .item-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 0.125rem;
      }

      .item-name {
        font-size: 1.0625rem;
        font-weight: 500;
        color: var(--text-primary);
      }

      .item-qty {
        font-size: 0.8125rem;
        color: var(--text-secondary);
      }

      .item-price {
        font-size: 0.875rem;
        color: var(--color-primary);
        font-weight: 500;
      }
    }

    .super-bottom {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem;
      background: var(--surface-secondary);
      border-top: 1px solid var(--border-subtle);
      gap: 1rem;

      .total-section {
        display: flex;
        flex-direction: column;
      }

      .total-label {
        font-size: 0.75rem;
        color: var(--text-secondary);
      }

      .total-amount {
        font-size: 1.25rem;
        font-weight: 700;
        color: var(--color-primary);
      }

      .complete-btn {
        min-width: 120px;
        height: 48px;
        font-size: 1rem;

        mat-icon {
          margin-inline-end: 0.5rem;
        }
      }
    }

    .completion-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10;
      animation: fadeIn 0.3s ease;

      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
    }

    .completion-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 2rem;
      background: var(--surface-primary);
      border-radius: 1.5rem;
      text-align: center;
      gap: 1rem;
      animation: scaleIn 0.3s ease;

      @keyframes scaleIn {
        from { transform: scale(0.9); opacity: 0; }
        to { transform: scale(1); opacity: 1; }
      }

      .check-icon {
        font-size: 64px;
        width: 64px;
        height: 64px;
        color: var(--color-success);
      }

      h2 {
        margin: 0;
        font-size: 1.5rem;
        color: var(--text-primary);
      }

      p {
        margin: 0;
        color: var(--text-secondary);
      }

      button {
        margin-top: 0.5rem;
      }
    }
  `]
})
export class SupermarketModeComponent implements OnInit, OnDestroy {
  shoppingService = inject(ShoppingService);
  private catalogService = inject(CatalogService);
  private confettiService = inject(ConfettiService);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  private wakeLock: WakeLockSentinel | null = null;
  private previousCompletedCategories: string[] = [];
  isChecking = false;

  async ngOnInit(): Promise<void> {
    // Load catalog and list if needed
    if (!this.catalogService.isLoaded()) {
      await this.catalogService.loadCatalog();
    }
    if (!this.shoppingService.activeList()) {
      await this.shoppingService.loadActiveList();
    }

    // Enter supermarket mode
    await this.shoppingService.enterSupermarketMode();

    // Request wake lock to keep screen on
    await this.requestWakeLock();
  }

  async ngOnDestroy(): Promise<void> {
    // Release wake lock
    await this.releaseWakeLock();
  }

  private async requestWakeLock(): Promise<void> {
    try {
      if ('wakeLock' in navigator) {
        this.wakeLock = await (navigator as any).wakeLock.request('screen');
        console.log('Wake lock acquired');

        // Re-acquire on visibility change
        document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
      }
    } catch (error) {
      console.warn('Wake lock not available:', error);
    }
  }

  private async releaseWakeLock(): Promise<void> {
    if (this.wakeLock) {
      await this.wakeLock.release();
      this.wakeLock = null;
      console.log('Wake lock released');
    }
    document.removeEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
  }

  private async handleVisibilityChange(): Promise<void> {
    if (document.visibilityState === 'visible' && !this.wakeLock) {
      await this.requestWakeLock();
    }
  }

  async quickCheck(item: ShoppingListItem): Promise<void> {
    this.isChecking = true;
    try {
      await this.shoppingService.quickCheck(item.id);

      // Check for newly completed categories
      this.checkForCelebrations();
    } catch (error: any) {
      this.snackBar.open(error.message || 'שגיאה', 'סגור', { duration: 2000 });
    } finally {
      this.isChecking = false;
    }
  }

  private checkForCelebrations(): void {
    const currentCompleted = this.shoppingService.completedCategories();

    // Check if list is complete
    if (this.shoppingService.isListComplete()) {
      this.confettiService.celebrateListComplete();
      return;
    }

    // Check if a new category was completed
    const newlyCompleted = currentCompleted.filter(
      cat => !this.previousCompletedCategories.includes(cat)
    );

    if (newlyCompleted.length > 0) {
      this.confettiService.celebrateCategory();
    }

    this.previousCompletedCategories = [...currentCompleted];
  }

  async undo(): Promise<void> {
    try {
      await this.shoppingService.undoLastCheck();
    } catch (error: any) {
      this.snackBar.open(error.message || 'שגיאה', 'סגור', { duration: 2000 });
    }
  }

  async exitSupermarketMode(): Promise<void> {
    await this.shoppingService.exitSupermarketMode();
    await this.releaseWakeLock();
    this.router.navigate(['/app/shopping']);
  }

  async completeShopping(): Promise<void> {
    const dialogRef = this.dialog.open(CompletionDialogComponent, {
      width: '100%',
      maxWidth: '450px',
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (result?.success) {
        await this.exitSupermarketMode();
        this.snackBar.open('קניות הושלמו בהצלחה!', '', { duration: 3000 });
      }
    });
  }

  getCheckedCount(group: CategoryGroup): number {
    return group.items.filter(i => i.checked).length;
  }

  getUnitLabel(unit: string): string {
    return getUnitMeta(unit as any).shortHe;
  }
}
