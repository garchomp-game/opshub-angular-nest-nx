import { Routes } from '@angular/router';

export const INVOICE_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./invoice-list.component').then((m) => m.InvoiceListComponent),
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./invoice-form.component').then((m) => m.InvoiceFormComponent),
    data: { title: '新規請求書' },
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./invoice-detail.component').then((m) => m.InvoiceDetailComponent),
    data: { title: '請求書詳細' },
  },
  {
    path: ':id/edit',
    loadComponent: () =>
      import('./invoice-form.component').then((m) => m.InvoiceFormComponent),
    data: { title: '請求書編集' },
  },
  {
    path: ':id/print',
    loadComponent: () =>
      import('./invoice-print-view.component').then((m) => m.InvoicePrintViewComponent),
    data: { title: '請求書印刷' },
  },
];
