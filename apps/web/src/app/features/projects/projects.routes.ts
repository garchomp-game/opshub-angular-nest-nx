import { Routes } from '@angular/router';

export const PROJECT_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./project-list.component').then((m) => m.ProjectListComponent),
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./project-form.component').then((m) => m.ProjectFormComponent),
    data: { title: '新規プロジェクト' },
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./project-detail.component').then((m) => m.ProjectDetailComponent),
    data: { title: 'プロジェクト詳細' },
  },
  {
    path: ':id/tasks',
    loadComponent: () =>
      import('./kanban-board.component').then((m) => m.KanbanBoardComponent),
    data: { title: 'タスクボード' },
  },
  {
    path: ':id/documents',
    loadComponent: () =>
      import('./documents/document-list.component').then((m) => m.DocumentListComponent),
    data: { title: 'ドキュメント' },
  },
];
