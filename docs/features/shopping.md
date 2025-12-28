# Shopping Feature

Smart shopping lists with real-time sync, 200+ Israeli item catalog, supermarket mode, favorites, budget tracking, and celebration animations.

## Overview

The shopping feature provides:
- **Real-time sync** across all family members
- **200+ item catalog** with Hebrew names and estimated prices
- **Smart categorization** - auto-categorize items by keywords
- **Supermarket mode** - optimized in-store experience with large touch targets
- **Favorites system** - quick access to frequently bought items
- **Budget tracking** - compare estimated vs actual costs
- **Shopping history** - track completed trips and spending
- **Confetti celebrations** - fun feedback when completing categories/lists

## User Flow

```
┌─────────────────────────────────────────────────────────┐
│                     Shopping Flow                        │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  /app/shopping                                          │
│  ├── List View (default)                                │
│  │   ├── View items grouped by category                 │
│  │   ├── Check/uncheck items with real-time sync        │
│  │   ├── Quick-add bar (always visible)                 │
│  │   ├── Catalog picker dialog (batch selection)        │
│  │   ├── See progress bar and estimated total           │
│  │   ├── Clear checked items                            │
│  │   ├── Finish shopping (completion dialog)            │
│  │   ├── Quick access to history via header icon        │
│  │   └── Enter supermarket mode                         │
│  │                                                      │
│  ├── /shopping/supermarket/:id                          │
│  │   ├── Large touch targets (64px+ height)             │
│  │   ├── One-tap check-off with swipe                   │
│  │   ├── Screen stays on (Wake Lock API)                │
│  │   ├── Quick undo (last 5 actions)                    │
│  │   ├── Confetti on category/list completion           │
│  │   └── Completion dialog with cost comparison         │
│  │                                                      │
│  ├── /shopping/staples (Favorites)                      │
│  │   ├── View and manage favorite items                 │
│  │   ├── Add/remove favorites                           │
│  │   └── Quick-add all favorites to list                │
│  │                                                      │
│  └── /shopping/history                                  │
│      ├── View completed shopping trips                  │
│      ├── Monthly spending summaries (table view)        │
│      ├── Total stats (trips, expenses, average)         │
│      └── Estimate accuracy indicator                    │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## Routes

| Path | Component | Description |
|------|-----------|-------------|
| `/app/shopping` | ListViewComponent | Main shopping list |
| `/app/shopping/supermarket/:id` | SupermarketModeComponent | In-store mode |
| `/app/shopping/staples` | StaplesComponent | Favorites management |
| `/app/shopping/history` | HistoryViewComponent | Shopping history |

## Architecture

### Services

| Service | Purpose |
|---------|---------|
| `ShoppingService` | Main CRUD, real-time sync, supermarket mode state |
| `CatalogService` | Catalog management, search, smart categorization |
| `FavoritesService` | User favorites stored per-user |
| `ShoppingHistoryService` | Completed trips, spending analytics |
| `ConfettiService` | Celebration animations |

### Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `ListViewComponent` | `list-view/` | Main shopping list display |
| `SupermarketModeComponent` | `supermarket-mode/` | In-store optimized view |
| `StaplesComponent` | `staples/` | Favorites management |
| `HistoryViewComponent` | `history/` | Shopping history view |
| `QuickAddComponent` | `components/quick-add/` | Autocomplete add input |
| `ItemPickerComponent` | `components/item-picker/` | Full catalog browser dialog |
| `QuantityEditorComponent` | `components/quantity-editor/` | Inline quantity/price editing |
| `CompletionDialogComponent` | `components/completion-dialog/` | End shopping with cost comparison |
| `ConfettiComponent` | `components/confetti/` | CSS-based confetti animations |

## Data Models

### ShoppingCategory
```typescript
type ShoppingCategory =
  | 'vegetables'   // ירקות
  | 'fruits'       // פירות
  | 'dairy'        // מוצרי חלב
  | 'meat'         // בשר ודגים
  | 'bakery'       // מאפים ולחם
  | 'pantry'       // מזווה
  | 'frozen'       // קפואים
  | 'drinks'       // משקאות
  | 'snacks'       // חטיפים
  | 'cleaning'     // ניקיון
  | 'personal'     // טיפוח
  | 'baby';        // תינוקות
