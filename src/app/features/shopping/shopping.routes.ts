import { Routes } from '@angular/router';

export const shoppingRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./list-view/list-view.component').then((m) => m.ListViewComponent),
    title: 'קניות - FamilyOps',
  },
  {
    path: 'supermarket/:id',
    loadComponent: () =>
      import('./supermarket-mode/supermarket-mode.component').then(
        (m) => m.SupermarketModeComponent
      ),
    title: 'מצב סופר - FamilyOps',
  },
  {
    path: 'staples',
    loadComponent: () =>
      import('./staples/staples.component').then((m) => m.StaplesComponent),
    title: 'מוצרים קבועים - FamilyOps',
  },
];

export default shoppingRoutes;
