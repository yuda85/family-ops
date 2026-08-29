import { Routes } from '@angular/router';

export const settingsRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./settings-home/settings-home.component').then((m) => m.SettingsHomeComponent),
    title: 'הגדרות - FamilyOps',
  },
  {
    path: 'activities',
    loadComponent: () =>
      import('./activities/activities.component').then((m) => m.ActivitiesComponent),
    title: 'חוגים קבועים - FamilyOps',
  },
  {
    path: 'import',
    loadComponent: () =>
      import('./import/import-schedule.component').then((m) => m.ImportScheduleComponent),
    title: 'ייבוא לוז - FamilyOps',
  },
  {
    path: 'profile',
    loadComponent: () => import('./profile/profile.component').then((m) => m.ProfileComponent),
    title: 'הפרופיל שלי - FamilyOps',
  },
];

export default settingsRoutes;
