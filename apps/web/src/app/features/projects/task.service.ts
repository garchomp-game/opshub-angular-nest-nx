import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { ApiResponse } from '@shared/types';
import { CreateTaskDto, UpdateTaskDto, ChangeTaskStatusDto } from '@api-client';

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  assigneeId?: string;
  assignee?: { id: string; profile?: { displayName: string } };
  dueDate?: string;
  projectId: string;
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({ providedIn: 'root' })
export class TaskService {
  private http = inject(HttpClient);

  // ─── State ───
  private _tasks = signal<Task[]>([]);
  private _loading = signal(false);

  // ─── Public Signals ───
  readonly tasks = this._tasks.asReadonly();
  readonly loading = this._loading.asReadonly();

  // ─── API Methods ───

  loadByProject(projectId: string): void {
    this._loading.set(true);
    this.http
      .get<ApiResponse<Task[]>>(`/api/projects/${projectId}/tasks`)
      .subscribe({
        next: (res) => {
          if (res.success) this._tasks.set(res.data);
          this._loading.set(false);
        },
        error: () => this._loading.set(false),
      });
  }

  create(projectId: string, dto: CreateTaskDto): Observable<ApiResponse<Task>> {
    return this.http
      .post<ApiResponse<Task>>(`/api/projects/${projectId}/tasks`, dto)
      .pipe(
        tap((res) => {
          if (res.success) {
            this._tasks.update((tasks) => [res.data, ...tasks]);
          }
        }),
      );
  }

  update(id: string, dto: Partial<UpdateTaskDto>): Observable<ApiResponse<Task>> {
    return this.http.put<ApiResponse<Task>>(`/api/tasks/${id}`, dto);
  }

  changeStatus(id: string, status: string): Observable<ApiResponse<Task>> {
    return this.http
      .patch<ApiResponse<Task>>(`/api/tasks/${id}/status`, { status })
      .pipe(
        tap((res) => {
          if (res.success) {
            this._tasks.update((tasks) =>
              tasks.map((t) => (t.id === id ? res.data : t)),
            );
          }
        }),
      );
  }

  remove(id: string): Observable<ApiResponse<void>> {
    return this.http
      .delete<ApiResponse<void>>(`/api/tasks/${id}`)
      .pipe(
        tap(() => {
          this._tasks.update((tasks) => tasks.filter((t) => t.id !== id));
        }),
      );
  }
}
