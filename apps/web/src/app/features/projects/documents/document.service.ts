import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse, PaginatedResult, PaginationMeta } from '@shared/types';

export interface ProjectDocument {
  id: string;
  name: string;
  fileSize: number;
  mimeType: string;
  storagePath: string;
  projectId: string;
  uploadedBy: string;
  uploader?: { id: string; profile?: { displayName: string } };
  createdAt: string;
  updatedAt?: string;
}

@Injectable({ providedIn: 'root' })
export class DocumentService {
  private http = inject(HttpClient);

  // ─── State ───
  private _documents = signal<ProjectDocument[]>([]);
  private _loading = signal(false);
  private _meta = signal<PaginationMeta | null>(null);

  // ─── Public Signals ───
  readonly documents = this._documents.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly meta = this._meta.asReadonly();

  // ─── API Methods ───

  loadDocuments(projectId: string, params?: Record<string, string>): void {
    this._loading.set(true);
    const queryParams = params
      ? '?' + new URLSearchParams(params).toString()
      : '';
    this.http
      .get<ApiResponse<PaginatedResult<ProjectDocument>>>(
        `/api/projects/${projectId}/documents${queryParams}`,
      )
      .subscribe({
        next: (res) => {
          if (res.success) {
            this._documents.set(res.data.data);
            this._meta.set(res.data.meta);
          }
          this._loading.set(false);
        },
        error: () => this._loading.set(false),
      });
  }

  uploadDocument(projectId: string, file: File): Observable<ApiResponse<ProjectDocument>> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<ApiResponse<ProjectDocument>>(
      `/api/projects/${projectId}/documents`,
      formData,
    );
  }

  downloadDocument(id: string): void {
    // ブラウザのダウンロードを直接トリガー
    window.open(`/api/documents/${id}/download`, '_blank');
  }

  deleteDocument(id: string): Observable<void> {
    return this.http.delete<void>(`/api/documents/${id}`);
  }
}
