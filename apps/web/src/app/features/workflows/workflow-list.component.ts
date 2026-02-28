import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { PaginatorModule } from 'primeng/paginator';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import {
  WorkflowService, Workflow,
} from './workflow.service';
import {
  WORKFLOW_STATUS_LABELS, WORKFLOW_STATUS_COLORS,
} from '@shared/types';

@Component({
  selector: 'app-workflow-list',
  standalone: true,
  imports: [
    CommonModule, RouterLink, FormsModule,
    TableModule, SelectModule, TagModule, PaginatorModule, ButtonModule, ProgressSpinnerModule,
  ],
  template: `
    <div class="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 class="text-2xl font-bold m-0">申請一覧</h1>
        <p-button icon="pi pi-plus" label="新規申請" routerLink="new" data-testid="create-workflow-btn" />
      </div>

      <!-- Filters -->
      <div class="flex flex-col sm:flex-row gap-4 items-end" data-testid="workflow-filters">
        <div class="w-full sm:w-64 flex flex-col gap-2">
          <label class="font-medium text-sm">ステータス</label>
          <p-select [options]="statusOptions" [(ngModel)]="statusFilter"
              (ngModelChange)="onFilterChange()" optionLabel="label" optionValue="value"
              placeholder="すべて" [showClear]="true" styleClass="w-full"
              data-testid="status-filter" />
        </div>

        <div class="w-full sm:w-64 flex flex-col gap-2">
          <label class="font-medium text-sm">種別</label>
          <p-select [options]="typeOptions" [(ngModel)]="typeFilter"
              (ngModelChange)="onFilterChange()" optionLabel="label" optionValue="value"
              placeholder="すべて" [showClear]="true" styleClass="w-full"
              data-testid="type-filter" />
        </div>

        <div class="w-full sm:w-64 flex flex-col gap-2">
          <label class="font-medium text-sm">表示</label>
          <p-select [options]="modeOptions" [(ngModel)]="modeFilter"
              (ngModelChange)="onFilterChange()" optionLabel="label" optionValue="value"
              placeholder="すべての申請" [showClear]="true" styleClass="w-full"
              data-testid="mode-filter" />
        </div>
      </div>

      <!-- Loading -->
      @if (workflowService.isLoading()) {
        <div class="flex justify-center py-20" data-testid="loading">
          <p-progressSpinner />
        </div>
      } @else {
        @if (workflowService.workflows().length === 0) {
          <div class="flex flex-col items-center justify-center py-20 opacity-40" data-testid="empty-state">
            <i class="pi pi-inbox text-5xl mb-4 opacity-50"></i>
            <p class="text-base font-medium">申請がありません</p>
          </div>
        } @else {
          <p-table [value]="paginatedWorkflows()" [tableStyle]="{ 'min-width': '50rem' }"
              [stripedRows]="true" [rowHover]="true"
              data-testid="workflow-table">
            <ng-template #header>
              <tr>
                <th class="whitespace-nowrap">申請番号</th>
                <th>種別</th>
                <th>タイトル</th>
                <th>ステータス</th>
                <th>申請日</th>
                <th>申請者</th>
              </tr>
            </ng-template>
            <ng-template #body let-row>
              <tr (click)="onRowClick(row)" class="cursor-pointer" data-testid="workflow-row">
                <td class="font-medium">{{ row.workflowNumber }}</td>
                <td>
                  <p-tag [value]="getTypeLabel(row.type)" severity="secondary" />
                </td>
                <td>{{ row.title }}</td>
                <td>
                  <p-tag [value]="getStatusLabel(row.status)" [severity]="getSeverity(row.status)" />
                </td>
                <td class="whitespace-nowrap opacity-60">{{ row.createdAt | date:'yyyy/MM/dd' }}</td>
                <td>
                  <div class="flex items-center opacity-80">
                    <div class="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold mr-2 uppercase">
                      {{ (row.creator?.profile?.displayName ?? 'U').charAt(0) }}
                    </div>
                    {{ row.creator?.profile?.displayName ?? '-' }}
                  </div>
                </td>
              </tr>
            </ng-template>
          </p-table>

          <!-- Pagination -->
          @if (totalPages() > 1) {
            <p-paginator [rows]="pageSize" [totalRecords]="workflowService.totalCount()"
                [first]="(pageIndex - 1) * pageSize"
                (onPageChange)="onPaginatorChange($event)"
                data-testid="pagination" />
          }
        }
      }
    </div>
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

  statusOptions = [
    { label: '下書き', value: 'draft' },
    { label: '申請中', value: 'submitted' },
    { label: '承認済', value: 'approved' },
    { label: '差戻し', value: 'rejected' },
    { label: '取下げ', value: 'withdrawn' },
  ];

  typeOptions = [
    { label: '経費', value: 'expense' },
    { label: '休暇', value: 'leave' },
    { label: '購買', value: 'purchase' },
    { label: 'その他', value: 'other' },
  ];

  modeOptions = [
    { label: '自分の申請のみ', value: 'mine' },
  ];

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

  getSeverity(status: string): 'success' | 'danger' | 'warn' | 'secondary' | 'info' | 'contrast' | undefined {
    switch (status) {
      case 'approved': return 'success';
      case 'rejected': return 'danger';
      case 'submitted': return 'warn';
      case 'draft': return 'secondary';
      case 'withdrawn': return 'contrast';
      default: return 'secondary';
    }
  }

  onFilterChange(): void {
    this.pageIndex = 1;
    this.loadData();
  }

  onPaginatorChange(event: any): void {
    this.pageIndex = Math.floor(event.first / event.rows) + 1;
    this.pageSize = event.rows;
    this.workflowService.loadAll({
      status: this.statusFilter || undefined,
      type: this.typeFilter || undefined,
      mode: this.modeFilter || undefined,
      page: this.pageIndex,
      limit: this.pageSize,
    });
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
