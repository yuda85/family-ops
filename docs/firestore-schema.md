# Firestore Schema

Complete database structure for FamilyOps.

## Collections Overview

```
firestore/
├── users/                    # User profiles and preferences
├── families/                 # Family documents
│   ├── {familyId}/members/   # Family members (subcollection)
│   ├── {familyId}/children/  # Family children (subcollection)
│   ├── {familyId}/events/    # Calendar events (subcollection)
│   ├── {familyId}/eventTemplates/  # Recurring event templates
│   ├── {familyId}/shoppingLists/   # Shopping lists
│   └── {familyId}/staples/   # Recurring shopping items
├── invites/                  # Family invite codes
└── shoppingCatalog/          # Global product catalog (read-only)
```

## Users Collection

**Path**: `users/{userId}`

Stores user profile and cross-family data.

```typescript
interface UserDocument {
  // Identity
  id: string;                          // Same as auth UID
  displayName: string;
  email: string;
  photoURL?: string;

  // Family memberships
  familyMemberships: {
    [familyId: string]: FamilyRole;    // 'owner' | 'admin' | 'member' | 'viewer'
  };
  activeFamilyId?: string;             // Currently selected family

  // Preferences
  preferences: {
    theme: 'light' | 'dark' | 'system';
    language: 'he' | 'en';
    notifications: {
      events: boolean;
      shopping: boolean;
      rides: boolean;
    };
  };

  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

## Families Collection

**Path**: `families/{familyId}`

Root document for each family.

```typescript
interface FamilyDocument {
  id: string;
  name: string;
  ownerUserId: string;                 // UID of family owner
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### Members Subcollection

**Path**: `families/{familyId}/members/{userId}`

Family membership records.

```typescript
interface FamilyMember {
  id: string;                          // Same as userId
  displayName: string;
  email: string;
  photoURL?: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  joinedAt: Timestamp;
  invitedBy: string;                   // UID of inviting user
}
```

### Children Subcollection

**Path**: `families/{familyId}/children/{childId}`

Children in the family.

```typescript
interface FamilyChild {
  id: string;
  name: string;
  color: string;                       // Hex color for avatar
  birthYear?: number;
  order: number;                       // Display order
  createdAt: Timestamp;
  createdBy: string;                   // UID of creator
}
```

### Events Subcollection

**Path**: `families/{familyId}/events/{eventId}`

Calendar events.

```typescript
interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  location?: string;

  // Categorization
  category: EventCategory;             // 'school' | 'activity' | 'family' | etc.
  isFamilyEvent: boolean;              // Applies to whole family

  // Timing
  start: Timestamp;
  end: Timestamp;
  isAllDay: boolean;

  // Participants
  childrenIds: string[];               // References to children

  // Rides
  needsRide: boolean;
  driverUserId?: string;
  returnHomeTime?: Timestamp;

  // Recurrence
  recurrence?: {
    type: 'weekly' | 'biweekly' | 'monthly';
    daysOfWeek?: number[];             // 0=Sunday, 6=Saturday
    endDate?: Timestamp;
  };
  templateId?: string;                 // Reference to event template

  // Metadata
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### Event Templates Subcollection

**Path**: `families/{familyId}/eventTemplates/{templateId}`

Templates for recurring events.

```typescript
interface EventTemplate {
  id: string;
  title: string;
  category: EventCategory;
  dayOfWeek: number;                   // 0-6
  startTime: string;                   // "HH:mm"
  endTime: string;                     // "HH:mm"
  childrenIds: string[];
  createdBy: string;
  createdAt: Timestamp;
}
```

### Shopping Lists Subcollection

**Path**: `families/{familyId}/shoppingLists/{listId}`

Shopping lists with embedded items.

```typescript
interface ShoppingList {
  id: string;
  name: string;
  isActive: boolean;                   // Currently in use

