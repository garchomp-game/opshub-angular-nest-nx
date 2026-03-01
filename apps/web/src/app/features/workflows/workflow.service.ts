import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap, finalize } from 'rxjs';
import { CreateWorkflowDto, UpdateWorkflowDto } from '@api-client';
import { ApiResponse } from '@shared/types';

export interface WorkflowAttachment {
  id: string;
  workflowId: string;
  fileName: string;
  fileSize: number;
  contentType: string;
  storagePath: string;
  uploadedBy: string;
  createdAt: string;
}

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
  attachments?: WorkflowAttachment[];
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

    this.http.get<ApiResponse<PaginatedWorkflows>>('/api/workflows', { params }).pipe(
      tap((res) => {
        const payload = res.success ? res.data : (res as unknown as PaginatedWorkflows);
        this._workflows.set(payload.data ?? []);
        if (payload.meta) this._totalCount.set(payload.meta.total);
      }),
      finalize(() => this._isLoading.set(false)),
    ).subscribe();
  }

  loadPending(): void {
    this._isLoading.set(true);
    this.http.get<ApiResponse<Workflow[]>>('/api/workflows/pending').pipe(
      tap((res) => {
        const data = res.success ? res.data : (res as unknown as Workflow[]);
        this._pendingWorkflows.set(Array.isArray(data) ? data : []);
      }),
      finalize(() => this._isLoading.set(false)),
    ).subscribe();
  }

  loadOne(id: string): void {
    this._isLoading.set(true);
    this.http.get<ApiResponse<Workflow>>(`/api/workflows/${id}`).pipe(
      tap((res) => {
        const data = res.success ? res.data : (res as unknown as Workflow);
        this._currentWorkflow.set(data);
      }),
      finalize(() => this._isLoading.set(false)),
    ).subscribe();
  }

  getAll(query?: WorkflowQuery): Observable<ApiResponse<PaginatedWorkflows>> {
    let params = new HttpParams();
    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params = params.set(key, String(value));
        }
      });
    }
    return this.http.get<ApiResponse<PaginatedWorkflows>>('/api/workflows', { params });
  }

  getPending(): Observable<ApiResponse<Workflow[]>> {
    return this.http.get<ApiResponse<Workflow[]>>('/api/workflows/pending');
  }

  getById(id: string): Observable<ApiResponse<Workflow>> {
    return this.http.get<ApiResponse<Workflow>>(`/api/workflows/${id}`);
  }

  create(dto: CreateWorkflowDto): Observable<ApiResponse<Workflow>> {
    return this.http.post<ApiResponse<Workflow>>('/api/workflows', dto);
  }

  update(id: string, dto: Partial<UpdateWorkflowDto>): Observable<ApiResponse<Workflow>> {
    return this.http.patch<ApiResponse<Workflow>>(`/api/workflows/${id}`, dto);
  }

  submit(id: string): Observable<ApiResponse<Workflow>> {
    return this.http.post<ApiResponse<Workflow>>(`/api/workflows/${id}/submit`, {});
  }

  approve(id: string): Observable<ApiResponse<Workflow>> {
    return this.http.post<ApiResponse<Workflow>>(`/api/workflows/${id}/approve`, {});
  }

  reject(id: string, reason: string): Observable<ApiResponse<Workflow>> {
    return this.http.post<ApiResponse<Workflow>>(`/api/workflows/${id}/reject`, { reason });
  }

  withdraw(id: string): Observable<ApiResponse<Workflow>> {
    return this.http.post<ApiResponse<Workflow>>(`/api/workflows/${id}/withdraw`, {});
  }

  // ─── Attachment Methods ───

  uploadAttachment(workflowId: string, file: File): Observable<WorkflowAttachment> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<WorkflowAttachment>(`/api/workflows/${workflowId}/attachments`, formData);
  }

  getAttachments(workflowId: string): Observable<WorkflowAttachment[]> {
    return this.http.get<WorkflowAttachment[]>(`/api/workflows/${workflowId}/attachments`);
  }

  deleteAttachment(workflowId: string, attachmentId: string): Observable<void> {
    return this.http.delete<void>(`/api/workflows/${workflowId}/attachments/${attachmentId}`);
  }

  downloadAttachment(workflowId: string, attachmentId: string, fileName: string): void {
    this.http.get(`/api/workflows/${workflowId}/attachments/${attachmentId}/download`, {
      responseType: 'blob',
    }).subscribe((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    });
  }
}
