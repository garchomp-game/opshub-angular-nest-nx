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
  {
    path: 'forgot-password',
    loadComponent: () =>
      import('./core/auth/forgot-password/forgot-password.component').then(
        (m) => m.ForgotPasswordComponent,
      ),
  },
  {
    path: 'reset-password',
    loadComponent: () =>
      import('./core/auth/reset-password/reset-password.component').then(
        (m) => m.ResetPasswordComponent,
      ),
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
        canActivate: [roleGuard],
        loadChildren: () =>
          import('./features/timesheets/timesheets.routes').then((m) => m.TIMESHEET_ROUTES),
        data: { roles: ['member', 'approver', 'pm', 'tenant_admin'], title: '工数' },
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
      {
        path: 'notifications',
        data: { title: '通知' },
        loadChildren: () =>
          import('./features/notifications/notifications.routes').then((m) => m.NOTIFICATION_ROUTES),
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

  // ─── Public 404 fallback (実質到達不能: protected ** + authGuard が先にマッチ) ───
  {
    path: '**',
    loadComponent: () =>
      import('./shared/components/not-found.component').then((m) => m.NotFoundComponent),
  },
];
