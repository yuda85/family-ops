import { Routes } from '@angular/router';

export const topicsRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./topic-list/topic-list.component').then((m) => m.TopicListComponent),
    title: 'נושאים חשובים - FamilyOps',
  },
  {
    path: ':topicId',
    loadComponent: () =>
      import('./topic-detail/topic-detail.component').then((m) => m.TopicDetailComponent),
    title: 'נושא - FamilyOps',
  },
];

export default topicsRoutes;
