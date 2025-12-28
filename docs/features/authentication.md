# Authentication Feature

FamilyOps uses Google OAuth for authentication via Firebase Authentication.

## Overview

- **Provider**: Google OAuth 2.0
- **Backend**: Firebase Authentication
- **Session**: Persistent across browser tabs
- **Flow**: Popup-based sign-in

## User Flow

```
┌─────────────────────────────────────────────────────────┐
│                    Authentication Flow                   │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────┐    ┌──────────┐    ┌──────────────────┐  │
│  │  Login   │───►│  Google  │───►│  Firebase Auth   │  │
│  │  Page    │    │  OAuth   │    │                  │  │
│  └──────────┘    └──────────┘    └────────┬─────────┘  │
│                                            │            │
│                                            ▼            │
│  ┌──────────────────┐    ┌─────────────────────────┐   │
│  │  Family Select   │◄───│  Create User Document   │   │
│  │  or /app         │    │  (if new user)          │   │
│  └──────────────────┘    └─────────────────────────┘   │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## Components

### Login Component
**Path**: `src/app/features/auth/login/login.component.ts`

**Features**:
- Google sign-in button with logo
- Theme toggle (light/dark/system)
- Error message display
- Loading state during authentication
- Redirect to `returnUrl` or `/family-select`

**Template Structure**:
```html
<div class="login-container">
  <div class="login-card">
    <div class="app-logo">👨‍👩‍👧‍👦</div>
    <h1>FamilyOps</h1>
    <p>ניהול זמן משפחתי חכם</p>

    <button (click)="signInWithGoogle()">
      <svg><!-- Google logo --></svg>
      התחבר עם Google
    </button>

    <div class="error">{{ error }}</div>
  </div>
</div>
```

## Services

### AuthService
**Path**: `src/app/core/auth/auth.service.ts`

#### Signals

| Signal | Type | Description |
|--------|------|-------------|
| `firebaseUser` | `User \| null` | Firebase user object |
| `user` | `UserDocument \| null` | Firestore user document |
| `isLoading` | `boolean` | Loading state |
| `error` | `string \| null` | Error message |
| `isAuthenticated` | `boolean` | Computed: has user |
| `userId` | `string \| null` | Computed: user ID |
| `displayName` | `string \| null` | Computed: display name |
| `photoURL` | `string \| null` | Computed: profile photo |
| `activeFamilyId` | `string \| null` | Computed: current family |

#### Methods

##### `signInWithGoogle(): Promise<void>`
Opens Google OAuth popup and handles sign-in.

```typescript
async signInWithGoogle(): Promise<void> {
  this._isLoading.set(true);
  this._error.set(null);

  try {
    const result = await signInWithPopup(this.auth, this.googleProvider);
    // Background: create/update user document
    this.ensureUserDocument(result.user).catch(console.warn);
  } catch (error) {
    this._error.set(this.getErrorMessage(error.code));
    throw error;
  } finally {
    this._isLoading.set(false);
  }
}
```

##### `logout(): Promise<void>`
Signs out the current user.

##### `updateProfile(data): Promise<void>`
Updates user profile in Firestore.

##### `setActiveFamily(familyId): Promise<void>`
Sets the user's active family.

##### `addFamilyMembership(familyId, role): Promise<void>`
Adds a family membership to user's record.

##### `removeFamilyMembership(familyId): Promise<void>`
Removes a family membership.

##### `getFamilyRole(familyId): FamilyRole | null`
Returns user's role in a specific family.

##### `isFamilyMember(familyId): boolean`
Checks if user is member of a family.

## Guards

### authGuard
**Path**: `src/app/core/auth/auth.guard.ts`

Protects routes requiring authentication.

```typescript
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoading()) {
    // Wait for auth to initialize
    return new Promise((resolve) => {
      const checkAuth = () => {
        if (!authService.isLoading()) {
          if (authService.isAuthenticated()) {
            resolve(true);
          } else {
            router.navigate(['/auth/login'], {
              queryParams: { returnUrl: state.url }
            });
            resolve(false);
          }
        } else {
          setTimeout(checkAuth, 50);
        }
      };
      checkAuth();
    });
  }

  if (authService.isAuthenticated()) {
    return true;
  }

  router.navigate(['/auth/login'], {
    queryParams: { returnUrl: state.url }
  });
  return false;
};
```

### guestGuard
Prevents authenticated users from accessing login page.

```typescript
export const guestGuard: CanActivateFn = (route, state) => {
  // Redirects to /app if already authenticated
};
```

## Data Models

### UserDocument
```typescript
interface UserDocument {
  id: string;
  displayName: string;
  email: string;
  photoURL?: string;
  familyMemberships: Record<string, FamilyRole>;
  activeFamilyId?: string;
  preferences: UserPreferences;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### UserPreferences
```typescript
interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: 'he' | 'en';
  notifications: {
    events: boolean;
    shopping: boolean;
    rides: boolean;
  };
}
```

### FamilyRole
```typescript
type FamilyRole = 'owner' | 'admin' | 'member' | 'viewer';
```

## Firestore Structure

### Users Collection
```
users/{userId}
├── displayName: string
├── email: string
├── photoURL?: string
├── familyMemberships: {
│   [familyId]: FamilyRole
│ }
├── activeFamilyId?: string
├── preferences: UserPreferences
├── createdAt: Timestamp
└── updatedAt: Timestamp
```

## Error Handling

The service translates Firebase error codes to Hebrew messages:

| Error Code | Hebrew Message |
|------------|----------------|
| `auth/popup-closed-by-user` | החלון נסגר לפני השלמת ההתחברות |
| `auth/popup-blocked` | החלון נחסם. אנא אפשר חלונות קופצים |
| `auth/cancelled-popup-request` | בקשת ההתחברות בוטלה |
| `auth/network-request-failed` | שגיאת רשת. בדוק את החיבור לאינטרנט |
| `auth/too-many-requests` | יותר מדי ניסיונות. נסה שוב מאוחר יותר |
| Default | אירעה שגיאה. נסה שוב |

## Configuration

### Firebase Auth Setup
1. Enable Google provider in Firebase Console
2. Add authorized domains:
   - `localhost` (development)
   - Your production domain

### Google Provider Configuration
```typescript
private googleProvider = new GoogleAuthProvider();

constructor() {
  this.googleProvider.setCustomParameters({
    prompt: 'select_account', // Always show account picker
  });
}
```

## Security Considerations

1. **No Password Storage** - Google handles all credential management
2. **Token Security** - Firebase SDK handles token refresh automatically
3. **Session Persistence** - Uses `browserLocalPersistence` for cross-tab sessions
4. **Firestore Rules** - User can only read/write their own document

### Firestore Security Rules
```javascript
match /users/{userId} {
  allow read: if request.auth != null;
  allow create: if request.auth.uid == userId;
  allow update: if request.auth.uid == userId &&
    !request.resource.data.diff(resource.data)
      .affectedKeys().hasAny(['createdAt']);
}
```