```

### ShoppingUnit
```typescript
type ShoppingUnit = 'kg' | 'units' | 'liter' | 'pack' | 'gram' | 'ml';
```

### CatalogItem
```typescript
interface CatalogItem {
  id: string;
  nameHe: string;                    // Hebrew name
  category: ShoppingCategory;
  defaultUnit: ShoppingUnit;
  defaultQuantity: number;
  estimatedPrice: number;            // Price in shekels (updatable by family)
  keywords: string[];                // For search and categorization
  lastPriceUpdate?: Timestamp;
  lastPriceUpdatedBy?: string;
}
```

### ShoppingList
```typescript
interface ShoppingList {
  id: string;
  familyId: string;
  name: string;
  status: 'active' | 'shopping' | 'completed';
  estimatedTotal: number;
  actualTotal?: number;
  createdBy: string;
  createdAt: Timestamp;
  completedAt?: Timestamp;
  activeShoppers: string[];          // Users currently in supermarket mode
}
```

### ShoppingListItem
```typescript
interface ShoppingListItem {
  id: string;
  listId: string;
  catalogItemId?: string;            // Reference to catalog item
  name: string;
  category: ShoppingCategory;
  quantity: number;
  unit: ShoppingUnit;
  estimatedPrice: number;
  actualPrice?: number;
  checked: boolean;
  checkedBy?: string;
  orderInCategory: number;
  addedBy: string;
  addedAt: Timestamp;
  note?: string;
}
```

### UserFavorite
```typescript
interface UserFavorite {
  id: string;
  userId: string;
  catalogItemId: string;
  customQuantity?: number;
  useCount: number;
  lastUsedAt?: Timestamp;
}
```

### ShoppingTrip
```typescript
interface ShoppingTrip {
  id: string;
  familyId: string;
  completedAt: Timestamp;
  completedBy: string;
  totalItems: number;
  estimatedTotal: number;
  actualTotal: number;
  items: ShoppingTripItem[];         // Snapshot of items
}
```

### PurchasePattern
```typescript
interface PurchasePattern {
  id: string;
  familyId: string;
  catalogItemId: string;
  itemName: string;
  purchaseCount: number;
  lastPurchased: Timestamp;
  averageIntervalDays: number;
}
```

### CategoryGroup
```typescript
interface CategoryGroup {
  category: ShoppingCategory;
  label: string;
  icon: string;
  items: ShoppingListItem[];
  isComplete: boolean;
}
```

## Firestore Structure

```
/families/{familyId}/
├── shoppingLists/{listId}
│   ├── name: string
│   ├── status: 'active' | 'shopping' | 'completed'
│   ├── estimatedTotal: number
│   ├── actualTotal?: number
│   ├── createdBy: string
│   ├── createdAt: Timestamp
│   ├── completedAt?: Timestamp
│   └── activeShoppers: string[]
│
├── shoppingListItems/{itemId}       # Subcollection for real-time sync
│   ├── listId: string
│   ├── catalogItemId?: string
│   ├── name: string
│   ├── category: ShoppingCategory
│   ├── quantity: number
│   ├── unit: ShoppingUnit
│   ├── estimatedPrice: number
│   ├── actualPrice?: number
│   ├── checked: boolean
│   ├── checkedBy?: string
│   ├── orderInCategory: number
│   ├── addedBy: string
│   ├── addedAt: Timestamp
│   └── note?: string
│
├── shoppingHistory/{tripId}
│   ├── completedAt: Timestamp
│   ├── completedBy: string
│   ├── totalItems: number
│   ├── estimatedTotal: number
│   ├── actualTotal: number
│   └── items: ShoppingTripItem[]    # Snapshot
│
├── purchasePatterns/{patternId}
│   ├── catalogItemId: string
│   ├── itemName: string
│   ├── purchaseCount: number
│   ├── lastPurchased: Timestamp
│   └── averageIntervalDays: number
│
└── catalog/{itemId}                  # Family's catalog with updatable prices
    ├── nameHe: string
    ├── category: ShoppingCategory
    ├── defaultUnit: ShoppingUnit
    ├── defaultQuantity: number
    ├── estimatedPrice: number
    ├── keywords: string[]
    ├── lastPriceUpdate?: Timestamp
    └── lastPriceUpdatedBy?: string

/users/{userId}/
└── shoppingFavorites/{favoriteId}
    ├── catalogItemId: string
    ├── customQuantity?: number
    ├── useCount: number
    └── lastUsedAt?: Timestamp
