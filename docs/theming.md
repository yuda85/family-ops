# FamilyOps Theme System

This document describes the theme switching system used in FamilyOps, including CSS custom properties, dark mode implementation, and Angular Material overrides.

## Overview

FamilyOps supports three theme modes:
- **Light** - Explicit light theme
- **Dark** - Explicit dark theme
- **System** - Follows user's OS preference

## Architecture

### Files Structure

```
src/styles/
├── _variables.scss    # SCSS variables (colors, spacing, fonts)
├── _theme.scss        # CSS custom properties & Material overrides
├── _typography.scss   # Font definitions
├── _mixins.scss       # Reusable SCSS mixins
└── _rtl.scss          # RTL-specific styles

src/app/core/theme/
└── theme.service.ts   # Theme switching logic
```

## Theme Service

Located at `src/app/core/theme/theme.service.ts`

### API

```typescript
// Get current theme
themeService.theme()  // Signal<'light' | 'dark' | 'system'>

// Set theme
themeService.setTheme('dark')

// Cycle through themes (light → dark → system → light)
themeService.cycleTheme()

// Get display label (Hebrew)
themeService.getThemeLabel()  // 'בהיר' | 'כהה' | 'מערכת'

// Get icon for current theme
themeService.getThemeIcon()  // 'light_mode' | 'dark_mode' | 'contrast'
```

### Storage

Theme preference is stored in `localStorage` under the key `theme`.

### Implementation

The service sets `data-theme` attribute on `<html>` element:
- `data-theme="light"` - Force light mode
- `data-theme="dark"` - Force dark mode
- No attribute - System preference (uses `prefers-color-scheme` media query)

## CSS Custom Properties

### Color Variables

Defined in `src/styles/_theme.scss` under `:root`:

#### Surface Colors
```scss
--surface-app        // Main app background
--surface-primary    // Card/container background
--surface-secondary  // Secondary surfaces (headers, sidebars)
--surface-tertiary   // Input backgrounds in dark mode
--surface-hover      // Hover state background
--surface-overlay    // Modal backdrop
```

#### Text Colors
```scss
--text-primary       // Main text color
--text-secondary     // Muted text
--text-tertiary      // Placeholder text
--text-disabled      // Disabled state text
--text-on-primary    // Text on primary color backgrounds
--text-on-colored    // Text on colored backgrounds
```

#### Border Colors
```scss
--border-subtle      // Subtle borders (cards, inputs)
--border-default     // Standard borders
--border-strong      // Emphasized borders
```

#### Brand Colors
```scss
--color-primary           // Primary brand color (#4F46E5)
--color-primary-light     // Lighter variant
--color-primary-alpha     // Semi-transparent primary
--color-secondary         // Secondary color
--color-success           // Success state (#10B981)
--color-warning           // Warning state (#F59E0B)
--color-error             // Error state (#EF4444)
```

#### Component-Specific
```scss
--header-bg          // Header background
--sidebar-bg         // Sidebar background
--modal-bg           // Dialog/modal background
--tooltip-bg         // Tooltip background
--tooltip-text       // Tooltip text color
```

### Light Mode Values (Default)

```scss
:root {
  --surface-app: #f8fafc;
  --surface-primary: #ffffff;
  --text-primary: #1e293b;
  --border-subtle: #e2e8f0;
  // ... etc
}
```

### Dark Mode Values

Applied via two selectors for comprehensive coverage:

```scss
// 1. Explicit dark mode
[data-theme='dark'] {
  --surface-app: #0f0f0f;
  --surface-primary: #1a1a1a;
  --text-primary: #f1f5f9;
  --border-subtle: #2a2a2a;
  // ... etc
}

// 2. System preference (when no explicit theme set)
@media (prefers-color-scheme: dark) {
  :root:not([data-theme='light']) {
    // Same dark values
  }
}
```

## Angular Material Overrides

### Global Material Styles

In `_theme.scss`, Material components are styled globally:

```scss
// Form fields
.mat-mdc-form-field {
  --mdc-outlined-text-field-outline-color: var(--border-subtle);
  --mdc-outlined-text-field-input-text-color: var(--text-primary);
  // ... etc
}

// Buttons
.mat-mdc-button {
  --mdc-text-button-label-text-color: var(--text-primary);
}

// Dialogs
.mat-mdc-dialog-container {
  --mdc-dialog-container-color: var(--modal-bg);
}
```

### Dark Mode Material Overrides

