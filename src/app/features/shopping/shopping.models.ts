import { Timestamp } from 'firebase/firestore';

// ============================================
// CATEGORY DEFINITIONS
// ============================================

export type ShoppingCategory =
  | 'vegetables'
  | 'fruits'
  | 'dairy'
  | 'meat'
  | 'bakery'
  | 'pantry'
  | 'frozen'
  | 'cleaning'
  | 'personal'
  | 'baby'
  | 'snacks'
  | 'drinks';

export interface ShoppingCategoryMeta {
  id: ShoppingCategory;
  labelHe: string;
  icon: string;
  color: string;
  order: number;
}

export const SHOPPING_CATEGORIES: ShoppingCategoryMeta[] = [
  { id: 'vegetables', labelHe: 'ירקות', icon: 'eco', color: '#4caf50', order: 0 },
  { id: 'fruits', labelHe: 'פירות', icon: 'nutrition', color: '#ff9800', order: 1 },
  { id: 'dairy', labelHe: 'מוצרי חלב', icon: 'egg_alt', color: '#2196f3', order: 2 },
  { id: 'meat', labelHe: 'בשר ודגים', icon: 'kebab_dining', color: '#c62828', order: 3 },
  { id: 'bakery', labelHe: 'מאפים', icon: 'bakery_dining', color: '#8d6e63', order: 4 },
  { id: 'pantry', labelHe: 'מזווה', icon: 'kitchen', color: '#795548', order: 5 },
  { id: 'frozen', labelHe: 'קפואים', icon: 'ac_unit', color: '#00bcd4', order: 6 },
  { id: 'drinks', labelHe: 'משקאות', icon: 'local_cafe', color: '#673ab7', order: 7 },
  { id: 'snacks', labelHe: 'חטיפים', icon: 'cookie', color: '#ffc107', order: 8 },
  { id: 'cleaning', labelHe: 'ניקיון', icon: 'cleaning_services', color: '#9c27b0', order: 9 },
  { id: 'personal', labelHe: 'טיפוח', icon: 'spa', color: '#e91e63', order: 10 },
  { id: 'baby', labelHe: 'תינוקות', icon: 'child_care', color: '#ff80ab', order: 11 },
];

/**
 * Get category metadata by ID
 */
export function getCategoryMeta(categoryId: ShoppingCategory): ShoppingCategoryMeta {
  return SHOPPING_CATEGORIES.find((c) => c.id === categoryId) ?? SHOPPING_CATEGORIES[5]; // Default to pantry
}

// ============================================
// UNIT DEFINITIONS
// ============================================

export type ShoppingUnit = 'units' | 'kg' | 'gram' | 'liter' | 'ml' | 'pack';

export interface UnitMeta {
  id: ShoppingUnit;
  labelHe: string;
  shortHe: string;
}

export const SHOPPING_UNITS: UnitMeta[] = [
  { id: 'units', labelHe: 'יחידות', shortHe: 'יח\'' },
  { id: 'kg', labelHe: 'קילוגרם', shortHe: 'ק"ג' },
  { id: 'gram', labelHe: 'גרם', shortHe: 'גר\'' },
  { id: 'liter', labelHe: 'ליטר', shortHe: 'ליטר' },
  { id: 'ml', labelHe: 'מיליליטר', shortHe: 'מ"ל' },
  { id: 'pack', labelHe: 'חבילה', shortHe: 'חבילה' },
];

/**
 * Get unit metadata by ID
 */
export function getUnitMeta(unitId: ShoppingUnit): UnitMeta {
  return SHOPPING_UNITS.find((u) => u.id === unitId) ?? SHOPPING_UNITS[0];
}

// ============================================
// CATALOG ITEM (stored in Firestore per family)
// ============================================

export interface CatalogItem {
  id: string;
  nameHe: string;
  category: ShoppingCategory;
  defaultUnit: ShoppingUnit;
  defaultQuantity: number;
  estimatedPrice: number; // Price in shekels (updatable by family)
  keywords: string[];
  lastPriceUpdate?: Timestamp;
  lastPriceUpdatedBy?: string;
}

