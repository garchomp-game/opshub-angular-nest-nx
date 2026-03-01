import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { ApiResponse, PaginatedResult, PaginationMeta } from '@shared/types';
import { CreateProjectDto, UpdateProjectDto } from '@api-client';

export interface ProjectMember {
  id: string;
  userId: string;
  user?: { id: string; email: string; profile?: { displayName: string } };
}

export interface TaskStats {
  total: number;
  todo: number;
  inProgress: number;
  done: number;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  status: string;
  pmId?: string;
  startDate?: string;
  endDate?: string;
  pm?: { id: string; profile?: { displayName: string } };
  members?: ProjectMember[];
  taskStats?: TaskStats;
  _count?: { members: number; tasks: number };
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({ providedIn: 'root' })
export class ProjectService {
  private http = inject(HttpClient);

  // ─── State ───
  private _projects = signal<Project[]>([]);
  private _currentProject = signal<Project | null>(null);
  private _loading = signal(false);
  private _meta = signal<PaginationMeta | null>(null);

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
      .get<ApiResponse<PaginatedResult<Project>>>(`/api/projects${queryParams}`)
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

  getById(id: string): Observable<ApiResponse<Project>> {
    this._loading.set(true);
    return this.http
      .get<ApiResponse<Project>>(`/api/projects/${id}`)
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

  create(dto: CreateProjectDto): Observable<ApiResponse<Project>> {
    return this.http.post<ApiResponse<Project>>('/api/projects', dto);
  }

  update(id: string, dto: Partial<UpdateProjectDto>): Observable<ApiResponse<Project>> {
    return this.http.patch<ApiResponse<Project>>(`/api/projects/${id}`, dto);
  }

  addMember(projectId: string, userId: string): Observable<ApiResponse<ProjectMember>> {
    return this.http.post<ApiResponse<ProjectMember>>(
      `/api/projects/${projectId}/members`,
      { userId },
    );
  }

  removeMember(projectId: string, userId: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(
      `/api/projects/${projectId}/members/${userId}`,
    );
  }
}