Both `[data-theme='dark']` and `@media (prefers-color-scheme: dark)` sections contain Material-specific overrides:

```scss
[data-theme='dark'] {
  // Buttons
  .mat-mdc-button,
  .mat-mdc-outlined-button {
    --mdc-text-button-label-text-color: var(--text-primary);
  }

  // Icon buttons
  .mat-mdc-icon-button {
    --mdc-icon-button-icon-color: var(--text-primary);
  }

  // Form fields
  .mat-mdc-form-field {
    --mdc-outlined-text-field-outline-color: var(--border-subtle);
    // Softer styling for dark mode
    .mdc-notched-outline__leading,
    .mdc-notched-outline__notch,
    .mdc-notched-outline__trailing {
      border-color: var(--border-subtle) !important;
    }
  }

  // Dialog title
  [mat-dialog-title],
  .mat-mdc-dialog-title {
    color: var(--text-primary) !important;
  }

  // Button toggle
  .mat-button-toggle-group {
    --mat-standard-button-toggle-text-color: var(--text-primary);
    --mat-standard-button-toggle-background-color: var(--surface-secondary);
  }

  // Sidenav
  .mat-sidenav,
  .mat-drawer {
    background-color: var(--sidebar-bg) !important;
  }

  // Nav list items
  .mat-mdc-nav-list .mat-mdc-list-item {
    --mdc-list-item-label-text-color: var(--text-primary);
  }
}
```

## Component-Level Dark Mode

Some components need additional dark mode styles. Use CSS custom properties:

```scss
// In component.scss
.my-component {
  background: var(--surface-primary);
  color: var(--text-primary);
  border: 1px solid var(--border-subtle);

  &:hover {
    background: var(--surface-hover);
  }
}
```

For Material components within a component, use `::ng-deep`:

```scss
::ng-deep mat-button-toggle-group {
  background: var(--surface-secondary);

  .mat-button-toggle-label-content {
    color: var(--text-primary);
  }

  .mat-button-toggle-checked {
    background: var(--color-primary);

    .mat-button-toggle-label-content {
      color: var(--text-on-primary);
    }
  }
}
```

## Adding New Dark Mode Styles

When adding new components or fixing dark mode issues:

1. **Use CSS custom properties** - Always use `var(--property-name)` instead of hardcoded colors

2. **Update both dark mode sections** - Changes must go in:
   - `[data-theme='dark']` block (~line 449 in _theme.scss)
   - `@media (prefers-color-scheme: dark)` block (~line 529 in _theme.scss)

3. **Test both modes** - Toggle between explicit dark mode and system preference

### Common Properties for Dark Mode

| Element | Property | Light Value | Dark Value |
|---------|----------|-------------|------------|
| Text | `--text-primary` | #1e293b | #f1f5f9 |
| Background | `--surface-primary` | #ffffff | #1a1a1a |
| Input background | `--surface-tertiary` | #f1f5f9 | #2a2a2a |
| Borders | `--border-subtle` | #e2e8f0 | #2a2a2a |
| Borders (hover) | `--border-default` | #cbd5e1 | #404040 |

## Fonts

Hebrew-first design with two font families:

```scss
$font-family-hebrew: 'Heebo', sans-serif;    // Body text, UI
$font-family-display: 'Rubik', sans-serif;   // Headlines, logo
```

Apply via CSS custom properties:
```scss
font-family: var(--font-family-hebrew);
font-family: var(--font-family-display);
```

## Troubleshooting

### Element not visible in dark mode

1. Check if element uses hardcoded colors
2. Replace with CSS custom properties
3. Add override in both dark mode sections if needed

### Material component not styled

1. Find the correct CSS custom property (use browser DevTools)
2. Override in `[data-theme='dark']` section
3. Copy to `@media (prefers-color-scheme: dark)` section

### Specificity issues

Use `!important` sparingly for Material overrides:
```scss
.mat-mdc-dialog-title {
  color: var(--text-primary) !important;
}
```

## Example: Adding Dark Mode to New Component

```scss
// my-component.component.scss

.my-card {
  // Use CSS variables - automatically adapts to theme
  background: var(--surface-primary);
  color: var(--text-primary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);

  .card-title {
    color: var(--text-primary);
    font-family: var(--font-family-hebrew);
  }

  .card-subtitle {
    color: var(--text-secondary);
  }

  &:hover {
    background: var(--surface-hover);
    border-color: var(--border-default);
  }
}
```
