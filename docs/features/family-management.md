# Family Management Feature

Manage families, members, children, and invitations.

## Overview

FamilyOps supports multiple families per user with role-based permissions:
- **Owner**: Full control including deletion
- **Admin**: Manage members and settings
- **Member**: Edit events and shopping
- **Viewer**: Read-only access

## User Flow

```
┌─────────────────────────────────────────────────────────┐
│                   Family Management Flow                 │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌────────────────┐                                     │
│  │ Family Select  │                                     │
│  │                │                                     │
│  │ • View families│                                     │
│  │ • Create new   │                                     │
│  │ • Join via code│                                     │
│  └───────┬────────┘                                     │
│          │                                               │
│          ▼                                               │
│  ┌────────────────────────────────────────────────┐     │
│  │              Main App (with family)            │     │
│  │                                                │     │
│  │  /app/family                                   │     │
│  │  ├── /children  - Manage children              │     │
│  │  ├── /members   - Manage members               │     │
│  │  ├── /settings  - Family settings              │     │
│  │  └── /invite    - Create invites               │     │
│  │                                                │     │
│  └────────────────────────────────────────────────┘     │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## Components

### Family Select
**Path**: `src/app/features/family/family-select/family-select.component.ts`

Entry point after login. Shows:
- List of user's families with roles
- Create new family form
- Join family via invite code

**Views**:
1. **List View**: Shows all families user belongs to
2. **Create View**: Form to create new family
3. **Join View**: Enter invite code to join

### Children Management
**Path**: `src/app/features/family/children/children.component.ts`

Manage children in the family.

**Features**:
- Add child with name and color
- Edit child details
- Delete child
- Color picker with 8 predefined colors

**Child Colors**:
```typescript
const CHILD_COLORS = [
  '#e07a5f', // Terracotta
  '#81b1cb', // Sky Blue
  '#87a878', // Sage Green
  '#a89cc8', // Lavender
  '#f4a261', // Sandy Orange
  '#e9c46a', // Gold
  '#2a9d8f', // Teal
  '#e76f51', // Coral
];
```

### Members Management
**Path**: `src/app/features/family/members/members.component.ts`

Manage family members (admin-only actions).

**Features**:
- View all members with roles
- Change member roles (Owner/Admin/Member/Viewer)
- Remove members (cannot remove self or owner)
- Leave family button (for non-owners)

### Family Settings
**Path**: `src/app/features/family/family-settings/family-settings.component.ts`

Configure family settings.

**Features**:
- Edit family name (admin-only)
- Future: Additional family settings

### Invite System
**Path**: `src/app/features/family/invite/invite.component.ts`

Create and share invite links.

**Features**:
- Generate invite code with role
- Set expiration (default 7 days)
- Copy shareable link
- Link format: `/#/family-select?invite=<code>`

## Services

### FamilyService
**Path**: `src/app/core/family/family.service.ts`

#### Signals

| Signal | Type | Description |
|--------|------|-------------|
| `currentFamily` | `FamilyDocument \| null` | Current family |
| `members` | `FamilyMember[]` | Family members |
| `children` | `FamilyChild[]` | Family children |
| `isLoading` | `boolean` | Loading state |
| `error` | `string \| null` | Error message |
| `familyId` | `string \| null` | Computed: family ID |
| `familyName` | `string \| null` | Computed: family name |
| `currentUserRole` | `FamilyRole \| null` | Computed: user's role |
| `isOwner` | `boolean` | Computed: is owner |
| `isAdmin` | `boolean` | Computed: is owner or admin |
| `canEdit` | `boolean` | Computed: can edit content |
| `sortedChildren` | `FamilyChild[]` | Computed: ordered children |

#### Methods

##### Family Operations

```typescript
// Load family and its data
async loadFamily(familyId: string): Promise<void>

// Create new family (user becomes owner)
async createFamily(data: CreateFamilyData): Promise<string>

// Update family details
async updateFamily(data: Partial<{name: string}>): Promise<void>

// Clear family state
clearFamily(): void
```

##### Child Operations

```typescript
// Add a child
async addChild(data: CreateChildData): Promise<string>

// Update child
async updateChild(childId: string, data: Partial<FamilyChild>): Promise<void>

// Delete child
async deleteChild(childId: string): Promise<void>

// Get child by ID
getChild(childId: string): FamilyChild | undefined

// Get multiple children by IDs
getChildren(childIds: string[]): FamilyChild[]
```

##### Member Operations

```typescript
// Update member's role
async updateMemberRole(memberId: string, role: FamilyRole): Promise<void>

// Remove member from family
async removeMember(memberId: string): Promise<void>

// Leave family (for non-owners)
async leaveFamily(): Promise<void>

// Get member by ID
getMember(memberId: string): FamilyMember | undefined
```

##### Invite Operations

```typescript
// Create invite code
async createInvite(data: CreateInviteData): Promise<string>

// Accept invite and join family
async acceptInvite(inviteId: string): Promise<string>
```

## Data Models

