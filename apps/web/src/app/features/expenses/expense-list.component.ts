import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  heroBanknotes,
  heroPlus,
  heroChartBar,
} from '@ng-icons/heroicons/outline';
import { ExpenseService, Expense } from './expense.service';
import {
  EXPENSE_CATEGORIES,
  EXPENSE_CATEGORY_COLORS,
  WORKFLOW_STATUS_LABELS,
  WORKFLOW_STATUS_COLORS,
} from '@shared/types';
import { ListPageComponent } from '../../shared/ui/page-layouts/list-page.component';

@Component({
  selector: 'app-expense-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NgIcon,
    ListPageComponent,
  ],
  viewProviders: [provideIcons({ heroBanknotes, heroPlus, heroChartBar })],
  template: `
    <app-list-page title="経費一覧">
      <div slot="actions" class="flex gap-3">
        <button class="btn btn-ghost btn-sm" (click)="goToSummary()"
            data-testid="expense-summary-btn">
          <ng-icon name="heroChartBar" class="text-base" />
          集計
        </button>
        <button class="btn btn-primary btn-sm" (click)="goToNew()"
            data-testid="expense-new-btn">
          <ng-icon name="heroPlus" class="text-base" />
          新規申請
        </button>
      </div>

      <!-- フィルタ -->
      <div slot="filters" class="card bg-base-100 shadow-sm">
        <div class="card-body py-3">
          <div class="flex flex-wrap gap-4 items-center">
            <div class="w-full sm:w-64">
              <select class="select select-sm w-full"
                [(ngModel)]="selectedCategory"
                (ngModelChange)="onFilterChange()"
                data-testid="filter-category">
                <option value="">すべてのカテゴリ</option>
                @for (cat of categories; track cat) {
                  <option [value]="cat">{{ cat }}</option>
                }
              </select>
            </div>

            <div class="w-full sm:w-64">
              <select class="select select-sm w-full"
                [(ngModel)]="selectedStatus"
                (ngModelChange)="onFilterChange()"
                data-testid="filter-status">
                <option value="">すべてのステータス</option>
                <option value="draft">下書き</option>
                <option value="submitted">申請中</option>
                <option value="approved">承認済</option>
                <option value="rejected">差戻し</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <!-- ローディング -->
      @if (expenseService.isLoading()) {
        <div class="flex justify-center py-12" data-testid="loading">
          <span class="loading loading-spinner loading-lg text-primary"></span>
        </div>
      }

      <!-- テーブル -->
      @if (!expenseService.isLoading()) {
        <div class="overflow-x-auto" data-testid="expense-table">
          <table class="table table-zebra">
            <thead>
              <tr>
                <th>申請番号</th>
                <th>カテゴリ</th>
                <th class="text-right">金額</th>
                <th>日付</th>
                <th>プロジェクト</th>
                <th>ステータス</th>
                <th>申請者</th>
              </tr>
            </thead>
            <tbody>
              @for (row of expenseService.expenses(); track row.id) {
                <tr>
                  <td class="whitespace-nowrap">
                    <span class="font-mono text-sm text-base-content/60">{{ row.workflow?.workflowNumber || '—' }}</span>
                  </td>
                  <td class="whitespace-nowrap">
                    <span class="badge badge-sm" [style.background-color]="getCategoryColor(row.category)" style="color: white; border: none;">
                      {{ row.category }}
                    </span>
                  </td>
                  <td class="font-semibold text-right whitespace-nowrap">
                    ¥{{ row.amount | number }}
                  </td>
                  <td class="text-base-content/70 whitespace-nowrap">
                    {{ row.expenseDate | date:'yyyy/MM/dd' }}
                  </td>
                  <td class="font-medium whitespace-nowrap truncate max-w-[200px]">
                    {{ row.project?.name || '—' }}
                  </td>
                  <td class="whitespace-nowrap">
                    @if (row.workflow) {
                      <span class="badge badge-sm" [class]="getStatusBadgeClass(row.workflow.status)">
                        {{ getStatusLabel(row.workflow.status) }}
                      </span>
                    } @else {
                      <span class="badge badge-sm badge-ghost">下書き</span>
                    }
                  </td>
                  <td class="whitespace-nowrap">
                    <div class="flex items-center gap-2">
                      <div class="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs uppercase flex-shrink-0">
                        {{ (row.createdBy.displayName || 'U').charAt(0) }}
                      </div>
                      <span class="font-medium">{{ row.createdBy.displayName || '—' }}</span>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>

          @if (expenseService.expenses().length === 0 && !expenseService.isLoading()) {
            <div class="flex flex-col items-center justify-center py-16 text-center">
              <div class="w-16 h-16 rounded-full bg-base-200 flex items-center justify-center mb-4">
                <ng-icon name="heroBanknotes" class="text-3xl text-base-content/40" />
              </div>
              <h3 class="text-lg font-bold mb-1">経費申請がありません</h3>
              <p class="text-base-content/60 mb-6">新しい経費申請を作成してください</p>
            </div>
          }
        </div>

        @if (expenseService.total() > 0) {
          <div class="border-t border-base-200 bg-base-200/30 px-4 py-3 flex justify-end items-center gap-2"
             data-testid="expense-paginator">
            <div class="join">
              <button class="join-item btn btn-sm"
                  [disabled]="pageIndex <= 1"
                  (click)="onPageIndexChange(pageIndex - 1)">«</button>
              <button class="join-item btn btn-sm btn-active">{{ pageIndex }}</button>
              <button class="join-item btn btn-sm"
                  [disabled]="pageIndex * pageSize >= expenseService.total()"
                  (click)="onPageIndexChange(pageIndex + 1)">»</button>
            </div>
            <select class="select select-sm w-20"
                [value]="pageSize"
                (change)="onPageSizeSelectChange($event)">
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
            </select>
          </div>
        }
      }

      <!-- エラー -->
      @if (expenseService.error()) {
        <div role="alert" class="alert alert-error mt-4">
          <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{{ expenseService.error() }}</span>
        </div>
      }
    </app-list-page>
  `,
  styles: [],
})
export class ExpenseListComponent implements OnInit {
  readonly expenseService = inject(ExpenseService);
  private router = inject(Router);

  categories = EXPENSE_CATEGORIES;
  selectedCategory = '';
  selectedStatus = '';
  pageIndex = 1;
  pageSize = 20;

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
    this.expenseService.loadAll({
      category: this.selectedCategory || undefined,
      status: this.selectedStatus || undefined,
    });
  }

  onPageIndexChange(pageIndex: number): void {
    this.pageIndex = pageIndex;
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
