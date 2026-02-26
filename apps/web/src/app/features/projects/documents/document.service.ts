import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { ApiResponse, PaginatedResult } from '@shared/types';

@Injectable({ providedIn: 'root' })
export class DocumentService {
    private http = inject(HttpClient);

    // ─── State ───
    private _documents = signal<any[]>([]);
    private _loading = signal(false);
    private _meta = signal<any | null>(null);

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
            .get<ApiResponse<PaginatedResult<any>>>(
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

    uploadDocument(projectId: string, file: File): Observable<ApiResponse<any>> {
        const formData = new FormData();
        formData.append('file', file);
        return this.http.post<ApiResponse<any>>(
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