### FamilyDocument
```typescript
interface FamilyDocument {
  id: string;
  name: string;
  ownerUserId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### FamilyMember
```typescript
interface FamilyMember {
  id: string;           // Same as userId
  displayName: string;
  email: string;
  photoURL?: string;
  role: FamilyRole;
  joinedAt: Timestamp;
  invitedBy: string;    // userId who invited
}
```

### FamilyChild
```typescript
interface FamilyChild {
  id: string;
  name: string;
  color: string;        // Hex color
  birthYear?: number;
  order: number;
  createdAt: Timestamp;
  createdBy: string;
}
```

### FamilyInvite
```typescript
interface FamilyInvite {
  id: string;
  familyId: string;
  familyName: string;
  role: FamilyRole;
  createdBy: string;
  createdAt: Timestamp;
  expiresAt: Timestamp;
  usedBy?: string;
  usedAt?: Timestamp;
}
```

### CreateFamilyData
```typescript
interface CreateFamilyData {
  name: string;
}
```

### CreateChildData
```typescript
interface CreateChildData {
  name: string;
  color?: string;       // Auto-assigned if not provided
  birthYear?: number;
}
```

### CreateInviteData
```typescript
interface CreateInviteData {
  familyId: string;
  familyName: string;
  role: FamilyRole;
  expiresInDays?: number;  // Default: 7
}
```

## Firestore Structure

### Families Collection
```
families/{familyId}
├── name: string
├── ownerUserId: string
├── createdAt: Timestamp
└── updatedAt: Timestamp
```

### Members Subcollection
```
families/{familyId}/members/{userId}
├── displayName: string
├── email: string
├── photoURL?: string
├── role: FamilyRole
├── joinedAt: Timestamp
└── invitedBy: string
```

### Children Subcollection
```
families/{familyId}/children/{childId}
├── name: string
├── color: string
├── birthYear?: number
├── order: number
├── createdAt: Timestamp
└── createdBy: string
```

### Invites Collection
```
invites/{inviteId}
├── familyId: string
├── familyName: string
├── role: FamilyRole
├── createdBy: string
├── createdAt: Timestamp
├── expiresAt: Timestamp
├── usedBy?: string
└── usedAt?: Timestamp
```

## Permission Matrix

| Action | Owner | Admin | Member | Viewer |
|--------|-------|-------|--------|--------|
| View family | ✓ | ✓ | ✓ | ✓ |
| Edit family name | ✓ | ✓ | - | - |
| Delete family | ✓ | - | - | - |
| View members | ✓ | ✓ | ✓ | ✓ |
| Invite members | ✓ | ✓ | - | - |
| Change roles | ✓ | ✓ | - | - |
| Remove members | ✓ | ✓ | - | - |
| View children | ✓ | ✓ | ✓ | ✓ |
| Add children | ✓ | ✓ | ✓ | - |
| Edit children | ✓ | ✓ | ✓ | - |
| Delete children | ✓ | ✓ | ✓ | - |

## Security Rules

```javascript
// Families
match /families/{familyId} {
  allow read: if isFamilyMember(familyId);
  allow create: if isAuthenticated();
  allow update: if isFamilyAdmin(familyId);
  allow delete: if isFamilyOwner(familyId);

  // Members subcollection
  match /members/{memberId} {
    allow read: if isFamilyMember(familyId);
    allow create: if isFamilyAdmin(familyId) ||
      // Owner creating their own member doc during family creation
      (isOwner(memberId) && get(.../families/$(familyId)).data.ownerUserId == request.auth.uid) ||
      // Self-join via invite
      (isOwner(memberId) && resource == null);
    allow update: if isFamilyAdmin(familyId) &&
      // Can't change own role
      !(memberId == request.auth.uid && request.resource.data.role != resource.data.role);
    allow delete: if isFamilyAdmin(familyId) && memberId != request.auth.uid;
  }

  // Children subcollection
  match /children/{childId} {
    allow read: if isFamilyMember(familyId);
    allow write: if canWrite(familyId);  // owner, admin, or member
  }
}

// Invites
match /invites/{inviteId} {
  allow read: if isAuthenticated();
  allow create: if isAuthenticated() &&
    isFamilyAdmin(request.resource.data.familyId);
  allow update: if isAuthenticated() &&
    resource.data.usedBy == null &&
    request.resource.data.usedBy == request.auth.uid;
  allow delete: if isAuthenticated() &&
    isFamilyAdmin(resource.data.familyId);
}
```

## Usage Examples

### Create a Family
```typescript
const familyService = inject(FamilyService);

await familyService.createFamily({ name: 'משפחת כהן' });
// User is automatically set as owner
// Navigates to family select
```

### Add a Child
```typescript
await familyService.addChild({
  name: 'יעל',
  color: '#e07a5f',  // Optional: auto-assigned if not provided
  birthYear: 2015,   // Optional
});
```

### Generate Invite Link
```typescript
const inviteId = await familyService.createInvite({
  familyId: familyService.familyId()!,
  familyName: familyService.familyName()!,
  role: 'member',
  expiresInDays: 7,
});

const inviteUrl = `${window.location.origin}/#/family-select?invite=${inviteId}`;
```

### Join via Invite
```typescript
// From URL: /#/family-select?invite=abc123
const inviteCode = route.queryParams['invite'];

if (inviteCode) {
  const familyId = await familyService.acceptInvite(inviteCode);
  router.navigate(['/app']);
}
```
