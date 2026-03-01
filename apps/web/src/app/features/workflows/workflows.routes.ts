import { Routes } from '@angular/router';

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
    data: { title: '新規申請' },
  },
  {
    path: 'pending',
    loadComponent: () =>
      import('./workflow-list.component').then((m) => m.WorkflowListComponent),
    data: { title: '承認待ち', defaultMode: 'pending' },
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./workflow-detail.component').then((m) => m.WorkflowDetailComponent),
    data: { title: '申請詳細' },
  },
  {
    path: ':id/edit',
    loadComponent: () =>
      import('./workflow-form.component').then((m) => m.WorkflowFormComponent),
    data: { title: '申請編集' },
  },
];
