import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MessageService } from 'primeng/api';

@Injectable({ providedIn: 'root' })
export class AdminUsersService {
  private http = inject(HttpClient);
  private messageService = inject(MessageService);

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
        this.messageService.add({ severity: 'success', summary: '招待を送信しました', life: 3000 });
        this.loadUsers();
      },
      error: (err) => {
        this.loading.set(false);
        this.messageService.add({
          severity: 'error',
          summary: err.error?.error?.message ?? '招待に失敗しました',
          life: 5000,
        });
      },
    });
  }

  updateRole(userId: string, dto: { role: string }): void {
    this.http.patch<any>(`/api/admin/users/${userId}/role`, dto).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'ロールを更新しました', life: 3000 });
        this.loadUsers();
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: err.error?.error?.message ?? 'ロール更新に失敗しました',
          life: 5000,
        });
      },
    });
  }

  updateStatus(userId: string, active: boolean): void {
    this.http.patch<any>(`/api/admin/users/${userId}/status`, { active }).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: active ? 'ユーザーを有効化しました' : 'ユーザーを無効化しました',
          life: 3000,
        });
        this.loadUsers();
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: err.error?.error?.message ?? 'ステータス更新に失敗しました',
          life: 5000,
        });
      },
    });
  }
}
