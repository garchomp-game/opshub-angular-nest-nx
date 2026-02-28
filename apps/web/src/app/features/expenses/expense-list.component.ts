import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { PaginatorModule } from 'primeng/paginator';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { ExpenseService, Expense } from './expense.service';
import {
  EXPENSE_CATEGORIES,
  EXPENSE_CATEGORY_COLORS,
  WORKFLOW_STATUS_LABELS,
  WORKFLOW_STATUS_COLORS,
} from '@shared/types';

@Component({
  selector: 'app-expense-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    PaginatorModule,
    SelectModule,
    TagModule,
    ButtonModule,
  ],
  template: `
    <div class="p-6 lg:p-8 max-w-[1400px] mx-auto space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold m-0">経費一覧</h1>
        <div class="flex gap-3">
          <p-button icon="pi pi-chart-bar" label="集計" [text]="true"
              (onClick)="goToSummary()"
              data-testid="expense-summary-btn" />
          <p-button icon="pi pi-plus" label="新規申請"
              (onClick)="goToNew()"
              data-testid="expense-new-btn" />
        </div>
      </div>

      <!-- フィルタ -->
      <div class="flex flex-wrap gap-4 items-center" data-testid="expense-filters">
        <div class="w-full sm:w-64">
          <p-select [options]="categoryOptions" [(ngModel)]="selectedCategory"
              (ngModelChange)="onFilterChange()"
              placeholder="すべてのカテゴリ" [showClear]="true"
              styleClass="w-full" data-testid="filter-category" />
        </div>
        <div class="w-full sm:w-64">
          <p-select [options]="statusOptions" [(ngModel)]="selectedStatus"
              (ngModelChange)="onFilterChange()"
              placeholder="すべてのステータス" [showClear]="true"
              optionLabel="label" optionValue="value"
              styleClass="w-full" data-testid="filter-status" />
        </div>
      </div>

      <!-- ローディング -->
      @if (expenseService.isLoading()) {
        <div class="flex justify-center py-12" data-testid="loading">
          <i class="pi pi-spin pi-spinner" style="font-size: 2rem; color: var(--p-primary-color);"></i>
        </div>
      }

      <!-- テーブル -->
      @if (!expenseService.isLoading()) {
        <p-table [value]="expenseService.expenses()" [tableStyle]="{ 'min-width': '60rem' }"
            dataKey="id" data-testid="expense-table">
          <ng-template #header>
            <tr>
              <th>申請番号</th>
              <th>カテゴリ</th>
              <th class="text-right">金額</th>
              <th>日付</th>
              <th>プロジェクト</th>
              <th>ステータス</th>
              <th>申請者</th>
            </tr>
          </ng-template>
          <ng-template #body let-row>
            <tr>
              <td class="whitespace-nowrap">
                <span class="font-mono text-sm" style="opacity: 0.6;">{{ row.workflow?.workflowNumber || '—' }}</span>
              </td>
              <td class="whitespace-nowrap">
                <p-tag [style]="{ 'background-color': getCategoryColor(row.category), 'border': 'none' }"
                    [value]="row.category" />
              </td>
              <td class="font-semibold text-right whitespace-nowrap">
                ¥{{ row.amount | number }}
              </td>
              <td class="whitespace-nowrap" style="opacity: 0.7;">
                {{ row.expenseDate | date:'yyyy/MM/dd' }}
              </td>
              <td class="font-medium whitespace-nowrap" style="max-width: 200px; overflow: hidden; text-overflow: ellipsis;">
                {{ row.project?.name || '—' }}
              </td>
              <td class="whitespace-nowrap">
                @if (row.workflow) {
                  <p-tag [value]="getStatusLabel(row.workflow.status)"
                      [severity]="getStatusSeverity(row.workflow.status)" />
                } @else {
                  <p-tag value="下書き" severity="secondary" />
                }
              </td>
              <td class="whitespace-nowrap">
                <div class="flex items-center gap-2">
                  <div class="w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs uppercase flex-shrink-0"
                      style="background-color: var(--p-primary-100); color: var(--p-primary-color);">
                    {{ (row.createdBy.displayName || 'U').charAt(0) }}
                  </div>
                  <span class="font-medium">{{ row.createdBy.displayName || '—' }}</span>
                </div>
              </td>
            </tr>
          </ng-template>
          <ng-template #emptymessage>
            <tr>
              <td colspan="7">
                <div class="flex flex-col items-center justify-center py-16 text-center">
                  <div class="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                      style="background-color: var(--p-surface-100);">
                    <i class="pi pi-wallet" style="font-size: 1.5rem; opacity: 0.4;"></i>
                  </div>
                  <h3 class="text-lg font-bold mb-1">経費申請がありません</h3>
                  <p style="opacity: 0.6;" class="mb-6">新しい経費申請を作成してください</p>
                </div>
              </td>
            </tr>
          </ng-template>
        </p-table>

        @if (expenseService.total() > 0) {
          <p-paginator
              [first]="first"
              [rows]="pageSize"
              [totalRecords]="expenseService.total()"
              [rowsPerPageOptions]="[10, 20, 50]"
              (onPageChange)="onPaginatorChange($event)"
              data-testid="expense-paginator" />
        }
      }

      <!-- エラー -->
      @if (expenseService.error()) {
        <div class="flex items-center gap-3 p-4 rounded-lg" style="background-color: var(--p-red-50); color: var(--p-red-700); border: 1px solid var(--p-red-200);">
          <i class="pi pi-times-circle" style="font-size: 1.25rem;"></i>
          <span>{{ expenseService.error() }}</span>
        </div>
      }
    </div>
  `,
  styles: [],
})
export class ExpenseListComponent implements OnInit {
  readonly expenseService = inject(ExpenseService);
  private router = inject(Router);

