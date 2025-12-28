# FamilyOps Documentation

A Hebrew-first (RTL) family time-management and smart shopping app built with Angular and Firebase.

## Overview

FamilyOps is designed to help Israeli families manage their daily lives with features for:
- **Family Calendar** - Shared events, activities, and ride coordination
- **Smart Shopping** - Categorized shopping lists with supermarket mode
- **Family Management** - Multiple families, members, and children tracking
- **Theme Support** - Light, dark, and system-based themes

## Quick Links

- [Getting Started](./getting-started.md) - Setup and installation
- [Architecture](./architecture.md) - Technical overview
- [Features](#features)
  - [Authentication](./features/authentication.md)
  - [Family Management](./features/family-management.md)
  - [Calendar](./features/calendar.md)
  - [Shopping](./features/shopping.md)
  - [Settings](./features/settings.md)
- [API Reference](./api-reference.md) - Services and models
- [Firestore Schema](./firestore-schema.md) - Database structure

## Tech Stack

| Technology | Purpose |
|-----------|---------|
| Angular 21+ | Frontend framework with standalone components |
| Firebase Auth | Google OAuth authentication |
| Cloud Firestore | NoSQL database with offline support |
| Angular Material | UI component library |
| TypeScript | Type-safe development |
| SCSS | Styling with CSS custom properties |

## Features

### Authentication
Google OAuth sign-in with automatic user profile creation. Supports session persistence across browser tabs.

### Family Management
- Create and join multiple families
- Invite members via shareable links
- Role-based permissions (Owner, Admin, Member, Viewer)
- Manage children with custom colors

### Calendar
- Month view with Hebrew week layout (Saturday-Friday)
- Event categories with color coding
- Ride coordination for children's activities
- Multi-child event support

### Shopping
- Categorized shopping lists (12 categories)
- Progress tracking with completion percentage
- Supermarket mode for in-store use
- Recurring staples management

### Settings
- Theme preferences (Light/Dark/System)
- Language settings (Hebrew primary)
- Notification preferences

## Project Structure

```
src/
├── app/
│   ├── core/           # Singleton services, guards
│   │   ├── auth/       # Authentication service & guards
│   │   ├── firebase/   # Firebase configuration & Firestore service
│   │   ├── family/     # Family management service
│   │   └── theme/      # Theme service
│   │
│   ├── shared/         # Reusable components
│   │   ├── components/ # Header, BottomNav, EmptyState, etc.
│   │   ├── pipes/      # Date formatting pipes
│   │   └── directives/ # Common directives
│   │
│   ├── features/       # Feature modules (lazy-loaded)
│   │   ├── auth/       # Login flow
│   │   ├── family/     # Family, members, children management
│   │   ├── calendar/   # Calendar views and events
│   │   ├── shopping/   # Shopping lists
│   │   └── settings/   # User preferences
│   │
│   └── layouts/        # Page layouts
│       └── main-layout/ # App shell with navigation
│
├── assets/
│   ├── data/           # Static JSON data
│   ├── i18n/           # Translations
│   └── icons/          # App icons
│
├── environments/       # Environment configs
└── styles/             # Global SCSS
    ├── _variables.scss # Design tokens
    ├── _theme.scss     # Light/dark themes
    ├── _typography.scss # Font definitions
    └── _rtl.scss       # RTL support
```

## Development

### Prerequisites
- Node.js 20+
- npm 10+
- Firebase project with Firestore and Authentication enabled

### Setup
```bash
# Install dependencies
npm install

# Start development server
npm start
# Opens at http://localhost:4201

# Build for production
npm run build
```

### Firebase Configuration
Update `src/environments/environment.ts` with your Firebase config:
```typescript
export const environment = {
  production: false,
  firebase: {
    apiKey: 'your-api-key',
    authDomain: 'your-project.firebaseapp.com',
    projectId: 'your-project-id',
    storageBucket: 'your-project.appspot.com',
    messagingSenderId: 'your-sender-id',
    appId: 'your-app-id',
  },
};
```

## License

Private - All rights reserved.
