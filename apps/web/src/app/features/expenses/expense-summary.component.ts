import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { TabsModule } from 'primeng/tabs';
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
    CardModule,
    TableModule,
    ButtonModule,
    DatePickerModule,
    TabsModule,
  ],
  template: `
    <div class="p-6 lg:p-8 max-w-[1200px] mx-auto space-y-6 flex flex-col min-h-full">
      <p-card>
        <ng-template #header>
          <div class="flex items-center gap-3 px-6 pt-5">
            <div class="w-10 h-10 rounded-full flex items-center justify-center"
                style="background-color: var(--p-primary-100); color: var(--p-primary-color);">
              <i class="pi pi-calculator" style="font-size: 1.25rem;"></i>
            </div>
            <h2 class="text-xl font-bold m-0">経費集計</h2>
          </div>
        </ng-template>

        <!-- Filters -->
        <div class="rounded-lg p-4 mb-6" style="background-color: var(--p-surface-50);" data-testid="filter-date">
          <div class="flex flex-wrap items-end gap-4">
            <div class="w-full sm:w-48">
              <label class="block text-xs font-medium mb-1">開始日</label>
              <p-datepicker [(ngModel)]="dateFrom" dateFormat="yy/mm/dd"
                  [showIcon]="true" styleClass="w-full"
                  data-testid="filter-date-from" />
            </div>

            <span class="font-medium hidden sm:block pb-2" style="opacity: 0.4;">〜</span>

            <div class="w-full sm:w-48">
              <label class="block text-xs font-medium mb-1">終了日</label>
              <p-datepicker [(ngModel)]="dateTo" dateFormat="yy/mm/dd"
                  [showIcon]="true" styleClass="w-full"
                  data-testid="filter-date-to" />
            </div>

            <p-button icon="pi pi-search" label="適用"
                size="small" (onClick)="loadData()"
                data-testid="apply-filter-btn" />
          </div>
        </div>

        <!-- Stats Cards -->
        @if (stats()) {
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6" data-testid="stats-cards">
            <p-card styleClass="text-center">
              <div class="flex flex-col items-center gap-2">
                <i class="pi pi-wallet" style="font-size: 1.5rem; color: var(--p-primary-color);"></i>
                <span class="text-sm" style="opacity: 0.6;">合計金額</span>
                <span class="text-lg font-bold">¥{{ stats()!.totalAmount | number }}</span>
              </div>
            </p-card>

            <p-card styleClass="text-center">
              <div class="flex flex-col items-center gap-2">
                <i class="pi pi-file" style="font-size: 1.5rem; color: var(--p-teal-500);"></i>
                <span class="text-sm" style="opacity: 0.6;">件数</span>
                <span class="text-lg font-bold">{{ stats()!.totalCount }}<span class="text-sm font-normal ml-1">件</span></span>
              </div>
            </p-card>

            <p-card styleClass="text-center">
              <div class="flex flex-col items-center gap-2">
                <i class="pi pi-chart-line" style="font-size: 1.5rem; color: var(--p-purple-500);"></i>
                <span class="text-sm" style="opacity: 0.6;">平均金額</span>
                <span class="text-lg font-bold">¥{{ stats()!.avgAmount | number }}</span>
              </div>
            </p-card>

            <p-card styleClass="text-center">
              <div class="flex flex-col items-center gap-2">
                <i class="pi pi-arrow-up" style="font-size: 1.5rem; color: var(--p-orange-500);"></i>
                <span class="text-sm" style="opacity: 0.6;">最高金額</span>
                <span class="text-lg font-bold">¥{{ stats()!.maxAmount | number }}</span>
              </div>
            </p-card>
          </div>
        }

        <!-- Loading -->
        @if (isLoading()) {
          <div class="flex justify-center items-center flex-1 py-16" data-testid="loading">
            <i class="pi pi-spin pi-spinner" style="font-size: 2rem; color: var(--p-primary-color);"></i>
          </div>
        } @else {
          <!-- Tabs -->
          <p-tabs [value]="activeTab()" (valueChange)="onTabChange($event)" data-testid="summary-tabs">
            <p-tablist>
              <p-tab [value]="0">カテゴリ別</p-tab>
              <p-tab [value]="1">プロジェクト別</p-tab>
              <p-tab [value]="2">月別推移</p-tab>
            </p-tablist>
            <p-tabpanels>
              <!-- カテゴリ別 -->
              <p-tabpanel [value]="0">
                <p-table [value]="categoryData()" [tableStyle]="{ 'min-width': '30rem' }"
                    data-testid="category-table">
                  <ng-template #header>
                    <tr>
                      <th>カテゴリ</th>
                      <th class="text-right" style="width: 130px;">件数</th>
                      <th class="text-right" style="width: 160px;">合計金額</th>
                      <th class="text-right" style="width: 130px;">割合</th>
                    </tr>
                  </ng-template>
                  <ng-template #body let-row>
                    <tr>
                      <td>
                        <div class="flex items-center gap-3">
                          <span class="inline-block w-3 h-3 rounded-full" [style.background-color]="getCategoryColor(row.category)"></span>
                          <span class="font-semibold">{{ row.category }}</span>
                        </div>
                      </td>
                      <td class="text-right pr-4">
                        <span class="font-medium font-mono">{{ row.count }}</span><span class="text-sm ml-1" style="opacity: 0.4;">件</span>
                      </td>
                      <td class="text-right">
                        <span class="font-bold text-base">¥{{ row.totalAmount | number }}</span>
                      </td>
                      <td class="text-right pr-6">
                        <span class="font-bold text-sm" style="color: var(--p-primary-color);">{{ row.percentage }}%</span>
                      </td>
                    </tr>
                  </ng-template>
                  <ng-template #emptymessage>
                    <tr>
                      <td colspan="4">
                        <div class="flex flex-col items-center justify-center py-16 text-center">
                          <p style="opacity: 0.6;" class="m-0">データがありません</p>
                        </div>
                      </td>
                    </tr>
                  </ng-template>
                </p-table>
              </p-tabpanel>

              <!-- PJ別 -->
              <p-tabpanel [value]="1">
                <p-table [value]="projectData()" [tableStyle]="{ 'min-width': '30rem' }"
                    data-testid="project-table">
                  <ng-template #header>
                    <tr>
                      <th>プロジェクト</th>
                      <th class="text-right" style="width: 130px;">件数</th>
                      <th class="text-right" style="width: 160px;">合計金額</th>
                    </tr>
                  </ng-template>
                  <ng-template #body let-row>
                    <tr>
                      <td>
                        <span class="font-medium">{{ row.projectName }}</span>
                      </td>
                      <td class="text-right pr-4">
                        <span class="font-medium font-mono">{{ row.count }}</span><span class="text-sm ml-1" style="opacity: 0.4;">件</span>
                      </td>
                      <td class="text-right pr-6">
                        <span class="font-bold text-base">¥{{ row.totalAmount | number }}</span>
                      </td>
                    </tr>
                  </ng-template>
                  <ng-template #emptymessage>
                    <tr>
                      <td colspan="3">
                        <div class="flex flex-col items-center justify-center py-16 text-center">
                          <p style="opacity: 0.6;" class="m-0">データがありません</p>
                        </div>
                      </td>
                    </tr>
                  </ng-template>
                </p-table>
              </p-tabpanel>

              <!-- 月別推移 -->
              <p-tabpanel [value]="2">
                <p-table [value]="monthlyData()" [tableStyle]="{ 'min-width': '30rem' }"
                    data-testid="monthly-table">
                  <ng-template #header>
                    <tr>
                      <th>月</th>
                      <th class="text-right" style="width: 130px;">件数</th>
                      <th class="text-right" style="width: 160px;">合計金額</th>
                    </tr>
                  </ng-template>
                  <ng-template #body let-row>
                    <tr>
                      <td>
                        <span class="font-medium">{{ row.month }}</span>
                      </td>
                      <td class="text-right pr-4">
                        <span class="font-medium font-mono">{{ row.count }}</span><span class="text-sm ml-1" style="opacity: 0.4;">件</span>
                      </td>
                      <td class="text-right pr-6">
                        <span class="font-bold text-base">¥{{ row.totalAmount | number }}</span>
                      </td>
                    </tr>
                  </ng-template>
                  <ng-template #emptymessage>
                    <tr>
                      <td colspan="3">
                        <div class="flex flex-col items-center justify-center py-16 text-center">
                          <p style="opacity: 0.6;" class="m-0">データがありません</p>
                        </div>
                      </td>
                    </tr>
                  </ng-template>
                </p-table>
              </p-tabpanel>
            </p-tabpanels>
          </p-tabs>
        }
      </p-card>
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
  activeTab = signal(0);

  categoryColumns = ['category', 'count', 'totalAmount', 'percentage'];
  projectColumns = ['projectName', 'count', 'totalAmount'];
  monthlyColumns = ['month', 'count', 'totalAmount'];

  ngOnInit(): void {
    this.loadData();
  }

  onTabChange(value: string | number | undefined): void {
    this.activeTab.set(Number(value ?? 0));
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
