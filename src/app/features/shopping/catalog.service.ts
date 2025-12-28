import { Injectable, inject, signal, computed } from '@angular/core';
import { Timestamp } from 'firebase/firestore';
import { FirestoreService } from '../../core/firebase/firestore.service';
import { AuthService } from '../../core/auth/auth.service';
import { FamilyService } from '../../core/family/family.service';
import {
  CatalogItem,
  ShoppingCategory,
  SHOPPING_CATEGORIES,
} from './shopping.models';
import { DEFAULT_CATALOG_ITEMS, CATEGORY_KEYWORDS } from './catalog-data';

@Injectable({
  providedIn: 'root',
})
export class CatalogService {
  private firestoreService = inject(FirestoreService);
  private authService = inject(AuthService);
  private familyService = inject(FamilyService);

  // Private signals
  private _catalogItems = signal<CatalogItem[]>([]);
  private _isLoading = signal(false);
  private _isLoaded = signal(false);
  private _error = signal<string | null>(null);

  // Public readonly signals
  readonly catalogItems = this._catalogItems.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly isLoaded = this._isLoaded.asReadonly();
  readonly error = this._error.asReadonly();

  /**
   * Catalog items grouped by category
   */
  readonly itemsByCategory = computed(() => {
    const items = this._catalogItems();
    const grouped = new Map<ShoppingCategory, CatalogItem[]>();

    for (const item of items) {
      const existing = grouped.get(item.category) || [];
      existing.push(item);
      grouped.set(item.category, existing);
    }

    // Sort items in each category alphabetically
    for (const [category, categoryItems] of grouped.entries()) {
      categoryItems.sort((a, b) => a.nameHe.localeCompare(b.nameHe, 'he'));
    }

    return grouped;
  });

  /**
   * Get catalog items for a specific category
   */
  getItemsByCategory(category: ShoppingCategory): CatalogItem[] {
    return this.itemsByCategory().get(category) || [];
  }

  /**
   * Get a single catalog item by ID
   */
  getCatalogItem(id: string): CatalogItem | undefined {
    return this._catalogItems().find((item) => item.id === id);
  }

