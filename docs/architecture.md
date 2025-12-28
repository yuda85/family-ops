# Architecture

This document describes the technical architecture of FamilyOps.

## Overview

FamilyOps is built with Angular 21+ using modern patterns:
- **Standalone Components** - No NgModules required
- **Signal-based State** - Angular's reactive signals API
- **Lazy Loading** - Route-based code splitting
- **Firebase Backend** - Serverless with Firestore

## Application Structure

```
┌─────────────────────────────────────────────────────────┐
│                    Angular Application                   │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │   Layouts   │  │   Features  │  │   Shared    │     │
│  │             │  │             │  │             │     │
│  │ MainLayout  │  │ Dashboard   │  │ Components  │     │
│  │             │  │ Auth        │  │ Pipes       │     │
│  └─────────────┘  │ Family      │  │ Directives  │     │
│                   │ Calendar    │  │             │     │
│                   │ Shopping    │  └─────────────┘     │
│                   │ Topics      │                       │
│                   │ Settings    │                       │
│                   └─────────────┘                       │
├─────────────────────────────────────────────────────────┤
│                      Core Services                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐  │
│  │AuthSvc   │  │FamilySvc │  │FirestoreSvc│ │ThemeSvc│  │
│  └──────────┘  └──────────┘  └──────────┘  └────────┘  │
├─────────────────────────────────────────────────────────┤
│                    Firebase SDK                          │
│  ┌──────────────────┐  ┌──────────────────────────┐    │
│  │  Authentication  │  │  Cloud Firestore         │    │
│  │  (Google OAuth)  │  │  (Persistent Cache)      │    │
│  └──────────────────┘  └──────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

## Core Modules

### Core Services (`src/app/core/`)

Singleton services provided at root level.

#### AuthService
- Manages Firebase Authentication
- Handles Google OAuth flow
- Maintains user session state
- Syncs user document with Firestore

```typescript
// Key signals
readonly firebaseUser = signal<User | null>(null);
readonly user = signal<UserDocument | null>(null);
readonly isAuthenticated = computed(() => !!this._firebaseUser());
readonly userId = computed(() => this._firebaseUser()?.uid ?? null);
```

#### FamilyService
- Manages current family context
- CRUD operations for family, members, children
- Invite system management
- Role-based permission checking

```typescript
// Key signals
readonly currentFamily = signal<FamilyDocument | null>(null);
readonly members = signal<FamilyMember[]>([]);
readonly children = signal<FamilyChild[]>([]);
readonly isOwner = computed(() => this.currentUserRole() === 'owner');
```

#### FirestoreService
- Generic CRUD wrapper for Firestore
- Type-safe document operations
- Real-time subscriptions via Observables
- Batch operations support

#### ThemeService
- Light/Dark/System theme management
- LocalStorage persistence
- System preference detection
- Dynamic CSS variable updates

### Guards

#### authGuard
Protects routes requiring authentication. Redirects to `/auth/login` if not authenticated.

#### familyGuard
Protects routes requiring an active family. Redirects to `/family-select` if no family selected.

#### guestGuard
Prevents authenticated users from accessing login page.

## Feature Modules (`src/app/features/`)

Each feature is lazily loaded for optimal bundle size.

### Routing Structure

```typescript
// app.routes.ts
{
  path: '',
  redirectTo: '/app',
  pathMatch: 'full'
},
{
  path: 'auth',
  loadChildren: () => import('./features/auth/auth.routes')
},
{
  path: 'family-select',
  loadComponent: () => import('./features/family/family-select/...'),
  canActivate: [authGuard]
},
{
  path: 'app',
  loadComponent: () => import('./layouts/main-layout/...'),
  canActivate: [authGuard, familyGuard],
  children: [
    { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    { path: 'dashboard', loadChildren: () => import('./features/dashboard/...') },
    { path: 'calendar', loadChildren: () => import('./features/calendar/...') },
    { path: 'shopping', loadChildren: () => import('./features/shopping/...') },
    { path: 'topics', loadChildren: () => import('./features/topics/...') },
    { path: 'family', loadChildren: () => import('./features/family/...') },
    { path: 'settings', loadChildren: () => import('./features/settings/...') }
  ]
}
```

## State Management

FamilyOps uses Angular Signals for reactive state management.

### Signal Pattern

```typescript
// Private writable signal
private _isLoading = signal(false);

// Public readonly signal
readonly isLoading = this._isLoading.asReadonly();

// Computed signal (derived state)
readonly canEdit = computed(() => {
  const role = this.currentUserRole();
  return role === 'owner' || role === 'admin' || role === 'member';
});

// Updating state
this._isLoading.set(true);
```

### Component State Flow

```
┌──────────────────┐
│   Component      │
│                  │
│  inject(Service) ──────┐
│                  │     │
│  service.data()  │◄────┤  Signal reads
│  service.action()│─────┤  Method calls
│                  │     │
└──────────────────┘     │
                         ▼
┌──────────────────┐    ┌──────────────────┐
│   Service        │    │   Firestore      │
│                  │    │                  │
│  signals         │◄───│  Real-time       │
│  methods         │───►│  updates         │
│                  │    │                  │
└──────────────────┘    └──────────────────┘
```

## Data Flow

### Authentication Flow

```
1. User clicks "Sign in with Google"
2. signInWithPopup() opens Google OAuth
3. On success, Firebase returns user
4. AuthService creates/updates user doc in Firestore
5. Auth state listener updates signals
6. Router navigates to /family-select or /app
```

### Family Selection Flow

```
1. User sees list of their families
2. User clicks a family OR creates new
3. FamilyService.loadFamily() fetches:
   - Family document
   - Members subcollection
   - Children subcollection
4. AuthService.setActiveFamily() updates user doc
5. Router navigates to /app/dashboard
```

## Styling Architecture

### CSS Custom Properties

Theme-aware styling using CSS variables:

```scss
// _theme.scss
:root, [data-theme='light'] {
  --text-primary: #1a1a1a;
  --surface-primary: #ffffff;
  --color-primary: #c4704f;
}

[data-theme='dark'] {
  --text-primary: #f5f5f5;
  --surface-primary: #1e1e1e;
  --color-primary: #e4836a;
}
```

### RTL Support

Full RTL support using logical CSS properties:

```scss
// Use logical properties
margin-inline-start: 1rem;  // Instead of margin-left
padding-inline-end: 1rem;   // Instead of padding-right
inset-inline-start: 0;      // Instead of left
```

### Component Styles

Scoped styles with Angular's view encapsulation:

```typescript
@Component({
  styles: [`
    .container {
      background: var(--surface-primary);
      color: var(--text-primary);
    }
  `]
})
```

## Performance Optimizations

### Lazy Loading
All feature modules are lazy-loaded to reduce initial bundle size.

### Firestore Persistence
Local cache with multi-tab support:
```typescript
db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
});
```

### Computed Signals
Expensive calculations are memoized with computed signals:
```typescript
readonly monthWeeks = computed(() => {
  // Only recalculates when currentDate changes
  return this.generateMonthGrid(this.currentDate());
});
```

### Change Detection
Using signals with OnPush change detection for optimal performance.

## Security

### Authentication
- Google OAuth only (no password storage)
- Session persistence across tabs
- Automatic token refresh

### Firestore Rules
Role-based access control enforced at database level:
```javascript
function isFamilyMember(familyId) {
  return exists(/databases/$(database)/documents/families/$(familyId)/members/$(request.auth.uid));
}

function canWrite(familyId) {
  let role = getFamilyRole(familyId);
  return role == 'owner' || role == 'admin' || role == 'member';
}
```

### XSS Prevention
Angular's built-in sanitization for all user content.

## Testing Strategy

### Unit Tests
- Services: Mock Firebase, test business logic
- Components: Test rendering and interactions
- Guards: Test navigation decisions

### E2E Tests
- Authentication flow
- Family creation and management
- Feature workflows

## Deployment

### GitHub Pages
```yaml
# .github/workflows/deploy.yml
- Build with production config
- Deploy to gh-pages branch
- Hash-based routing for SPA support
```

### Environment Configuration
```typescript
// environment.prod.ts
export const environment = {
  production: true,
  firebase: { ... }
};
```
