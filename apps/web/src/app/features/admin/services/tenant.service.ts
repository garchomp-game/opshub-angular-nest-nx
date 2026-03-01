import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MessageService } from 'primeng/api';

export interface ExportTenantDto {
  format: 'json' | 'csv';
  include: string[];
}

export interface ExportJobStatus {
  jobId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  filePath?: string;
  error?: string;
}

@Injectable({ providedIn: 'root' })
export class AdminTenantService {
  private http = inject(HttpClient);
  private messageService = inject(MessageService);

  readonly tenant = signal<any>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  // Export state
  readonly exportJobId = signal<string | null>(null);
  readonly exportStatus = signal<ExportJobStatus | null>(null);
  readonly exporting = signal(false);
  private pollTimer: ReturnType<typeof setInterval> | null = null;

  loadTenant(): void {
    this.loading.set(true);
    this.http.get<any>('/api/admin/tenant').subscribe({
      next: (data) => {
        this.tenant.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.error?.message ?? 'テナント情報の取得に失敗しました');
        this.loading.set(false);
      },
    });
  }

  updateTenant(dto: { name?: string; settings?: Record<string, unknown> }): void {
    this.loading.set(true);
    this.http.patch<any>('/api/admin/tenant', dto).subscribe({
      next: (data) => {
        this.tenant.set(data);
        this.loading.set(false);
        this.messageService.add({ severity: 'success', summary: 'テナント設定を保存しました', life: 3000 });
      },
      error: (err) => {
        this.error.set(err.error?.error?.message ?? '保存に失敗しました');
        this.loading.set(false);
      },
    });
  }

  deleteTenant(): void {
    this.loading.set(true);
    this.http.delete('/api/admin/tenant').subscribe({
      next: () => {
        this.loading.set(false);
        this.messageService.add({ severity: 'success', summary: 'テナントを削除しました', life: 3000 });
      },
      error: (err) => {
        this.error.set(err.error?.error?.message ?? '削除に失敗しました');
        this.loading.set(false);
      },
    });
  }

  // ── Export ──

  requestExport(dto: ExportTenantDto): void {
    this.exporting.set(true);
    this.exportStatus.set(null);
    this.http.post<{ jobId: string; status: string }>('/api/admin/tenant/export', dto).subscribe({
      next: (res) => {
        this.exportJobId.set(res.jobId);
        this.exportStatus.set({
          jobId: res.jobId,
          status: 'queued',
          progress: 0,
        });
        this.messageService.add({ severity: 'info', summary: 'エクスポートを開始しました', life: 3000 });
        this.startPolling(res.jobId);
      },
      error: (err) => {
        this.exporting.set(false);
        this.error.set(err.error?.error?.message ?? 'エクスポートの開始に失敗しました');
      },
    });
  }

  downloadExport(jobId: string): void {
    window.open(`/api/admin/tenant/export/${jobId}/download`);
  }

  private startPolling(jobId: string): void {
    this.stopPolling();
    this.pollTimer = setInterval(() => {
      this.http.get<ExportJobStatus>(`/api/admin/tenant/export/${jobId}`).subscribe({
        next: (status) => {
          this.exportStatus.set(status);
          if (status.status === 'completed' || status.status === 'failed') {
            this.exporting.set(false);
            this.stopPolling();
            if (status.status === 'completed') {
              this.messageService.add({ severity: 'success', summary: 'エクスポートが完了しました', life: 5000 });
            } else {
              this.messageService.add({ severity: 'error', summary: 'エクスポートに失敗しました', life: 5000 });
            }
          }
        },
        error: () => {
          this.exporting.set(false);
          this.stopPolling();
        },
      });
    }, 5000);
  }

  private stopPolling(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }
}
