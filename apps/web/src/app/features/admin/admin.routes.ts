import { Routes } from '@angular/router';
import { TenantSettingsComponent } from './tenant/tenant-settings.component';
import { UserListComponent } from './users/user-list.component';
import { AuditLogViewerComponent } from './audit-logs/audit-log-viewer.component';

export const ADMIN_ROUTES: Routes = [
  { path: 'tenant', component: TenantSettingsComponent },
  { path: 'users', component: UserListComponent },
  { path: 'audit-logs', component: AuditLogViewerComponent },
  { path: '', redirectTo: 'tenant', pathMatch: 'full' },
];