  // Embedded items (for atomic updates)
  items: Array<{
    id: string;
    catalogItemId?: string;            // Reference to global catalog
    customName?: string;               // For custom items
    category: ShoppingCategory;
    quantity?: number;
    unit?: string;
    note?: string;
    checked: boolean;
    checkedAt?: Timestamp;
    checkedBy?: string;
  }>;

  // Metadata
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  updatedBy: string;
}
```

### Staples Subcollection

**Path**: `families/{familyId}/staples/{staplesId}`

Recurring shopping items.

```typescript
interface FamilyStaples {
  id: string;
  items: Array<{
    catalogItemId?: string;
    customName?: string;
    category: ShoppingCategory;
    defaultQuantity?: number;
    unit?: string;
  }>;
  updatedAt: Timestamp;
}
```

## Invites Collection

**Path**: `invites/{inviteId}`

Family invite codes (separate collection for security).

```typescript
interface FamilyInvite {
  id: string;
  familyId: string;
  familyName: string;
  role: 'admin' | 'member' | 'viewer'; // Never 'owner'
  createdBy: string;
  createdAt: Timestamp;
  expiresAt: Timestamp;
  usedBy?: string;                     // UID of user who accepted
  usedAt?: Timestamp;
}
```

## Shopping Catalog Collection

**Path**: `shoppingCatalog/{itemId}`

Global product catalog (admin-managed).

```typescript
interface CatalogItem {
  id: string;
  nameHe: string;                      // Hebrew name
  category: ShoppingCategory;
  synonyms?: string[];                 // Alternative names
  icon?: string;                       // Material icon name
  order: number;                       // Display order in category
}
```

## Enums and Types

### FamilyRole
```typescript
type FamilyRole = 'owner' | 'admin' | 'member' | 'viewer';
```

### EventCategory
```typescript
type EventCategory =
  | 'school'      // בית ספר
  | 'activity'    // חוג
  | 'family'      // משפחה
  | 'general'     // כללי
  | 'vacation'    // חופשה
  | 'car'         // רכב
  | 'health'      // בריאות
  | 'other';      // אחר
```

### ShoppingCategory
```typescript
type ShoppingCategory =
  | 'vegetables'  // ירקות ופירות
  | 'dairy'       // מוצרי חלב
  | 'meat'        // בשר ודגים
  | 'bakery'      // מאפים ולחם
  | 'pantry'      // מזווה
  | 'frozen'      // קפואים
  | 'drinks'      // משקאות
  | 'snacks'      // חטיפים
  | 'cleaning'    // ניקיון
  | 'personal'    // טיפוח
  | 'baby'        // תינוקות
  | 'other';      // אחר
```

## Indexes

### Required Composite Indexes

```
families/{familyId}/events
  - category ASC, start ASC
  - childrenIds ARRAY_CONTAINS, start ASC
  - needsRide ASC, start ASC

families/{familyId}/children
  - order ASC

invites
  - familyId ASC, expiresAt DESC
```

## Security Rules Summary

```javascript
// Users: own data only
users/{userId}: read if auth, write if owner

// Families: members only
families/{familyId}: read if member, create if auth, update if admin, delete if owner

// Members: complex rules for join/leave
families/{familyId}/members/{memberId}:
  - read: if family member
  - create: if admin, or self during family creation, or self via invite
  - update: if admin (can't change own role)
  - delete: if admin (can't delete self)

// Content: read if member, write if member+ role
families/{familyId}/children: read if member, write if canWrite
families/{familyId}/events: read if member, write if canWrite
families/{familyId}/shoppingLists: read if member, write if canWrite

// Invites: auth required, role-based actions
invites: read if auth, create if admin, update if accepting, delete if admin

// Catalog: read-only
shoppingCatalog: read if auth, write never
```

## Data Migration Notes

### Version 1.0 Schema
Initial schema as documented above.

### Future Considerations
- Consider separate items subcollection if shopping lists grow large
- May need denormalized child names in events for performance
- Consider event instances collection for recurring events
