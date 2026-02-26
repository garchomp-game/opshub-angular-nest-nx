import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { ApiResponse, PaginatedResult } from '@shared/types';

@Injectable({ providedIn: 'root' })
export class ProjectService {
    private http = inject(HttpClient);

    // ─── State ───
    private _projects = signal<any[]>([]);
    private _currentProject = signal<any | null>(null);
    private _loading = signal(false);
    private _meta = signal<any | null>(null);

    // ─── Public Signals ───
    readonly projects = this._projects.asReadonly();
    readonly currentProject = this._currentProject.asReadonly();
    readonly loading = this._loading.asReadonly();
    readonly meta = this._meta.asReadonly();

    // ─── API Methods ───

    loadAll(params?: Record<string, string>): void {
        this._loading.set(true);
        const queryParams = params
            ? '?' + new URLSearchParams(params).toString()
            : '';
        this.http
            .get<ApiResponse<PaginatedResult<any>>>(`/api/projects${queryParams}`)
            .subscribe({
                next: (res) => {
                    if (res.success) {
                        this._projects.set(res.data.data);
                        this._meta.set(res.data.meta);
                    }
                    this._loading.set(false);
                },
                error: () => this._loading.set(false),
            });
    }

    getById(id: string): Observable<ApiResponse<any>> {
        this._loading.set(true);
        return this.http
            .get<ApiResponse<any>>(`/api/projects/${id}`)
            .pipe(
                tap({
                    next: (res) => {
                        if (res.success) this._currentProject.set(res.data);
                        this._loading.set(false);
                    },
                    error: () => this._loading.set(false),
                }),
            );
    }

    create(dto: any): Observable<ApiResponse<any>> {
        return this.http.post<ApiResponse<any>>('/api/projects', dto);
    }

    update(id: string, dto: any): Observable<ApiResponse<any>> {
        return this.http.patch<ApiResponse<any>>(`/api/projects/${id}`, dto);
    }

    addMember(projectId: string, userId: string): Observable<ApiResponse<any>> {
        return this.http.post<ApiResponse<any>>(
            `/api/projects/${projectId}/members`,
            { userId },
        );
    }

    removeMember(projectId: string, userId: string): Observable<ApiResponse<any>> {
        return this.http.delete<ApiResponse<any>>(
            `/api/projects/${projectId}/members/${userId}`,
        );
    }
}
