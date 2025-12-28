# FamilyOps 👨‍👩‍👧‍👦

אפליקציית ניהול זמן משפחתי חכמה - Hebrew-first RTL family management app.

## Features

- **יומן משפחתי** - Calendar with event categories, child assignments, and ride coordination
- **רשימת קניות** - Smart shopping list with Hebrew catalog and supermarket mode
- **ניהול ילדים** - Children management with color coding
- **תמיכה במשפחות מרובות** - Multi-family support with invitations and roles
- **מצב כהה/בהיר** - Light/dark mode with system preference detection
- **RTL תמיכה מלאה** - Full right-to-left Hebrew support

## Tech Stack

- **Frontend**: Angular 21 (standalone components, signals)
- **UI Library**: Angular Material
- **Backend**: Firebase (Auth, Firestore)
- **Styling**: SCSS with CSS custom properties
- **Deployment**: GitHub Pages

## Getting Started

### Prerequisites

- Node.js 20+
- npm 10+
- Firebase project

### Installation

1. Clone the repository:
```bash
git clone https://github.com/YOUR_USERNAME/FamilyOps.git
cd FamilyOps
```

2. Install dependencies:
```bash
npm install --legacy-peer-deps
```

3. Configure Firebase:

   Create a Firebase project at [Firebase Console](https://console.firebase.google.com/).

   Update `src/environments/environment.ts` and `src/environments/environment.prod.ts` with your Firebase config:

```typescript
export const environment = {
  production: false,
  firebase: {
    apiKey: 'YOUR_API_KEY',
    authDomain: 'YOUR_PROJECT_ID.firebaseapp.com',
    projectId: 'YOUR_PROJECT_ID',
    storageBucket: 'YOUR_PROJECT_ID.appspot.com',
    messagingSenderId: 'YOUR_MESSAGING_SENDER_ID',
    appId: 'YOUR_APP_ID',
  },
  // ...
};
```

4. Start the development server:
```bash
npm start
```

The app will be available at `http://localhost:4201`

### Firebase Setup

1. Enable **Email/Password** authentication in Firebase Console
2. Create a Firestore database
3. Deploy security rules from `firestore.rules`

## Development

```bash
# Start dev server on port 4201
npm start

# Build for production
npm run build:prod

# Deploy to GitHub Pages
npm run deploy
```

## Project Structure

```
src/
├── app/
│   ├── core/           # Singleton services, guards
│   │   ├── auth/       # Authentication
│   │   ├── firebase/   # Firebase config
│   │   ├── family/     # Family management
│   │   └── theme/      # Theme service
│   ├── shared/         # Reusable components
│   ├── features/       # Feature modules
│   │   ├── auth/       # Login, register
│   │   ├── calendar/   # Calendar views
│   │   ├── shopping/   # Shopping list
│   │   ├── family/     # Family management
│   │   └── settings/   # User settings
│   └── layouts/        # Layout components
├── assets/
│   └── data/           # Static data (catalog, holidays)
├── environments/       # Environment configs
└── styles/             # Global SCSS
```

## Deployment

### GitHub Pages (Automatic)

Push to `main` or `master` branch - GitHub Actions will automatically build and deploy.

### Manual Deployment

```bash
npm run deploy
```

## Firestore Security Rules

The app requires specific security rules. See the plan document for the complete rules.

Key points:
- Users can only access families they're members of
- Only owners/admins can manage family settings
- Members can create/edit events and shopping lists
- Viewers are read-only

## License

MIT

---

Built with ❤️ for Israeli families
