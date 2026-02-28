import {
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  heroChartBar,
  heroFunnel,
  heroArrowDownTray,
  heroFolder,
  heroUserGroup,
} from '@ng-icons/heroicons/outline';
import {
  TimesheetService,
  ProjectSummary,
  UserSummary,
  SummaryQuery,
} from './timesheet.service';
import { ToastService } from '../../shared/ui/toast/toast.service';

@Component({
  selector: 'app-timesheet-report',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NgIcon,
  ],
  viewProviders: [provideIcons({ heroChartBar, heroFunnel, heroArrowDownTray, heroFolder, heroUserGroup })],
  template: `
    <div class="p-6 lg:p-8 max-w-[1200px] mx-auto space-y-6 flex flex-col min-h-full">
      <div class="card bg-base-100 shadow-sm flex flex-col flex-1">
        <div class="card-body flex flex-col flex-1">
          <div class="flex items-center gap-3 mb-6">
            <div class="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <ng-icon name="heroChartBar" class="text-xl" />
            </div>
            <h2 class="text-xl font-bold m-0">工数レポート</h2>
          </div>

          <!-- Filters -->
          <div class="bg-base-200/30 rounded-lg p-4 mb-6" data-testid="report-filter-period">
            <div class="flex flex-wrap items-end gap-4">
              <div class="w-full sm:w-48">
                <label class="label text-xs font-medium">開始日</label>
                <input type="date"
                  [value]="filterDateFromStr()"
                  (change)="onDateFromChange($event)"
                  class="input input-sm w-full"
                  data-testid="report-date-from">
              </div>

              <span class="text-base-content/40 font-medium hidden sm:block pb-2">〜</span>

              <div class="w-full sm:w-48">
                <label class="label text-xs font-medium">終了日</label>
                <input type="date"
                  [value]="filterDateToStr()"
                  (change)="onDateToChange($event)"
                  class="input input-sm w-full"
                  data-testid="report-date-to">
              </div>

              <div class="flex gap-2 ml-auto w-full sm:w-auto">
                <button class="btn btn-primary btn-sm flex-1 sm:flex-none"
                    (click)="applyFilter()"
                    data-testid="report-apply-btn">
                  <ng-icon name="heroFunnel" class="text-base" />
                  適用
                </button>

                <button class="btn btn-ghost btn-sm flex-1 sm:flex-none group"
                    (click)="downloadCsv()"
                    data-testid="report-csv-btn">
                  <ng-icon name="heroArrowDownTray" class="text-base" />
                  CSV出力
                </button>
              </div>
            </div>
          </div>

          @if (isLoading()) {
            <div class="flex justify-center items-center flex-1 py-24" data-testid="loading">
              <div class="flex flex-col items-center gap-4">
                <span class="loading loading-spinner loading-lg text-primary"></span>
                <span class="text-base-content/60 font-medium">データを集計中...</span>
              </div>
            </div>
          } @else {
            <!-- Tabs -->
            <div role="tablist" class="tabs tabs-border mb-4" data-testid="report-tabs">
              <input type="radio" name="report-tab" role="tab" class="tab"
                  aria-label="プロジェクト別" [checked]="activeTab() === 0"
                  (change)="activeTab.set(0)" />
              <input type="radio" name="report-tab" role="tab" class="tab"
                  aria-label="メンバー別" [checked]="activeTab() === 1"
                  (change)="activeTab.set(1)" />
            </div>

            <!-- Project Summary Tab -->
            @if (activeTab() === 0) {
              <div class="overflow-x-auto rounded-xl border border-base-200">
                <table class="table table-zebra" data-testid="report-table">
                  <thead>
                    <tr>
                      <th>プロジェクト</th>
                      <th class="text-right w-[130px]">合計工数 (h)</th>
                      <th class="text-right w-[130px]">エントリ数</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (row of projectSummary(); track row.projectId) {
                      <tr data-testid="report-project-row">
                        <td>
                          <span class="font-medium">{{ row.projectName }}</span>
                        </td>
                        <td class="text-right">
                          <span class="badge badge-primary badge-outline font-bold text-base">{{ row.totalHours | number:'1.1-2' }}</span>
                        </td>
                        <td class="text-right pr-6">
                          <span class="font-medium font-mono">{{ row.entryCount }}</span>件
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
                @if (projectSummary().length === 0) {
                  <div class="flex flex-col items-center justify-center py-24 text-center" data-testid="empty-state">
                    <div class="w-16 h-16 rounded-full bg-base-200 flex items-center justify-center mb-4">
                      <ng-icon name="heroChartBar" class="text-3xl text-base-content/40" />
                    </div>
                    <p class="text-lg font-bold mb-1">データがありません</p>
                    <p class="text-base-content/60 text-sm">指定した期間内の工数データは見つかりませんでした</p>
                  </div>
                }
              </div>
            }

            <!-- User Summary Tab -->
            @if (activeTab() === 1) {
              <div class="overflow-x-auto rounded-xl border border-base-200">
                <table class="table table-zebra">
                  <thead>
                    <tr>
                      <th>メンバー</th>
                      <th class="text-right w-[130px]">合計工数 (h)</th>
                      <th class="text-right w-[130px]">エントリ数</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (row of userSummary(); track row.userId) {
                      <tr data-testid="report-user-row">
                        <td>
                          <div class="flex items-center gap-3">
                            <div class="w-8 h-8 rounded-full bg-accent/10 text-accent flex items-center justify-center font-bold text-xs uppercase">
                              {{ (row.userName || 'U').charAt(0) }}
                            </div>
                            <span class="font-medium">{{ row.userName }}</span>
                          </div>
                        </td>
                        <td class="text-right">
                          <span class="badge badge-accent badge-outline font-bold text-base">{{ row.totalHours | number:'1.1-2' }}</span>
                        </td>
                        <td class="text-right pr-6">
                          <span class="font-medium font-mono">{{ row.entryCount }}</span>件
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
                @if (userSummary().length === 0) {
                  <div class="flex flex-col items-center justify-center py-24 text-center" data-testid="empty-state">
                    <div class="w-16 h-16 rounded-full bg-base-200 flex items-center justify-center mb-4">
                      <ng-icon name="heroUserGroup" class="text-3xl text-base-content/40" />
                    </div>
                    <p class="text-lg font-bold mb-1">データがありません</p>
                    <p class="text-base-content/60 text-sm">指定した期間内のメンバーデータは見つかりませんでした</p>
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
export class TimesheetReportComponent implements OnInit {
  private timesheetService = inject(TimesheetService);
  private toast = inject(ToastService);

  // ─── State ───
  filterDateFrom: Date = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  filterDateTo: Date = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);

  projectSummary = signal<ProjectSummary[]>([]);
  userSummary = signal<UserSummary[]>([]);
  isLoading = signal(false);
  activeTab = signal(0);

  projectColumns = ['projectName', 'totalHours', 'entryCount'];
  userColumns = ['userName', 'totalHours', 'entryCount'];

  filterDateFromStr = signal(this.formatDate(this.filterDateFrom));
  filterDateToStr = signal(this.formatDate(this.filterDateTo));

  ngOnInit(): void {
    this.applyFilter();
  }

  onDateFromChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    if (value) {
      this.filterDateFrom = new Date(value + 'T00:00:00');
      this.filterDateFromStr.set(value);
    }
  }

  onDateToChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    if (value) {
      this.filterDateTo = new Date(value + 'T00:00:00');
      this.filterDateToStr.set(value);
    }
  }

  applyFilter(): void {
    const query: SummaryQuery = {
      dateFrom: this.formatDate(this.filterDateFrom),
      dateTo: this.formatDate(this.filterDateTo),
    };

    this.isLoading.set(true);

    this.timesheetService.getProjectSummary(query).subscribe({
      next: (data) => this.projectSummary.set(data),
      error: () => this.toast.error('データの取得に失敗しました'),
    });

    this.timesheetService.getUserSummary(query).subscribe({
      next: (data) => {
        this.userSummary.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.toast.error('データの取得に失敗しました');
      },
    });
  }

  downloadCsv(): void {
    this.timesheetService.exportCsv({
      dateFrom: this.formatDate(this.filterDateFrom),
      dateTo: this.formatDate(this.filterDateTo),
    });
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }
}
