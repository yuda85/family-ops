import { Routes } from '@angular/router';

export const budgetRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./budget-dashboard/budget-dashboard.component').then(
        (m) => m.BudgetDashboardComponent
      ),
    title: 'תקציב - FamilyOps',
  },
  {
    path: 'setup',
    loadComponent: () =>
      import('./budget-setup/budget-setup.component').then(
        (m) => m.BudgetSetupComponent
      ),
    title: 'הגדרת תקציב - FamilyOps',
  },
  {
    path: 'categories',
    loadComponent: () =>
      import('./category-config/category-config-list.component').then(
        (m) => m.CategoryConfigListComponent
      ),
    title: 'קטגוריות תקציב - FamilyOps',
  },
  {
    path: 'occasional',
    loadComponent: () =>
      import('./occasional-expenses/occasional-list.component').then(
        (m) => m.OccasionalListComponent
      ),
    title: 'הוצאות חד פעמיות - FamilyOps',
  },
  {
    path: 'close-month',
    loadComponent: () =>
      import('./close-month/close-month-wizard.component').then(
        (m) => m.CloseMonthWizardComponent
      ),
    title: 'סגירת חודש - FamilyOps',
  },
  {
    path: 'history',
    loadComponent: () =>
      import('./budget-history/budget-history.component').then(
        (m) => m.BudgetHistoryComponent
      ),
    title: 'היסטוריית תקציב - FamilyOps',
  },
];

export default budgetRoutes;
