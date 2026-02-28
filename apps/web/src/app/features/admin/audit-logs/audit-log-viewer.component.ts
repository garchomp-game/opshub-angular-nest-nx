import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { heroClipboardDocumentList, heroArrowPath, heroFunnel } from '@ng-icons/heroicons/outline';
import { AdminAuditLogsService } from '../services/audit-logs.service';
import { ListPageComponent } from '../../../shared/ui';

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
    NgIcon,
    ListPageComponent,
  ],
  viewProviders: [provideIcons({ heroClipboardDocumentList, heroArrowPath, heroFunnel })],
  template: `
  <app-list-page title="監査ログ" subtitle="システム内で行われたユーザーの操作履歴を確認できます。" data-testid="audit-log-viewer">
    <!-- フィルタ -->
    <div slot="filters" class="card bg-base-100 shadow-sm">
      <div class="card-body">
        <div class="flex flex-wrap items-end gap-4">
          <div class="fieldset w-full sm:w-64">
            <label class="label font-medium">アクション種別</label>
            <select class="select w-full"
                [(ngModel)]="selectedAction"
                (ngModelChange)="onFilterChange()"
                data-testid="filter-action">
              <option [ngValue]="null">すべて</option>
              @for (action of actionOptions; track action.value) {
                <option [ngValue]="action.value">{{ action.label }}</option>
              }
            </select>
          </div>

          <div class="fieldset w-full sm:w-64">
            <label class="label font-medium">リソース種別</label>
            <select class="select w-full"
                [(ngModel)]="selectedResourceType"
                (ngModelChange)="onFilterChange()"
                data-testid="filter-resource">
              <option [ngValue]="null">すべて</option>
              <option value="workflow">ワークフロー</option>
              <option value="project">プロジェクト</option>
              <option value="task">タスク</option>
              <option value="user">ユーザー</option>
              <option value="tenant">テナント</option>
            </select>
          </div>

          <button class="btn btn-ghost btn-sm gap-2" (click)="onReset()" data-testid="filter-reset-btn">
            <ng-icon name="heroArrowPath" class="text-lg" />
            リセット
          </button>
        </div>
      </div>
    </div>

    <!-- Content -->
    @if (auditLogsService.loading()) {
      <div class="flex justify-center items-center py-24" data-testid="loading">
        <span class="loading loading-spinner loading-lg"></span>
      </div>
    } @else {
      @if (auditLogsService.logs().length === 0) {
        <div class="flex flex-col items-center justify-center py-16 text-center">
          <ng-icon name="heroClipboardDocumentList" class="text-5xl text-base-content/20 mb-4" />
          <p class="text-lg font-bold text-base-content mb-1">ログが見つかりません</p>
          <p class="text-base-content/60 text-sm m-0">条件に一致する監査ログはありません。</p>
        </div>
      } @else {
        <div class="overflow-x-auto">
          <table class="table table-zebra" data-testid="audit-logs-table">
            <thead>
              <tr>
                <th class="w-44">日時</th>
                <th>操作者</th>
                <th>アクション</th>
                <th>リソース種別</th>
                <th>リソースID</th>
              </tr>
            </thead>
            <tbody>
              @for (log of auditLogsService.logs(); track log.id) {
                <tr data-testid="audit-log-row">
                  <td>
                    <span class="font-mono text-sm">{{ log.createdAt | date:'yyyy/MM/dd HH:mm:ss' }}</span>
                  </td>
                  <td>
                    <span class="font-medium">{{ log.userName }}</span>
                  </td>
                  <td>
                    <span class="badge badge-info">{{ getActionLabel(log.action) }}</span>
                  </td>
                  <td>
                    <span class="text-base-content/60">{{ log.resourceType }}</span>
                  </td>
                  <td>
                    <span class="text-base-content/50 font-mono text-xs">{{ log.resourceId?.substring(0, 8) }}…</span>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        @if (auditLogsService.meta().totalPages > 1) {
          <div class="flex justify-center py-4">
            <div class="join">
              @for (p of getPages(); track p) {
                <button class="join-item btn btn-sm"
                    [class.btn-active]="p === currentPage"
                    (click)="onPageIndexChange(p)">
                  {{ p }}
                </button>
              }
            </div>
          </div>
        }
      }
    }
  </app-list-page>
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

  getPages(): number[] {
    const total = this.auditLogsService.meta().totalPages;
    return Array.from({ length: total }, (_, i) => i + 1);
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
