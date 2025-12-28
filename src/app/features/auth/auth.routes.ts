import { Routes } from '@angular/router';
import { guestGuard } from '../../core/auth/auth.guard';

export const authRoutes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./login/login.component').then((m) => m.LoginComponent),
    canActivate: [guestGuard],
    title: 'התחברות - FamilyOps',
  },
];

export default authRoutes;
