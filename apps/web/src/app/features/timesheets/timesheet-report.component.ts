import {
    Component,
    OnInit,
    inject,
    signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';
import { NzMessageService } from 'ng-zorro-antd/message';
import {
    TimesheetService,
    ProjectSummary,
    UserSummary,
    SummaryQuery,
} from './timesheet.service';

@Component({
    selector: 'app-timesheet-report',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        NzTableModule,
        NzTabsModule,
        NzDatePickerModule,
        NzButtonModule,
        NzIconModule,
        NzSpinModule,
        NzCardModule,
        NzStatisticModule,
    ],
    template: `
        <div class="p-6 lg:p-8 max-w-[1200px] mx-auto space-y-6 flex flex-col min-h-full">
            <nz-card [nzBordered]="true"
                     class="!rounded-xl shadow-sm border border-gray-200 flex flex-col flex-1">
                <div class="px-6 py-5 border-b border-gray-100 flex items-center gap-3 bg-gray-50/50 -mx-6 -mt-6 mb-6">
                    <div class="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center text-primary-600">
                        <span nz-icon nzType="bar-chart" nzTheme="outline" class="text-xl"></span>
                    </div>
                    <h2 class="text-xl font-bold text-gray-900 m-0">工数レポート</h2>
                </div>

                <!-- Filters -->
                <div class="p-6 border-b border-gray-100 bg-white -mx-6 mb-6" data-testid="report-filter-period">
                    <div class="flex flex-wrap items-center gap-4 px-6">
                        <div class="w-full sm:w-48">
                            <label class="block text-xs font-medium text-gray-500 mb-1">開始日</label>
                            <nz-date-picker
                                [(ngModel)]="filterDateFrom"
                                nzFormat="yyyy/MM/dd"
                                class="w-full"
                                nzPlaceHolder="開始日">
                            </nz-date-picker>
                        </div>

                        <span class="text-gray-400 font-medium hidden sm:block mt-4">〜</span>

                        <div class="w-full sm:w-48">
                            <label class="block text-xs font-medium text-gray-500 mb-1">終了日</label>
                            <nz-date-picker
                                [(ngModel)]="filterDateTo"
                                nzFormat="yyyy/MM/dd"
                                class="w-full"
                                nzPlaceHolder="終了日">
                            </nz-date-picker>
                        </div>

                        <div class="flex gap-2 ml-auto sm:ml-4 w-full sm:w-auto mt-4 sm:mt-auto">
                            <button nz-button nzType="primary" (click)="applyFilter()"
                                    class="!rounded-lg shadow-sm font-medium flex-1 sm:flex-none"
                                    data-testid="report-apply-btn">
                                <span nz-icon nzType="filter" nzTheme="outline"></span>
                                適用
                            </button>

                            <button nz-button nzType="default" (click)="downloadCsv()"
                                    class="font-medium flex-1 sm:flex-none group"
                                    data-testid="report-csv-btn">
                                <span nz-icon nzType="download" nzTheme="outline" class="text-gray-500 group-hover:text-primary-600 transition-colors"></span>
                                CSV出力
                            </button>
                        </div>
                    </div>
                </div>

                @if (isLoading()) {
                    <div class="flex justify-center items-center flex-1 py-24" data-testid="loading">
                        <div class="flex flex-col items-center gap-4">
                            <nz-spin nzSimple [nzSize]="'large'"></nz-spin>
                            <span class="text-gray-500 font-medium">データを集計中...</span>
                        </div>
                    </div>
                } @else {
                    <nz-tabs class="min-h-[400px]">
                        <!-- Project Summary Tab -->
                        <nz-tab>
                            <ng-template nzTabLink>
                                <div class="flex items-center gap-2 px-2 py-1">
                                    <span nz-icon nzType="folder" nzTheme="outline" class="text-primary-600"></span>
                                    <span class="font-bold">プロジェクト別</span>
                                </div>
                            </ng-template>

                            <div class="p-6">
                                <div class="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                                    <nz-table #projectTable
                                        [nzData]="projectSummary()"
                                        [nzShowPagination]="false"
                                        [nzBordered]="false"
                                        [nzSize]="'middle'"
                                        [nzNoResult]="projectEmptyTpl"
                                        data-testid="report-table">
                                        <thead>
                                            <tr>
                                                <th class="!bg-gray-50 !text-gray-500 font-medium text-xs tracking-wider uppercase">プロジェクト</th>
                                                <th class="!bg-gray-50 !text-gray-500 font-medium text-xs tracking-wider uppercase text-right" nzWidth="130px">合計工数 (h)</th>
                                                <th class="!bg-gray-50 !text-gray-500 font-medium text-xs tracking-wider uppercase text-right" nzWidth="130px">エントリ数</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            @for (row of projectSummary(); track row.projectId) {
                                                <tr class="hover:bg-gray-50/50 transition-colors" data-testid="report-project-row">
                                                    <td class="border-b border-gray-100 !py-4">
                                                        <span class="font-medium text-gray-900">{{ row.projectName }}</span>
                                                    </td>
                                                    <td class="border-b border-gray-100 !py-4 text-right">
                                                        <span class="font-bold text-primary-700 bg-primary-50 px-3 py-1 rounded-full text-base">{{ row.totalHours | number:'1.1-2' }}</span>
                                                    </td>
                                                    <td class="border-b border-gray-100 !py-4 text-right pr-6">
                                                        <span class="text-gray-600 font-medium font-mono">{{ row.entryCount }}</span>件
                                                    </td>
                                                </tr>
                                            }
                                        </tbody>
                                    </nz-table>
                                    <ng-template #projectEmptyTpl>
                                        <div class="flex flex-col items-center justify-center py-24 text-center bg-gray-50/30" data-testid="empty-state">
                                            <div class="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                                                <span nz-icon nzType="bar-chart" nzTheme="outline" class="text-3xl text-gray-400"></span>
                                            </div>
                                            <p class="text-lg font-bold text-gray-900 mb-1">データがありません</p>
                                            <p class="text-gray-500 text-sm">指定した期間内の工数データは見つかりませんでした</p>
                                        </div>
                                    </ng-template>
                                </div>
                            </div>
                        </nz-tab>

                        <!-- User Summary Tab -->
                        <nz-tab>
                            <ng-template nz-tab-link>
                                <div class="flex items-center gap-2 px-2 py-1">
                                    <span nz-icon nzType="team" nzTheme="outline" class="text-teal-600"></span>
                                    <span class="font-bold">メンバー別</span>
                                </div>
                            </ng-template>

                            <div class="p-6">
                                <div class="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                                    <nz-table #userTable
                                        [nzData]="userSummary()"
                                        [nzShowPagination]="false"
                                        [nzBordered]="false"
                                        [nzSize]="'middle'"
                                        [nzNoResult]="userEmptyTpl">
                                        <thead>
                                            <tr>
                                                <th class="!bg-gray-50 !text-gray-500 font-medium text-xs tracking-wider uppercase">メンバー</th>
                                                <th class="!bg-gray-50 !text-gray-500 font-medium text-xs tracking-wider uppercase text-right" nzWidth="130px">合計工数 (h)</th>
                                                <th class="!bg-gray-50 !text-gray-500 font-medium text-xs tracking-wider uppercase text-right" nzWidth="130px">エントリ数</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            @for (row of userSummary(); track row.userId) {
                                                <tr class="hover:bg-gray-50/50 transition-colors" data-testid="report-user-row">
                                                    <td class="border-b border-gray-100 !py-4">
                                                        <div class="flex items-center gap-3">
                                                            <div class="w-8 h-8 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-xs uppercase shadow-sm">
                                                                {{ (row.userName || 'U').charAt(0) }}
                                                            </div>
                                                            <span class="font-medium text-gray-900">{{ row.userName }}</span>
                                                        </div>
                                                    </td>
                                                    <td class="border-b border-gray-100 !py-4 text-right">
                                                        <span class="font-bold text-teal-700 bg-teal-50 px-3 py-1 rounded-full text-base">{{ row.totalHours | number:'1.1-2' }}</span>
                                                    </td>
                                                    <td class="border-b border-gray-100 !py-4 text-right pr-6">
                                                        <span class="text-gray-600 font-medium font-mono">{{ row.entryCount }}</span>件
                                                    </td>
                                                </tr>
                                            }
                                        </tbody>
                                    </nz-table>
                                    <ng-template #userEmptyTpl>
                                        <div class="flex flex-col items-center justify-center py-24 text-center bg-gray-50/30" data-testid="empty-state">
                                            <div class="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                                                <span nz-icon nzType="team" nzTheme="outline" class="text-3xl text-gray-400"></span>
                                            </div>
                                            <p class="text-lg font-bold text-gray-900 mb-1">データがありません</p>
                                            <p class="text-gray-500 text-sm">指定した期間内のメンバーデータは見つかりませんでした</p>
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
export class TimesheetReportComponent implements OnInit {
    private timesheetService = inject(TimesheetService);
    private message = inject(NzMessageService);

    // ─── State ───
    filterDateFrom: Date = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    filterDateTo: Date = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);

    projectSummary = signal<ProjectSummary[]>([]);
    userSummary = signal<UserSummary[]>([]);
    isLoading = signal(false);

    projectColumns = ['projectName', 'totalHours', 'entryCount'];
    userColumns = ['userName', 'totalHours', 'entryCount'];

    ngOnInit(): void {
        this.applyFilter();
    }

    applyFilter(): void {
        const query: SummaryQuery = {
            dateFrom: this.formatDate(this.filterDateFrom),
            dateTo: this.formatDate(this.filterDateTo),
        };

        this.isLoading.set(true);

        this.timesheetService.getProjectSummary(query).subscribe({
            next: (data) => this.projectSummary.set(data),
            error: () => this.message.error('データの取得に失敗しました'),
        });

        this.timesheetService.getUserSummary(query).subscribe({
            next: (data) => {
                this.userSummary.set(data);
                this.isLoading.set(false);
            },
            error: () => {
                this.isLoading.set(false);
                this.message.error('データの取得に失敗しました');
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
