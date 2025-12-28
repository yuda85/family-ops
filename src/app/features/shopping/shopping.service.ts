import { Injectable, inject, signal, computed, OnDestroy } from '@angular/core';
import { Timestamp } from 'firebase/firestore';
import { Subscription } from 'rxjs';
import { FirestoreService, where, orderBy } from '../../core/firebase/firestore.service';
import { AuthService } from '../../core/auth/auth.service';
import { FamilyService } from '../../core/family/family.service';
import {
  ShoppingList,
  ShoppingListItem,
  AddItemToListData,
  UpdateItemData,
  CreateShoppingListData,
  CategoryGroup,
  ShoppingCategory,
  SHOPPING_CATEGORIES,
  getCategoryMeta,
  CompleteShoppingData,
  ShoppingTrip,
  ShoppingTripItem,
} from './shopping.models';

@Injectable({
  providedIn: 'root',
})
export class ShoppingService implements OnDestroy {
  private firestoreService = inject(FirestoreService);
  private authService = inject(AuthService);
  private familyService = inject(FamilyService);

  // Subscriptions for real-time updates
  private listSubscription?: Subscription;
  private itemsSubscription?: Subscription;

  // Private signals
  private _activeList = signal<ShoppingList | null>(null);
  private _items = signal<ShoppingListItem[]>([]);
  private _isLoading = signal(false);
  private _error = signal<string | null>(null);
  private _isSupermarketMode = signal(false);
  private _collapsedCategories = signal<Set<ShoppingCategory>>(new Set());

  // Undo stack for supermarket mode
  private _undoStack = signal<Array<{ itemId: string; wasChecked: boolean }>>([]);
  private readonly MAX_UNDO = 5;

  // Public readonly signals
  readonly activeList = this._activeList.asReadonly();
  readonly items = this._items.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly isSupermarketMode = this._isSupermarketMode.asReadonly();
  readonly undoStack = this._undoStack.asReadonly();

  // Computed signals
  readonly totalCount = computed(() => this._items().length);

  readonly checkedCount = computed(() =>
    this._items().filter((i) => i.checked).length
  );

  readonly progress = computed(() => {
    const total = this.totalCount();
    if (total === 0) return 0;
    return (this.checkedCount() / total) * 100;
  });

  readonly estimatedTotal = computed(() =>
    this._items().reduce((sum, item) => sum + item.estimatedPrice * item.quantity, 0)
  );

  readonly actualTotal = computed(() =>
    this._items().reduce((sum, item) => {
      const price = item.actualPrice ?? item.estimatedPrice;
      return sum + price * item.quantity;
    }, 0)
  );

  readonly hasItems = computed(() => this._items().length > 0);

  readonly hasCheckedItems = computed(() => this.checkedCount() > 0);

  readonly isListComplete = computed(() => {
    const total = this.totalCount();
    return total > 0 && this.checkedCount() === total;
  });

  /**
   * Items grouped by category for display
   */
  readonly groupedItems = computed<CategoryGroup[]>(() => {
    const items = this._items();
    const collapsed = this._collapsedCategories();

    // Group items by category
    const groups = new Map<ShoppingCategory, ShoppingListItem[]>();
    for (const item of items) {
      const existing = groups.get(item.category) || [];
      existing.push(item);
      groups.set(item.category, existing);
    }

    // Convert to CategoryGroup array, sorted by category order
    const result: CategoryGroup[] = [];
    for (const categoryMeta of SHOPPING_CATEGORIES) {
      const categoryItems = groups.get(categoryMeta.id);
      if (categoryItems && categoryItems.length > 0) {
        // Sort items by orderInCategory
        categoryItems.sort((a, b) => a.orderInCategory - b.orderInCategory);

        result.push({
          category: categoryMeta.id,
          categoryMeta,
          items: categoryItems,
          isCollapsed: collapsed.has(categoryMeta.id),
          isComplete: categoryItems.every((i) => i.checked),
        });
      }
    }

    return result;
  });

  /**
   * Categories that are fully completed (all items checked)
   */
  readonly completedCategories = computed(() =>
    this.groupedItems()
      .filter((g) => g.isComplete)
      .map((g) => g.category)
  );

