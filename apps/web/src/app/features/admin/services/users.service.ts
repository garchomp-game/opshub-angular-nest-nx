import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({ providedIn: 'root' })
export class AdminUsersService {
    private http = inject(HttpClient);
    private snackBar = inject(MatSnackBar);

    readonly users = signal<any[]>([]);
    readonly loading = signal(false);

    loadUsers(): void {
        this.loading.set(true);
        this.http.get<any[]>('/api/admin/users').subscribe({
            next: (data) => {
                this.users.set(data);
                this.loading.set(false);
            },
            error: () => this.loading.set(false),
        });
    }

    inviteUser(dto: { email: string; role: string; displayName?: string }): void {
        this.loading.set(true);
        this.http.post<any>('/api/admin/users/invite', dto).subscribe({
            next: () => {
                this.snackBar.open('招待を送信しました', '閉じる', { duration: 3000 });
                this.loadUsers();
            },
            error: (err) => {
                this.loading.set(false);
                this.snackBar.open(
                    err.error?.error?.message ?? '招待に失敗しました',
                    '閉じる',
                    { duration: 5000 },
                );
            },
        });
    }

    updateRole(userId: string, dto: { role: string }): void {
        this.http.patch<any>(`/api/admin/users/${userId}/role`, dto).subscribe({
            next: () => {
                this.snackBar.open('ロールを更新しました', '閉じる', { duration: 3000 });
                this.loadUsers();
            },
            error: (err) => {
                this.snackBar.open(
                    err.error?.error?.message ?? 'ロール更新に失敗しました',
                    '閉じる',
                    { duration: 5000 },
                );
            },
        });
    }

    updateStatus(userId: string, active: boolean): void {
        this.http.patch<any>(`/api/admin/users/${userId}/status`, { active }).subscribe({
            next: () => {
                this.snackBar.open(
                    active ? 'ユーザーを有効化しました' : 'ユーザーを無効化しました',
                    '閉じる',
                    { duration: 3000 },
                );
                this.loadUsers();
            },
            error: (err) => {
                this.snackBar.open(
                    err.error?.error?.message ?? 'ステータス更新に失敗しました',
                    '閉じる',
                    { duration: 5000 },
                );
            },
        });
    }
}
