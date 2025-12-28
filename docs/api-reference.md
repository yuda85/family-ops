# API Reference

Complete reference for FamilyOps services and their methods.

## Core Services

### AuthService

**Path**: `src/app/core/auth/auth.service.ts`

Manages authentication and user state.

#### Signals


| Name | Type | Description |
|------|------|-------------|
| `firebaseUser` | `Signal<User \| null>` | Firebase Auth user object |
| `user` | `Signal<UserDocument \| null>` | Firestore user document |
| `isLoading` | `Signal<boolean>` | Loading state |
| `error` | `Signal<string \| null>` | Error message (Hebrew) |
| `isAuthenticated` | `Signal<boolean>` | Computed: has authenticated user |
| `userId` | `Signal<string \| null>` | Computed: current user ID |
| `userEmail` | `Signal<string \| null>` | Computed: user email |
| `displayName` | `Signal<string \| null>` | Computed: display name |
| `photoURL` | `Signal<string \| null>` | Computed: profile photo URL |
| `activeFamilyId` | `Signal<string \| null>` | Computed: active family ID |

#### Methods

##### `signInWithGoogle(): Promise<void>`
Signs in with Google OAuth popup.
- Throws: Authentication errors
- Side effects: Creates user document if new user

##### `logout(): Promise<void>`
Signs out the current user.
- Clears user document signal

##### `updateProfile(data): Promise<void>`
Updates user profile in Firestore.
```typescript
updateProfile(data: Partial<Pick<UserDocument, 'displayName' | 'photoURL' | 'preferences'>>): Promise<void>
```

##### `setActiveFamily(familyId: string): Promise<void>`
Sets the user's active family.

##### `addFamilyMembership(familyId: string, role: FamilyRole): Promise<void>`
Adds a family membership to user's record.

##### `removeFamilyMembership(familyId: string): Promise<void>`
Removes a family membership.

##### `getFamilyRole(familyId: string): FamilyRole | null`
Returns user's role in a specific family.

##### `isFamilyMember(familyId: string): boolean`
Checks if user is member of a family.

##### `clearError(): void`
Clears the error signal.

---

### FamilyService

**Path**: `src/app/core/family/family.service.ts`

Manages family, members, and children.

#### Signals

| Name | Type | Description |
|------|------|-------------|
| `currentFamily` | `Signal<FamilyDocument \| null>` | Current family document |
| `members` | `Signal<FamilyMember[]>` | Family members list |
| `children` | `Signal<FamilyChild[]>` | Family children list |
| `isLoading` | `Signal<boolean>` | Loading state |
| `error` | `Signal<string \| null>` | Error message (Hebrew) |
| `familyId` | `Signal<string \| null>` | Computed: family ID |
| `familyName` | `Signal<string \| null>` | Computed: family name |
| `currentUserRole` | `Signal<FamilyRole \| null>` | Computed: user's role |
| `isOwner` | `Signal<boolean>` | Computed: is owner |
| `isAdmin` | `Signal<boolean>` | Computed: is owner or admin |
| `canEdit` | `Signal<boolean>` | Computed: can edit content |
| `sortedChildren` | `Signal<FamilyChild[]>` | Computed: ordered by `order` |

#### Family Methods

##### `loadFamily(familyId: string): Promise<void>`
Loads family document, members, and children.

##### `createFamily(data: CreateFamilyData): Promise<string>`
Creates a new family. User becomes owner.
```typescript
interface CreateFamilyData {
  name: string;
}
```
Returns: New family ID

##### `updateFamily(data): Promise<void>`
Updates family details (admin only).
```typescript
updateFamily(data: Partial<Pick<FamilyDocument, 'name'>>): Promise<void>
```

##### `clearFamily(): void`
Clears current family state.

#### Child Methods

##### `addChild(data: CreateChildData): Promise<string>`
Adds a child to the family.
```typescript
interface CreateChildData {
  name: string;
  color?: string;      // Auto-assigned if not provided
  birthYear?: number;
}
```
Returns: New child ID

##### `updateChild(childId: string, data): Promise<void>`
Updates child details.
```typescript
updateChild(childId: string, data: Partial<Pick<FamilyChild, 'name' | 'color' | 'birthYear' | 'order'>>): Promise<void>
```

##### `deleteChild(childId: string): Promise<void>`
Deletes a child.

##### `getChild(childId: string): FamilyChild | undefined`
Gets a child by ID from current state.

##### `getChildren(childIds: string[]): FamilyChild[]`
Gets multiple children by IDs.

#### Member Methods

##### `updateMemberRole(memberId: string, role: FamilyRole): Promise<void>`
Updates a member's role (admin only).
- Cannot change own role
- Cannot change owner's role

##### `removeMember(memberId: string): Promise<void>`
Removes a member (admin only).
- Cannot remove self
- Cannot remove owner

##### `leaveFamily(): Promise<void>`
Leave the current family (non-owners only).

##### `getMember(memberId: string): FamilyMember | undefined`
Gets a member by ID from current state.

#### Invite Methods

##### `createInvite(data: CreateInviteData): Promise<string>`
Creates an invite code (admin only).
```typescript
interface CreateInviteData {
  familyId: string;
  familyName: string;
  role: FamilyRole;
  expiresInDays?: number;  // Default: 7
}
```
Returns: Invite ID

