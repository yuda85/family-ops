import { Routes } from '@angular/router';

export const calendarRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./calendar-view/calendar-view.component').then(
        (m) => m.CalendarViewComponent
      ),
    title: 'יומן - FamilyOps',
  },
  {
    path: 'event/:id',
    loadComponent: () =>
      import('./event-detail/event-detail.component').then(
        (m) => m.EventDetailComponent
      ),
    title: 'אירוע - FamilyOps',
  },
  {
    path: 'rides',
    loadComponent: () =>
      import('./rides-view/rides-view.component').then(
        (m) => m.RidesViewComponent
      ),
    title: 'הסעות - FamilyOps',
  },
];

export default calendarRoutes;