```

## Category Metadata

```typescript
const CATEGORY_META: Record<ShoppingCategory, { label: string; icon: string; order: number }> = {
  vegetables: { label: 'ירקות', icon: 'grass', order: 1 },
  fruits: { label: 'פירות', icon: 'nutrition', order: 2 },
  dairy: { label: 'מוצרי חלב', icon: 'egg', order: 3 },
  meat: { label: 'בשר ודגים', icon: 'restaurant', order: 4 },
  bakery: { label: 'מאפים ולחם', icon: 'bakery_dining', order: 5 },
  pantry: { label: 'מזווה', icon: 'kitchen', order: 6 },
  frozen: { label: 'קפואים', icon: 'ac_unit', order: 7 },
  drinks: { label: 'משקאות', icon: 'local_cafe', order: 8 },
  snacks: { label: 'חטיפים', icon: 'cookie', order: 9 },
  cleaning: { label: 'ניקיון', icon: 'cleaning_services', order: 10 },
  personal: { label: 'טיפוח', icon: 'spa', order: 11 },
  baby: { label: 'תינוקות', icon: 'child_friendly', order: 12 },
};
```

## Smart Categorization

Items are auto-categorized using keyword matching:

```typescript
const CATEGORY_KEYWORDS: Partial<Record<ShoppingCategory, string[]>> = {
  dairy: ['חלב', 'גבינה', 'יוגורט', 'קוטג', 'שמנת', 'חמאה', 'לבן', 'ביצ'],
  vegetables: ['עגבני', 'מלפפון', 'גזר', 'בצל', 'פלפל', 'חסה', 'כרוב', 'קישוא'],
  fruits: ['תפוח', 'בננה', 'תפוז', 'אבטיח', 'ענבים', 'אגס', 'מנגו', 'קיווי'],
  meat: ['עוף', 'בקר', 'טחון', 'שניצל', 'נקניק', 'דג', 'סלמון', 'טונה'],
  bakery: ['לחם', 'פיתה', 'חלה', 'לחמני', 'באגט', 'עוג'],
  pantry: ['אורז', 'פסטה', 'שמן', 'סוכר', 'קמח', 'מלח', 'רוטב', 'שימור'],
  frozen: ['קפוא', 'גלידה', 'פיצה קפואה', 'ירקות קפואים'],
  drinks: ['מים', 'קולה', 'מיץ', 'בירה', 'יין', 'קפה', 'תה'],
  snacks: ['במבה', 'ביסלי', 'שוקולד', 'עוגי', 'ופל', 'חטיף', 'אגוז'],
  cleaning: ['אקונומיקה', 'סבון', 'נייר טואלט', 'מגב', 'שקית'],
  personal: ['שמפו', 'מברשת', 'משחת', 'דאודורנט', 'קרם'],
  baby: ['חיתול', 'מגבון', 'פורמולה', 'מוצץ'],
};
```

## Key Features

### 1. Quick-Add with Autocomplete

The quick-add component provides instant search across the 200+ item catalog:

```typescript
onSearchChange(query: string): void {
  if (!query || query.trim().length === 0) {
    this.suggestions.set([]);
    return;
  }
  const results = this.catalogService.searchItems(query);
  this.suggestions.set(results.slice(0, 8)); // Limit to 8 suggestions
}
```

### 2. Supermarket Mode

Optimized for in-store use with:
- **Large touch targets** (64px minimum height)
- **Wake Lock API** to keep screen on
- **Undo stack** for last 5 actions
- **Swipe to check** items
- **Confetti celebrations** on completion

```typescript
async enterSupermarketMode(): Promise<void> {
  this.isSupermarketMode.set(true);

  // Request wake lock
  if ('wakeLock' in navigator) {
    try {
      this.wakeLock = await navigator.wakeLock.request('screen');
    } catch (e) {
      console.warn('Wake lock not available');
    }
  }
}
```

### 3. Undo Stack

Quick undo for accidental checks in supermarket mode:

```typescript
private undoStack: UndoAction[] = [];
private readonly MAX_UNDO = 5;

async quickCheck(itemId: string): Promise<void> {
  const item = this.items().find(i => i.id === itemId);
  if (!item) return;

  // Save to undo stack
  this.undoStack.push({ itemId, wasChecked: item.checked });
  if (this.undoStack.length > this.MAX_UNDO) {
    this.undoStack.shift();
  }

  await this.toggleItem(itemId);
}

async undoLastCheck(): Promise<void> {
  const lastAction = this.undoStack.pop();
  if (!lastAction) return;

  await this.updateItem(lastAction.itemId, { checked: lastAction.wasChecked });
}
```

### 4. Confetti Celebrations

CSS-based confetti for fun feedback:

```typescript
// Small confetti when a category is completed
celebrateCategory(): void {
  this.isActive.set(true);
  this.intensity.set('small');
  setTimeout(() => this.isActive.set(false), 2000);
}

// Big confetti when the entire list is completed
celebrateListComplete(): void {
  this.isActive.set(true);
  this.intensity.set('big');
  setTimeout(() => this.isActive.set(false), 3000);
}
```

### 5. Budget Tracking

Compare estimated vs actual costs:

```typescript
readonly estimatedTotal = computed(() => {
  return this.items().reduce((sum, item) => {
    return sum + (item.estimatedPrice * item.quantity);
  }, 0);
});

