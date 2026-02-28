import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap, catchError, throwError } from 'rxjs';

export interface TimesheetEntry {
  id: string;
  projectId: string;
  taskId?: string;
  workDate: string;
  hours: number;
  note?: string;
  project: { id: string; name: string };
  task?: { id: string; title: string } | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface WeeklyTimesheets {
  weekStart: string;
  entries: TimesheetEntry[];
}

export interface ProjectSummary {
  projectId: string;
  projectName: string;
  totalHours: number;
  entryCount: number;
}

export interface UserSummary {
  userId: string;
  userName: string;
  totalHours: number;
  entryCount: number;
}

export interface BulkUpsertRequest {
  entries: {
    id?: string;
    projectId: string;
    taskId?: string;
    workDate: string;
    hours: number;
    note?: string;
  }[];
  deletedIds?: string[];
}

export interface SummaryQuery {
  dateFrom: string;
  dateTo: string;
  projectIds?: string[];
  unit?: 'month' | 'week' | 'day';
}

export interface ExportQuery {
  dateFrom: string;
  dateTo: string;
  projectId?: string;
}

@Injectable({ providedIn: 'root' })
export class TimesheetService {
  private http = inject(HttpClient);

  // ─── State ───
  private _weeklyEntries = signal<TimesheetEntry[]>([]);
  private _isLoading = signal(false);
  private _error = signal<string | null>(null);
  private _weekStart = signal<string>('');

  // ─── Public Signals (readonly) ───
  readonly weeklyEntries = this._weeklyEntries.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly weekStart = this._weekStart.asReadonly();

  readonly weeklyTotal = computed(() =>
    this._weeklyEntries().reduce((sum, e) => sum + e.hours, 0),
  );

  // ─── Weekly ───

  loadWeekly(weekStart: string): void {
    this._isLoading.set(true);
    this._error.set(null);
    this._weekStart.set(weekStart);

    this.http
      .get<WeeklyTimesheets>('/api/timesheets/weekly', {
        params: new HttpParams().set('weekStart', weekStart),
      })
      .subscribe({
        next: (res) => {
          this._weeklyEntries.set(res.entries);
          this._isLoading.set(false);
        },
        error: (err) => {
          this._error.set(err.error?.error?.message || 'データの取得に失敗しました');
          this._isLoading.set(false);
        },
      });
  }

  // ─── Upsert ───

  upsert(request: BulkUpsertRequest): Observable<TimesheetEntry[]> {
    this._isLoading.set(true);
    return this.http
      .put<TimesheetEntry[]>('/api/timesheets/bulk', request)
      .pipe(
        tap((entries) => {
          // Reload weekly data after save
          const ws = this._weekStart();
          if (ws) this.loadWeekly(ws);
        }),
        catchError((err) => {
          this._isLoading.set(false);
          return throwError(() => err);
        }),
      );
  }

  // ─── Summary ───

  getProjectSummary(query: SummaryQuery): Observable<ProjectSummary[]> {
    let params = new HttpParams()
      .set('dateFrom', query.dateFrom)
      .set('dateTo', query.dateTo);

    if (query.projectIds?.length) {
      query.projectIds.forEach((id) => {
        params = params.append('projectIds', id);
      });
    }
    if (query.unit) params = params.set('unit', query.unit);

    return this.http.get<ProjectSummary[]>(
      '/api/timesheets/summary/by-project',
      { params },
    );
  }

  getUserSummary(query: SummaryQuery): Observable<UserSummary[]> {
    let params = new HttpParams()
      .set('dateFrom', query.dateFrom)
      .set('dateTo', query.dateTo);

    if (query.projectIds?.length) {
      query.projectIds.forEach((id) => {
        params = params.append('projectIds', id);
      });
    }
    if (query.unit) params = params.set('unit', query.unit);

    return this.http.get<UserSummary[]>(
      '/api/timesheets/summary/by-member',
      { params },
    );
  }

  // ─── CSV Export ───

  exportCsv(query: ExportQuery): void {
    let params = new HttpParams()
      .set('dateFrom', query.dateFrom)
      .set('dateTo', query.dateTo);

    if (query.projectId) params = params.set('projectId', query.projectId);

    this.http
      .get('/api/timesheets/export', {
        params,
        responseType: 'blob',
      })
      .subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `timesheets_${query.dateFrom}_${query.dateTo}.csv`;
          a.click();
          window.URL.revokeObjectURL(url);
        },
        error: (err) => {
          this._error.set('CSVのダウンロードに失敗しました');
        },
      });
  }
}
