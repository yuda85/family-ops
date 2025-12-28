import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { FavoritesService } from '../favorites.service';
import { CatalogService } from '../catalog.service';
import { ItemPickerComponent } from '../components/item-picker/item-picker.component';
import { getCategoryMeta, getUnitMeta } from '../shopping.models';

@Component({
  selector: 'app-staples',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    EmptyStateComponent,
  ],
  template: `
    <div class="staples-page">
      <header class="page-header">
        <div class="header-top">
          <button mat-icon-button routerLink="../">
            <mat-icon>arrow_forward</mat-icon>
          </button>
          <h1>מועדפים</h1>
        </div>

        @if (favoritesService.favoritesWithDetails().length > 0) {
          <button
            mat-flat-button
            color="primary"
            class="add-all-btn"
            (click)="addAllToList()"
            [disabled]="isAddingAll"
          >
            <mat-icon>playlist_add</mat-icon>
            הוסף הכל לרשימה
          </button>
        }
      </header>

      @if (favoritesService.isLoading()) {
        <div class="loading-container">
          <mat-spinner diameter="40"></mat-spinner>
          <p>טוען מועדפים...</p>
        </div>
      } @else if (favoritesService.favoritesWithDetails().length > 0) {
        <div class="favorites-list">
          @for (item of favoritesService.favoritesWithDetails(); track item.favorite.id) {
            <div class="favorite-item">
              <div class="item-info">
                <mat-icon [style.color]="getCategoryColor(item.catalogItem.category)">
                  {{ getCategoryIcon(item.catalogItem.category) }}
                </mat-icon>
                <div class="item-details">
                  <span class="item-name">{{ item.catalogItem.nameHe }}</span>
                  <span class="item-meta">
                    {{ item.favorite.customQuantity ?? item.catalogItem.defaultQuantity }}
                    {{ getUnitLabel(item.favorite.customUnit ?? item.catalogItem.defaultUnit) }}
                    · ₪{{ item.catalogItem.estimatedPrice }}
                  </span>
                </div>
              </div>
              <div class="item-actions">
                <button
                  mat-icon-button
                  (click)="addToList(item.catalogItem.id)"
                  [disabled]="isAdding === item.catalogItem.id"
                >
                  <mat-icon>add_shopping_cart</mat-icon>
                </button>
                <button
                  mat-icon-button
                  (click)="removeFavorite(item.catalogItem.id)"
                  class="remove-btn"
                >
                  <mat-icon>star</mat-icon>
                </button>
              </div>
            </div>
          }
        </div>

        <p class="usage-hint">
          <mat-icon>info</mat-icon>
          לחץ על כוכב בקטלוג כדי להוסיף פריטים למועדפים
        </p>
      } @else {
        <app-empty-state
          icon="star_border"
          title="אין מועדפים"
          description="הוסיפו מוצרים שאתם קונים באופן קבוע"
          actionLabel="בחר מוצרים"
          actionIcon="add"
          (action)="openCatalog()"
        ></app-empty-state>
      }
    </div>
  `,
  styles: [`
    .staples-page {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .page-header {
      .header-top {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 1rem;

        h1 {
          font-size: 1.5rem;
          font-weight: 700;
          margin: 0;
          color: var(--text-primary);
        }
      }

      .add-all-btn {
        width: 100%;

        mat-icon {
          margin-inline-end: 0.5rem;
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

    .favorites-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .favorite-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem 1rem;
      background: var(--surface-primary);
      border: 1px solid var(--border-subtle);
      border-radius: 0.75rem;
      transition: all 0.15s ease;

      &:hover {
        background: var(--surface-hover);
      }

      .item-info {
        display: flex;
        align-items: center;
        gap: 0.75rem;

        mat-icon {
          font-size: 24px;
          width: 24px;
          height: 24px;
        }
      }

      .item-details {
        display: flex;
        flex-direction: column;
        gap: 0.125rem;
      }

      .item-name {
        font-size: 0.9375rem;
        color: var(--text-primary);
        font-weight: 500;
      }

      .item-meta {
        font-size: 0.75rem;
        color: var(--text-secondary);
      }

      .item-actions {
        display: flex;
        gap: 0.25rem;
      }

      .remove-btn {
        color: #ffc107;

        &:hover {
          color: var(--text-tertiary);
        }
      }
    }

    .usage-hint {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 1rem;
      margin: 0;
      color: var(--text-tertiary);
      font-size: 0.8125rem;
      text-align: center;

      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }
    }
  `]
})
export class StaplesComponent implements OnInit {
  favoritesService = inject(FavoritesService);
  private catalogService = inject(CatalogService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  isAdding: string | null = null;
  isAddingAll = false;

  ngOnInit(): void {
    // Load catalog first if not loaded
    if (!this.catalogService.isLoaded()) {
      this.catalogService.loadCatalog().then(() => {
        this.favoritesService.loadFavorites();
      });
    } else {
      this.favoritesService.loadFavorites();
    }
  }

  async addToList(catalogItemId: string): Promise<void> {
    this.isAdding = catalogItemId;
    try {
      await this.favoritesService.addFavoriteToList(catalogItemId);
      this.snackBar.open('נוסף לרשימה', '', { duration: 2000 });
    } catch (error: any) {
      this.snackBar.open(error.message || 'שגיאה', 'סגור', { duration: 3000 });
    } finally {
      this.isAdding = null;
    }
  }

  async addAllToList(): Promise<void> {
    this.isAddingAll = true;
    try {
      const count = await this.favoritesService.addAllFavoritesToList();
      this.snackBar.open(`נוספו ${count} פריטים לרשימה`, '', { duration: 2000 });
    } catch (error: any) {
      this.snackBar.open(error.message || 'שגיאה', 'סגור', { duration: 3000 });
    } finally {
      this.isAddingAll = false;
    }
  }

  async removeFavorite(catalogItemId: string): Promise<void> {
    try {
      await this.favoritesService.removeFavorite(catalogItemId);
      this.snackBar.open('הוסר מהמועדפים', '', { duration: 2000 });
    } catch (error: any) {
      this.snackBar.open(error.message || 'שגיאה', 'סגור', { duration: 3000 });
    }
  }

  openCatalog(): void {
    this.dialog.open(ItemPickerComponent, {
      width: '100%',
      maxWidth: '600px',
      height: '80vh',
      panelClass: 'item-picker-dialog',
    });
  }

  getCategoryIcon(category: string): string {
    return getCategoryMeta(category as any).icon;
  }

  getCategoryColor(category: string): string {
    return getCategoryMeta(category as any).color;
  }

  getUnitLabel(unit: string): string {
    return getUnitMeta(unit as any).shortHe;
  }
}
