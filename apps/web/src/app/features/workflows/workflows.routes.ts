import { Routes } from '@angular/router';
import { roleGuard } from '../../core/auth/role.guard';

export const WORKFLOW_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./workflow-list.component').then((m) => m.WorkflowListComponent),
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./workflow-form.component').then((m) => m.WorkflowFormComponent),
  },
  {
    path: 'pending',
    canActivate: [roleGuard],
    data: { roles: ['approver', 'tenant_admin'] },
    loadComponent: () =>
      import('./workflow-pending.component').then((m) => m.WorkflowPendingComponent),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./workflow-detail.component').then((m) => m.WorkflowDetailComponent),
  },
  {
    path: ':id/edit',
    loadComponent: () =>
      import('./workflow-form.component').then((m) => m.WorkflowFormComponent),
  },
];
