import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({ providedIn: 'root' })
export class AdminTenantService {
    private http = inject(HttpClient);
    private snackBar = inject(MatSnackBar);

    readonly tenant = signal<any>(null);
    readonly loading = signal(false);
    readonly error = signal<string | null>(null);

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
                this.snackBar.open('テナント設定を保存しました', '閉じる', { duration: 3000 });
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
                this.snackBar.open('テナントを削除しました', '閉じる', { duration: 3000 });
            },
            error: (err) => {
                this.error.set(err.error?.error?.message ?? '削除に失敗しました');
                this.loading.set(false);
            },
        });
    }
}