/**
 * Data for seeding catalog (without Firestore fields)
 */
export interface CatalogItemSeed {
  id: string;
  nameHe: string;
  category: ShoppingCategory;
  defaultUnit: ShoppingUnit;
  defaultQuantity: number;
  estimatedPrice: number;
  keywords: string[];
}

// ============================================
// SHOPPING LIST
// ============================================

export interface ShoppingList {
  id: string;
  familyId: string;
  name: string;
  status: 'active' | 'shopping' | 'completed';
  estimatedTotal: number;
  actualTotal?: number;
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  completedAt?: Timestamp;
  completedBy?: string;
  activeShoppers: string[]; // User IDs currently in supermarket mode
}

/**
 * Data for creating a new shopping list
 */
export interface CreateShoppingListData {
  name: string;
}

// ============================================
// SHOPPING LIST ITEM
// ============================================

export interface ShoppingListItem {
  id: string;
  listId: string;
  catalogItemId?: string; // Reference to catalog item (if from catalog)
  name: string;
  category: ShoppingCategory;
  quantity: number;
  unit: ShoppingUnit;
  estimatedPrice: number;
  actualPrice?: number;
  checked: boolean;
  checkedAt?: Timestamp;
  checkedBy?: string;
  orderInCategory: number;
  addedBy: string;
  addedAt: Timestamp;
  note?: string;
}

/**
 * Data for adding an item to a shopping list
 */
export interface AddItemToListData {
  catalogItemId?: string;
  name: string;
  category: ShoppingCategory;
  quantity: number;
  unit: ShoppingUnit;
  estimatedPrice: number;
  note?: string;
}

/**
 * Data for updating a shopping list item
 */
export interface UpdateItemData {
  quantity?: number;
  unit?: ShoppingUnit;
  estimatedPrice?: number;
  actualPrice?: number;
  checked?: boolean;
  note?: string;
  orderInCategory?: number;
}

// ============================================
// USER FAVORITES
// ============================================

export interface UserFavorite {
  id: string;
  userId: string;
  familyId: string;
  catalogItemId: string;
  customQuantity?: number;
  customUnit?: ShoppingUnit;
  addedAt: Timestamp;
  lastUsedAt?: Timestamp;
  useCount: number;
}

/**
 * Data for adding a favorite
 */
export interface AddFavoriteData {
  catalogItemId: string;
  customQuantity?: number;
  customUnit?: ShoppingUnit;
}

// ============================================
// SHOPPING HISTORY (Completed Trips)
// ============================================

export interface ShoppingTrip {
  id: string;
  familyId: string;
  listId: string;
  listName: string;
  completedAt: Timestamp;
  completedBy: string;
  totalItems: number;
  checkedItems: number;
  estimatedTotal: number;
  actualTotal: number;
  items: ShoppingTripItem[]; // Snapshot of items
}

export interface ShoppingTripItem {
  name: string;
  category: ShoppingCategory;
  quantity: number;
  unit: ShoppingUnit;
  estimatedPrice: number;
  actualPrice?: number;
  wasChecked: boolean;
}

/**
 * Data for completing a shopping trip
 */
export interface CompleteShoppingData {
  actualTotal: number;
  itemPrices?: Record<string, number>; // itemId -> actualPrice
}

// ============================================
// PURCHASE PATTERNS (for smart suggestions)
// ============================================

export interface PurchasePattern {
  id: string;
  familyId: string;
  catalogItemId: string;
  itemName: string;
  category: ShoppingCategory;
  purchaseCount: number;
  lastPurchased: Timestamp;
  averageQuantity: number;
  averageIntervalDays: number;
}

// ============================================
// GROUPED ITEMS FOR DISPLAY
// ============================================

export interface CategoryGroup {
  category: ShoppingCategory;
  categoryMeta: ShoppingCategoryMeta;
  items: ShoppingListItem[];
  isCollapsed: boolean;
  isComplete: boolean; // All items checked
}
