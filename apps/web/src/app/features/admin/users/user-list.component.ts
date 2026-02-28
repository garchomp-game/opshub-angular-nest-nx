import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { heroUserPlus, heroNoSymbol, heroUserGroup } from '@ng-icons/heroicons/outline';
import { AdminUsersService } from '../services/users.service';
import { InviteModalComponent } from './invite-modal.component';
import { ROLE_LABELS, USER_STATUS_LABELS } from '@shared/types';
import { ListPageComponent, ModalService } from '../../../shared/ui';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [
    CommonModule,
    NgIcon,
    ListPageComponent,
  ],
  viewProviders: [provideIcons({ heroUserPlus, heroNoSymbol, heroUserGroup })],
  template: `
  <app-list-page title="ユーザー管理" subtitle="システムを利用するユーザーの招待や権限の管理を行います。" data-testid="user-management">
    <button slot="actions" class="btn btn-primary btn-sm gap-2"
        (click)="openInviteDialog()"
        data-testid="invite-btn">
      <ng-icon name="heroUserPlus" class="text-lg" />
      ユーザーを招待
    </button>

    @if (usersService.loading()) {
      <div class="flex justify-center items-center py-24" data-testid="loading">
        <span class="loading loading-spinner loading-lg"></span>
      </div>
    } @else if (usersService.users().length === 0) {
      <div class="flex flex-col items-center justify-center py-24 text-center" data-testid="empty-state">
        <div class="w-16 h-16 rounded-full bg-base-200 flex items-center justify-center mb-4">
          <ng-icon name="heroUserGroup" class="text-3xl text-base-content/40" />
        </div>
        <p class="text-lg font-bold text-base-content mb-1">ユーザーがいません</p>
        <p class="text-base-content/60 text-sm max-w-sm mb-6">まだユーザーが登録されていません。右上のボタンからユーザーを招待してください。</p>
      </div>
    } @else {
      <div class="overflow-x-auto">
        <table class="table table-zebra" data-testid="users-table">
          <thead>
            <tr>
              <th>名前</th>
              <th>メールアドレス</th>
              <th>ロール</th>
              <th class="w-20"></th>
            </tr>
          </thead>
          <tbody>
            @for (user of usersService.users(); track user.id) {
              <tr data-testid="user-row">
                <td>
                  <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs uppercase">
                      {{ user.displayName ? user.displayName.charAt(0) : 'U' }}
                    </div>
                    <span class="font-medium">{{ user.displayName }}</span>
                  </div>
                </td>
                <td>
                  <span class="text-base-content/60">{{ user.email }}</span>
                </td>
                <td>
                  <div class="flex flex-wrap gap-1">
                    @for (role of user.roles; track role) {
                      <span class="badge" [class]="getRoleBadgeClass(role)">
                        {{ getRoleLabel(role) }}
                      </span>
                    }
                  </div>
                </td>
                <td class="text-right">
                  <button class="btn btn-ghost btn-sm text-error"
                      (click)="onDeactivate(user.id)"
                      data-testid="deactivate-btn"
                      title="ユーザーを無効化">
                    <ng-icon name="heroNoSymbol" class="text-lg" />
                  </button>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    }
  </app-list-page>
 `,
  styles: [],
})
export class UserListComponent implements OnInit {
  usersService = inject(AdminUsersService);
  private modalService = inject(ModalService);

  ngOnInit(): void {
    this.usersService.loadUsers();
  }

  getRoleLabel(role: string): string {
    return (ROLE_LABELS as any)[role] ?? role;
  }

  getRoleBadgeClass(role: string): string {
    switch (role) {
      case 'tenant_admin': return 'badge-error';
      case 'admin': return 'badge-error';
      case 'pm': return 'badge-info';
      case 'manager': return 'badge-info';
      case 'member': return 'badge-success';
      default: return 'badge-ghost';
    }
  }

  openInviteDialog(): void {
    this.modalService.open(InviteModalComponent, { width: '30rem' });
  }

  onDeactivate(userId: string): void {
    this.usersService.updateStatus(userId, false);
  }
}
