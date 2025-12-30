import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/auth/auth.guard';
import { familyGuard } from './core/family/family.guard';

export const routes: Routes = [
  // Landing page (for non-authenticated users)
  {
    path: '',
    loadComponent: () =>
      import('./features/landing/landing.component').then(
        (m) => m.LandingComponent
      ),
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
      import('./layouts/main-layout/main-layout.component').then(
        (m) => m.MainLayoutComponent
      ),
    canActivate: [authGuard, familyGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
      {
        path: 'dashboard',
        loadChildren: () => import('./features/dashboard/dashboard.routes'),
      },
      {
        path: 'calendar',
        loadChildren: () => import('./features/calendar/calendar.routes'),
      },
      {
        path: 'transportation',
        loadChildren: () => import('./features/transportation/transportation.routes'),
      },
      {
        path: 'shopping',
        loadChildren: () => import('./features/shopping/shopping.routes'),
      },
      {
        path: 'budget',
        loadChildren: () => import('./features/budget/budget.routes'),
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
