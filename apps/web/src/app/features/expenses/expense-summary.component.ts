import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';
import { forkJoin } from 'rxjs';
import {
    ExpenseService,
    CategorySummary,
    ProjectSummary,
    MonthlySummary,
    ExpenseStats,
    SummaryQuery,
} from './expense.service';
import { EXPENSE_CATEGORY_COLORS } from '@shared/types';

@Component({
    selector: 'app-expense-summary',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        NzCardModule,
        NzTabsModule,
        NzTableModule,
        NzDatePickerModule,
        NzButtonModule,
        NzIconModule,
        NzSpinModule,
        NzStatisticModule,
    ],
    template: `
        <div class="p-6 lg:p-8 max-w-[1200px] mx-auto space-y-6 flex flex-col min-h-full">
            <nz-card [nzBordered]="true"
                     class="!rounded-xl shadow-sm border border-gray-200 flex flex-col flex-1">
                <div class="px-6 py-5 border-b border-gray-100 flex items-center gap-3 bg-gray-50/50 -mx-6 -mt-6 mb-6 flex-shrink-0">
                    <div class="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center text-primary-600">
                        <span nz-icon nzType="fund" nzTheme="outline" class="text-xl"></span>
                    </div>
                    <h2 class="text-xl font-bold text-gray-900 m-0">経費集計</h2>
                </div>

                <!-- Filters -->
                <div class="p-6 border-b border-gray-100 bg-white -mx-6 mb-6" data-testid="filter-date">
                    <div class="flex flex-wrap items-center gap-4 px-6">
                        <div class="w-full sm:w-48">
                            <label class="block text-xs font-medium text-gray-500 mb-1">開始日</label>
                            <nz-date-picker
                                [(ngModel)]="dateFrom"
                                nzFormat="yyyy/MM/dd"
                                class="w-full"
                                nzPlaceHolder="開始日"
                                data-testid="filter-date-from">
                            </nz-date-picker>
                        </div>

                        <span class="text-gray-400 font-medium hidden sm:block mt-4">〜</span>

                        <div class="w-full sm:w-48">
                            <label class="block text-xs font-medium text-gray-500 mb-1">終了日</label>
                            <nz-date-picker
                                [(ngModel)]="dateTo"
                                nzFormat="yyyy/MM/dd"
                                class="w-full"
                                nzPlaceHolder="終了日"
                                data-testid="filter-date-to">
                            </nz-date-picker>
                        </div>

                        <button nz-button nzType="primary" (click)="loadData()"
                                data-testid="apply-filter-btn"
                                class="!rounded-lg shadow-sm font-medium w-full sm:w-auto mt-4 sm:mt-auto">
                            <span nz-icon nzType="search" nzTheme="outline"></span>
                            適用
                        </button>
                    </div>
                </div>

                <!-- Stats Cards -->
                @if (stats()) {
                    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        <nz-card [nzBordered]="true" class="!rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                            <div class="flex items-center gap-4">
                                <div class="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                                    <span nz-icon nzType="dollar" nzTheme="outline" class="text-2xl"></span>
                                </div>
                                <div class="flex-1 min-w-0">
                                    <nz-statistic
                                        nzTitle="合計金額"
                                        [nzValue]="stats()!.totalAmount"
                                        nzPrefix="¥"
                                        [nzValueStyle]="{ 'font-size': '1.25rem', 'font-weight': '700', 'color': '#111827' }">
                                    </nz-statistic>
                                </div>
                            </div>
                        </nz-card>

                        <nz-card [nzBordered]="true" class="!rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                            <div class="flex items-center gap-4">
                                <div class="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
                                    <span nz-icon nzType="file-text" nzTheme="outline" class="text-2xl"></span>
                                </div>
                                <div class="flex-1 min-w-0">
                                    <nz-statistic
                                        nzTitle="件数"
                                        [nzValue]="stats()!.totalCount"
                                        nzSuffix="件"
                                        [nzValueStyle]="{ 'font-size': '1.25rem', 'font-weight': '700', 'color': '#111827' }">
                                    </nz-statistic>
                                </div>
                            </div>
                        </nz-card>

                        <nz-card [nzBordered]="true" class="!rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                            <div class="flex items-center gap-4">
                                <div class="w-12 h-12 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center flex-shrink-0">
                                    <span nz-icon nzType="rise" nzTheme="outline" class="text-2xl"></span>
                                </div>
                                <div class="flex-1 min-w-0">
                                    <nz-statistic
                                        nzTitle="平均金額"
                                        [nzValue]="stats()!.avgAmount"
                                        nzPrefix="¥"
                                        [nzValueStyle]="{ 'font-size': '1.25rem', 'font-weight': '700', 'color': '#111827' }">
                                    </nz-statistic>
                                </div>
                            </div>
                        </nz-card>

                        <nz-card [nzBordered]="true" class="!rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                            <div class="flex items-center gap-4">
                                <div class="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
                                    <span nz-icon nzType="arrow-up" nzTheme="outline" class="text-2xl"></span>
                                </div>
                                <div class="flex-1 min-w-0">
                                    <nz-statistic
                                        nzTitle="最高金額"
                                        [nzValue]="stats()!.maxAmount"
                                        nzPrefix="¥"
                                        [nzValueStyle]="{ 'font-size': '1.25rem', 'font-weight': '700', 'color': '#111827' }">
                                    </nz-statistic>
                                </div>
                            </div>
                        </nz-card>
                    </div>
                }

                <!-- Loading -->
                @if (isLoading()) {
                    <div class="flex justify-center items-center flex-1 py-16" data-testid="loading">
                        <nz-spin nzSimple [nzSize]="'large'"></nz-spin>
                    </div>
                } @else {
                    <!-- Tabs -->
                    <nz-tabs class="min-h-[400px]" data-testid="summary-tabs">
                        <!-- カテゴリ別 -->
                        <nz-tab>
                            <ng-template nzTabLink>
                                <div class="flex items-center gap-2 px-2 py-1">
                                    <span nz-icon nzType="appstore" nzTheme="outline" class="text-blue-600"></span>
                                    <span class="font-bold">カテゴリ別</span>
                                </div>
                            </ng-template>

                            <div class="p-6">
                                <div class="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                                    <nz-table #categoryTable
                                        [nzData]="categoryData()"
                                        [nzShowPagination]="false"
                                        [nzBordered]="false"
                                        [nzSize]="'middle'"
                                        [nzNoResult]="categoryEmptyTpl"
                                        data-testid="category-table">
                                        <thead>
                                            <tr>
                                                <th class="!bg-gray-50 !text-gray-500 font-medium text-xs tracking-wider uppercase">カテゴリ</th>
                                                <th class="!bg-gray-50 !text-gray-500 font-medium text-xs tracking-wider uppercase text-right" nzWidth="130px">件数</th>
                                                <th class="!bg-gray-50 !text-gray-500 font-medium text-xs tracking-wider uppercase text-right" nzWidth="160px">合計金額</th>
                                                <th class="!bg-gray-50 !text-gray-500 font-medium text-xs tracking-wider uppercase text-right" nzWidth="130px">割合</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            @for (row of categoryData(); track row.category) {
                                                <tr class="hover:bg-gray-50/50 transition-colors">
                                                    <td class="border-b border-gray-100 !py-4">
                                                        <div class="flex items-center gap-3">
                                                            <span class="inline-block w-3 h-3 rounded-full shadow-sm" [style.background-color]="getCategoryColor(row.category)"></span>
                                                            <span class="font-semibold text-gray-900">{{ row.category }}</span>
                                                        </div>
                                                    </td>
                                                    <td class="border-b border-gray-100 !py-4 text-right pr-4">
                                                        <span class="text-gray-600 font-medium font-mono">{{ row.count }}</span><span class="text-gray-400 text-sm ml-1">件</span>
                                                    </td>
                                                    <td class="border-b border-gray-100 !py-4 text-right">
                                                        <span class="font-bold text-gray-900 text-base">¥{{ row.totalAmount | number }}</span>
                                                    </td>
                                                    <td class="border-b border-gray-100 !py-4 text-right pr-6">
                                                        <div class="flex items-center justify-end gap-2">
                                                            <span class="font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full text-sm min-w-[3rem] text-center">{{ row.percentage }}%</span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            }
                                        </tbody>
                                    </nz-table>
                                    <ng-template #categoryEmptyTpl>
                                        <div class="flex flex-col items-center justify-center py-16 text-center">
                                            <p class="text-gray-500 mb-0">データがありません</p>
                                        </div>
                                    </ng-template>
                                </div>
                            </div>
                        </nz-tab>

                        <!-- PJ別 -->
                        <nz-tab>
                            <ng-template nz-tab-link>
                                <div class="flex items-center gap-2 px-2 py-1">
                                    <span nz-icon nzType="project" nzTheme="outline" class="text-indigo-600"></span>
                                    <span class="font-bold">プロジェクト別</span>
                                </div>
                            </ng-template>

                            <div class="p-6">
                                <div class="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                                    <nz-table #projectTable
                                        [nzData]="projectData()"
                                        [nzShowPagination]="false"
                                        [nzBordered]="false"
                                        [nzSize]="'middle'"
                                        [nzNoResult]="projectEmptyTpl"
                                        data-testid="project-table">
                                        <thead>
                                            <tr>
                                                <th class="!bg-gray-50 !text-gray-500 font-medium text-xs tracking-wider uppercase">プロジェクト</th>
                                                <th class="!bg-gray-50 !text-gray-500 font-medium text-xs tracking-wider uppercase text-right" nzWidth="130px">件数</th>
                                                <th class="!bg-gray-50 !text-gray-500 font-medium text-xs tracking-wider uppercase text-right" nzWidth="160px">合計金額</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            @for (row of projectData(); track row.projectId) {
                                                <tr class="hover:bg-gray-50/50 transition-colors">
                                                    <td class="border-b border-gray-100 !py-4">
                                                        <span class="font-medium text-gray-900">{{ row.projectName }}</span>
                                                    </td>
                                                    <td class="border-b border-gray-100 !py-4 text-right pr-4">
                                                        <span class="text-gray-600 font-medium font-mono">{{ row.count }}</span><span class="text-gray-400 text-sm ml-1">件</span>
                                                    </td>
                                                    <td class="border-b border-gray-100 !py-4 text-right pr-6">
                                                        <span class="font-bold text-gray-900 text-base">¥{{ row.totalAmount | number }}</span>
                                                    </td>
                                                </tr>
                                            }
                                        </tbody>
                                    </nz-table>
                                    <ng-template #projectEmptyTpl>
                                        <div class="flex flex-col items-center justify-center py-16 text-center">
                                            <p class="text-gray-500 mb-0">データがありません</p>
                                        </div>
                                    </ng-template>
                                </div>
                            </div>
                        </nz-tab>

                        <!-- 月別推移 -->
                        <nz-tab>
                            <ng-template nz-tab-link>
                                <div class="flex items-center gap-2 px-2 py-1">
                                    <span nz-icon nzType="calendar" nzTheme="outline" class="text-teal-600"></span>
                                    <span class="font-bold">月別推移</span>
                                </div>
                            </ng-template>

                            <div class="p-6">
                                <div class="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                                    <nz-table #monthlyTable
                                        [nzData]="monthlyData()"
                                        [nzShowPagination]="false"
                                        [nzBordered]="false"
                                        [nzSize]="'middle'"
                                        [nzNoResult]="monthlyEmptyTpl"
                                        data-testid="monthly-table">
                                        <thead>
                                            <tr>
                                                <th class="!bg-gray-50 !text-gray-500 font-medium text-xs tracking-wider uppercase">月</th>
                                                <th class="!bg-gray-50 !text-gray-500 font-medium text-xs tracking-wider uppercase text-right" nzWidth="130px">件数</th>
                                                <th class="!bg-gray-50 !text-gray-500 font-medium text-xs tracking-wider uppercase text-right" nzWidth="160px">合計金額</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            @for (row of monthlyData(); track row.month) {
                                                <tr class="hover:bg-gray-50/50 transition-colors">
                                                    <td class="border-b border-gray-100 !py-4">
                                                        <span class="font-medium text-gray-900">{{ row.month }}</span>
                                                    </td>
                                                    <td class="border-b border-gray-100 !py-4 text-right pr-4">
                                                        <span class="text-gray-600 font-medium font-mono">{{ row.count }}</span><span class="text-gray-400 text-sm ml-1">件</span>
                                                    </td>
                                                    <td class="border-b border-gray-100 !py-4 text-right pr-6">
                                                        <span class="font-bold text-gray-900 text-base">¥{{ row.totalAmount | number }}</span>
                                                    </td>
                                                </tr>
                                            }
                                        </tbody>
                                    </nz-table>
                                    <ng-template #monthlyEmptyTpl>
                                        <div class="flex flex-col items-center justify-center py-16 text-center">
                                            <p class="text-gray-500 mb-0">データがありません</p>
                                        </div>
                                    </ng-template>
                                </div>
                            </div>
                        </nz-tab>
                    </nz-tabs>
                }
            </nz-card>
        </div>
    `,
    styles: [],
})
export class ExpenseSummaryComponent implements OnInit {
    private expenseService = inject(ExpenseService);

