import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class AdminAuditLogsService {
  private http = inject(HttpClient);

  readonly logs = signal<any[]>([]);
  readonly meta = signal<{ total: number; page: number; limit: number; totalPages: number }>({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
  });
  readonly loading = signal(false);

  loadLogs(filter: {
    page?: number;
    limit?: number;
    action?: string;
    resourceType?: string;
    userId?: string;
    dateFrom?: string;
    dateTo?: string;
  } = {}): void {
    this.loading.set(true);

    let params = new HttpParams();
    if (filter.page) params = params.set('page', filter.page.toString());
    if (filter.limit) params = params.set('limit', filter.limit.toString());
    if (filter.action) params = params.set('action', filter.action);
    if (filter.resourceType) params = params.set('resourceType', filter.resourceType);
    if (filter.userId) params = params.set('userId', filter.userId);
    if (filter.dateFrom) params = params.set('dateFrom', filter.dateFrom);
    if (filter.dateTo) params = params.set('dateTo', filter.dateTo);

    this.http.get<any>('/api/admin/audit-logs', { params }).subscribe({
      next: (result) => {
        this.logs.set(result.data);
        this.meta.set(result.meta);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