  /**
   * Check if can undo
   */
  readonly canUndo = computed(() => this._undoStack().length > 0);

  ngOnDestroy(): void {
    this.unsubscribe();
  }

  /**
   * Load or create active shopping list for the family
   */
  async loadActiveList(): Promise<void> {
    const familyId = this.familyService.familyId();
    if (!familyId) {
      this._activeList.set(null);
      this._items.set([]);
      return;
    }

    this._isLoading.set(true);
    this._error.set(null);

    try {
      // Look for an active list
      const lists = await this.firestoreService.getCollection<ShoppingList>(
        `families/${familyId}/shoppingLists`,
        where('status', '==', 'active'),
        orderBy('createdAt', 'desc')
      );

      if (lists.length > 0) {
        // Use the most recent active list
        this._activeList.set(lists[0]);
        this.subscribeToItems(lists[0].id);
      } else {
        // Create a new list
        const listId = await this.createList({ name: 'רשימת קניות' });
        const newList = await this.firestoreService.getDocument<ShoppingList>(
          `families/${familyId}/shoppingLists/${listId}`
        );
        this._activeList.set(newList);
        this.subscribeToItems(listId);
      }
    } catch (error: any) {
      console.error('Error loading shopping list:', error);
      this._error.set('שגיאה בטעינת רשימת הקניות');
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Subscribe to real-time updates for list items
   */
  private subscribeToItems(listId: string): void {
    const familyId = this.familyService.familyId();
    if (!familyId) return;

    // Unsubscribe from previous subscription
    this.itemsSubscription?.unsubscribe();

    // Subscribe to items collection
    this.itemsSubscription = this.firestoreService
      .getCollection$<ShoppingListItem>(
        `families/${familyId}/shoppingLists/${listId}/items`,
        orderBy('createdAt', 'desc')
      )
      .subscribe({
        next: (items) => {
          this._items.set(items);
        },
        error: (error) => {
          console.error('Error subscribing to items:', error);
          this._error.set('שגיאה בטעינת פריטים');
        },
      });
  }

  /**
   * Unsubscribe from all real-time subscriptions
   */
  private unsubscribe(): void {
    this.listSubscription?.unsubscribe();
    this.itemsSubscription?.unsubscribe();
  }

  /**
   * Create a new shopping list
   */
  async createList(data: CreateShoppingListData): Promise<string> {
    const familyId = this.familyService.familyId();
    const userId = this.authService.userId();

    if (!familyId || !userId) {
      throw new Error('אין משפחה פעילה');
    }

    if (!this.familyService.canEdit()) {
      throw new Error('אין לך הרשאה ליצור רשימות');
    }

    const listData = {
      familyId,
      name: data.name,
      status: 'active' as const,
      estimatedTotal: 0,
      createdBy: userId,
      activeShoppers: [],
    };

    return await this.firestoreService.createDocument(
      `families/${familyId}/shoppingLists`,
      listData
    );
  }

  /**
   * Add an item to the active list
   */
  async addItem(data: AddItemToListData): Promise<string> {
    const familyId = this.familyService.familyId();
    const userId = this.authService.userId();
    let listId = this._activeList()?.id;

    if (!familyId || !userId) {
      throw new Error('אין משתמש או משפחה פעילים');
    }

    // If no active list, create one
    if (!listId) {
      await this.loadActiveList();
      listId = this._activeList()?.id;
      if (!listId) {
        throw new Error('לא ניתן ליצור רשימה');
      }
    }

    if (!this.familyService.canEdit()) {
      throw new Error('אין לך הרשאה להוסיף פריטים');
    }

    // Get the max order for this category
    const categoryItems = this._items().filter((i) => i.category === data.category);
    const maxOrder = categoryItems.reduce((max, i) => Math.max(max, i.orderInCategory), -1);

    const itemData = {
      listId,
      catalogItemId: data.catalogItemId || null,
      name: data.name,
      category: data.category,
      quantity: data.quantity,
      unit: data.unit,
      estimatedPrice: data.estimatedPrice,
      checked: false,
      orderInCategory: maxOrder + 1,
      addedBy: userId,
      addedAt: this.firestoreService.getServerTimestamp(),
      note: data.note || null,
    };

    const itemId = await this.firestoreService.createDocument(
      `families/${familyId}/shoppingLists/${listId}/items`,
      itemData
    );

    // Update list estimated total
    await this.updateListTotal();

    return itemId;
  }

  /**
   * Update an item in the list
   */
  async updateItem(itemId: string, data: UpdateItemData): Promise<void> {
    const familyId = this.familyService.familyId();
    const listId = this._activeList()?.id;

    if (!familyId || !listId) {
      throw new Error('אין רשימה פעילה');
    }

    if (!this.familyService.canEdit()) {
      throw new Error('אין לך הרשאה לעדכן פריטים');
    }

    const updateData: Record<string, any> = {};

    if (data.quantity !== undefined) updateData['quantity'] = data.quantity;
    if (data.unit !== undefined) updateData['unit'] = data.unit;
    if (data.estimatedPrice !== undefined) updateData['estimatedPrice'] = data.estimatedPrice;
    if (data.actualPrice !== undefined) updateData['actualPrice'] = data.actualPrice;
    if (data.note !== undefined) updateData['note'] = data.note || null;
    if (data.orderInCategory !== undefined) updateData['orderInCategory'] = data.orderInCategory;

    if (data.checked !== undefined) {
      updateData['checked'] = data.checked;
      if (data.checked) {
        updateData['checkedAt'] = this.firestoreService.getServerTimestamp();
        updateData['checkedBy'] = this.authService.userId();
      } else {
        updateData['checkedAt'] = null;
        updateData['checkedBy'] = null;
      }
    }

    await this.firestoreService.updateDocument(
      `families/${familyId}/shoppingLists/${listId}/items/${itemId}`,
      updateData
    );

    // Update total if price or quantity changed
    if (data.estimatedPrice !== undefined || data.quantity !== undefined) {
      await this.updateListTotal();
    }
  }

  /**
   * Toggle an item's checked status
   */
  async toggleItem(itemId: string): Promise<void> {
    const item = this._items().find((i) => i.id === itemId);
    if (!item) return;

    await this.updateItem(itemId, { checked: !item.checked });
  }

  /**
   * Quick check for supermarket mode (with undo support)
   */
  async quickCheck(itemId: string): Promise<void> {
    const item = this._items().find((i) => i.id === itemId);
    if (!item) return;

    // Add to undo stack
    this._undoStack.update((stack) => {
      const newStack = [...stack, { itemId, wasChecked: item.checked }];
      if (newStack.length > this.MAX_UNDO) {
        newStack.shift();
      }
      return newStack;
    });

    await this.toggleItem(itemId);
  }

  /**
   * Undo last check action
   */
  async undoLastCheck(): Promise<void> {
    const stack = this._undoStack();
    if (stack.length === 0) return;

    const last = stack[stack.length - 1];
    this._undoStack.update((s) => s.slice(0, -1));

    await this.updateItem(last.itemId, { checked: last.wasChecked });
  }

  /**
   * Remove an item from the list
   */
  async removeItem(itemId: string): Promise<void> {
    const familyId = this.familyService.familyId();
    const listId = this._activeList()?.id;

    if (!familyId || !listId) {
      throw new Error('אין רשימה פעילה');
    }

    if (!this.familyService.canEdit()) {
      throw new Error('אין לך הרשאה למחוק פריטים');
    }

    await this.firestoreService.deleteDocument(
      `families/${familyId}/shoppingLists/${listId}/items/${itemId}`
    );

    await this.updateListTotal();
  }

  /**
   * Clear all checked items
   */
  async clearCheckedItems(): Promise<void> {
    const familyId = this.familyService.familyId();
    const listId = this._activeList()?.id;

    if (!familyId || !listId) {
      throw new Error('אין רשימה פעילה');
    }

    if (!this.familyService.canEdit()) {
      throw new Error('אין לך הרשאה למחוק פריטים');
    }

    const checkedItems = this._items().filter((i) => i.checked);

    // Delete all checked items using batch
    const operations = checkedItems.map((item) => ({
      type: 'delete' as const,
      path: `families/${familyId}/shoppingLists/${listId}/items/${item.id}`,
    }));

    if (operations.length > 0) {
      await this.firestoreService.batchWrite(operations);
      await this.updateListTotal();
    }
  }

  /**
   * Update the list's estimated total
   */
  private async updateListTotal(): Promise<void> {
    const familyId = this.familyService.familyId();
    const listId = this._activeList()?.id;

    if (!familyId || !listId) return;

    const total = this.estimatedTotal();

    await this.firestoreService.updateDocument(
      `families/${familyId}/shoppingLists/${listId}`,
      { estimatedTotal: total }
    );
  }

  /**
   * Toggle category collapsed state
   */
  toggleCategory(category: ShoppingCategory): void {
    this._collapsedCategories.update((set) => {
      const newSet = new Set(set);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  }

  /**
   * Enter supermarket mode
   */
  async enterSupermarketMode(): Promise<void> {
    const familyId = this.familyService.familyId();
    const listId = this._activeList()?.id;
    const userId = this.authService.userId();

    if (!familyId || !listId || !userId) return;

    this._isSupermarketMode.set(true);
    this._undoStack.set([]);

    // Add user to active shoppers
    const list = this._activeList();
    if (list) {
      const activeShoppers = [...(list.activeShoppers || [])];
      if (!activeShoppers.includes(userId)) {
        activeShoppers.push(userId);
        await this.firestoreService.updateDocument(
          `families/${familyId}/shoppingLists/${listId}`,
          { status: 'shopping', activeShoppers }
        );
      }
    }
  }

  /**
   * Exit supermarket mode
   */
  async exitSupermarketMode(): Promise<void> {
    const familyId = this.familyService.familyId();
    const listId = this._activeList()?.id;
    const userId = this.authService.userId();

    if (!familyId || !listId || !userId) return;

    this._isSupermarketMode.set(false);
    this._undoStack.set([]);

    // Remove user from active shoppers
    const list = this._activeList();
    if (list) {
      const activeShoppers = (list.activeShoppers || []).filter((id) => id !== userId);
      const status = activeShoppers.length === 0 ? 'active' : 'shopping';
      await this.firestoreService.updateDocument(
        `families/${familyId}/shoppingLists/${listId}`,
        { status, activeShoppers }
      );
    }
  }

  /**
   * Complete shopping and archive the trip
   */
  async completeShopping(data: CompleteShoppingData): Promise<string> {
    const familyId = this.familyService.familyId();
    const userId = this.authService.userId();
    const list = this._activeList();

    if (!familyId || !userId || !list) {
      throw new Error('אין רשימה פעילה');
    }

    // Update item prices if provided
    if (data.itemPrices) {
      for (const [itemId, price] of Object.entries(data.itemPrices)) {
        await this.updateItem(itemId, { actualPrice: price });
      }
    }

    // Create trip snapshot
    const items = this._items();
    const tripItems: ShoppingTripItem[] = items.map((item) => ({
      name: item.name,
      category: item.category,
      quantity: item.quantity,
      unit: item.unit,
      estimatedPrice: item.estimatedPrice,
      actualPrice: item.actualPrice,
      wasChecked: item.checked,
    }));

    const tripData = {
      familyId,
      listId: list.id,
      listName: list.name,
      completedBy: userId,
      totalItems: items.length,
      checkedItems: items.filter((i) => i.checked).length,
      estimatedTotal: this.estimatedTotal(),
      actualTotal: data.actualTotal,
      items: tripItems,
    };

    // Save trip to history
    const tripId = await this.firestoreService.createDocument(
      `families/${familyId}/shoppingHistory`,
      tripData
    );

    // Mark list as completed
    await this.firestoreService.updateDocument(
      `families/${familyId}/shoppingLists/${list.id}`,
      {
        status: 'completed',
        actualTotal: data.actualTotal,
        completedAt: this.firestoreService.getServerTimestamp(),
        completedBy: userId,
        activeShoppers: [],
      }
    );

    // Reset state
    this._activeList.set(null);
    this._items.set([]);
    this._isSupermarketMode.set(false);

    return tripId;
  }

  /**
   * Clear error
   */
  clearError(): void {
    this._error.set(null);
  }
}
