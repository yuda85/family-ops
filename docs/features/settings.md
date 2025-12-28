# Settings Feature

User preferences and application settings.

## Overview

The settings feature allows users to customize:
- Theme preferences (Light/Dark/System)
- Language settings
- Notification preferences
- Profile information

## User Flow

```
┌─────────────────────────────────────────────────────────┐
│                     Settings Flow                        │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  /app/settings                                          │
│  ├── Profile Section                                    │
│  │   ├── Display name                                   │
│  │   ├── Profile photo                                  │
│  │   └── Email (read-only)                              │
│  │                                                      │
│  ├── Preferences Section                                │
│  │   ├── Theme (Light/Dark/System)                      │
│  │   ├── Language (Hebrew/English)                      │
│  │   └── Notifications                                  │
│  │                                                      │
│  └── Account Section                                    │
│      └── Logout                                         │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## Routes

| Path | Component | Description |
|------|-----------|-------------|
| `/app/settings` | ProfileComponent | User settings |

## Components

### Profile Component
**Path**: `src/app/features/settings/profile/profile.component.ts`

Main settings page.

**Current Features**:
- Display user profile info
- Theme preference selection
- Placeholder for additional settings

**Planned Features**:
- Edit display name
- Change profile photo
- Language toggle
- Notification settings

## Theme Service

**Path**: `src/app/core/theme/theme.service.ts`

Manages application theming.

### Signals

| Signal | Type | Description |
|--------|------|-------------|
| `theme` | `Theme` | Current theme setting |
| `isDark` | `boolean` | Computed: is dark mode active |

### Methods

```typescript
// Set specific theme
setTheme(theme: Theme): void

// Toggle between light/dark
toggleTheme(): void

// Cycle through all options
cycleTheme(): void

// Get display icon
getThemeIcon(): string

