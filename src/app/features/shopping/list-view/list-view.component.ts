import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';

import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';

interface ShoppingItem {
  id: string;
  name: string;
  category: string;
  quantity?: number;
  unit?: string;
  checked: boolean;
}

interface CategoryGroup {
  category: string;
  categoryLabel: string;
  items: ShoppingItem[];
  isCollapsed: boolean;
}

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
    EmptyStateComponent,
  ],
  template: `
    <div class="shopping-page">
      <header class="page-header">
        <div class="header-top">
          <h1>רשימת קניות</h1>
          <div class="header-actions">
            <button mat-stroked-button routerLink="staples">
              <mat-icon>star</mat-icon>
              מוצרים קבועים
            </button>
            @if (hasItems()) {
              <button mat-flat-button color="primary" routerLink="supermarket/main">
                <mat-icon>shopping_basket</mat-icon>
                מצב סופר
              </button>
            }
          </div>
        </div>

        @if (hasItems()) {
          <div class="progress-bar">
            <div class="progress" [style.width.%]="getProgress()"></div>
          </div>
          <p class="progress-text">{{ getCheckedCount() }} מתוך {{ getTotalCount() }} פריטים</p>
        }
      </header>

      @if (hasItems()) {
        <div class="category-groups">
          @for (group of categoryGroups(); track group.category) {
            <div class="category-group" [class.collapsed]="group.isCollapsed">
              <button class="category-header" (click)="toggleCategory(group)">
                <div class="category-info">
                  <mat-icon>{{ getCategoryIcon(group.category) }}</mat-icon>
                  <span class="category-name">{{ group.categoryLabel }}</span>
                  <span class="category-count">{{ group.items.length }}</span>
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
                      <span class="item-name">{{ item.name }}</span>
                      @if (item.quantity) {
                        <span class="item-quantity">{{ item.quantity }} {{ item.unit ?? '' }}</span>
                      }
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

        @if (getCheckedCount() > 0) {
          <button mat-button class="clear-checked" (click)="clearChecked()">
            <mat-icon>delete_sweep</mat-icon>
            נקה פריטים מסומנים
          </button>
        }
      } @else {
        <app-empty-state
          icon="shopping_cart"
          title="הרשימה ריקה"
          description="הוסיפו פריטים לרשימת הקניות שלכם"
          actionLabel="הוסף פריטים"
          actionIcon="add"
          (action)="openCatalog()"
        ></app-empty-state>
      }

      <button class="fab" mat-fab color="primary" (click)="openCatalog()">
        <mat-icon>add</mat-icon>
      </button>
    </div>
  `,
  styles: [`
    .shopping-page {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      padding-bottom: 80px;
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

    .progress-bar {
      height: 8px;
      background: var(--surface-secondary);
      border-radius: 4px;
      overflow: hidden;
      margin-top: 1rem;

      .progress {
        height: 100%;
        background: var(--color-primary);
        transition: width 0.3s ease;
        border-radius: 4px;
      }
    }

    .progress-text {
      font-size: 0.75rem;
      color: var(--text-secondary);
      margin: 0.5rem 0 0;
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
          color: var(--color-primary);
        }

        .category-name {
          font-weight: 600;
          color: var(--text-primary);
        }

        .category-count {
          background: var(--color-primary-alpha);
          color: var(--color-primary);
          padding: 0.125rem 0.5rem;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 500;
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
      }

      .item-name {
        flex: 1;
        font-size: 0.9375rem;
        color: var(--text-primary);
      }

      .item-quantity {
        font-size: 0.75rem;
        color: var(--text-secondary);
        background: var(--surface-secondary);
        padding: 0.25rem 0.5rem;
        border-radius: 0.5rem;
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

    .fab {
      position: fixed;
      bottom: calc(64px + 1rem);
      inset-inline-end: 1rem;
      z-index: 100;

      @media (min-width: 768px) {
        bottom: 1.5rem;
        inset-inline-end: 1.5rem;
      }
    }
  `]
})
export class ListViewComponent {
  // Demo data
  categoryGroups = signal<CategoryGroup[]>([
    {
      category: 'vegetables',
      categoryLabel: 'ירקות',
      isCollapsed: false,
      items: [
        { id: '1', name: 'עגבניות', category: 'vegetables', quantity: 1, unit: 'ק"ג', checked: false },
        { id: '2', name: 'מלפפונים', category: 'vegetables', quantity: 6, checked: true },
        { id: '3', name: 'גזר', category: 'vegetables', checked: false },
      ],
    },
    {
      category: 'dairy',
      categoryLabel: 'מוצרי חלב',
      isCollapsed: false,
      items: [
        { id: '4', name: 'חלב', category: 'dairy', quantity: 2, unit: 'ליטר', checked: false },
        { id: '5', name: 'גבינה צהובה', category: 'dairy', checked: false },
      ],
    },
    {
      category: 'pantry',
      categoryLabel: 'מזווה',
      isCollapsed: true,
      items: [
        { id: '6', name: 'אורז', category: 'pantry', quantity: 1, unit: 'ק"ג', checked: false },
        { id: '7', name: 'שמן זית', category: 'pantry', checked: true },
      ],
    },
  ]);

  categoryIcons: Record<string, string> = {
    vegetables: 'eco',
    fruits: 'nutrition',
    dairy: 'egg_alt',
    meat: 'kebab_dining',
    pantry: 'kitchen',
    frozen: 'ac_unit',
    cleaning: 'cleaning_services',
    personal: 'spa',
    baby: 'child_care',
    snacks: 'cookie',
    drinks: 'local_bar',
    other: 'more_horiz',
  };

  hasItems(): boolean {
    return this.categoryGroups().some(g => g.items.length > 0);
  }

  getTotalCount(): number {
    return this.categoryGroups().reduce((sum, g) => sum + g.items.length, 0);
  }

  getCheckedCount(): number {
    return this.categoryGroups().reduce(
      (sum, g) => sum + g.items.filter(i => i.checked).length,
      0
    );
  }

  getProgress(): number {
    const total = this.getTotalCount();
    if (total === 0) return 0;
    return (this.getCheckedCount() / total) * 100;
  }

  getCategoryIcon(category: string): string {
    return this.categoryIcons[category] ?? 'inventory_2';
  }

  toggleCategory(group: CategoryGroup): void {
    this.categoryGroups.update(groups =>
      groups.map(g =>
        g.category === group.category ? { ...g, isCollapsed: !g.isCollapsed } : g
      )
    );
  }

  toggleItem(item: ShoppingItem): void {
    this.categoryGroups.update(groups =>
      groups.map(g => ({
        ...g,
        items: g.items.map(i =>
          i.id === item.id ? { ...i, checked: !i.checked } : i
        ),
      }))
    );
  }

  removeItem(item: ShoppingItem): void {
    this.categoryGroups.update(groups =>
      groups.map(g => ({
        ...g,
        items: g.items.filter(i => i.id !== item.id),
      })).filter(g => g.items.length > 0)
    );
  }

  clearChecked(): void {
    this.categoryGroups.update(groups =>
      groups.map(g => ({
        ...g,
        items: g.items.filter(i => !i.checked),
      })).filter(g => g.items.length > 0)
    );
  }

  openCatalog(): void {
    // TODO: Open catalog picker dialog
    console.log('Open catalog picker');
  }
}
