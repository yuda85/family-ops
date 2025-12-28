import { Routes } from '@angular/router';

export const settingsRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./profile/profile.component').then((m) => m.ProfileComponent),
    title: 'הגדרות - FamilyOps',
  },
];

export default settingsRoutes;
