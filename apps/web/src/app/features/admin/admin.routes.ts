import { Routes } from '@angular/router';
import { roleGuard } from '../../core/auth/role.guard';

export const ADMIN_ROUTES: Routes = [
  { path: '', redirectTo: 'tenant', pathMatch: 'full' },
  {
    path: 'tenant',
    data: { roles: ['tenant_admin'], title: 'テナント管理' },
    canActivate: [roleGuard],
    loadComponent: () =>
      import('./tenant/tenant-settings.component').then((m) => m.TenantSettingsComponent),
  },
  {
    path: 'users',
    data: { roles: ['tenant_admin'], title: 'ユーザー管理' },
    canActivate: [roleGuard],
    loadComponent: () =>
      import('./users/user-list.component').then((m) => m.UserListComponent),
  },
  {
    path: 'audit-logs',
    data: { roles: ['tenant_admin', 'it_admin'], title: '監査ログ' },
    canActivate: [roleGuard],
    loadComponent: () =>
      import('./audit-logs/audit-log-viewer.component').then((m) => m.AuditLogViewerComponent),
  },
];
