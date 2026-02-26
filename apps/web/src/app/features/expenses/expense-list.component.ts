import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzPaginationModule } from 'ng-zorro-antd/pagination';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzAlertModule } from 'ng-zorro-antd/alert';
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
        NzTableModule,
        NzPaginationModule,
        NzSelectModule,
        NzButtonModule,
        NzTagModule,
        NzIconModule,
        NzSpinModule,
        NzCardModule,
        NzAlertModule,
    ],
    template: `
        <div class="p-6 lg:p-8 max-w-[1200px] mx-auto space-y-6">
            <div class="flex items-center justify-between border-b border-gray-200 pb-4">
                <h1 class="text-2xl font-bold text-gray-900 m-0 flex items-center gap-2">
                    <span nz-icon nzType="file-text" nzTheme="outline" class="text-primary-600"></span>
                    経費一覧
                </h1>
                <div class="flex gap-3">
                    <button nz-button nzType="default" (click)="goToSummary()"
                            data-testid="expense-summary-btn">
                        <span nz-icon nzType="bar-chart" nzTheme="outline"></span>
                        集計
                    </button>
                    <button nz-button nzType="primary" (click)="goToNew()"
                            data-testid="expense-new-btn"
                            class="!rounded-lg shadow-sm">
                        <span nz-icon nzType="plus" nzTheme="outline"></span>
                        新規申請
                    </button>
                </div>
            </div>

            <!-- フィルタ -->
            <nz-card [nzBordered]="true" class="!rounded-xl shadow-sm border border-gray-200">
                <div class="flex flex-wrap gap-4 items-center">
                    <div class="w-full sm:w-64">
                        <nz-select
                            [(ngModel)]="selectedCategory"
                            (ngModelChange)="onFilterChange()"
                            nzPlaceHolder="カテゴリ"
                            nzAllowClear
                            class="w-full"
                            data-testid="filter-category">
                            <nz-option nzValue="" nzLabel="すべて"></nz-option>
                            @for (cat of categories; track cat) {
                                <nz-option [nzValue]="cat" [nzLabel]="cat"></nz-option>
                            }
                        </nz-select>
                    </div>

                    <div class="w-full sm:w-64">
                        <nz-select
                            [(ngModel)]="selectedStatus"
                            (ngModelChange)="onFilterChange()"
                            nzPlaceHolder="ステータス"
                            nzAllowClear
                            class="w-full"
                            data-testid="filter-status">
                            <nz-option nzValue="" nzLabel="すべて"></nz-option>
                            <nz-option nzValue="draft" nzLabel="下書き"></nz-option>
                            <nz-option nzValue="submitted" nzLabel="申請中"></nz-option>
                            <nz-option nzValue="approved" nzLabel="承認済"></nz-option>
                            <nz-option nzValue="rejected" nzLabel="差戻し"></nz-option>
                        </nz-select>
                    </div>
                </div>
            </nz-card>

            <!-- ローディング -->
            @if (expenseService.isLoading()) {
                <div class="flex justify-center py-12">
                    <nz-spin nzSimple [nzSize]="'large'"></nz-spin>
                </div>
            }

            <!-- テーブル -->
            @if (!expenseService.isLoading()) {
                <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div class="overflow-x-auto">
                        <nz-table #expenseTable
                            [nzData]="expenseService.expenses()"
                            [nzShowPagination]="false"
                            [nzBordered]="false"
                            [nzSize]="'middle'"
                            [nzNoResult]="emptyTpl"
                            data-testid="expense-table">
                            <thead>
                                <tr>
                                    <th class="!bg-gray-50 !text-gray-500 font-medium text-xs tracking-wider uppercase">申請番号</th>
                                    <th class="!bg-gray-50 !text-gray-500 font-medium text-xs tracking-wider uppercase">カテゴリ</th>
                                    <th class="!bg-gray-50 !text-gray-500 font-medium text-xs tracking-wider uppercase text-right">金額</th>
                                    <th class="!bg-gray-50 !text-gray-500 font-medium text-xs tracking-wider uppercase">日付</th>
                                    <th class="!bg-gray-50 !text-gray-500 font-medium text-xs tracking-wider uppercase">プロジェクト</th>
                                    <th class="!bg-gray-50 !text-gray-500 font-medium text-xs tracking-wider uppercase">ステータス</th>
                                    <th class="!bg-gray-50 !text-gray-500 font-medium text-xs tracking-wider uppercase">申請者</th>
                                </tr>
                            </thead>
                            <tbody>
                                @for (row of expenseService.expenses(); track row.id) {
                                    <tr class="hover:bg-gray-50/50 transition-colors">
                                        <td class="border-b border-gray-100 !py-3 whitespace-nowrap">
                                            <span class="font-mono text-sm text-gray-500">{{ row.workflow?.workflowNumber || '—' }}</span>
                                        </td>
                                        <td class="border-b border-gray-100 !py-3 whitespace-nowrap">
                                            <nz-tag [nzColor]="getCategoryColor(row.category)" class="!rounded-full !px-2.5 !py-0.5 !text-xs !font-bold !border-0">
                                                {{ row.category }}
                                            </nz-tag>
                                        </td>
                                        <td class="border-b border-gray-100 !py-3 font-semibold text-gray-900 text-right whitespace-nowrap">
                                            ¥{{ row.amount | number }}
                                        </td>
                                        <td class="border-b border-gray-100 !py-3 text-gray-600 whitespace-nowrap">
                                            {{ row.expenseDate | date:'yyyy/MM/dd' }}
                                        </td>
                                        <td class="border-b border-gray-100 !py-3 text-gray-900 font-medium whitespace-nowrap truncate max-w-[200px]">
                                            {{ row.project?.name || '—' }}
                                        </td>
                                        <td class="border-b border-gray-100 !py-3 whitespace-nowrap">
                                            @if (row.workflow) {
                                                <nz-tag [nzColor]="getStatusNzColor(row.workflow.status)">
                                                    {{ getStatusLabel(row.workflow.status) }}
                                                </nz-tag>
                                            } @else {
                                                <nz-tag nzColor="default">下書き</nz-tag>
                                            }
                                        </td>
                                        <td class="border-b border-gray-100 !py-3 whitespace-nowrap">
                                            <div class="flex items-center gap-2">
                                                <div class="w-6 h-6 rounded-full bg-primary-50 text-primary-700 flex items-center justify-center font-bold text-xs uppercase flex-shrink-0">
                                                    {{ (row.createdBy?.displayName || 'U').charAt(0) }}
                                                </div>
                                                <span class="text-gray-700 font-medium">{{ row.createdBy?.displayName || '—' }}</span>
                                            </div>
                                        </td>
                                    </tr>
                                }
                            </tbody>
                        </nz-table>
                        <ng-template #emptyTpl>
                            @if (!expenseService.isLoading()) {
                                <div class="flex flex-col items-center justify-center py-16 text-center">
                                    <div class="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-4">
                                        <span nz-icon nzType="file-text" nzTheme="outline" class="text-3xl text-gray-400"></span>
                                    </div>
                                    <h3 class="text-lg font-bold text-gray-900 mb-1">経費申請がありません</h3>
                                    <p class="text-gray-500 mb-6">新しい経費申請を作成してください</p>
                                </div>
                            }
                        </ng-template>
                    </div>

                    @if (expenseService.total() > 0) {
                        <div class="border-t border-gray-100 bg-gray-50/50 px-4 py-3 flex justify-end">
                            <nz-pagination
                                [nzTotal]="expenseService.total()"
                                [nzPageSize]="pageSize"
                                [nzPageIndex]="pageIndex"
                                [nzPageSizeOptions]="[10, 20, 50]"
                                nzShowSizeChanger
                                (nzPageIndexChange)="onPageIndexChange($event)"
                                (nzPageSizeChange)="onPageSizeChange($event)"
                                data-testid="expense-paginator">
                            </nz-pagination>
                        </div>
                    }
                </div>
            }

            <!-- エラー -->
            @if (expenseService.error()) {
                <nz-alert
                    nzType="error"
                    [nzMessage]="expenseService.error()!"
                    nzShowIcon>
                </nz-alert>
            }
        </div>
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

    getCategoryColor(category: string): string {
        return EXPENSE_CATEGORY_COLORS[category as keyof typeof EXPENSE_CATEGORY_COLORS] || '#757575';
    }

    getStatusLabel(status: string): string {
        return WORKFLOW_STATUS_LABELS[status as keyof typeof WORKFLOW_STATUS_LABELS] || status;
    }

    getStatusNzColor(status: string): string {
        const colorMap: Record<string, string> = {
            draft: 'default',
            submitted: 'processing',
            approved: 'success',
            rejected: 'error',
        };
        return colorMap[status] || 'default';
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
