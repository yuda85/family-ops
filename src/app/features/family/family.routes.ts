import { Routes } from '@angular/router';

export const familyRoutes: Routes = [
  {
    path: '',
    redirectTo: 'children',
    pathMatch: 'full',
  },
  {
    path: 'children',
    loadComponent: () =>
      import('./children/children.component').then((m) => m.ChildrenComponent),
    title: 'הילדים - FamilyOps',
  },
  {
    path: 'members',
    loadComponent: () =>
      import('./members/members.component').then((m) => m.MembersComponent),
    title: 'חברי משפחה - FamilyOps',
  },
  {
    path: 'settings',
    loadComponent: () =>
      import('./family-settings/family-settings.component').then(
        (m) => m.FamilySettingsComponent
      ),
    title: 'הגדרות משפחה - FamilyOps',
  },
  {
    path: 'invite',
    loadComponent: () =>
      import('./invite/invite.component').then((m) => m.InviteComponent),
    title: 'הזמנה למשפחה - FamilyOps',
  },
];

export default familyRoutes;