##### `acceptInvite(inviteId: string): Promise<string>`
Accepts an invite and joins family.
Returns: Family ID

---

### FirestoreService

**Path**: `src/app/core/firebase/firestore.service.ts`

Generic Firestore CRUD operations.

#### Document Methods

##### `getDocRef<T>(path: string): DocumentReference<T>`
Gets a Firestore document reference.

##### `getDocument<T>(path: string): Promise<T | null>`
Gets a single document.

##### `getDocument$<T>(path: string): Observable<T | null>`
Gets a document with real-time updates.

##### `setDocument<T>(path: string, data: T, merge?: boolean): Promise<void>`
Creates or overwrites a document.
- Adds `updatedAt` timestamp automatically

##### `updateDocument<T>(path: string, data: Partial<T>): Promise<void>`
Updates specific fields.
- Adds `updatedAt` timestamp automatically

##### `deleteDocument(path: string): Promise<void>`
Deletes a document.

#### Collection Methods

##### `getCollectionRef<T>(path: string): CollectionReference<T>`
Gets a Firestore collection reference.

##### `getCollection<T>(path: string, ...constraints: QueryConstraint[]): Promise<T[]>`
Gets all documents in a collection.

##### `getCollection$<T>(path: string, ...constraints: QueryConstraint[]): Observable<T[]>`
Gets collection with real-time updates.

##### `createDocument<T>(collectionPath: string, data: T): Promise<string>`
Creates document with auto-generated ID.
- Adds `createdAt` and `updatedAt` timestamps
- Returns: Document ID

#### Batch Operations

##### `batchWrite(operations): Promise<void>`
Executes multiple operations atomically.
```typescript
batchWrite(operations: Array<{
  type: 'set' | 'update' | 'delete';
  path: string;
  data?: any;
}>): Promise<void>
```

#### Utility Methods

##### `generateId(collectionPath: string): string`
Generates a new document ID.

##### `toTimestamp(date: Date): Timestamp`
Converts Date to Firestore Timestamp.

##### `fromTimestamp(timestamp: Timestamp): Date`
Converts Firestore Timestamp to Date.

##### `getServerTimestamp(): FieldValue`
Gets server timestamp placeholder.

---

### ThemeService

**Path**: `src/app/core/theme/theme.service.ts`

Manages application theming.

#### Signals

| Name | Type | Description |
|------|------|-------------|
| `theme` | `Signal<Theme>` | Current theme setting |
| `isDark` | `Signal<boolean>` | Computed: is dark mode active |

#### Methods

##### `setTheme(theme: Theme): void`
Sets specific theme.
```typescript
type Theme = 'light' | 'dark' | 'system';
```

##### `toggleTheme(): void`
Toggles between light and dark.

##### `cycleTheme(): void`
Cycles through: light → dark → system → light

##### `getThemeIcon(): string`
Returns Material icon name for current theme.
- `'light_mode'` | `'dark_mode'` | `'contrast'`

##### `getThemeLabel(): string`
Returns Hebrew label for current theme.
- `'בהיר'` | `'כהה'` | `'אוטומטי'`

---

## Guards

### authGuard

**Path**: `src/app/core/auth/auth.guard.ts`

```typescript
export const authGuard: CanActivateFn
```

Protects routes requiring authentication.
- Waits for auth to initialize
- Redirects to `/auth/login` with `returnUrl` query param

### guestGuard

```typescript
export const guestGuard: CanActivateFn
```

Prevents authenticated users from accessing login page.
- Redirects to `/app` if authenticated

### familyGuard

**Path**: `src/app/core/family/family.guard.ts`

```typescript
export const familyGuard: CanActivateFn
```

Requires active family selection.
- Redirects to `/family-select` if no active family

---

## Exported Query Helpers

From `firestore.service.ts`:

```typescript
export { where, orderBy, limit, Timestamp, serverTimestamp };
```

### Usage Example

```typescript
import { where, orderBy } from '../firebase/firestore.service';

// Query events for a specific child
const events = await firestoreService.getCollection<CalendarEvent>(
  `families/${familyId}/events`,
  where('childrenIds', 'array-contains', childId),
  orderBy('start', 'asc')
);
```

---

## Helper Functions

### getNextChildColor

**Path**: `src/app/core/family/family.models.ts`

```typescript
function getNextChildColor(usedColors: string[]): string
```

Returns the next available color from the palette.

### hasPermission

**Path**: `src/app/core/auth/auth.models.ts`

```typescript
function hasPermission(role: FamilyRole, permission: Permission): boolean
```

Checks if a role has a specific permission.

---

## Error Handling

Services translate Firebase errors to Hebrew messages:

| Error Code | Hebrew Message |
|------------|----------------|
| `auth/popup-closed-by-user` | החלון נסגר לפני השלמת ההתחברות |
| `auth/popup-blocked` | החלון נחסם. אנא אפשר חלונות קופצים |
| `auth/network-request-failed` | שגיאת רשת. בדוק את החיבור לאינטרנט |
| `permission-denied` | אין לך הרשאה לפעולה זו |
| Default | אירעה שגיאה. נסה שוב |

---

## Type Definitions

All types are exported from their respective model files:

- `src/app/core/auth/auth.models.ts`
- `src/app/core/family/family.models.ts`
- `src/app/features/calendar/calendar.models.ts`
- `src/app/features/shopping/shopping.models.ts`
