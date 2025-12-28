import { Routes } from '@angular/router';

export const transportationRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./planner-view/planner-view.component').then(
        (m) => m.PlannerViewComponent
      ),
    title: 'לוח הסעות - FamilyOps',
  },
];

export default transportationRoutes;
