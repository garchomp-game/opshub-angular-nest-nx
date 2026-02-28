import { Routes } from '@angular/router';
import { TimesheetWeeklyComponent } from './timesheet-weekly.component';
import { TimesheetReportComponent } from './timesheet-report.component';

export const TIMESHEET_ROUTES: Routes = [
  { path: '', component: TimesheetWeeklyComponent },
  { path: 'reports', component: TimesheetReportComponent },
];
