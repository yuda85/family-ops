# Shopping Feature

Smart shopping lists with categories, supermarket mode, and recurring staples.

## Overview

The shopping feature provides:
- Categorized shopping lists
- Progress tracking
- Supermarket mode for in-store use
- Recurring staples management
- Shared lists for the family

## User Flow

```
┌─────────────────────────────────────────────────────────┐
│                     Shopping Flow                        │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  /app/shopping                                          │
│  ├── List View (default)                                │
│  │   ├── View items by category                         │
│  │   ├── Check/uncheck items                            │
│  │   ├── Add items (from catalog or custom)             │
│  │   └── Clear checked items                            │
│  │                                                      │
│  ├── /shopping/supermarket/:id                          │
│  │   └── Large touch targets                            │
│  │   └── One-tap check-off                              │
│  │                                                      │
│  └── /shopping/staples                                  │
│      └── Manage recurring items                         │
│      └── Quick-add to list                              │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## Routes

| Path | Component | Description |
|------|-----------|-------------|
| `/app/shopping` | ListViewComponent | Main shopping list |
| `/app/shopping/supermarket/:id` | SupermarketModeComponent | In-store mode |
| `/app/shopping/staples` | StaplesComponent | Recurring items |

## Components

### List View
**Path**: `src/app/features/shopping/list-view/list-view.component.ts`

Main shopping list display.

**Features**:
- Items grouped by category
- Collapsible category sections
- Checkbox for each item
- Progress bar showing completion
- Delete individual items
- Clear all checked items
- FAB to add items

**Progress Calculation**:
```typescript
readonly progress = computed(() => {
  const items = this.items();
  if (items.length === 0) return 0;
  const checked = items.filter(i => i.checked).length;
  return Math.round((checked / items.length) * 100);
});
```

**Category Grouping**:
```typescript
readonly groupedItems = computed(() => {
  const items = this.items();
  const groups: Map<string, ShoppingItem[]> = new Map();

  for (const item of items) {
    const category = item.category;
    if (!groups.has(category)) {
      groups.set(category, []);
    }
    groups.get(category)!.push(item);
  }

  return groups;
});
```

### Catalog Picker (Planned)
**Path**: `src/app/features/shopping/catalog-picker/catalog-picker.component.ts`

Browse and select items from catalog.

**Planned Features**:
- Search by Hebrew name
- Browse by category
- Recently used items
- Custom item entry

### Supermarket Mode (Planned)
**Path**: `src/app/features/shopping/supermarket-mode/supermarket-mode.component.ts`

Optimized for in-store use.

**Planned Features**:
- Large touch targets
- One-tap check-off
- Category sections
- Screen stays on
- Quick undo

### Staples Management (Planned)
**Path**: `src/app/features/shopping/staples/staples.component.ts`

Manage recurring items.

**Planned Features**:
- Add items to staples list
- Default quantities
- Quick-add all staples to current list
- Edit/remove staples

## Data Models

### ShoppingItem
```typescript
interface ShoppingItem {
  id: string;
  catalogItemId?: string;    // Reference to catalog item
  customName?: string;       // For custom items
  name: string;              // Display name (from catalog or custom)
  category: ShoppingCategory;
  quantity?: number;
  unit?: string;
  note?: string;
  checked: boolean;
  checkedAt?: Timestamp;
  checkedBy?: string;
  createdAt: Timestamp;
  createdBy: string;
}
```

### ShoppingCategory
```typescript
type ShoppingCategory =
  | 'vegetables'    // ירקות ופירות
  | 'dairy'         // מוצרי חלב
  | 'meat'          // בשר ודגים
  | 'bakery'        // מאפים ולחם
  | 'pantry'        // מזווה
  | 'frozen'        // קפואים
  | 'drinks'        // משקאות
  | 'snacks'        // חטיפים
  | 'cleaning'      // ניקיון
  | 'personal'      // טיפוח
  | 'baby'          // תינוקות
  | 'other';        // אחר