async completeShopping(actualTotal: number): Promise<void> {
  const list = this.activeList();
  if (!list) return;

  // Save to history
  await this.historyService.saveTrip({
    listId: list.id,
    items: this.items(),
    estimatedTotal: this.estimatedTotal(),
    actualTotal,
  });

  // Mark list as completed
  await this.updateList(list.id, {
    status: 'completed',
    actualTotal,
    completedAt: new Date(),
  });
}
```

### 6. Shopping History

Track completed trips with spending analytics:

```typescript
readonly monthlySpending = computed(() => {
  const trips = this.trips();
  const monthly = new Map<string, { estimated: number; actual: number; count: number }>();

  for (const trip of trips) {
    const monthKey = trip.completedAt.toDate().toISOString().slice(0, 7);
    const current = monthly.get(monthKey) || { estimated: 0, actual: 0, count: 0 };
    monthly.set(monthKey, {
      estimated: current.estimated + trip.estimatedTotal,
      actual: current.actual + trip.actualTotal,
      count: current.count + 1,
    });
  }

  return monthly;
});
```

## Catalog Data

The catalog includes 200+ Israeli grocery items with Hebrew names and estimated prices:

```typescript
// Sample items from catalog-data.ts
export const CATALOG_ITEMS: CatalogItem[] = [
  // Dairy - מוצרי חלב
  { id: 'milk-3', nameHe: 'חלב 3%', category: 'dairy', defaultUnit: 'liter', defaultQuantity: 1, estimatedPrice: 7, keywords: ['חלב'] },
  { id: 'cottage', nameHe: "קוטג'", category: 'dairy', defaultUnit: 'units', defaultQuantity: 1, estimatedPrice: 8, keywords: ['קוטג', 'גבינה'] },

  // Snacks - חטיפים
  { id: 'bamba', nameHe: 'במבה', category: 'snacks', defaultUnit: 'pack', defaultQuantity: 1, estimatedPrice: 8, keywords: ['במבה', 'חטיף', 'אוסם'] },
  { id: 'bisli', nameHe: 'ביסלי', category: 'snacks', defaultUnit: 'pack', defaultQuantity: 1, estimatedPrice: 8, keywords: ['ביסלי', 'חטיף', 'אוסם'] },

  // ... 200+ more items
];
```

Categories covered:
- **ירקות (Vegetables)**: 25+ items
- **פירות (Fruits)**: 20+ items
- **מוצרי חלב (Dairy)**: 25+ items
- **בשר ודגים (Meat & Fish)**: 20+ items
- **מאפים ולחם (Bakery)**: 15+ items
- **מזווה (Pantry)**: 35+ items
- **קפואים (Frozen)**: 15+ items
- **משקאות (Drinks)**: 20+ items
- **חטיפים (Snacks)**: 15+ items
- **ניקיון (Cleaning)**: 15+ items
- **טיפוח (Personal Care)**: 15+ items
- **תינוקות (Baby)**: 10+ items

## UI Components

### List View Header
```
┌─────────────────────────────────────────┐
│  רשימת קניות                           │
│  ████████████░░░ 75%    סה"כ: ₪142     │
│  [+ הוסף פריט]  [מצב סופר]             │
└─────────────────────────────────────────┘
```

### Category Section
```
┌─────────────────────────────────────────┐
│ 🥬 ירקות                          [▼]  │
├─────────────────────────────────────────┤
│ ☐ עגבניות     2 ק"ג    ₪12       [🗑] │
│ ☐ מלפפונים    1 ק"ג    ₪8        [🗑] │
│ ☑ תפוחים     3 יח'    ₪15       [🗑] │
└─────────────────────────────────────────┘
```

### Supermarket Mode Item
```
┌─────────────────────────────────────────┐
│                                         │
│         עגבניות                        │
│         2 ק"ג  •  ₪12                  │
│                                         │
│         [  ✓  ]                        │
│                                         │
└─────────────────────────────────────────┘
```

### Completion Dialog

A beautifully designed receipt-style dialog with animations:

```
┌┬┬┬┬┬┬┬┬┬┬┬┬┬┬┬┬┬┬┬┬┬┬┬┬┬┬┬┬┬┬┬┬┬┬┬┬┬┬┬┐  ← Decorative zigzag edge
│                                         │
│              ✓ (animated)               │  ← Success badge with
│           סיום הקניות                   │     SVG checkmark animation
│        בואו נסכם את הסיבוב!             │     + shimmer effect
│                                         │
│  ┌──────────────┐  ┌──────────────┐    │
│  │ 🛒  8        │  │ 🚫  2        │    │  ← Stats cards
│  │    נקנו      │  │    דילגנו   │    │     (purchased/skipped)
│  └──────────────┘  └──────────────┘    │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  📊 הערכה           ₪142       │   │  ← Price comparison
│  │  ─ ─ ─ ─ ─ ● ─ ─ ─ ─ ─ ● ─ ─  │   │     section with fancy
│  │  📃 בפועל        [₪ 150    ]   │   │     dashed divider
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  ↑  +₪8                         │   │  ← Difference badge
│  │     מעל ההערכה                  │   │     (color-coded:
│  └─────────────────────────────────┘   │      red/green/gold)
│                                         │
│       [ביטול]    [🎉 סיום!]            │  ← Action buttons with
│                                         │     gradient + shadow
└┴┴┴┴┴┴┴┴┴┴┴┴┴┴┴┴┴┴┴┴┴┴┴┴┴┴┴┴┴┴┴┴┴┴┴┴┴┴┴┘  ← Decorative zigzag edge
```

**Design Features:**
- Receipt-style decorative zigzag edges
- Animated success badge with SVG checkmark stroke animation
- Shimmer effect on the success badge
- Stats cards showing items purchased vs skipped
- Price comparison with fancy dashed divider
- Color-coded difference badge (red for over, green for under, gold pulse for exact)
- Gradient primary button with shadow and hover lift effect
- Staggered fade-in animations for all elements
- Subtle noise texture overlay

## Security Rules

```javascript
// Shopping Lists
match /families/{familyId}/shoppingLists/{listId} {
  allow read: if isFamilyMember(familyId);
  allow write: if canWrite(familyId);
}

