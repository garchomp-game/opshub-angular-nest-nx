import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { roleGuard } from './core/auth/role.guard';
import { AppShellComponent } from './shared/components/app-shell.component';

export const APP_ROUTES: Routes = [
  // ─── Public ───
  {
    path: 'login',
    loadComponent: () =>
      import('./core/auth/login/login.component').then((m) => m.LoginComponent),
  },

  // ─── Protected ───
  {
    path: '',
    canActivate: [authGuard],
    component: AppShellComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },

      {
        path: 'dashboard',
        data: { title: 'ダッシュボード' },
        loadChildren: () =>
          import('./features/dashboard/dashboard.routes').then((m) => m.DASHBOARD_ROUTES),
      },
      {
        path: 'workflows',
        data: { title: '申請' },
        loadChildren: () =>
          import('./features/workflows/workflows.routes').then((m) => m.WORKFLOW_ROUTES),
      },
      {
        path: 'projects',
        loadChildren: () =>
          import('./features/projects/projects.routes').then((m) => m.PROJECT_ROUTES),
        data: { title: 'プロジェクト' },
      },
      {
        path: 'timesheets',
        loadChildren: () =>
          import('./features/timesheets/timesheets.routes').then((m) => m.TIMESHEET_ROUTES),
        data: { title: '工数' },
      },
      {
        path: 'expenses',
        loadChildren: () =>
          import('./features/expenses/expenses.routes').then((m) => m.EXPENSE_ROUTES),
        data: { title: '経費' },
      },
      {
        path: 'invoices',
        canActivate: [roleGuard],
        data: { roles: ['accounting', 'pm', 'tenant_admin'], title: '請求書' },
        loadChildren: () =>
          import('./features/invoices/invoices.routes').then((m) => m.INVOICE_ROUTES),
      },
      {
        path: 'search',
        loadChildren: () =>
          import('./features/search/search.routes').then((m) => m.SEARCH_ROUTES),
        data: { title: '検索' },
      },
      {
        path: 'admin',
        canActivate: [roleGuard],
        data: { roles: ['tenant_admin', 'it_admin'], title: '管理' },
        loadChildren: () =>
          import('./features/admin/admin.routes').then((m) => m.ADMIN_ROUTES),
      },

      // ─── 404 inside protected shell ───
      {
        path: '**',
        loadComponent: () =>
          import('./shared/components/not-found.component').then((m) => m.NotFoundComponent),
        data: { title: 'ページが見つかりません' },
      },
    ],
  },

  // ─── Public 404 fallback ───
  {
    path: '**',
    loadComponent: () =>
      import('./shared/components/not-found.component').then((m) => m.NotFoundComponent),
  },
];
