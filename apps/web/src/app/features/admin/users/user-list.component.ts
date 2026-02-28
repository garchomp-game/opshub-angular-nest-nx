import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { AdminUsersService } from '../services/users.service';
import { InviteModalComponent } from './invite-modal.component';
import { ROLE_LABELS, USER_STATUS_LABELS } from '@shared/types';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [
    CommonModule,
    TableModule,
    TagModule,
    ButtonModule,
    DialogModule,
    ProgressSpinnerModule,
    InviteModalComponent,
  ],
  template: `
  <div class="p-6 lg:p-8 max-w-6xl mx-auto space-y-6" data-testid="user-management">
    <div class="flex items-center justify-between mb-2">
      <div>
        <h1 class="text-2xl font-bold m-0">ユーザー管理</h1>
        <p class="mt-1 text-sm" style="color: var(--p-text-muted-color)">システムを利用するユーザーの招待や権限の管理を行います。</p>
      </div>
      <p-button label="ユーザーを招待" icon="pi pi-user-plus" size="small"
          (onClick)="inviteDialogVisible = true"
          data-testid="invite-btn" />
    </div>

    @if (usersService.loading()) {
      <div class="flex justify-center items-center py-24" data-testid="loading">
        <p-progressspinner strokeWidth="4" />
      </div>
    } @else if (usersService.users().length === 0) {
      <div class="flex flex-col items-center justify-center py-24 text-center" data-testid="empty-state">
        <div class="w-16 h-16 rounded-full flex items-center justify-center mb-4" style="background: var(--p-primary-50); color: var(--p-primary-color)">
          <i class="pi pi-users text-3xl"></i>
        </div>
        <p class="text-lg font-bold mb-1">ユーザーがいません</p>
        <p class="text-sm max-w-sm mb-6" style="color: var(--p-text-muted-color)">まだユーザーが登録されていません。右上のボタンからユーザーを招待してください。</p>
      </div>
    } @else {
      <p-table [value]="usersService.users()" [stripedRows]="true" data-testid="users-table">
        <ng-template pTemplate="header">
          <tr>
            <th>名前</th>
            <th>メールアドレス</th>
            <th>ロール</th>
            <th class="w-20"></th>
          </tr>
        </ng-template>
        <ng-template pTemplate="body" let-user>
          <tr data-testid="user-row">
            <td>
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs uppercase"
                    style="background: var(--p-primary-50); color: var(--p-primary-color)">
                  {{ user.displayName ? user.displayName.charAt(0) : 'U' }}
                </div>
                <span class="font-medium">{{ user.displayName }}</span>
              </div>
            </td>
            <td>
              <span style="color: var(--p-text-muted-color)">{{ user.email }}</span>
            </td>
            <td>
              <div class="flex flex-wrap gap-1">
                @for (role of user.roles; track role) {
                  <p-tag [value]="getRoleLabel(role)" [severity]="getRoleSeverity(role)" />
                }
              </div>
            </td>
            <td class="text-right">
              <p-button icon="pi pi-ban" [rounded]="true" [text]="true" severity="danger"
                  (onClick)="onDeactivate(user.id)"
                  data-testid="deactivate-btn"
                  pTooltip="ユーザーを無効化" />
            </td>
          </tr>
        </ng-template>
      </p-table>
    }

    <app-invite-modal [(visible)]="inviteDialogVisible" />
  </div>
 `,
  styles: [],
})
export class UserListComponent implements OnInit {
  usersService = inject(AdminUsersService);

  inviteDialogVisible = false;

  ngOnInit(): void {
    this.usersService.loadUsers();
  }

  getRoleLabel(role: string): string {
    return (ROLE_LABELS as any)[role] ?? role;
  }

  getRoleSeverity(role: string): 'danger' | 'info' | 'success' | 'secondary' {
    switch (role) {
      case 'tenant_admin': return 'danger';
      case 'admin': return 'danger';
      case 'pm': return 'info';
      case 'manager': return 'info';
      case 'member': return 'success';
      default: return 'secondary';
    }
  }

  openInviteDialog(): void {
    this.inviteDialogVisible = true;
  }

  onDeactivate(userId: string): void {
    this.usersService.updateStatus(userId, false);
  }
}