  categories = EXPENSE_CATEGORIES;
  categoryOptions = EXPENSE_CATEGORIES.map(cat => cat);
  statusOptions = [
    { label: '下書き', value: 'draft' },
    { label: '申請中', value: 'submitted' },
    { label: '承認済', value: 'approved' },
    { label: '差戻し', value: 'rejected' },
  ];
  selectedCategory: string | null = null;
  selectedStatus: string | null = null;
  pageIndex = 1;
  pageSize = 20;
  first = 0;

  displayedColumns = [
    'workflowNumber',
    'category',
    'amount',
    'expenseDate',
    'project',
    'status',
    'createdBy',
  ];

  ngOnInit(): void {
    this.expenseService.loadAll();
  }

  onFilterChange(): void {
    this.pageIndex = 1;
    this.first = 0;
    this.expenseService.loadAll({
      category: this.selectedCategory || undefined,
      status: this.selectedStatus || undefined,
    });
  }

  onPaginatorChange(event: any): void {
    this.first = event.first;
    this.pageSize = event.rows;
    this.pageIndex = Math.floor(event.first / event.rows) + 1;
    this.expenseService.loadAll({
      category: this.selectedCategory || undefined,
      status: this.selectedStatus || undefined,
      page: this.pageIndex,
      limit: this.pageSize,
    });
  }

  onPageIndexChange(pageIndex: number): void {
    this.pageIndex = pageIndex;
    this.first = (pageIndex - 1) * this.pageSize;
    this.expenseService.loadAll({
      category: this.selectedCategory || undefined,
      status: this.selectedStatus || undefined,
      page: pageIndex,
      limit: this.pageSize,
    });
  }

  onPageSizeChange(pageSize: number): void {
    this.pageSize = pageSize;
    this.pageIndex = 1;
    this.first = 0;
    this.expenseService.loadAll({
      category: this.selectedCategory || undefined,
      status: this.selectedStatus || undefined,
      page: 1,
      limit: pageSize,
    });
  }

  onPageSizeSelectChange(event: Event): void {
    const value = parseInt((event.target as HTMLSelectElement).value, 10);
    this.onPageSizeChange(value);
  }

  getCategoryColor(category: string): string {
    return EXPENSE_CATEGORY_COLORS[category as keyof typeof EXPENSE_CATEGORY_COLORS] || '#757575';
  }

  getStatusLabel(status: string): string {
    return WORKFLOW_STATUS_LABELS[status as keyof typeof WORKFLOW_STATUS_LABELS] || status;
  }

  getStatusSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' | undefined {
    const severityMap: Record<string, 'success' | 'info' | 'warn' | 'danger' | 'secondary'> = {
      draft: 'secondary',
      submitted: 'info',
      approved: 'success',
      rejected: 'danger',
    };
    return severityMap[status] || 'secondary';
  }

  getStatusBadgeClass(status: string): string {
    const classMap: Record<string, string> = {
      draft: 'badge-ghost',
      submitted: 'badge-info',
      approved: 'badge-success',
      rejected: 'badge-error',
    };
    return classMap[status] || 'badge-ghost';
  }

  getStatusColor(status: string): string {
    return WORKFLOW_STATUS_COLORS[status as keyof typeof WORKFLOW_STATUS_COLORS] || '';
  }

  goToNew(): void {
    this.router.navigate(['/expenses/new']);
  }

  goToSummary(): void {
    this.router.navigate(['/expenses/summary']);
  }
}