  /**
   * Load the family's catalog from Firestore
   * Seeds the catalog if it doesn't exist
   */
  async loadCatalog(): Promise<void> {
    const familyId = this.familyService.familyId();
    if (!familyId) {
      this._catalogItems.set([]);
      return;
    }

    // Don't reload if already loaded for this family
    if (this._isLoaded()) {
      return;
    }

    this._isLoading.set(true);
    this._error.set(null);

    try {
      // Try to load existing catalog
      const items = await this.firestoreService.getCollection<CatalogItem>(
        `families/${familyId}/catalog`
      );

      if (items.length === 0) {
        // Seed the catalog with default items
        await this.seedCatalog();
        // Reload after seeding
        const seededItems = await this.firestoreService.getCollection<CatalogItem>(
          `families/${familyId}/catalog`
        );
        this._catalogItems.set(seededItems);
      } else {
        this._catalogItems.set(items);
      }

      this._isLoaded.set(true);
    } catch (error: any) {
      console.error('Error loading catalog:', error);
      this._error.set('שגיאה בטעינת הקטלוג');
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Seed the family's catalog with default items
   */
  async seedCatalog(): Promise<void> {
    const familyId = this.familyService.familyId();
    if (!familyId) {
      throw new Error('אין משפחה פעילה');
    }

    console.log('Seeding catalog with', DEFAULT_CATALOG_ITEMS.length, 'items...');

    // Batch write all items
    const batchSize = 500; // Firestore limit
    for (let i = 0; i < DEFAULT_CATALOG_ITEMS.length; i += batchSize) {
      const batch = DEFAULT_CATALOG_ITEMS.slice(i, i + batchSize);
      const operations = batch.map((item) => ({
        type: 'set' as const,
        path: `families/${familyId}/catalog/${item.id}`,
        data: {
          ...item,
          lastPriceUpdate: null,
          lastPriceUpdatedBy: null,
        },
      }));

      await this.firestoreService.batchWrite(operations);
    }

    console.log('Catalog seeded successfully');
  }

  /**
   * Search catalog items by name or keywords
   */
  searchItems(query: string): CatalogItem[] {
    if (!query || query.trim().length === 0) {
      return [];
    }

    const normalizedQuery = query.trim().toLowerCase();
    const items = this._catalogItems();

    // Score-based search
    const scored = items
      .map((item) => {
        let score = 0;

        // Exact name match (highest score)
        if (item.nameHe.toLowerCase() === normalizedQuery) {
          score = 100;
        }
        // Name starts with query
        else if (item.nameHe.toLowerCase().startsWith(normalizedQuery)) {
          score = 80;
        }
        // Name contains query
        else if (item.nameHe.toLowerCase().includes(normalizedQuery)) {
          score = 60;
        }
        // Keywords match
        else if (item.keywords.some((kw) => kw.toLowerCase().includes(normalizedQuery))) {
          score = 40;
        }

        return { item, score };
      })
      .filter((result) => result.score > 0)
      .sort((a, b) => b.score - a.score);

    return scored.map((result) => result.item);
  }

  /**
   * Smart categorize an item name
   * Returns the most likely category based on keywords
   */
  categorizeItem(name: string): ShoppingCategory {
    const normalizedName = name.toLowerCase();

    // Check each category's keywords
    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
      for (const keyword of keywords) {
        if (normalizedName.includes(keyword.toLowerCase())) {
          return category as ShoppingCategory;
        }
      }
    }

    // Check if it matches any existing catalog item
    const matchingItem = this._catalogItems().find((item) =>
      item.nameHe.toLowerCase().includes(normalizedName) ||
      normalizedName.includes(item.nameHe.toLowerCase())
    );

    if (matchingItem) {
      return matchingItem.category;
    }

    // Default to pantry
    return 'pantry';
  }

  /**
   * Update an item's price in the catalog
   */
  async updateItemPrice(itemId: string, newPrice: number): Promise<void> {
    const familyId = this.familyService.familyId();
    const userId = this.authService.userId();

    if (!familyId || !userId) {
      throw new Error('אין משפחה פעילה');
    }

    if (!this.familyService.canEdit()) {
      throw new Error('אין לך הרשאה לעדכן מחירים');
    }

    await this.firestoreService.updateDocument(
      `families/${familyId}/catalog/${itemId}`,
      {
        estimatedPrice: newPrice,
        lastPriceUpdate: this.firestoreService.getServerTimestamp(),
        lastPriceUpdatedBy: userId,
      }
    );

    // Update local state
    this._catalogItems.update((items) =>
      items.map((item) =>
        item.id === itemId
          ? {
              ...item,
              estimatedPrice: newPrice,
              lastPriceUpdate: Timestamp.now(),
              lastPriceUpdatedBy: userId,
            }
          : item
      )
    );
  }

  /**
   * Add a custom item to the catalog
   */
  async addCustomItem(
    name: string,
    category: ShoppingCategory,
    estimatedPrice: number
  ): Promise<string> {
    const familyId = this.familyService.familyId();
    const userId = this.authService.userId();

    if (!familyId || !userId) {
      throw new Error('אין משפחה פעילה');
    }

    if (!this.familyService.canEdit()) {
      throw new Error('אין לך הרשאה להוסיף פריטים');
    }

    // Generate a unique ID
    const id = `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const itemData = {
      id,
      nameHe: name,
      category,
      defaultUnit: 'units' as const,
      defaultQuantity: 1,
      estimatedPrice,
      keywords: [name.toLowerCase()],
      lastPriceUpdate: this.firestoreService.getServerTimestamp(),
      lastPriceUpdatedBy: userId,
    };

    await this.firestoreService.setDocument(
      `families/${familyId}/catalog/${id}`,
      itemData
    );

    // Update local state
    const newItem: CatalogItem = {
      ...itemData,
      lastPriceUpdate: Timestamp.now(),
      lastPriceUpdatedBy: userId,
    };
    this._catalogItems.update((items) => [...items, newItem]);

    return id;
  }

  /**
   * Get recently used items (items that appear in recent shopping lists)
   * For now, returns most common items - can be enhanced with actual usage data
   */
  getCommonItems(limit: number = 20): CatalogItem[] {
    // Return a curated list of common items
    const commonIds = [
      'milk-3', 'bread-white', 'eggs-12', 'tomatoes', 'cucumbers',
      'chicken-breast', 'yellow-cheese', 'yogurt-plain', 'bananas', 'apples',
      'rice', 'pasta-spaghetti', 'olive-oil', 'onions', 'potatoes',
      'toilet-paper', 'dish-soap', 'bamba', 'water-6pack', 'cola',
    ];

    const items = this._catalogItems();
    return commonIds
      .map((id) => items.find((item) => item.id === id))
      .filter((item): item is CatalogItem => item !== undefined)
      .slice(0, limit);
  }

  /**
   * Clear error
   */
  clearError(): void {
    this._error.set(null);
  }

  /**
   * Force reload catalog (e.g., when switching families)
   */
  async reloadCatalog(): Promise<void> {
    this._isLoaded.set(false);
    await this.loadCatalog();
  }
}
