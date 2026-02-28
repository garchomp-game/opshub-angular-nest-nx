import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { PaginatorModule } from 'primeng/paginator';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
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
    FormsModule,
    DatePipe,
    TableModule,
    TagModule,
    SelectModule,
    ButtonModule,
    CardModule,
    PaginatorModule,
    ProgressSpinnerModule,
  ],
  template: `
  <div class="p-6 lg:p-8 max-w-6xl mx-auto space-y-6" data-testid="audit-log-viewer">
    <div class="mb-2">
      <h1 class="text-2xl font-bold m-0">監査ログ</h1>
      <p class="mt-1 text-sm" style="color: var(--p-text-muted-color)">システム内で行われたユーザーの操作履歴を確認できます。</p>
    </div>

    <!-- フィルタ -->
    <p-card>
      <div class="flex flex-wrap items-end gap-4">
        <div class="flex flex-col gap-2 w-full sm:w-64">
          <label class="font-medium text-sm">アクション種別</label>
          <p-select [options]="actionFilterOptions"
              [(ngModel)]="selectedAction"
              (ngModelChange)="onFilterChange()"
              optionLabel="label" optionValue="value"
              placeholder="すべて" [showClear]="true"
              styleClass="w-full"
              data-testid="filter-action" />
        </div>

        <div class="flex flex-col gap-2 w-full sm:w-64">
          <label class="font-medium text-sm">リソース種別</label>
          <p-select [options]="resourceTypeOptions"
              [(ngModel)]="selectedResourceType"
              (ngModelChange)="onFilterChange()"
              optionLabel="label" optionValue="value"
              placeholder="すべて" [showClear]="true"
              styleClass="w-full"
              data-testid="filter-resource" />
        </div>

        <p-button label="リセット" icon="pi pi-refresh" [text]="true" size="small"
            (onClick)="onReset()" data-testid="filter-reset-btn" />
      </div>
    </p-card>

    <!-- Content -->
    @if (auditLogsService.loading()) {
      <div class="flex justify-center items-center py-24" data-testid="loading">
        <p-progressspinner strokeWidth="4" />
      </div>
    } @else {
      @if (auditLogsService.logs().length === 0) {
        <div class="flex flex-col items-center justify-center py-16 text-center">
          <i class="pi pi-list text-5xl mb-4" style="color: var(--p-text-muted-color); opacity: 0.3"></i>
          <p class="text-lg font-bold mb-1">ログが見つかりません</p>
          <p class="text-sm m-0" style="color: var(--p-text-muted-color)">条件に一致する監査ログはありません。</p>
        </div>
      } @else {
        <p-table [value]="auditLogsService.logs()" [stripedRows]="true" data-testid="audit-logs-table">
          <ng-template pTemplate="header">
            <tr>
              <th class="w-44">日時</th>
              <th>操作者</th>
              <th>アクション</th>
              <th>リソース種別</th>
              <th>リソースID</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-log>
            <tr data-testid="audit-log-row">
              <td>
                <span class="font-mono text-sm">{{ log.createdAt | date:'yyyy/MM/dd HH:mm:ss' }}</span>
              </td>
              <td>
                <span class="font-medium">{{ log.userName }}</span>
              </td>
              <td>
                <p-tag [value]="getActionLabel(log.action)" severity="info" />
              </td>
              <td>
                <span style="color: var(--p-text-muted-color)">{{ log.resourceType }}</span>
              </td>
              <td>
                <span class="font-mono text-xs" style="color: var(--p-text-muted-color); opacity: 0.7">{{ log.resourceId?.substring(0, 8) }}…</span>
              </td>
            </tr>
          </ng-template>
        </p-table>

        <!-- Pagination -->
        @if (auditLogsService.meta().totalPages > 1) {
          <p-paginator
              [first]="(currentPage - 1) * pageSize"
              [rows]="pageSize"
              [totalRecords]="auditLogsService.meta().totalPages * pageSize"
              [rowsPerPageOptions]="[10, 20, 50]"
              (onPageChange)="onPaginatorChange($event)" />
        }
      }
    }
  </div>
 `,
  styles: [],
})
export class AuditLogViewerComponent implements OnInit {
  auditLogsService = inject(AdminAuditLogsService);

  selectedAction: string | null = null;
  selectedResourceType: string | null = null;
  currentPage = 1;
  pageSize = 10;

  actionOptions = Object.entries(ACTION_LABELS).map(([value, label]) => ({ value, label }));

  actionFilterOptions = this.actionOptions;

  resourceTypeOptions = [
    { label: 'ワークフロー', value: 'workflow' },
    { label: 'プロジェクト', value: 'project' },
    { label: 'タスク', value: 'task' },
    { label: 'ユーザー', value: 'user' },
    { label: 'テナント', value: 'tenant' },
  ];

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

  onPaginatorChange(event: any): void {
    const newPage = Math.floor(event.first / event.rows) + 1;
    this.currentPage = newPage;
    this.pageSize = event.rows;
    this.auditLogsService.loadLogs({
      page: newPage,
      limit: event.rows,
      action: this.selectedAction || undefined,
      resourceType: this.selectedResourceType || undefined,
    });
  }

  onPageIndexChange(pageIndex: number): void {
    this.currentPage = pageIndex;
    this.auditLogsService.loadLogs({
      page: pageIndex,
      limit: this.pageSize,
      action: this.selectedAction || undefined,
      resourceType: this.selectedResourceType || undefined,
    });
  }

  onPageSizeChange(pageSize: number): void {
    this.currentPage = 1;
    this.pageSize = pageSize;
    this.auditLogsService.loadLogs({
      page: 1,
      limit: pageSize,
      action: this.selectedAction || undefined,
      resourceType: this.selectedResourceType || undefined,
    });
  }
}
