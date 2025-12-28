import { Routes } from '@angular/router';

export default [
  {
    path: '',
    loadComponent: () =>
      import('./dashboard-view/dashboard-view.component').then(
        (m) => m.DashboardViewComponent
      ),
    title: 'דשבורד - FamilyOps',
  },
] satisfies Routes;
