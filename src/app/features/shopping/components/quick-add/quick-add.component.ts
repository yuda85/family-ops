import { Component, inject, signal, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatSnackBar } from '@angular/material/snack-bar';

import { ShoppingService } from '../../shopping.service';
import { CatalogService } from '../../catalog.service';
import { CatalogItem } from '../../shopping.models';

@Component({
  selector: 'app-quick-add',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatAutocompleteModule,
  ],
  template: `
    <div class="quick-add-container">
      <mat-form-field appearance="outline" class="quick-add-field">
        <mat-icon matPrefix>add_shopping_cart</mat-icon>
        <input
          matInput
          type="text"
          placeholder="הוסף פריט..."
          [(ngModel)]="searchQuery"
          (ngModelChange)="onSearchChange($event)"
          (keydown.enter)="onEnter()"
          [matAutocomplete]="auto"
        />
        <mat-autocomplete
          #auto="matAutocomplete"
          (optionSelected)="onOptionSelected($event)"
          class="quick-add-autocomplete"
        >
          @for (item of suggestions(); track item.id) {
            <mat-option [value]="item">
              <div class="suggestion-item">
                <span class="suggestion-name">{{ item.nameHe }}</span>
                <span class="suggestion-price">₪{{ item.estimatedPrice }}</span>
              </div>
            </mat-option>
          }
          @if (searchQuery && suggestions().length === 0 && !isLoading()) {
            <mat-option disabled>
              <span class="no-results">לחץ Enter להוספת "{{ searchQuery }}"</span>
            </mat-option>
          }
        </mat-autocomplete>
        @if (searchQuery) {
          <button mat-icon-button matSuffix (click)="clearSearch()">
            <mat-icon>close</mat-icon>
          </button>
        }
      </mat-form-field>
    </div>
  `,
  styles: [`
    .quick-add-container {
      width: 100%;
    }

    .quick-add-field {
      width: 100%;

      ::ng-deep {
        .mat-mdc-form-field-subscript-wrapper {
          display: none;
        }

        .mdc-text-field--outlined {
          background: var(--surface-primary);
        }

        .mat-mdc-form-field-icon-prefix {
          padding-inline-end: 0.5rem;
          color: var(--text-tertiary);
        }

        .mat-mdc-form-field-icon-suffix {
          padding-inline-start: 0.25rem;
        }
      }
    }

    .suggestion-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
      gap: 1rem;

      .suggestion-name {
        flex: 1;
      }

      .suggestion-price {
        font-size: 0.75rem;
        color: var(--text-secondary);
      }
    }

    .no-results {
      color: var(--text-secondary);
      font-size: 0.875rem;
    }
  `]
})
export class QuickAddComponent {
  private shoppingService = inject(ShoppingService);
  private catalogService = inject(CatalogService);
  private snackBar = inject(MatSnackBar);

  @Output() itemAdded = new EventEmitter<string>();

  searchQuery = '';
  suggestions = signal<CatalogItem[]>([]);
  isLoading = signal(false);

  onSearchChange(query: string): void {
    if (!query || query.trim().length === 0) {
      this.suggestions.set([]);
      return;
    }

    const results = this.catalogService.searchItems(query);
    this.suggestions.set(results.slice(0, 8)); // Limit to 8 suggestions
  }

  async onOptionSelected(event: any): Promise<void> {
    const item = event.option.value as CatalogItem;
    await this.addItemFromCatalog(item);
    this.clearSearch();
  }

  async onEnter(): Promise<void> {
    if (!this.searchQuery || this.searchQuery.trim().length === 0) {
      return;
    }

    // Check if there's a matching catalog item
    const suggestions = this.suggestions();
    if (suggestions.length > 0) {
      // Add the first suggestion
      await this.addItemFromCatalog(suggestions[0]);
    } else {
      // Add as custom item
      await this.addCustomItem(this.searchQuery.trim());
    }

    this.clearSearch();
  }

  private async addItemFromCatalog(item: CatalogItem): Promise<void> {
    this.isLoading.set(true);
    try {
      await this.shoppingService.addItem({
        catalogItemId: item.id,
        name: item.nameHe,
        category: item.category,
        quantity: item.defaultQuantity,
        unit: item.defaultUnit,
        estimatedPrice: item.estimatedPrice,
      });
      this.itemAdded.emit(item.nameHe);
    } catch (error: any) {
      this.snackBar.open(error.message || 'שגיאה בהוספת פריט', 'סגור', { duration: 3000 });
    } finally {
      this.isLoading.set(false);
    }
  }

  private async addCustomItem(name: string): Promise<void> {
    this.isLoading.set(true);
    try {
      // Smart categorize the item
      const category = this.catalogService.categorizeItem(name);

      await this.shoppingService.addItem({
        name,
        category,
        quantity: 1,
        unit: 'units',
        estimatedPrice: 0, // Unknown price for custom items
      });
      this.itemAdded.emit(name);
    } catch (error: any) {
      this.snackBar.open(error.message || 'שגיאה בהוספת פריט', 'סגור', { duration: 3000 });
    } finally {
      this.isLoading.set(false);
    }
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.suggestions.set([]);
  }
}
