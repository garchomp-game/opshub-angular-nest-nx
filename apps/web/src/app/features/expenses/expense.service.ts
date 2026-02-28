import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap, catchError, throwError } from 'rxjs';

// ─── Interfaces ───

export interface Expense {
  id: string;
  category: string;
  amount: number;
  expenseDate: string;
  description?: string;
  projectId?: string;
  project?: { id: string; name: string };
  workflow?: { id: string; status: string; workflowNumber: string };
  createdBy: { id: string; displayName: string };
  createdAt: string;
}

export interface ExpenseListResponse {
  data: Expense[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateExpenseRequest {
  category: string;
  amount: number;
  expenseDate: string;
  description?: string;
  projectId: string;
  approverId: string;
  status?: 'draft' | 'submitted';
}

export interface CategorySummary {
  category: string;
  count: number;
  totalAmount: number;
  percentage: number;
}

export interface ProjectSummary {
  projectId: string;
  projectName: string;
  count: number;
  totalAmount: number;
}

export interface MonthlySummary {
  month: string;
  count: number;
  totalAmount: number;
}

export interface ExpenseStats {
  totalAmount: number;
  totalCount: number;
  avgAmount: number;
  maxAmount: number;
}

export interface SummaryQuery {
  dateFrom: string;
  dateTo: string;
  category?: string;
  projectId?: string;
  approvedOnly?: boolean;
}

@Injectable({ providedIn: 'root' })
export class ExpenseService {
  private http = inject(HttpClient);

  // ─── Signal State ───
  private _expenses = signal<Expense[]>([]);
  private _total = signal(0);
  private _isLoading = signal(false);
  private _error = signal<string | null>(null);

  // ─── Public Signals ───
  readonly expenses = this._expenses.asReadonly();
  readonly total = this._total.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly error = this._error.asReadonly();

  // ─── List ───

  loadAll(query?: { category?: string; status?: string; page?: number; limit?: number }): void {
    this._isLoading.set(true);
    this._error.set(null);

    let params = new HttpParams();
    if (query?.category) params = params.set('category', query.category);
    if (query?.status) params = params.set('status', query.status);
    if (query?.page) params = params.set('page', query.page.toString());
    if (query?.limit) params = params.set('limit', query.limit.toString());

    this.http
      .get<ExpenseListResponse>('/api/expenses', { params })
      .subscribe({
        next: (res) => {
          this._expenses.set(res.data);
          this._total.set(res.total);
          this._isLoading.set(false);
        },
        error: (err) => {
          this._error.set(err.error?.message || 'データの取得に失敗しました');
          this._isLoading.set(false);
        },
      });
  }

  // ─── Detail ───

  getById(id: string): Observable<Expense> {
    return this.http.get<Expense>(`/api/expenses/${id}`);
  }

  // ─── Create ───

  create(dto: CreateExpenseRequest): Observable<Expense> {
    this._isLoading.set(true);
    return this.http.post<Expense>('/api/expenses', dto).pipe(
      tap(() => {
        this._isLoading.set(false);
        this.loadAll();
      }),
      catchError((err) => {
        this._isLoading.set(false);
        return throwError(() => err);
      }),
    );
  }

  // ─── Summary ───

  getSummaryByCategory(query: SummaryQuery): Observable<CategorySummary[]> {
    return this.http.get<CategorySummary[]>(
      '/api/expenses/summary/by-category',
      { params: this.buildSummaryParams(query) },
    );
  }

  getSummaryByProject(query: SummaryQuery): Observable<ProjectSummary[]> {
    return this.http.get<ProjectSummary[]>(
      '/api/expenses/summary/by-project',
      { params: this.buildSummaryParams(query) },
    );
  }

  getSummaryByMonth(query: SummaryQuery): Observable<MonthlySummary[]> {
    return this.http.get<MonthlySummary[]>(
      '/api/expenses/summary/by-month',
      { params: this.buildSummaryParams(query) },
    );
  }

  getStats(query: SummaryQuery): Observable<ExpenseStats> {
    return this.http.get<ExpenseStats>(
      '/api/expenses/summary/stats',
      { params: this.buildSummaryParams(query) },
    );
  }

  // ─── Helper ───

  private buildSummaryParams(query: SummaryQuery): HttpParams {
    let params = new HttpParams()
      .set('dateFrom', query.dateFrom)
      .set('dateTo', query.dateTo);

    if (query.category) params = params.set('category', query.category);
    if (query.projectId) params = params.set('projectId', query.projectId);
    if (query.approvedOnly) params = params.set('approvedOnly', 'true');

    return params;
  }
}
