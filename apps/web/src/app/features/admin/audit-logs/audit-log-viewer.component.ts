import { Component, OnInit, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { CommonModule, DatePipe } from '@angular/common';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { FormsModule } from '@angular/forms';
import { AdminAuditLogsService } from '../services/audit-logs.service';

const ACTION_LABELS: Record<string, string> = {
    'workflow.create': '申請作成',
    'workflow.approve': '申請承認',
    'workflow.reject': '申請差戻し',
    'project.create': 'PJ作成',
    'project.update': 'PJ更新',
    'task.create': 'タスク作成',
    'task.status_change': 'ステータス変更',
    'user.invite': 'ユーザー招待',
    'user.role_change': 'ロール変更',
    'tenant.update': 'テナント更新',
    'tenant.delete': 'テナント削除',
};

@Component({
    selector: 'app-audit-log-viewer',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        FormsModule,
        DatePipe,
        NzTableModule,
        NzCardModule,
        NzSelectModule,
        NzButtonModule,
        NzIconModule,
        NzTagModule,
        NzSpinModule,
        NzDatePickerModule,
    ],
    template: `
    <div class="min-h-[calc(100vh-64px)] bg-gray-50/50 py-8 px-4 sm:px-6 lg:px-8">
      <div class="max-w-7xl mx-auto" data-testid="audit-log-viewer">
        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
                <h1 class="text-2xl font-bold text-gray-900 m-0 tracking-tight">監査ログ</h1>
                <p class="text-gray-500 mt-1 mb-0 text-sm">システム内で行われたユーザーの操作履歴を確認できます。</p>
            </div>
        </div>

        <!-- Filter Card -->
        <nz-card [nzBordered]="true" class="rounded-2xl shadow-sm mb-6" nzTitle="絞り込み">
            <div class="flex flex-wrap items-end gap-4">
                <div class="w-full sm:w-64">
                    <label class="block text-sm font-bold text-gray-700 mb-1.5">アクション種別</label>
                    <nz-select [(ngModel)]="selectedAction"
                               (ngModelChange)="onFilterChange()"
                               nzPlaceHolder="すべて"
                               nzAllowClear
                               class="w-full"
                               data-testid="filter-action">
                        @for (action of actionOptions; track action.value) {
                            <nz-option [nzValue]="action.value" [nzLabel]="action.label"></nz-option>
                        }
                    </nz-select>
                </div>

                <div class="w-full sm:w-64">
                    <label class="block text-sm font-bold text-gray-700 mb-1.5">リソース種別</label>
                    <nz-select [(ngModel)]="selectedResourceType"
                               (ngModelChange)="onFilterChange()"
                               nzPlaceHolder="すべて"
                               nzAllowClear
                               class="w-full"
                               data-testid="filter-resource">
                        <nz-option nzValue="workflow" nzLabel="ワークフロー"></nz-option>
                        <nz-option nzValue="project" nzLabel="プロジェクト"></nz-option>
                        <nz-option nzValue="task" nzLabel="タスク"></nz-option>
                        <nz-option nzValue="user" nzLabel="ユーザー"></nz-option>
                        <nz-option nzValue="tenant" nzLabel="テナント"></nz-option>
                    </nz-select>
                </div>

                <button nz-button nzType="default" (click)="onReset()" data-testid="filter-reset-btn">
                    <span nz-icon nzType="reload" nzTheme="outline"></span>
                    リセット
                </button>
            </div>
        </nz-card>

        <!-- Content Card -->
        <nz-card [nzBordered]="true" class="rounded-2xl shadow-sm overflow-hidden" [nzBodyStyle]="{ padding: '0' }">
            @if (auditLogsService.loading()) {
                <div class="flex justify-center items-center py-24" data-testid="loading">
                    <nz-spin nzSimple [nzSize]="'large'"></nz-spin>
                </div>
            } @else {
                @if (auditLogsService.logs().length === 0) {
                    <div class="flex flex-col items-center justify-center py-16 text-center bg-gray-50/30">
                        <span nz-icon nzType="history" nzTheme="outline" class="text-5xl text-gray-300 mb-4"></span>
                        <p class="text-lg font-bold text-gray-900 mb-1">ログが見つかりません</p>
                        <p class="text-gray-500 text-sm m-0">条件に一致する監査ログはありません。</p>
                    </div>
                } @else {
                    <nz-table #auditTable
                              [nzData]="auditLogsService.logs()"
                              [nzFrontPagination]="false"
                              [nzTotal]="auditLogsService.meta().total"
                              [nzPageSize]="auditLogsService.meta().limit"
                              [nzPageIndex]="currentPage"
                              (nzPageIndexChange)="onPageIndexChange($event)"
                              (nzPageSizeChange)="onPageSizeChange($event)"
                              [nzPageSizeOptions]="[10, 20, 50, 100]"
                              nzShowSizeChanger
                              nzSize="middle"
                              data-testid="audit-logs-table">
                        <thead>
                            <tr>
                                <th nzWidth="180px">日時</th>
                                <th>操作者</th>
                                <th>アクション</th>
                                <th>リソース種別</th>
                                <th>リソースID</th>
                            </tr>
                        </thead>
                        <tbody>
                            @for (log of auditTable.data; track log.id) {
                                <tr class="hover:bg-gray-50/50 transition-colors" data-testid="audit-log-row">
                                    <td>
                                        <span class="text-gray-900 font-mono text-sm">{{ log.createdAt | date:'yyyy/MM/dd HH:mm:ss' }}</span>
                                    </td>
                                    <td>
                                        <span class="font-medium text-gray-900">{{ log.userName }}</span>
                                    </td>
                                    <td>
                                        <nz-tag nzColor="blue">{{ getActionLabel(log.action) }}</nz-tag>
                                    </td>
                                    <td>
                                        <span class="text-gray-600">{{ log.resourceType }}</span>
                                    </td>
                                    <td>
                                        <span class="text-gray-500 font-mono text-xs">{{ log.resourceId?.substring(0, 8) }}…</span>
                                    </td>
                                </tr>
                            }
                        </tbody>
                    </nz-table>
                }
            }
        </nz-card>
      </div>
    </div>
  `,
    styles: [],
})
export class AuditLogViewerComponent implements OnInit {
    auditLogsService = inject(AdminAuditLogsService);

    selectedAction: string | null = null;
    selectedResourceType: string | null = null;
    currentPage = 1;

    actionOptions = Object.entries(ACTION_LABELS).map(([value, label]) => ({ value, label }));

    ngOnInit(): void {
        this.auditLogsService.loadLogs();
    }

    getActionLabel(action: string): string {
        return ACTION_LABELS[action] ?? action;
    }

    onFilterChange(): void {
        this.currentPage = 1;
        this.auditLogsService.loadLogs({
            action: this.selectedAction || undefined,
            resourceType: this.selectedResourceType || undefined,
        });
    }

    onReset(): void {
        this.selectedAction = null;
        this.selectedResourceType = null;
        this.currentPage = 1;
        this.auditLogsService.loadLogs();
    }

    onPageIndexChange(pageIndex: number): void {
        this.currentPage = pageIndex;
        this.auditLogsService.loadLogs({
            page: pageIndex,
            limit: this.auditLogsService.meta().limit,
            action: this.selectedAction || undefined,
            resourceType: this.selectedResourceType || undefined,
        });
    }

    onPageSizeChange(pageSize: number): void {
        this.currentPage = 1;
        this.auditLogsService.loadLogs({
            page: 1,
            limit: pageSize,
            action: this.selectedAction || undefined,
            resourceType: this.selectedResourceType || undefined,
        });
    }
}
