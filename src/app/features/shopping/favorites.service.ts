import { Injectable, inject, signal, computed } from '@angular/core';
import { Timestamp } from 'firebase/firestore';
import { FirestoreService, orderBy } from '../../core/firebase/firestore.service';
import { AuthService } from '../../core/auth/auth.service';
import { FamilyService } from '../../core/family/family.service';
import { UserFavorite, CatalogItem, AddFavoriteData } from './shopping.models';
import { CatalogService } from './catalog.service';
import { ShoppingService } from './shopping.service';

@Injectable({
  providedIn: 'root',
})
export class FavoritesService {
  private firestoreService = inject(FirestoreService);
  private authService = inject(AuthService);
  private familyService = inject(FamilyService);
  private catalogService = inject(CatalogService);
  private shoppingService = inject(ShoppingService);

  // Private signals
  private _favorites = signal<UserFavorite[]>([]);
  private _isLoading = signal(false);
  private _error = signal<string | null>(null);

  // Public readonly signals
  readonly favorites = this._favorites.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly error = this._error.asReadonly();

  /**
   * Favorites sorted by use count (most used first)
   */
  readonly sortedFavorites = computed(() => {
    return [...this._favorites()].sort((a, b) => b.useCount - a.useCount);
  });

  /**
   * Favorites with catalog item details
   */
  readonly favoritesWithDetails = computed(() => {
    const favorites = this._favorites();
    return favorites
      .map((fav) => {
        const catalogItem = this.catalogService.getCatalogItem(fav.catalogItemId);
        return catalogItem ? { favorite: fav, catalogItem } : null;
      })
      .filter((item): item is { favorite: UserFavorite; catalogItem: CatalogItem } => item !== null)
      .sort((a, b) => b.favorite.useCount - a.favorite.useCount);
  });

  /**
   * Check if a catalog item is a favorite
   */
  isFavorite(catalogItemId: string): boolean {
    return this._favorites().some((f) => f.catalogItemId === catalogItemId);
  }

  /**
   * Get favorite by catalog item ID
   */
  getFavorite(catalogItemId: string): UserFavorite | undefined {
    return this._favorites().find((f) => f.catalogItemId === catalogItemId);
  }

  /**
   * Load user's favorites
   */
  async loadFavorites(): Promise<void> {
    const userId = this.authService.userId();
    if (!userId) {
      this._favorites.set([]);
      return;
    }

    this._isLoading.set(true);
    this._error.set(null);

    try {
      const favorites = await this.firestoreService.getCollection<UserFavorite>(
        `users/${userId}/shoppingFavorites`,
        orderBy('useCount', 'desc')
      );
      this._favorites.set(favorites);
    } catch (error: any) {
      console.error('Error loading favorites:', error);
      this._error.set('שגיאה בטעינת המועדפים');
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Add an item to favorites
   */
  async addFavorite(data: AddFavoriteData): Promise<string> {
    const userId = this.authService.userId();
    const familyId = this.familyService.familyId();

    if (!userId || !familyId) {
      throw new Error('משתמש לא מחובר');
    }

    // Check if already a favorite
    if (this.isFavorite(data.catalogItemId)) {
      throw new Error('פריט כבר נמצא במועדפים');
    }

    const favoriteData = {
      userId,
      familyId,
      catalogItemId: data.catalogItemId,
      customQuantity: data.customQuantity,
      customUnit: data.customUnit,
      useCount: 0,
    };

    const favoriteId = await this.firestoreService.createDocument(
      `users/${userId}/shoppingFavorites`,
      favoriteData
    );

    // Update local state
    const newFavorite: UserFavorite = {
      id: favoriteId,
      userId,
      familyId,
      catalogItemId: data.catalogItemId,
      customQuantity: data.customQuantity,
      customUnit: data.customUnit,
      useCount: 0,
      addedAt: Timestamp.now(),
    };

    this._favorites.update((favorites) => [...favorites, newFavorite]);

    return favoriteId;
  }

  /**
   * Remove an item from favorites
   */
  async removeFavorite(catalogItemId: string): Promise<void> {
    const userId = this.authService.userId();
    if (!userId) {
      throw new Error('משתמש לא מחובר');
    }

    const favorite = this.getFavorite(catalogItemId);
    if (!favorite) {
      throw new Error('פריט לא נמצא במועדפים');
    }

    await this.firestoreService.deleteDocument(
      `users/${userId}/shoppingFavorites/${favorite.id}`
    );

    // Update local state
    this._favorites.update((favorites) =>
      favorites.filter((f) => f.catalogItemId !== catalogItemId)
    );
  }

  /**
   * Toggle favorite status
   */
  async toggleFavorite(catalogItemId: string): Promise<boolean> {
    if (this.isFavorite(catalogItemId)) {
      await this.removeFavorite(catalogItemId);
      return false;
    } else {
      await this.addFavorite({ catalogItemId });
      return true;
    }
  }

  /**
   * Add all favorites to the shopping list
   */
  async addAllFavoritesToList(): Promise<number> {
    const favoritesWithDetails = this.favoritesWithDetails();
    let addedCount = 0;

    for (const { favorite, catalogItem } of favoritesWithDetails) {
      try {
        await this.shoppingService.addItem({
          catalogItemId: catalogItem.id,
          name: catalogItem.nameHe,
          category: catalogItem.category,
          quantity: favorite.customQuantity ?? catalogItem.defaultQuantity,
          unit: favorite.customUnit ?? catalogItem.defaultUnit,
          estimatedPrice: catalogItem.estimatedPrice,
        });

        // Update use count
        await this.incrementUseCount(favorite.id);
        addedCount++;
      } catch (error) {
        console.error('Error adding favorite to list:', error);
      }
    }

    return addedCount;
  }

  /**
   * Add a single favorite to the shopping list
   */
  async addFavoriteToList(catalogItemId: string): Promise<void> {
    const favorite = this.getFavorite(catalogItemId);
    const catalogItem = this.catalogService.getCatalogItem(catalogItemId);

    if (!favorite || !catalogItem) {
      throw new Error('פריט לא נמצא');
    }

    await this.shoppingService.addItem({
      catalogItemId: catalogItem.id,
      name: catalogItem.nameHe,
      category: catalogItem.category,
      quantity: favorite.customQuantity ?? catalogItem.defaultQuantity,
      unit: favorite.customUnit ?? catalogItem.defaultUnit,
      estimatedPrice: catalogItem.estimatedPrice,
    });

    // Update use count
    await this.incrementUseCount(favorite.id);
  }

  /**
   * Increment the use count for a favorite
   */
  private async incrementUseCount(favoriteId: string): Promise<void> {
    const userId = this.authService.userId();
    if (!userId) return;

    const favorite = this._favorites().find((f) => f.id === favoriteId);
    if (!favorite) return;

    await this.firestoreService.updateDocument(
      `users/${userId}/shoppingFavorites/${favoriteId}`,
      {
        useCount: favorite.useCount + 1,
        lastUsedAt: this.firestoreService.getServerTimestamp(),
      }
    );

    // Update local state
    this._favorites.update((favorites) =>
      favorites.map((f) =>
        f.id === favoriteId
          ? { ...f, useCount: f.useCount + 1, lastUsedAt: Timestamp.now() }
          : f
      )
    );
  }

  /**
   * Clear error
   */
  clearError(): void {
    this._error.set(null);
  }
}