// Shopping List Items
match /families/{familyId}/shoppingListItems/{itemId} {
  allow read: if isFamilyMember(familyId);
  allow write: if canWrite(familyId);
}

// Shopping History
match /families/{familyId}/shoppingHistory/{tripId} {
  allow read: if isFamilyMember(familyId);
  allow create: if canWrite(familyId);
  allow update, delete: if false; // History is immutable
}

// Family Catalog (updatable prices)
match /families/{familyId}/catalog/{itemId} {
  allow read: if isFamilyMember(familyId);
  allow write: if canWrite(familyId);
}

// User Favorites
match /users/{userId}/shoppingFavorites/{favoriteId} {
  allow read, write: if request.auth.uid == userId;
}
```

## Implementation Status

### Completed
- Real-time sync with Firestore
- 200+ item catalog with Hebrew names and prices
- Smart categorization by keywords
- Quick-add with autocomplete
- Item picker dialog with batch selection (select multiple items, save all at once)
- Quantity and price editing
- Favorites/staples management
- Supermarket mode with large touch targets
- Wake Lock API for screen-on
- Undo stack (last 5 actions)
- Confetti celebrations
- Shopping history view with monthly summaries
- Redesigned completion dialog (receipt-style with animations)
- Budget tracking (estimated vs actual)
- Monthly spending summaries
- "Finish Shopping" button accessible from main list view (not just supermarket mode)
- Always-visible "Add Items" bar with quick-add search and catalog button
- History button in header for quick access

### Planned
- Drag & drop reordering
- Smart suggestions based on purchase patterns
- Active shoppers presence indicator

## Recent Updates

### Item Picker - Batch Selection
The item picker now supports batch selection for better UX:
- Click items to select/deselect (toggle with visual feedback)
- Selected items show a checkmark and highlighted border
- Footer shows count of selected items
- "Clear" button to reset selection
- "Add to List" button saves all selected items at once
- Only saves to Firestore when dialog is confirmed

### Completion Dialog Redesign
The completion dialog received a major visual overhaul:
- Receipt-style aesthetic with decorative zigzag edges
- Animated SVG checkmark with stroke animation
- Shimmer effect on success badge
- Two stat cards showing purchased vs skipped items
- Fancy dashed divider between estimated and actual prices
- Custom styled input field with terracotta accent
- Color-coded difference badge (red/green/gold with icons)
- Staggered entrance animations
- Gradient buttons with hover effects
- CSS-only spinner for loading state

### List View Improvements
- "Finish Shopping" button always available when items exist
- History icon button in header for quick navigation
- "Add Items" bar always visible (not hidden in empty state)
- Improved empty state messaging

### History View Fixes
- Fixed history not displaying due to missing `completedAt` field
- Client-side sorting with fallback to `createdAt` for older documents
- Proper date handling for monthly spending calculations
