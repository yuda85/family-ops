import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { ShoppingService } from '../shopping.service';
import { CatalogService } from '../catalog.service';
import { ShoppingListItem, CategoryGroup, getUnitMeta } from '../shopping.models';
import { ItemPickerComponent } from '../components/item-picker/item-picker.component';
import { QuickAddComponent } from '../components/quick-add/quick-add.component';

@Component({
  selector: 'app-list-view',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatChipsModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    EmptyStateComponent,
    QuickAddComponent,
  ],
  template: `
    <div class="shopping-page">
      <header class="page-header">
        <div class="header-top">
          <h1>רשימת קניות</h1>
          <div class="header-actions">
            <button mat-stroked-button routerLink="staples">
              <mat-icon>star</mat-icon>
              מועדפים
            </button>
            @if (shoppingService.hasItems()) {
              <button mat-flat-button color="primary" routerLink="supermarket/main">
                <mat-icon>shopping_basket</mat-icon>
                מצב סופר
              </button>
            }
          </div>
        </div>

        @if (shoppingService.hasItems()) {
          <div class="progress-section">
            <div class="progress-bar">
              <div class="progress" [style.width.%]="shoppingService.progress()"></div>
            </div>
            <div class="progress-info">
              <span class="progress-text">{{ shoppingService.checkedCount() }} מתוך {{ shoppingService.totalCount() }} פריטים</span>
              <span class="estimated-total">סה"כ משוער: ₪{{ shoppingService.estimatedTotal() | number:'1.0-0' }}</span>
            </div>
          </div>
        }
      </header>

      <!-- Add Items Bar - Always visible -->
      @if (!shoppingService.isLoading()) {
        <div class="add-items-bar">
          <app-quick-add (itemAdded)="onItemAdded($any($event))"></app-quick-add>
          <button mat-flat-button color="primary" class="catalog-btn" (click)="openCatalog()">
            <mat-icon>list_alt</mat-icon>
            קטלוג
          </button>
        </div>
      }

      @if (shoppingService.isLoading()) {
        <div class="loading-container">
          <mat-spinner diameter="40"></mat-spinner>
          <p>טוען רשימה...</p>
        </div>
      } @else if (shoppingService.hasItems()) {
        <div class="category-groups">
          @for (group of shoppingService.groupedItems(); track group.category) {
            <div class="category-group" [class.collapsed]="group.isCollapsed" [class.complete]="group.isComplete">
              <button class="category-header" (click)="toggleCategory(group)">
                <div class="category-info">
                  <mat-icon [style.color]="group.categoryMeta.color">{{ group.categoryMeta.icon }}</mat-icon>
                  <span class="category-name">{{ group.categoryMeta.labelHe }}</span>
                  <span class="category-count" [class.all-checked]="group.isComplete">
                    {{ getCheckedCount(group) }}/{{ group.items.length }}
                  </span>
                </div>
                <mat-icon class="chevron">
                  {{ group.isCollapsed ? 'expand_more' : 'expand_less' }}
                </mat-icon>
              </button>

              @if (!group.isCollapsed) {
                <div class="items-list">
                  @for (item of group.items; track item.id) {
                    <div class="shopping-item" [class.checked]="item.checked">
                      <mat-checkbox
                        [checked]="item.checked"
                        (change)="toggleItem(item)"
                        color="primary"
                      ></mat-checkbox>
                      <div class="item-content">
                        <span class="item-name">{{ item.name }}</span>
                        @if (item.quantity && item.quantity > 0) {
                          <span class="item-quantity">{{ item.quantity }} {{ getUnitLabel(item.unit) }}</span>
                        }
                        @if (item.estimatedPrice > 0) {
                          <span class="item-price">₪{{ item.estimatedPrice * item.quantity | number:'1.0-0' }}</span>
                        }
                      </div>
                      <button mat-icon-button class="delete-btn" (click)="removeItem(item)">
                        <mat-icon>close</mat-icon>
                      </button>
                    </div>
                  }
                </div>
              }
            </div>
          }
        </div>

        @if (shoppingService.hasCheckedItems()) {
          <button mat-button class="clear-checked" (click)="clearChecked()">
            <mat-icon>delete_sweep</mat-icon>
            נקה פריטים מסומנים
          </button>
        }
      } @else {
        <app-empty-state
          icon="shopping_cart"
          title="הרשימה ריקה"
          description="השתמשו בשורת החיפוש למעלה או לחצו על 'קטלוג' להוספת פריטים"
        ></app-empty-state>
      }
    </div>
  `,
  styles: [`
    .shopping-page {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .add-items-bar {
      display: flex;
      gap: 0.5rem;
      align-items: stretch;

      app-quick-add {
        flex: 1;
      }

      .catalog-btn {
        flex-shrink: 0;
        height: 56px;

        mat-icon {
          margin-inline-end: 0.25rem;
        }

        @media (max-width: 480px) {
          min-width: auto;
          padding: 0 0.75rem;

          mat-icon {
            margin-inline-end: 0;
          }

          // Hide text on small screens
          span:not(.mat-mdc-button-touch-target) {
            display: none;
          }
        }
      }
    }

    .page-header {
      .header-top {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 1rem;
        flex-wrap: wrap;

        h1 {
          font-size: 1.5rem;
          font-weight: 700;
          margin: 0;
          color: var(--text-primary);
        }
      }

      .header-actions {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;

        @media (max-width: 480px) {
          button {
            font-size: 0.75rem;
            padding: 0 0.75rem;

            mat-icon {
              font-size: 18px;
              width: 18px;
              height: 18px;
            }
          }
        }
      }
    }

    .progress-section {
      margin-top: 1rem;
    }

    .progress-bar {
      height: 8px;
      background: var(--surface-secondary);
      border-radius: 4px;
      overflow: hidden;

      .progress {
        height: 100%;
        background: var(--color-primary);
        transition: width 0.3s ease;
        border-radius: 4px;
      }
    }

    .progress-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 0.5rem;
    }

    .progress-text {
      font-size: 0.75rem;
      color: var(--text-secondary);
    }

    .estimated-total {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--color-primary);
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

    .category-groups {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .category-group {
      background: var(--surface-primary);
      border: 1px solid var(--border-subtle);
      border-radius: 1rem;
      overflow: hidden;
      transition: all 0.2s ease;

      &.complete {
        border-color: var(--color-success);
        background: color-mix(in srgb, var(--color-success) 5%, var(--surface-primary));
      }
    }

    .category-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
      padding: 1rem;
      background: var(--surface-secondary);
      border: none;
      cursor: pointer;
      transition: background 0.15s ease;

      &:hover {
        background: var(--surface-hover);
      }

      .category-info {
        display: flex;
        align-items: center;
        gap: 0.75rem;

        mat-icon {
          font-size: 24px;
          width: 24px;
          height: 24px;
        }

        .category-name {
          font-weight: 600;
          color: var(--text-primary);
        }

        .category-count {
          background: var(--surface-tertiary);
          color: var(--text-secondary);
          padding: 0.125rem 0.5rem;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 500;

          &.all-checked {
            background: var(--color-success);
            color: white;
          }
        }
      }

      .chevron {
        color: var(--text-tertiary);
      }
    }

    .items-list {
      padding: 0.5rem;
    }

    .shopping-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem;
      border-radius: 0.75rem;
      transition: all 0.15s ease;

      &:hover {
        background: var(--surface-hover);

        .delete-btn {
          opacity: 1;
        }
      }

      &.checked {
        .item-name {
          text-decoration: line-through;
          color: var(--text-tertiary);
        }

        .item-price {
          color: var(--text-tertiary);
        }
      }

      .item-content {
        flex: 1;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        flex-wrap: wrap;
      }

      .item-name {
        font-size: 0.9375rem;
        color: var(--text-primary);
      }

      .item-quantity {
        font-size: 0.75rem;
        color: var(--text-secondary);
        background: var(--surface-secondary);
        padding: 0.125rem 0.5rem;
        border-radius: 0.5rem;
      }

      .item-price {
        font-size: 0.75rem;
        color: var(--color-primary);
        font-weight: 500;
        margin-inline-start: auto;
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
    }

    .clear-checked {
      display: flex;
      margin: 0 auto;
      color: var(--text-secondary);

      mat-icon {
        margin-inline-end: 0.5rem;
      }
    }
  `]
})
export class ListViewComponent implements OnInit {
  shoppingService = inject(ShoppingService);
  private catalogService = inject(CatalogService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  async ngOnInit(): Promise<void> {
    // Load catalog first, then shopping list - await both to ensure list is ready
    await this.catalogService.loadCatalog();
    await this.shoppingService.loadActiveList();
  }

  toggleCategory(group: CategoryGroup): void {
    this.shoppingService.toggleCategory(group.category);
  }

  async toggleItem(item: ShoppingListItem): Promise<void> {
    try {
      await this.shoppingService.toggleItem(item.id);
    } catch (error: any) {
      this.snackBar.open(error.message || 'שגיאה', 'סגור', { duration: 3000 });
    }
  }

  async removeItem(item: ShoppingListItem): Promise<void> {
    try {
      await this.shoppingService.removeItem(item.id);
    } catch (error: any) {
      this.snackBar.open(error.message || 'שגיאה', 'סגור', { duration: 3000 });
    }
  }

  async clearChecked(): Promise<void> {
    try {
      await this.shoppingService.clearCheckedItems();
      this.snackBar.open('פריטים מסומנים נמחקו', '', { duration: 2000 });
    } catch (error: any) {
      this.snackBar.open(error.message || 'שגיאה', 'סגור', { duration: 3000 });
    }
  }

  openCatalog(): void {
    const dialogRef = this.dialog.open(ItemPickerComponent, {
      width: '100%',
      maxWidth: '600px',
      height: '80vh',
      panelClass: 'item-picker-dialog',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        // Items were added
      }
    });
  }

  onItemAdded(itemName: string): void {
    this.snackBar.open(`${itemName} נוסף לרשימה`, '', { duration: 2000 });
  }

  getUnitLabel(unit: string): string {
    return getUnitMeta(unit as any).shortHe;
  }

  getCheckedCount(group: CategoryGroup): number {
    return group.items.filter(i => i.checked).length;
  }
}
