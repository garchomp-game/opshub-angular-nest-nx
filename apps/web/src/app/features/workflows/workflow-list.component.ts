import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { heroPlus, heroInboxStack } from '@ng-icons/heroicons/outline';
import {
  WorkflowService, Workflow,
} from './workflow.service';
import {
  WORKFLOW_STATUS_LABELS, WORKFLOW_STATUS_COLORS,
} from '@shared/types';
import { ListPageComponent } from '../../shared/ui/page-layouts/list-page.component';

@Component({
  selector: 'app-workflow-list',
  standalone: true,
  imports: [
    CommonModule, RouterLink, FormsModule,
    NgIcon, ListPageComponent,
  ],
  viewProviders: [provideIcons({ heroPlus, heroInboxStack })],
  template: `
    <app-list-page title="申請一覧">
      <a slot="actions" class="btn btn-primary" routerLink="new" data-testid="create-workflow-btn">
        <ng-icon name="heroPlus" class="text-lg" />
        新規申請
      </a>

      <!-- Filters -->
      <div slot="filters" class="card bg-base-100 shadow-sm" data-testid="workflow-filters">
        <div class="card-body py-4">
          <div class="flex flex-col sm:flex-row gap-4 items-end">
            <div class="w-full sm:w-64">
              <label class="label font-medium">ステータス</label>
              <select class="select w-full"
                  [(ngModel)]="statusFilter"
                  (ngModelChange)="onFilterChange()"
                  data-testid="status-filter">
                <option [ngValue]="null">すべて</option>
                <option value="draft">下書き</option>
                <option value="submitted">申請中</option>
                <option value="approved">承認済</option>
                <option value="rejected">差戻し</option>
                <option value="withdrawn">取下げ</option>
              </select>
            </div>

            <div class="w-full sm:w-64">
              <label class="label font-medium">種別</label>
              <select class="select w-full"
                  [(ngModel)]="typeFilter"
                  (ngModelChange)="onFilterChange()"
                  data-testid="type-filter">
                <option [ngValue]="null">すべて</option>
                <option value="expense">経費</option>
                <option value="leave">休暇</option>
                <option value="purchase">購買</option>
                <option value="other">その他</option>
              </select>
            </div>

            <div class="w-full sm:w-64">
              <label class="label font-medium">表示</label>
              <select class="select w-full"
                  [(ngModel)]="modeFilter"
                  (ngModelChange)="onFilterChange()"
                  data-testid="mode-filter">
                <option [ngValue]="null">すべての申請</option>
                <option value="mine">自分の申請のみ</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading -->
      @if (workflowService.isLoading()) {
        <div class="flex justify-center py-20" data-testid="loading">
          <span class="loading loading-spinner loading-lg"></span>
        </div>
      } @else {
        @if (workflowService.workflows().length === 0) {
          <div class="flex flex-col items-center justify-center py-20 text-base-content/40" data-testid="empty-state">
            <ng-icon name="heroInboxStack" class="text-5xl mb-4 opacity-50" />
            <p class="text-base text-base-content/50 font-medium">申請がありません</p>
          </div>
        } @else {
          <div class="overflow-x-auto" data-testid="workflow-table">
            <table class="table table-zebra">
              <thead>
                <tr>
                  <th class="whitespace-nowrap">申請番号</th>
                  <th>種別</th>
                  <th>タイトル</th>
                  <th>ステータス</th>
                  <th>申請日</th>
                  <th>申請者</th>
                </tr>
              </thead>
              <tbody>
                @for (row of paginatedWorkflows(); track row.id) {
                  <tr (click)="onRowClick(row)"
                    class="cursor-pointer hover:bg-base-200/50 transition-colors"
                    data-testid="workflow-row">
                    <td class="font-medium">{{ row.workflowNumber }}</td>
                    <td>
                      <span class="badge badge-outline">{{ getTypeLabel(row.type) }}</span>
                    </td>
                    <td>{{ row.title }}</td>
                    <td>
                      <span class="badge" [ngClass]="getBadgeClass(row.status)">
                        {{ getStatusLabel(row.status) }}
                      </span>
                    </td>
                    <td class="text-base-content/60 whitespace-nowrap">{{ row.createdAt | date:'yyyy/MM/dd' }}</td>
                    <td>
                      <div class="flex items-center text-base-content/80">
                        <div class="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold mr-2 uppercase">
                          {{ (row.creator?.profile?.displayName ?? 'U').charAt(0) }}
                        </div>
                        {{ row.creator?.profile?.displayName ?? '-' }}
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          @if (totalPages() > 1) {
            <div class="flex justify-center py-4" data-testid="pagination">
              <div class="join">
                @for (p of pages(); track p) {
                  <button class="join-item btn btn-sm"
                      [class.btn-active]="p === pageIndex"
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
export class WorkflowListComponent implements OnInit {
  workflowService = inject(WorkflowService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  statusFilter: string | null = null;
  typeFilter: string | null = null;
  modeFilter: string | null = null;
  pageSize = 20;
  pageIndex = 1;

  private readonly typeLabels: Record<string, string> = {
    expense: '経費', leave: '休暇', purchase: '購買', other: 'その他',
  };

  paginatedWorkflows = computed(() => {
    return this.workflowService.workflows();
  });

  totalPages = computed(() => {
    return Math.ceil(this.workflowService.totalCount() / this.pageSize);
  });

  pages = computed(() => {
    const total = this.totalPages();
    return Array.from({ length: total }, (_, i) => i + 1);
  });

  ngOnInit(): void {
    // URL パラメータからフィルター初期値を取得 (ダッシュボードからの遷移用)
    const queryParams = this.route.snapshot.queryParams;
    if (queryParams['mode']) {
      this.modeFilter = queryParams['mode'];
    }
    if (queryParams['status']) {
      this.statusFilter = queryParams['status'];
    }
    this.loadData();
  }

  getStatusLabel(status: string): string {
    return (WORKFLOW_STATUS_LABELS as any)[status] ?? status;
  }

  getStatusColor(status: string): string {
    return (WORKFLOW_STATUS_COLORS as any)[status] ?? '';
  }

  getTypeLabel(type: string): string {
    return this.typeLabels[type] ?? type;
  }

  getBadgeClass(status: string): string {
    switch (status) {
      case 'approved': return 'badge-success';
      case 'rejected': return 'badge-error';
      case 'submitted': return 'badge-warning';
      case 'draft': return 'badge-ghost';
      case 'withdrawn': return 'badge-ghost';
      default: return 'badge-ghost';
    }
  }

  onFilterChange(): void {
    this.pageIndex = 1;
    this.loadData();
  }

  onPageIndexChange(pageIndex: number): void {
    this.pageIndex = pageIndex;
    this.workflowService.loadAll({
      status: this.statusFilter || undefined,
      type: this.typeFilter || undefined,
      mode: this.modeFilter || undefined,
      page: pageIndex,
      limit: this.pageSize,
    });
  }

  onPageSizeChange(pageSize: number): void {
    this.pageSize = pageSize;
    this.pageIndex = 1;
    this.workflowService.loadAll({
      status: this.statusFilter || undefined,
      type: this.typeFilter || undefined,
      mode: this.modeFilter || undefined,
      page: 1,
      limit: pageSize,
    });
  }

  onRowClick(workflow: Workflow): void {
    this.router.navigate(['/workflows', workflow.id]);
  }

  private loadData(): void {
    this.workflowService.loadAll({
      status: this.statusFilter || undefined,
      type: this.typeFilter || undefined,
      mode: this.modeFilter || undefined,
    });
  }
}
