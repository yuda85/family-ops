import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { ShoppingService } from '../../shopping.service';
import { CatalogService } from '../../catalog.service';
import {
  CatalogItem,
  ShoppingCategory,
  SHOPPING_CATEGORIES,
  AddItemToListData,
} from '../../shopping.models';

interface PendingItem {
  catalogItem?: CatalogItem;
  customName?: string;
  data: AddItemToListData;
}

@Component({
  selector: 'app-item-picker',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatTabsModule,
    MatChipsModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="item-picker">
      <header class="picker-header">
        <h2>הוספת פריטים</h2>
        <button mat-icon-button (click)="cancel()">
          <mat-icon>close</mat-icon>
        </button>
      </header>

      <div class="search-section">
        <mat-form-field appearance="outline" class="search-field">
          <mat-icon matPrefix>search</mat-icon>
          <input
            matInput
            type="text"
            placeholder="חיפוש פריטים..."
            [(ngModel)]="searchQuery"
            (ngModelChange)="onSearchChange($event)"
          />
          @if (searchQuery) {
            <button mat-icon-button matSuffix (click)="clearSearch()">
              <mat-icon>close</mat-icon>
            </button>
          }
        </mat-form-field>
      </div>

      @if (searchQuery) {
        <!-- Search Results -->
        <div class="search-results">
          @if (searchResults().length > 0) {
            <div class="results-list">
              @for (item of searchResults(); track item.id) {
                <button
                  class="item-button"
                  [class.selected]="isItemSelected(item.id)"
                  (click)="toggleItem(item)"
                >
                  <span class="item-name">{{ item.nameHe }}</span>
                  <span class="item-meta">
                    <span class="item-price">₪{{ item.estimatedPrice }}</span>
                    <mat-icon class="add-icon">
                      {{ isItemSelected(item.id) ? 'check' : 'add' }}
                    </mat-icon>
                  </span>
                </button>
              }
            </div>
          } @else {
            <div class="no-results">
              <p>לא נמצאו תוצאות</p>
              <button mat-stroked-button (click)="addCustomItem()">
                <mat-icon>add</mat-icon>
                הוסף "{{ searchQuery }}"
              </button>
            </div>
          }
        </div>
      } @else {
        <!-- Category Tabs -->
        <div class="categories-section">
          <div class="category-chips">
            @for (category of categories; track category.id) {
              <button
                class="category-chip"
                [class.active]="selectedCategory() === category.id"
                (click)="selectCategory(category.id)"
              >
                <mat-icon [style.color]="category.color">{{ category.icon }}</mat-icon>
                <span>{{ category.labelHe }}</span>
              </button>
            }
          </div>

          <div class="category-items">
            @if (categoryItems().length > 0) {
              @for (item of categoryItems(); track item.id) {
                <button
                  class="item-button"
                  [class.selected]="isItemSelected(item.id)"
                  (click)="toggleItem(item)"
                >
                  <span class="item-name">{{ item.nameHe }}</span>
                  <span class="item-meta">
                    <span class="item-price">₪{{ item.estimatedPrice }}</span>
                    <mat-icon class="add-icon">
                      {{ isItemSelected(item.id) ? 'check' : 'add' }}
                    </mat-icon>
                  </span>
                </button>
              }
            } @else {
              <div class="empty-category">
                <mat-icon>inventory_2</mat-icon>
                <p>אין פריטים בקטגוריה זו</p>
              </div>
            }
          </div>
        </div>
      }

      <!-- Footer with selected items and save button -->
      <footer class="picker-footer">
        @if (pendingItems().length > 0) {
          <div class="selected-summary">
            <span>נבחרו {{ pendingItems().length }} פריטים</span>
            <button mat-button color="warn" (click)="clearSelection()">
              <mat-icon>clear_all</mat-icon>
              נקה
            </button>
          </div>
        }
        <div class="footer-actions">
          <button mat-button (click)="cancel()">ביטול</button>
          <button
            mat-flat-button
            color="primary"
            [disabled]="pendingItems().length === 0 || isSaving()"
            (click)="saveItems()"
          >
            @if (isSaving()) {
              <mat-spinner diameter="20"></mat-spinner>
            } @else {
              <mat-icon>add_shopping_cart</mat-icon>
              הוסף לרשימה
            }
          </button>
        </div>
      </footer>
    </div>
  `,
  styles: [`
    .item-picker {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: var(--surface-primary);
    }

    .picker-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem;
      border-bottom: 1px solid var(--border-subtle);

      h2 {
        margin: 0;
        font-size: 1.25rem;
        font-weight: 600;
        color: var(--text-primary);
      }
    }

    .search-section {
      padding: 1rem;
      padding-bottom: 0;
    }

    .search-field {
      width: 100%;

      ::ng-deep {
        .mat-mdc-form-field-subscript-wrapper {
          display: none;
        }

        .mat-mdc-form-field-icon-prefix {
          padding-inline-end: 0.5rem;
          color: var(--text-tertiary);
        }
      }
    }

    .search-results,
    .categories-section {
      flex: 1;
      overflow-y: auto;
      padding: 1rem;
    }

    .results-list,
    .category-items {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .item-button {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
      padding: 0.875rem 1rem;
      background: var(--surface-secondary);
      border: 1px solid var(--border-subtle);
      border-radius: 0.75rem;
      cursor: pointer;
      transition: all 0.15s ease;
      text-align: start;

      &:hover:not(:disabled) {
        background: var(--surface-hover);
        border-color: var(--color-primary);

        .add-icon {
          color: var(--color-primary);
        }
      }

      &.selected {
        background: color-mix(in srgb, var(--color-primary) 15%, var(--surface-secondary));
        border-color: var(--color-primary);

        .add-icon {
          color: var(--color-primary);
        }
      }

      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      .item-name {
        font-size: 0.9375rem;
        color: var(--text-primary);
      }

      .item-meta {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .item-price {
        font-size: 0.75rem;
        color: var(--text-secondary);
      }

      .add-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
        color: var(--text-tertiary);
        transition: color 0.15s ease;
      }
    }

    .no-results {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      gap: 1rem;

      p {
        color: var(--text-secondary);
        margin: 0;
      }
    }

    .category-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-bottom: 1rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid var(--border-subtle);
    }

    .category-chip {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.5rem 0.75rem;
      background: var(--surface-secondary);
      border: 1px solid var(--border-subtle);
      border-radius: 9999px;
      cursor: pointer;
      transition: all 0.15s ease;
      font-size: 0.8125rem;
      color: var(--text-secondary);

      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }

      &:hover {
        background: var(--surface-hover);
      }

      &.active {
        background: var(--color-primary-alpha);
        border-color: var(--color-primary);
        color: var(--color-primary);
      }
    }

    .empty-category {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3rem;
      gap: 0.5rem;
      color: var(--text-tertiary);

      mat-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
      }

      p {
        margin: 0;
      }
    }

    .picker-footer {
      padding: 1rem;
      border-top: 1px solid var(--border-subtle);
      background: var(--surface-secondary);
    }

    .selected-summary {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.75rem;
      font-size: 0.875rem;
      color: var(--text-secondary);

      button {
        mat-icon {
          font-size: 18px;
          width: 18px;
          height: 18px;
          margin-inline-end: 0.25rem;
        }
      }
    }

    .footer-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;

      button {
        mat-icon {
          margin-inline-end: 0.5rem;
        }

        mat-spinner {
          margin-inline-end: 0.5rem;
        }
      }
    }
  `]
})
export class ItemPickerComponent {
  private dialogRef = inject(MatDialogRef<ItemPickerComponent>);
  private shoppingService = inject(ShoppingService);
  private catalogService = inject(CatalogService);
  private snackBar = inject(MatSnackBar);

  categories = SHOPPING_CATEGORIES;
  searchQuery = '';
  selectedCategory = signal<ShoppingCategory>('vegetables');
  searchResults = signal<CatalogItem[]>([]);
  pendingItems = signal<PendingItem[]>([]);
  isSaving = signal(false);

  // Track selected item IDs for UI
  private selectedIds = signal<Set<string>>(new Set());

  categoryItems = computed(() => {
    return this.catalogService.getItemsByCategory(this.selectedCategory());
  });

  onSearchChange(query: string): void {
    if (!query || query.trim().length === 0) {
      this.searchResults.set([]);
      return;
    }

    const results = this.catalogService.searchItems(query);
    this.searchResults.set(results);
  }

  selectCategory(category: ShoppingCategory): void {
    this.selectedCategory.set(category);
  }

  isItemSelected(catalogItemId: string): boolean {
    return this.selectedIds().has(catalogItemId);
  }

  toggleItem(item: CatalogItem): void {
    const ids = this.selectedIds();

    if (ids.has(item.id)) {
      // Remove from selection
      const newIds = new Set(ids);
      newIds.delete(item.id);
      this.selectedIds.set(newIds);

      this.pendingItems.update(items =>
        items.filter(i => i.data.catalogItemId !== item.id)
      );
    } else {
      // Add to selection
      const newIds = new Set(ids);
      newIds.add(item.id);
      this.selectedIds.set(newIds);

      this.pendingItems.update(items => [
        ...items,
        {
          catalogItem: item,
          data: {
            catalogItemId: item.id,
            name: item.nameHe,
            category: item.category,
            quantity: item.defaultQuantity,
            unit: item.defaultUnit,
            estimatedPrice: item.estimatedPrice,
          }
        }
      ]);
    }
  }

  addCustomItem(): void {
    if (!this.searchQuery || this.searchQuery.trim().length === 0) {
      return;
    }

    const name = this.searchQuery.trim();
    const category = this.catalogService.categorizeItem(name);

    // Check if custom item with same name already exists
    const exists = this.pendingItems().some(i => i.customName === name);
    if (exists) {
      this.snackBar.open('פריט זה כבר ברשימה', '', { duration: 2000 });
      return;
    }

    this.pendingItems.update(items => [
      ...items,
      {
        customName: name,
        data: {
          name,
          category,
          quantity: 1,
          unit: 'units',
          estimatedPrice: 0,
        }
      }
    ]);

    this.clearSearch();
    this.snackBar.open(`"${name}" נוסף לרשימה`, '', { duration: 2000 });
  }

  clearSelection(): void {
    this.pendingItems.set([]);
    this.selectedIds.set(new Set());
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.searchResults.set([]);
  }

  async saveItems(): Promise<void> {
    const items = this.pendingItems();
    if (items.length === 0) return;

    this.isSaving.set(true);

    try {
      // Add all items to the shopping list
      for (const item of items) {
        await this.shoppingService.addItem(item.data);
      }

      this.snackBar.open(`נוספו ${items.length} פריטים לרשימה`, '', { duration: 3000 });
      this.dialogRef.close(true);
    } catch (error: any) {
      this.snackBar.open(error.message || 'שגיאה בהוספת פריטים', 'סגור', { duration: 3000 });
    } finally {
      this.isSaving.set(false);
    }
  }

  cancel(): void {
    this.dialogRef.close(false);
  }
}