// Get display label (Hebrew)
getThemeLabel(): string
```

### Theme Type

```typescript
type Theme = 'light' | 'dark' | 'system';
```

### Implementation

```typescript
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private _theme = signal<Theme>('system');
  readonly theme = this._theme.asReadonly();

  readonly isDark = computed(() => {
    const theme = this._theme();
    if (theme === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return theme === 'dark';
  });

  constructor() {
    // Load saved theme
    const saved = localStorage.getItem('theme') as Theme;
    if (saved) {
      this._theme.set(saved);
    }

    // Listen for system changes
    window.matchMedia('(prefers-color-scheme: dark)')
      .addEventListener('change', () => this.applyTheme());

    this.applyTheme();
  }

  setTheme(theme: Theme): void {
    this._theme.set(theme);
    localStorage.setItem('theme', theme);
    this.applyTheme();
  }

  toggleTheme(): void {
    this.setTheme(this.isDark() ? 'light' : 'dark');
  }

  cycleTheme(): void {
    const current = this._theme();
    const next = current === 'light' ? 'dark'
               : current === 'dark' ? 'system'
               : 'light';
    this.setTheme(next);
  }

  getThemeIcon(): string {
    switch (this._theme()) {
      case 'light': return 'light_mode';
      case 'dark': return 'dark_mode';
      case 'system': return 'contrast';
    }
  }

  getThemeLabel(): string {
    switch (this._theme()) {
      case 'light': return 'בהיר';
      case 'dark': return 'כהה';
      case 'system': return 'אוטומטי';
    }
  }

  private applyTheme(): void {
    const isDark = this.isDark();
    document.documentElement.setAttribute(
      'data-theme',
      isDark ? 'dark' : 'light'
    );

    // Update mobile meta theme-color
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute('content', isDark ? '#1e1e1e' : '#ffffff');
    }
  }
}
```

## Data Models

### UserPreferences

```typescript
interface UserPreferences {
  theme: Theme;
  language: 'he' | 'en';
  notifications: NotificationSettings;
}
```

### NotificationSettings

```typescript
interface NotificationSettings {
  events: boolean;      // Event reminders
  shopping: boolean;    // Shopping list updates
  rides: boolean;       // Ride coordination
}
```

### Default Preferences

```typescript
const DEFAULT_USER_PREFERENCES: UserPreferences = {
  theme: 'system',
  language: 'he',
  notifications: {
    events: true,
    shopping: true,
    rides: true
  }
};
```

## Theme CSS Variables

### Light Theme
```scss
:root, [data-theme='light'] {
  --text-primary: #1a1a1a;
  --text-secondary: #666666;
  --surface-primary: #ffffff;
  --surface-secondary: #f5f5f5;
  --color-primary: #c4704f;
  --header-bg: #ffffff;
  --border-subtle: #e0e0e0;
}
```

### Dark Theme
```scss
[data-theme='dark'] {
  --text-primary: #f5f5f5;
  --text-secondary: #b0b0b0;
  --surface-primary: #1e1e1e;
  --surface-secondary: #252525;
  --color-primary: #e4836a;
  --header-bg: #1e1e1e;
  --border-subtle: #2a2a2a;
}
```

## UI Components

### Settings Page Layout

```
┌─────────────────────────────────────────┐
│  הגדרות                                │
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  👤 יהודה בכר                   │   │
│  │  yehuda@example.com             │   │
│  │  [ערוך פרופיל]                  │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  ערכת נושא                      │   │
│  │  ○ בהיר  ● כהה  ○ אוטומטי      │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  שפה                            │   │
│  │  ● עברית  ○ English             │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  התראות                         │   │
│  │  ☑ אירועים                      │   │
│  │  ☑ קניות                        │   │
│  │  ☑ הסעות                        │   │
│  └─────────────────────────────────┘   │
│                                         │
│  [התנתק]                                │
│                                         │
└─────────────────────────────────────────┘
```

### Theme Toggle (in Header)

```
┌───────┐
│ 🌙    │  ← Click to cycle: light → dark → system
└───────┘
```

## Current Implementation Status

### Completed ✓
- Theme service with persistence
- Light/Dark/System theme support
- Theme toggle in header
- CSS variables for theming
- System preference detection
- Settings page structure

### In Progress
- Theme selection UI in settings
- Profile display

### Planned
- Edit display name
- Change profile photo
- Language toggle (he/en)
- Notification settings
- Push notification setup
- Data export
- Account deletion

## Usage Examples

### Toggle Theme (Header)
```typescript
themeService = inject(ThemeService);

// In template
<button (click)="themeService.cycleTheme()">
  <mat-icon>{{ themeService.getThemeIcon() }}</mat-icon>
</button>
```

### Set Theme in Settings
```typescript
// In component
selectTheme(theme: Theme): void {
  this.themeService.setTheme(theme);
}

// In template
<mat-radio-group [value]="themeService.theme()" (change)="selectTheme($event.value)">
  <mat-radio-button value="light">בהיר</mat-radio-button>
  <mat-radio-button value="dark">כהה</mat-radio-button>
  <mat-radio-button value="system">אוטומטי</mat-radio-button>
</mat-radio-group>
```

### Update Preferences
```typescript
async updatePreferences(): Promise<void> {
  await this.authService.updateProfile({
    preferences: {
      theme: this.selectedTheme,
      language: this.selectedLanguage,
      notifications: this.notificationSettings
    }
  });
}
```

## Firestore Structure

Preferences are stored in the user document:

```
users/{userId}
├── ...
├── preferences: {
│   ├── theme: 'light' | 'dark' | 'system'
│   ├── language: 'he' | 'en'
│   └── notifications: {
│       ├── events: boolean
│       ├── shopping: boolean
│       └── rides: boolean
│   }
│ }
└── ...
```

## Security

- Users can only update their own preferences
- Theme is also stored in localStorage for immediate access
- Preferences sync across devices via Firestore
