import {
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { TabsModule } from 'primeng/tabs';
import { TagModule } from 'primeng/tag';
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
    CardModule,
    TableModule,
    ButtonModule,
    DatePickerModule,
    TabsModule,
    TagModule,
  ],
  template: `
    <div class="p-6 lg:p-8 max-w-[1200px] mx-auto space-y-6 flex flex-col min-h-full">
      <p-card>
        <ng-template #header>
          <div class="flex items-center gap-3 px-6 pt-5">
            <div class="w-10 h-10 rounded-full flex items-center justify-center"
                style="background-color: var(--p-primary-100); color: var(--p-primary-color);">
              <i class="pi pi-chart-bar" style="font-size: 1.25rem;"></i>
            </div>
            <h2 class="text-xl font-bold m-0">工数レポート</h2>
          </div>
        </ng-template>

        <!-- Filters -->
        <div class="rounded-lg p-4 mb-6" style="background-color: var(--p-surface-50);" data-testid="report-filter-period">
          <div class="flex flex-wrap items-end gap-4">
            <div class="w-full sm:w-48">
              <label class="block text-xs font-medium mb-1">開始日</label>
              <p-datepicker [(ngModel)]="filterDateFrom" dateFormat="yy/mm/dd"
                  [showIcon]="true" styleClass="w-full"
                  data-testid="report-date-from" />
            </div>

            <span class="font-medium hidden sm:block pb-2" style="opacity: 0.4;">〜</span>

            <div class="w-full sm:w-48">
              <label class="block text-xs font-medium mb-1">終了日</label>
              <p-datepicker [(ngModel)]="filterDateTo" dateFormat="yy/mm/dd"
                  [showIcon]="true" styleClass="w-full"
                  data-testid="report-date-to" />
            </div>

            <div class="flex gap-2 ml-auto w-full sm:w-auto">
              <p-button icon="pi pi-filter" label="適用" size="small"
                  (onClick)="applyFilter()"
                  data-testid="report-apply-btn" />

              <p-button icon="pi pi-download" label="CSV出力"
                  severity="secondary" [text]="true" size="small"
                  (onClick)="downloadCsv()"
                  data-testid="report-csv-btn" />
            </div>
          </div>
        </div>

        @if (isLoading()) {
          <div class="flex justify-center items-center flex-1 py-24" data-testid="loading">
            <div class="flex flex-col items-center gap-4">
              <i class="pi pi-spin pi-spinner" style="font-size: 2rem; color: var(--p-primary-color);"></i>
              <span class="font-medium" style="opacity: 0.6;">データを集計中...</span>
            </div>
          </div>
        } @else {
          <!-- Tabs -->
          <p-tabs [value]="activeTab()" (valueChange)="onTabChange($event)" data-testid="report-tabs">
            <p-tablist>
              <p-tab [value]="0">プロジェクト別</p-tab>
              <p-tab [value]="1">メンバー別</p-tab>
            </p-tablist>
            <p-tabpanels>
              <!-- Project Summary Tab -->
              <p-tabpanel [value]="0">
                <p-table [value]="projectSummary()" [tableStyle]="{ 'min-width': '30rem' }"
                    data-testid="report-table">
                  <ng-template #header>
                    <tr>
                      <th>プロジェクト</th>
                      <th class="text-right" style="width: 130px;">合計工数 (h)</th>
                      <th class="text-right" style="width: 130px;">エントリ数</th>
                    </tr>
                  </ng-template>
                  <ng-template #body let-row>
                    <tr data-testid="report-project-row">
                      <td>
                        <span class="font-medium">{{ row.projectName }}</span>
                      </td>
                      <td class="text-right">
                        <p-tag [value]="(row.totalHours | number:'1.1-2') + ''" severity="info" [rounded]="true" />
                      </td>
                      <td class="text-right pr-6">
                        <span class="font-medium font-mono">{{ row.entryCount }}</span>件
                      </td>
                    </tr>
                  </ng-template>
                  <ng-template #emptymessage>
                    <tr>
                      <td colspan="3">
                        <div class="flex flex-col items-center justify-center py-24 text-center" data-testid="empty-state">
                          <div class="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                              style="background-color: var(--p-surface-100);">
                            <i class="pi pi-chart-bar" style="font-size: 1.5rem; opacity: 0.4;"></i>
                          </div>
                          <p class="text-lg font-bold mb-1">データがありません</p>
                          <p class="text-sm" style="opacity: 0.6;">指定した期間内の工数データは見つかりませんでした</p>
                        </div>
                      </td>
                    </tr>
                  </ng-template>
                </p-table>
              </p-tabpanel>

              <!-- User Summary Tab -->
              <p-tabpanel [value]="1">
                <p-table [value]="userSummary()" [tableStyle]="{ 'min-width': '30rem' }">
                  <ng-template #header>
                    <tr>
                      <th>メンバー</th>
                      <th class="text-right" style="width: 130px;">合計工数 (h)</th>
                      <th class="text-right" style="width: 130px;">エントリ数</th>
                    </tr>
                  </ng-template>
                  <ng-template #body let-row>
                    <tr data-testid="report-user-row">
                      <td>
                        <div class="flex items-center gap-3">
                          <div class="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs uppercase"
                              style="background-color: var(--p-teal-50); color: var(--p-teal-600);">
                            {{ (row.userName || 'U').charAt(0) }}
                          </div>
                          <span class="font-medium">{{ row.userName }}</span>
                        </div>
                      </td>
                      <td class="text-right">
                        <p-tag [value]="(row.totalHours | number:'1.1-2') + ''" severity="contrast" [rounded]="true" />
                      </td>
                      <td class="text-right pr-6">
                        <span class="font-medium font-mono">{{ row.entryCount }}</span>件
                      </td>
                    </tr>
                  </ng-template>
                  <ng-template #emptymessage>
                    <tr>
                      <td colspan="3">
                        <div class="flex flex-col items-center justify-center py-24 text-center" data-testid="empty-state">
                          <div class="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                              style="background-color: var(--p-surface-100);">
                            <i class="pi pi-users" style="font-size: 1.5rem; opacity: 0.4;"></i>
                          </div>
                          <p class="text-lg font-bold mb-1">データがありません</p>
                          <p class="text-sm" style="opacity: 0.6;">指定した期間内のメンバーデータは見つかりませんでした</p>
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

  ngOnInit(): void {
    this.applyFilter();
  }

  onTabChange(value: string | number | undefined): void {
    this.activeTab.set(Number(value ?? 0));
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
