# Getting Started

This guide will help you set up FamilyOps for local development.

## Prerequisites

- **Node.js** 20.x or later
- **npm** 10.x or later
- A **Firebase project** with:
  - Authentication (Google provider enabled)
  - Cloud Firestore database
  - Authorized domains configured

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd FamilyOps
```

### 2. Install Dependencies

```bash
npm install
```

If you encounter peer dependency issues:
```bash
npm install --legacy-peer-deps
```

### 3. Configure Firebase

Create or update `src/environments/environment.ts`:

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
    measurementId: 'your-measurement-id', // optional
  },
};
```

For production, also update `src/environments/environment.prod.ts`.

### 4. Configure Firebase Console

#### Enable Authentication
1. Go to Firebase Console → Authentication → Sign-in method
2. Enable Google provider
3. Add your domains to Authorized domains:
   - `localhost`
   - Your production domain

#### Setup Firestore
1. Go to Firebase Console → Firestore Database
2. Create database (start in test mode or configure rules)
3. Deploy the security rules from `firestore.rules`:

```bash
firebase deploy --only firestore:rules
```

Or copy the contents of `firestore.rules` to Firebase Console → Firestore → Rules.

### 5. Start Development Server

```bash
npm start
```

The app runs at **http://localhost:4201**

## First Run

1. Open http://localhost:4201
2. Click "התחבר עם Google" (Sign in with Google)
3. Authorize the application
4. Create your first family or join via invite code
5. Start managing your family!

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start dev server on port 4201 |
| `npm run build` | Build for production |
| `npm run build:prod` | Build with production config |
| `npm test` | Run unit tests |
| `npm run lint` | Lint the codebase |

## Project Configuration

### Angular Configuration

Key settings in `angular.json`:
- **Port**: 4201 (to avoid conflicts)
- **Output path**: `dist/family-ops`
- **Base href**: `/FamilyOps/` (for GitHub Pages)
- **Polyfills**: `zone.js` required

### TypeScript Configuration

Strict mode enabled with:
- `strictNullChecks`
- `strictPropertyInitialization`
- `noImplicitAny`

## Troubleshooting

### "Firebase not initialized" Error
Ensure `initializeFirebase()` is called in `app.config.ts` before any Firebase services are used.

### Google Sign-in Popup Blocked
Add `localhost` to Firebase Console → Authentication → Authorized domains.

### Firestore Permission Denied
Deploy the security rules from `firestore.rules` or temporarily set rules to:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### Zone.js Error
Ensure `"polyfills": ["zone.js"]` is in `angular.json` under build options.

## Next Steps

- Read the [Architecture Guide](./architecture.md) to understand the codebase
- Explore [Feature Documentation](./features/) for specific features
- Check the [API Reference](./api-reference.md) for service details
