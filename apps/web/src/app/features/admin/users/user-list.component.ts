import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { AdminUsersService } from '../services/users.service';
import { InviteModalComponent } from './invite-modal.component';
import { ROLE_LABELS, USER_STATUS_LABELS } from '@shared/types';

@Component({
    selector: 'app-user-list',
    standalone: true,
    imports: [
        CommonModule,
        NzTableModule,
        NzButtonModule,
        NzIconModule,
        NzTagModule,
        NzSpinModule,
        NzCardModule,
        NzPopconfirmModule,
        NzBadgeModule,
        NzTooltipModule,
        NzModalModule,
    ],
    template: `
    <div class="min-h-[calc(100vh-64px)] bg-gray-50/50 py-8 px-4 sm:px-6 lg:px-8">
        <div class="max-w-7xl mx-auto" data-testid="user-management">
            <!-- Header -->
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 class="text-2xl font-bold text-gray-900 m-0 tracking-tight">ユーザー管理</h1>
                    <p class="text-gray-500 mt-1 mb-0 text-sm">システムを利用するユーザーの招待や権限の管理を行います。</p>
                </div>
                <button nz-button nzType="primary"
                        (click)="openInviteDialog()"
                        data-testid="invite-btn">
                    <span nz-icon nzType="user-add" nzTheme="outline"></span>
                    ユーザーを招待
                </button>
            </div>

            <!-- Content Card -->
            <nz-card [nzBordered]="true" class="rounded-2xl shadow-sm">
                @if (usersService.loading()) {
                    <div class="flex justify-center items-center py-24" data-testid="loading">
                        <nz-spin nzSimple [nzSize]="'large'"></nz-spin>
                    </div>
                } @else if (usersService.users().length === 0) {
                    <div class="flex flex-col items-center justify-center py-24 text-center" data-testid="empty-state">
                        <div class="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                            <span nz-icon nzType="team" nzTheme="outline" class="text-3xl text-gray-400"></span>
                        </div>
                        <p class="text-lg font-bold text-gray-900 mb-1">ユーザーがいません</p>
                        <p class="text-gray-500 text-sm max-w-sm mb-6">まだユーザーが登録されていません。右上のボタンからユーザーを招待してください。</p>
                    </div>
                } @else {
                    <div class="overflow-x-auto">
                        <nz-table #usersTable
                                  [nzData]="usersService.users()"
                                  [nzFrontPagination]="false"
                                  [nzShowPagination]="false"
                                  nzSize="middle"
                                  data-testid="users-table">
                            <thead>
                                <tr>
                                    <th>名前</th>
                                    <th>メールアドレス</th>
                                    <th>ロール</th>
                                    <th nzWidth="80px"></th>
                                </tr>
                            </thead>
                            <tbody>
                                @for (user of usersTable.data; track user.id) {
                                    <tr class="hover:bg-gray-50/50 transition-colors" data-testid="user-row">
                                        <td>
                                            <div class="flex items-center gap-3">
                                                <div class="w-8 h-8 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-xs uppercase shadow-sm">
                                                    {{ user.displayName ? user.displayName.charAt(0) : 'U' }}
                                                </div>
                                                <span class="font-medium text-gray-900">{{ user.displayName }}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <span class="text-gray-600">{{ user.email }}</span>
                                        </td>
                                        <td>
                                            <div class="flex flex-wrap gap-1">
                                                @for (role of user.roles; track role) {
                                                    <nz-tag [nzColor]="getRoleColor(role)">
                                                        {{ getRoleLabel(role) }}
                                                    </nz-tag>
                                                }
                                            </div>
                                        </td>
                                        <td class="text-right">
                                            <button nz-button nzType="text" nzDanger nzSize="small"
                                                    nz-popconfirm
                                                    nzPopconfirmTitle="このユーザーを無効化しますか？"
                                                    (nzOnConfirm)="onDeactivate(user.id)"
                                                    nz-tooltip nzTooltipTitle="ユーザーを無効化"
                                                    data-testid="deactivate-btn">
                                                <span nz-icon nzType="stop" nzTheme="outline"></span>
                                            </button>
                                        </td>
                                    </tr>
                                }
                            </tbody>
                        </nz-table>
                    </div>
                }
            </nz-card>
        </div>
    </div>
  `,
    styles: [],
})
export class UserListComponent implements OnInit {
    usersService = inject(AdminUsersService);
    private modalService = inject(NzModalService);

    ngOnInit(): void {
        this.usersService.loadUsers();
    }

    getRoleLabel(role: string): string {
        return (ROLE_LABELS as any)[role] ?? role;
    }

    getRoleColor(role: string): string {
        switch (role) {
            case 'tenant_admin': return 'red';
            case 'admin': return 'red';
            case 'pm': return 'blue';
            case 'manager': return 'blue';
            case 'member': return 'green';
            default: return 'default';
        }
    }

    openInviteDialog(): void {
        this.modalService.create({
            nzContent: InviteModalComponent,
            nzFooter: null,
            nzWidth: 480,
        });
    }

    onDeactivate(userId: string): void {
        this.usersService.updateStatus(userId, false);
    }
}
