import { Routes } from '@angular/router';
import { ExpenseListComponent } from './expense-list.component';
import { ExpenseFormComponent } from './expense-form.component';
import { ExpenseSummaryComponent } from './expense-summary.component';

export const EXPENSE_ROUTES: Routes = [
    { path: '', component: ExpenseListComponent },
    { path: 'new', component: ExpenseFormComponent },
    { path: 'summary', component: ExpenseSummaryComponent },
];
