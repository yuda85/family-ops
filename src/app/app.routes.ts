import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { familyGuard } from './core/family/family.guard';

export const routes: Routes = [
  // Default redirect
  {
    path: '',
    redirectTo: 'app',
    pathMatch: 'full',
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
      import('./layouts/main-layout/main-layout.component').then(
        (m) => m.MainLayoutComponent
      ),
    canActivate: [authGuard, familyGuard],
    children: [
      {
        path: '',
        redirectTo: 'calendar',
        pathMatch: 'full',
      },
      {
        path: 'calendar',
        loadChildren: () => import('./features/calendar/calendar.routes'),
      },
      {
        path: 'shopping',
        loadChildren: () => import('./features/shopping/shopping.routes'),
      },
      {
        path: 'topics',
        loadChildren: () => import('./features/topics/topics.routes'),
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

  // Catch-all redirect
  {
    path: '**',
    redirectTo: 'app',
  },
];
