import { Routes } from '@angular/router';
import { ExpenseListComponent } from './expense-list.component';
import { ExpenseFormComponent } from './expense-form.component';
import { ExpenseSummaryComponent } from './expense-summary.component';

export const EXPENSE_ROUTES: Routes = [
  { path: '', component: ExpenseListComponent },
  { path: 'new', component: ExpenseFormComponent, data: { title: '新規経費' } },
  { path: 'summary', component: ExpenseSummaryComponent, data: { title: '経費サマリー' } },
];