```

### Category Metadata
```typescript
const SHOPPING_CATEGORIES = {
  vegetables: {
    label: 'ירקות ופירות',
    icon: 'local_florist',
    order: 1
  },
  dairy: {
    label: 'מוצרי חלב',
    icon: 'egg',
    order: 2
  },
  meat: {
    label: 'בשר ודגים',
    icon: 'restaurant',
    order: 3
  },
  bakery: {
    label: 'מאפים ולחם',
    icon: 'bakery_dining',
    order: 4
  },
  pantry: {
    label: 'מזווה',
    icon: 'kitchen',
    order: 5
  },
  frozen: {
    label: 'קפואים',
    icon: 'ac_unit',
    order: 6
  },
  drinks: {
    label: 'משקאות',
    icon: 'local_cafe',
    order: 7
  },
  snacks: {
    label: 'חטיפים',
    icon: 'cookie',
    order: 8
  },
  cleaning: {
    label: 'ניקיון',
    icon: 'cleaning_services',
    order: 9
  },
  personal: {
    label: 'טיפוח',
    icon: 'spa',
    order: 10
  },
  baby: {
    label: 'תינוקות',
    icon: 'child_friendly',
    order: 11
  },
  other: {
    label: 'אחר',
    icon: 'more_horiz',
    order: 12
  }
};
```

### ShoppingList
```typescript
interface ShoppingList {
  id: string;
  name: string;
  isActive: boolean;
  items: ShoppingItem[];
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  updatedBy: string;
}
```

### StaplesItem
```typescript
interface StaplesItem {
  catalogItemId?: string;
  customName?: string;
  category: ShoppingCategory;
  defaultQuantity?: number;
  unit?: string;
}
```

### CatalogItem (Global)
```typescript
interface CatalogItem {
  id: string;
  nameHe: string;
  category: ShoppingCategory;
  synonyms?: string[];    // Alternative names for search
  icon?: string;
  order: number;          // Display order within category
}
```

## Firestore Structure

### Shopping Lists Subcollection
```
families/{familyId}/shoppingLists/{listId}
├── name: string
├── isActive: boolean
├── items: ShoppingItem[]     // Embedded array for performance
├── createdBy: string
├── createdAt: Timestamp
├── updatedAt: Timestamp
└── updatedBy: string
```

### Staples Subcollection
```
families/{familyId}/staples/{staplesId}
├── items: StaplesItem[]
└── updatedAt: Timestamp
```

### Global Catalog (Read-only)
```
shoppingCatalog/{itemId}
├── nameHe: string
├── category: ShoppingCategory
├── synonyms?: string[]
├── icon?: string
└── order: number
```

## UI Components

### List View Header
```
┌─────────────────────────────────────────┐
│  רשימת קניות                           │
│  ████████████░░░ 75%                   │
│  [מצב סופר] [נקה מסומנים]              │
└─────────────────────────────────────────┘
```

### Category Section
```
┌─────────────────────────────────────────┐
│ 🥬 ירקות ופירות                   [▼]  │
├─────────────────────────────────────────┤
│ ☐ עגבניות          2 ק"ג         [🗑] │
│ ☐ מלפפונים         1 ק"ג         [🗑] │
│ ☑ תפוחים          3 יח'         [🗑] │
└─────────────────────────────────────────┘
```

### Supermarket Mode Item
```
┌─────────────────────────────────────────┐
│                                         │
│         עגבניות                        │
│         2 ק"ג                          │
│                                         │
│         [  ✓  ]                        │
│                                         │
└─────────────────────────────────────────┘
```

## Current Implementation Status

### Completed ✓
- List view with category grouping
- Checkbox toggle for items
- Progress bar calculation
- Delete individual items
- Clear checked items
- Collapsible categories
- Responsive design
- Demo data display

### In Progress
- Firestore integration
- Real-time sync

### Planned
- Add item dialog
- Catalog picker
- Custom item entry
- Supermarket mode
- Staples management
- Share list
- Quantity editing
- Sort by category order
- Search/filter items

## Usage Examples

### Toggle Item (Current)
```typescript
toggleItem(item: ShoppingItem): void {
  item.checked = !item.checked;
}
```

### Delete Item (Current)
```typescript
deleteItem(id: string): void {
  const items = this.items();
  const index = items.findIndex(i => i.id === id);
  if (index > -1) {
    items.splice(index, 1);
  }
}
```

### Clear Checked (Current)
```typescript
clearChecked(): void {
  const unchecked = this.items().filter(i => !i.checked);
  this.items.set(unchecked);
}
```

### Add Item (Planned)
```typescript
async addItem(item: CreateItemData): Promise<void> {
  const listId = this.activeListId();
  await this.firestoreService.updateDocument(
    `families/${familyId}/shoppingLists/${listId}`,
    {
      items: arrayUnion({
        id: generateId(),
        ...item,
        checked: false,
        createdAt: serverTimestamp(),
        createdBy: userId
      })
    }
  );
}
```

### Add Staples to List (Planned)
```typescript
async addStaplesToList(listId: string): Promise<void> {
  const staples = await this.getStaples();
  const newItems = staples.map(s => ({
    id: generateId(),
    catalogItemId: s.catalogItemId,
    customName: s.customName,
    category: s.category,
    quantity: s.defaultQuantity,
    unit: s.unit,
    checked: false
  }));

  await this.firestoreService.updateDocument(
    `families/${familyId}/shoppingLists/${listId}`,
    { items: arrayUnion(...newItems) }
  );
}
```

## Security Rules

```javascript
// Shopping Lists
match /families/{familyId}/shoppingLists/{listId} {
  allow read: if isFamilyMember(familyId);
  allow write: if canWrite(familyId);
}

// Staples
match /families/{familyId}/staples/{staplesId} {
  allow read: if isFamilyMember(familyId);
  allow write: if canWrite(familyId);
}

// Global Catalog (admin-only writes)
match /shoppingCatalog/{itemId} {
  allow read: if isAuthenticated();
  allow write: if false;  // Admin via console only
}
```

## Sample Catalog Data

```json
{
  "items": [
    { "nameHe": "חלב", "category": "dairy", "synonyms": ["חלב תנובה"] },
    { "nameHe": "ביצים", "category": "dairy" },
    { "nameHe": "לחם", "category": "bakery" },
    { "nameHe": "עגבניות", "category": "vegetables" },
    { "nameHe": "מלפפונים", "category": "vegetables" },
    { "nameHe": "תפוחים", "category": "vegetables" },
    { "nameHe": "עוף", "category": "meat" },
    { "nameHe": "בשר טחון", "category": "meat" },
    { "nameHe": "מים מינרליים", "category": "drinks" },
    { "nameHe": "נייר טואלט", "category": "cleaning" }
  ]
}
```