    // Date range (default: current month)
    dateFrom: Date = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    dateTo: Date = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);

    // Signals
    stats = signal<ExpenseStats | null>(null);
    categoryData = signal<CategorySummary[]>([]);
    projectData = signal<ProjectSummary[]>([]);
    monthlyData = signal<MonthlySummary[]>([]);
    isLoading = signal(false);

    categoryColumns = ['category', 'count', 'totalAmount', 'percentage'];
    projectColumns = ['projectName', 'count', 'totalAmount'];
    monthlyColumns = ['month', 'count', 'totalAmount'];

    ngOnInit(): void {
        this.loadData();
    }

    loadData(): void {
        this.isLoading.set(true);

        const query: SummaryQuery = {
            dateFrom: this.formatDate(this.dateFrom),
            dateTo: this.formatDate(this.dateTo),
        };

        forkJoin({
            stats: this.expenseService.getStats(query),
            byCategory: this.expenseService.getSummaryByCategory(query),
            byProject: this.expenseService.getSummaryByProject(query),
            byMonth: this.expenseService.getSummaryByMonth(query),
        }).subscribe({
            next: (result) => {
                this.stats.set(result.stats);
                this.categoryData.set(result.byCategory);
                this.projectData.set(result.byProject);
                this.monthlyData.set(result.byMonth);
                this.isLoading.set(false);
            },
            error: () => {
                this.isLoading.set(false);
            },
        });
    }

    getCategoryColor(category: string): string {
        return EXPENSE_CATEGORY_COLORS[category as keyof typeof EXPENSE_CATEGORY_COLORS] || '#757575';
    }

    private formatDate(date: Date): string {
        return date.toISOString().split('T')[0];
    }
}
