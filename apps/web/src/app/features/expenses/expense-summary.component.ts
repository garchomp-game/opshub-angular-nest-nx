import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  heroCalculator,
  heroBanknotes,
  heroDocumentText,
  heroArrowTrendingUp,
  heroArrowUp,
  heroRectangleGroup,
  heroFolder,
  heroCalendarDays,
  heroMagnifyingGlass,
} from '@ng-icons/heroicons/outline';
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
    NgIcon,
  ],
  viewProviders: [provideIcons({
    heroCalculator, heroBanknotes, heroDocumentText, heroArrowTrendingUp,
    heroArrowUp, heroRectangleGroup, heroFolder, heroCalendarDays, heroMagnifyingGlass,
  })],
  template: `
    <div class="p-6 lg:p-8 max-w-[1200px] mx-auto space-y-6 flex flex-col min-h-full">
      <div class="card bg-base-100 shadow-sm flex flex-col flex-1">
        <div class="card-body flex flex-col flex-1">
          <div class="flex items-center gap-3 mb-6">
            <div class="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <ng-icon name="heroCalculator" class="text-xl" />
            </div>
            <h2 class="text-xl font-bold m-0">経費集計</h2>
          </div>

          <!-- Filters -->
          <div class="bg-base-200/30 rounded-lg p-4 mb-6" data-testid="filter-date">
            <div class="flex flex-wrap items-end gap-4">
              <div class="w-full sm:w-48">
                <label class="label text-xs font-medium">開始日</label>
                <input type="date"
                  [value]="dateFromStr()"
                  (change)="onDateFromChange($event)"
                  class="input input-sm w-full"
                  data-testid="filter-date-from">
              </div>

              <span class="text-base-content/40 font-medium hidden sm:block pb-2">〜</span>

              <div class="w-full sm:w-48">
                <label class="label text-xs font-medium">終了日</label>
                <input type="date"
                  [value]="dateToStr()"
                  (change)="onDateToChange($event)"
                  class="input input-sm w-full"
                  data-testid="filter-date-to">
              </div>

              <button class="btn btn-primary btn-sm w-full sm:w-auto"
                  (click)="loadData()"
                  data-testid="apply-filter-btn">
                <ng-icon name="heroMagnifyingGlass" class="text-base" />
                適用
              </button>
            </div>
          </div>

          <!-- Stats Cards -->
          @if (stats()) {
            <div class="stats stats-vertical sm:stats-horizontal shadow w-full mb-6" data-testid="stats-cards">
              <div class="stat">
                <div class="stat-figure text-primary">
                  <ng-icon name="heroBanknotes" class="text-3xl" />
                </div>
                <div class="stat-title">合計金額</div>
                <div class="stat-value text-lg">¥{{ stats()!.totalAmount | number }}</div>
              </div>

              <div class="stat">
                <div class="stat-figure text-secondary">
                  <ng-icon name="heroDocumentText" class="text-3xl" />
                </div>
                <div class="stat-title">件数</div>
                <div class="stat-value text-lg">{{ stats()!.totalCount }}<span class="text-sm font-normal ml-1">件</span></div>
              </div>

              <div class="stat">
                <div class="stat-figure text-accent">
                  <ng-icon name="heroArrowTrendingUp" class="text-3xl" />
                </div>
                <div class="stat-title">平均金額</div>
                <div class="stat-value text-lg">¥{{ stats()!.avgAmount | number }}</div>
              </div>

              <div class="stat">
                <div class="stat-figure text-warning">
                  <ng-icon name="heroArrowUp" class="text-3xl" />
                </div>
                <div class="stat-title">最高金額</div>
                <div class="stat-value text-lg">¥{{ stats()!.maxAmount | number }}</div>
              </div>
            </div>
          }

          <!-- Loading -->
          @if (isLoading()) {
            <div class="flex justify-center items-center flex-1 py-16" data-testid="loading">
              <span class="loading loading-spinner loading-lg text-primary"></span>
            </div>
          } @else {
            <!-- Tabs -->
            <div role="tablist" class="tabs tabs-border mb-4" data-testid="summary-tabs">
              <input type="radio" name="summary-tab" role="tab" class="tab"
                  aria-label="カテゴリ別" [checked]="activeTab() === 0"
                  (change)="activeTab.set(0)" />
              <input type="radio" name="summary-tab" role="tab" class="tab"
                  aria-label="プロジェクト別" [checked]="activeTab() === 1"
                  (change)="activeTab.set(1)" />
              <input type="radio" name="summary-tab" role="tab" class="tab"
                  aria-label="月別推移" [checked]="activeTab() === 2"
                  (change)="activeTab.set(2)" />
            </div>

            <!-- カテゴリ別 -->
            @if (activeTab() === 0) {
              <div class="overflow-x-auto rounded-xl border border-base-200">
                <table class="table table-zebra" data-testid="category-table">
                  <thead>
                    <tr>
                      <th>カテゴリ</th>
                      <th class="text-right w-[130px]">件数</th>
                      <th class="text-right w-[160px]">合計金額</th>
                      <th class="text-right w-[130px]">割合</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (row of categoryData(); track row.category) {
                      <tr>
                        <td>
                          <div class="flex items-center gap-3">
                            <span class="inline-block w-3 h-3 rounded-full" [style.background-color]="getCategoryColor(row.category)"></span>
                            <span class="font-semibold">{{ row.category }}</span>
                          </div>
                        </td>
                        <td class="text-right pr-4">
                          <span class="font-medium font-mono">{{ row.count }}</span><span class="text-base-content/40 text-sm ml-1">件</span>
                        </td>
                        <td class="text-right">
                          <span class="font-bold text-base">¥{{ row.totalAmount | number }}</span>
                        </td>
                        <td class="text-right pr-6">
                          <span class="badge badge-primary badge-outline badge-sm font-bold">{{ row.percentage }}%</span>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
                @if (categoryData().length === 0) {
                  <div class="flex flex-col items-center justify-center py-16 text-center">
                    <p class="text-base-content/60 mb-0">データがありません</p>
                  </div>
                }
              </div>
            }

            <!-- PJ別 -->
            @if (activeTab() === 1) {
              <div class="overflow-x-auto rounded-xl border border-base-200">
                <table class="table table-zebra" data-testid="project-table">
                  <thead>
                    <tr>
                      <th>プロジェクト</th>
                      <th class="text-right w-[130px]">件数</th>
                      <th class="text-right w-[160px]">合計金額</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (row of projectData(); track row.projectId) {
                      <tr>
                        <td>
                          <span class="font-medium">{{ row.projectName }}</span>
                        </td>
                        <td class="text-right pr-4">
                          <span class="font-medium font-mono">{{ row.count }}</span><span class="text-base-content/40 text-sm ml-1">件</span>
                        </td>
                        <td class="text-right pr-6">
                          <span class="font-bold text-base">¥{{ row.totalAmount | number }}</span>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
                @if (projectData().length === 0) {
                  <div class="flex flex-col items-center justify-center py-16 text-center">
                    <p class="text-base-content/60 mb-0">データがありません</p>
                  </div>
                }
              </div>
            }

            <!-- 月別推移 -->
            @if (activeTab() === 2) {
              <div class="overflow-x-auto rounded-xl border border-base-200">
                <table class="table table-zebra" data-testid="monthly-table">
                  <thead>
                    <tr>
                      <th>月</th>
                      <th class="text-right w-[130px]">件数</th>
                      <th class="text-right w-[160px]">合計金額</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (row of monthlyData(); track row.month) {
                      <tr>
                        <td>
                          <span class="font-medium">{{ row.month }}</span>
                        </td>
                        <td class="text-right pr-4">
                          <span class="font-medium font-mono">{{ row.count }}</span><span class="text-base-content/40 text-sm ml-1">件</span>
                        </td>
                        <td class="text-right pr-6">
                          <span class="font-bold text-base">¥{{ row.totalAmount | number }}</span>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
                @if (monthlyData().length === 0) {
                  <div class="flex flex-col items-center justify-center py-16 text-center">
                    <p class="text-base-content/60 mb-0">データがありません</p>
                  </div>
                }
              </div>
            }
          }
        </div>
      </div>
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

  dateFromStr = signal(this.formatDate(this.dateFrom));
  dateToStr = signal(this.formatDate(this.dateTo));

  categoryColumns = ['category', 'count', 'totalAmount', 'percentage'];
  projectColumns = ['projectName', 'count', 'totalAmount'];
  monthlyColumns = ['month', 'count', 'totalAmount'];

  ngOnInit(): void {
    this.loadData();
  }

  onDateFromChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    if (value) {
      this.dateFrom = new Date(value + 'T00:00:00');
      this.dateFromStr.set(value);
    }
  }

  onDateToChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    if (value) {
      this.dateTo = new Date(value + 'T00:00:00');
      this.dateToStr.set(value);
    }
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
