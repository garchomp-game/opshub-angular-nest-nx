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
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./invoice-detail.component').then((m) => m.InvoiceDetailComponent),
  },
  {
    path: ':id/edit',
    loadComponent: () =>
      import('./invoice-form.component').then((m) => m.InvoiceFormComponent),
  },
  {
    path: ':id/print',
    loadComponent: () =>
      import('./invoice-print-view.component').then((m) => m.InvoicePrintViewComponent),
  },
];
