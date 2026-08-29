import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/auth/auth.guard';
import { familyGuard } from './core/family/family.guard';
import { environment } from '../environments/environment';

export const routes: Routes = [
  // Landing page (for non-authenticated users)
  {
    path: '',
    loadComponent: () =>
      import('./features/landing/landing.component').then((m) => m.LandingComponent),
    canActivate: [guestGuard],
    pathMatch: 'full',
    title: 'FamilyOps - ניהול משפחתי חכם',
  },

  // Auth routes (public)
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes'),
  },

  // Family selection (requires auth but not family)
  {
    path: 'family-select',
    loadComponent: () =>
      import('./features/family/family-select/family-select.component').then(
        (m) => m.FamilySelectComponent
      ),
    canActivate: [authGuard],
    title: 'בחירת משפחה - FamilyOps',
  },

  // Accept invite (public - handles auth internally)
  {
    path: 'accept-invite/:inviteId',
    loadComponent: () =>
      import('./features/family/accept-invite/accept-invite.component').then(
        (m) => m.AcceptInviteComponent
      ),
    title: 'קבל הזמנה - FamilyOps',
  },

  // Main app routes (requires auth and family)
  {
    path: 'app',
    loadComponent: () =>
      import('./layouts/main-layout/main-layout.component').then((m) => m.MainLayoutComponent),
    canActivate: [authGuard, familyGuard],
    children: [
      { path: '', redirectTo: 'today', pathMatch: 'full' },
      {
        path: 'today',
        loadComponent: () =>
          import('./features/today/today.component').then((m) => m.TodayComponent),
        title: 'היום - FamilyOps',
      },
      {
        path: 'week',
        loadComponent: () => import('./features/week/week.component').then((m) => m.WeekComponent),
        title: 'השבוע - FamilyOps',
      },
      {
        path: 'family',
        loadChildren: () => import('./features/family/family.routes'),
      },
      {
        path: 'settings',
        loadChildren: () => import('./features/settings/settings.routes'),
      },
    ],
  },

  // Development-only visual harness for the Today screen.
  ...(environment.production
    ? []
    : [
        {
          path: 'preview/today',
          loadComponent: () =>
            import('./features/preview/today-preview.component').then(
              (m) => m.TodayPreviewComponent
            ),
          title: 'תצוגה מקדימה - היום',
        },
        {
          path: 'preview/presence',
          loadComponent: () =>
            import('./features/preview/presence-preview.component').then(
              (m) => m.PresencePreviewComponent
            ),
          title: 'תצוגה מקדימה - מי בבית היום',
        },
        {
          path: 'preview/availability',
          loadComponent: () =>
            import('./features/preview/availability-preview.component').then(
              (m) => m.AvailabilityPreviewComponent
            ),
          title: 'תצוגה מקדימה - מי בבית',
        },
        {
          path: 'preview/import',
          loadComponent: () =>
            import('./features/preview/import-preview.component').then(
              (m) => m.ImportPreviewComponent
            ),
          title: 'תצוגה מקדימה - ייבוא',
        },
        {
          path: 'preview/settings',
          loadComponent: () =>
            import('./features/preview/settings-preview.component').then(
              (m) => m.SettingsPreviewComponent
            ),
          title: 'תצוגה מקדימה - הגדרות',
        },
        {
          path: 'preview/activities',
          loadComponent: () =>
            import('./features/preview/activities-preview.component').then(
              (m) => m.ActivitiesPreviewComponent
            ),
          title: 'תצוגה מקדימה - חוגים',
        },
        {
          path: 'preview/week',
          loadComponent: () =>
            import('./features/preview/week-preview.component').then(
              (m) => m.WeekPreviewComponent
            ),
          title: 'תצוגה מקדימה - השבוע',
        },
      ]),

  // Catch-all redirect
  {
    path: '**',
    redirectTo: 'app',
  },
];
