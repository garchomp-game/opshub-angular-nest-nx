import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap, finalize } from 'rxjs';

export interface Workflow {
  id: string;
  workflowNumber: string;
  type: string;
  title: string;
  description?: string;
  status: string;
  amount?: number;
  dateFrom?: string;
  dateTo?: string;
  approverId?: string;
  rejectionReason?: string;
  createdBy: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
  creator?: { id: string; profile?: { displayName: string } };
  approver?: { id: string; profile?: { displayName: string } };
  attachments?: any[];
}

export interface PaginatedWorkflows {
  data: Workflow[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export interface WorkflowQuery {
  status?: string;
  type?: string;
  mode?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

@Injectable({ providedIn: 'root' })
export class WorkflowService {
  private http = inject(HttpClient);

  // ─── State ───
  private _workflows = signal<Workflow[]>([]);
  private _pendingWorkflows = signal<Workflow[]>([]);
  private _currentWorkflow = signal<Workflow | null>(null);
  private _isLoading = signal(false);
  private _totalCount = signal(0);

  // ─── Public Signals ───
  readonly workflows = this._workflows.asReadonly();
  readonly pendingWorkflows = this._pendingWorkflows.asReadonly();
  readonly currentWorkflow = this._currentWorkflow.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly totalCount = this._totalCount.asReadonly();

  // ─── API Methods ───

  loadAll(query: WorkflowQuery = {}): void {
    this._isLoading.set(true);
    let params = new HttpParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params = params.set(key, String(value));
      }
    });

    this.http.get<any>('/api/workflows', { params }).pipe(
      tap((res) => {
        const data = res.success ? res.data : res;
        this._workflows.set(data.data ?? data);
        if (data.meta) this._totalCount.set(data.meta.total);
      }),
      finalize(() => this._isLoading.set(false)),
    ).subscribe();
  }

  loadPending(): void {
    this._isLoading.set(true);
    this.http.get<any>('/api/workflows/pending').pipe(
      tap((res) => {
        const data = res.success ? res.data : res;
        this._pendingWorkflows.set(Array.isArray(data) ? data : data.data ?? []);
      }),
      finalize(() => this._isLoading.set(false)),
    ).subscribe();
  }

  loadOne(id: string): void {
    this._isLoading.set(true);
    this.http.get<any>(`/api/workflows/${id}`).pipe(
      tap((res) => {
        const data = res.success ? res.data : res;
        this._currentWorkflow.set(data);
      }),
      finalize(() => this._isLoading.set(false)),
    ).subscribe();
  }

  getAll(query?: WorkflowQuery): Observable<any> {
    let params = new HttpParams();
    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params = params.set(key, String(value));
        }
      });
    }
    return this.http.get<any>('/api/workflows', { params });
  }

  getPending(): Observable<any> {
    return this.http.get<any>('/api/workflows/pending');
  }

  getById(id: string): Observable<any> {
    return this.http.get<any>(`/api/workflows/${id}`);
  }

  create(dto: any): Observable<any> {
    return this.http.post<any>('/api/workflows', dto);
  }

  update(id: string, dto: any): Observable<any> {
    return this.http.patch<any>(`/api/workflows/${id}`, dto);
  }

  submit(id: string): Observable<any> {
    return this.http.post<any>(`/api/workflows/${id}/submit`, {});
  }

  approve(id: string): Observable<any> {
    return this.http.post<any>(`/api/workflows/${id}/approve`, {});
  }

  reject(id: string, reason: string): Observable<any> {
    return this.http.post<any>(`/api/workflows/${id}/reject`, { reason });
  }

  withdraw(id: string): Observable<any> {
    return this.http.post<any>(`/api/workflows/${id}/withdraw`, {});
  }
}
