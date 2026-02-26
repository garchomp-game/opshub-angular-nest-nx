import {
    Component,
    OnInit,
    inject,
    signal,
    computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { NzMessageService } from 'ng-zorro-antd/message';
import {
    TimesheetService,
    TimesheetEntry,
    BulkUpsertRequest,
} from './timesheet.service';
import { HttpClient } from '@angular/common/http';

interface GridRow {
    id?: string;
    projectId: string;
    projectName: string;
    taskId?: string;
    taskName?: string;
    days: { [date: string]: number };
    notes: { [date: string]: string };
    isNew: boolean;
}

interface ProjectOption {
    id: string;
    name: string;
}

@Component({
    selector: 'app-timesheet-weekly',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        NzTableModule,
        NzInputNumberModule,
        NzSelectModule,
        NzButtonModule,
        NzIconModule,
        NzSpinModule,
        NzCardModule,
        NzTooltipModule,
    ],
    template: `
        <div class="p-6 lg:p-8 max-w-[1400px] mx-auto space-y-6">
            <nz-card [nzBordered]="true" data-testid="timesheet-grid"
                     class="!rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div class="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 -mx-6 -mt-6 mb-6">
                    <div>
                        <h2 class="text-lg font-bold text-gray-900 m-0 flex items-center">
                            <span nz-icon nzType="clock-circle" nzTheme="outline" class="mr-2 text-primary-600"></span>
                            工数入力
                        </h2>
                        <p class="text-sm text-gray-500 mt-1 mb-0">{{ weekStartFormatted() }} 〜 {{ weekEndFormatted() }}</p>
                    </div>
                </div>

                <!-- Week navigation -->
                <div class="flex items-center gap-2 mb-6 bg-gray-50 rounded-lg p-2 max-w-fit mx-auto border border-gray-100">
                    <button nz-button nzType="text" nzShape="circle" (click)="prevWeek()"
                            nz-tooltip nzTooltipTitle="前の週"
                            data-testid="timesheet-prev-week">
                        <span nz-icon nzType="left" nzTheme="outline"></span>
                    </button>

                    <span class="text-base font-bold text-gray-900 px-6 min-w-[200px] text-center tracking-wide">
                        {{ weekStartFormatted() }} 〜 {{ weekEndFormatted() }}
                    </span>

                    <button nz-button nzType="text" nzShape="circle" (click)="nextWeek()"
                            nz-tooltip nzTooltipTitle="次の週"
                            data-testid="timesheet-next-week">
                        <span nz-icon nzType="right" nzTheme="outline"></span>
                    </button>

                    <div class="w-px h-6 bg-gray-200 mx-2"></div>

                    <button nz-button nzType="default" (click)="goToCurrentWeek()"
                            data-testid="timesheet-current-week">
                        今週
                    </button>
                </div>

                @if (timesheetService.isLoading()) {
                    <div class="flex justify-center py-16" data-testid="loading">
                        <nz-spin nzSimple [nzSize]="'large'"></nz-spin>
                    </div>
                } @else {
                    <div class="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                        <div class="overflow-x-auto">
                            <nz-table #weeklyTable
                                [nzData]="rows()"
                                [nzShowPagination]="false"
                                [nzBordered]="false"
                                [nzSize]="'middle'"
                                nzTableLayout="fixed"
                                [nzNoResult]="emptyTpl">
                                <thead>
                                    <tr>
                                        <th class="!bg-gray-50 !text-gray-500 font-medium text-xs tracking-wider uppercase min-w-[200px] border-r border-gray-100">プロジェクト</th>
                                        @for (day of weekDays(); track day.date) {
                                            <th class="!bg-gray-50 !text-center min-w-[70px] border-r border-gray-100">
                                                <div class="flex flex-col items-center justify-center space-y-1">
                                                    <span class="text-xs font-bold text-gray-400">{{ day.label }}</span>
                                                    <span class="text-[13px] font-medium text-gray-900">{{ day.dateShort }}</span>
                                                </div>
                                            </th>
                                        }
                                        <th class="!bg-primary-50 !text-primary-800 font-bold text-xs tracking-wider uppercase text-center min-w-[80px]">合計</th>
                                        <th class="!bg-gray-50 w-12"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    @for (row of rows(); track row.projectId; let i = $index) {
                                        <tr class="hover:bg-blue-50/30 transition-colors" data-testid="timesheet-row">
                                            <td class="border-b border-gray-100 !py-3 border-r pr-2">
                                                @if (row.isNew) {
                                                    <nz-select [(ngModel)]="row.projectId"
                                                        nzPlaceHolder="プロジェクト選択"
                                                        nzShowSearch
                                                        class="w-full"
                                                        (ngModelChange)="onProjectChange(row, $event)">
                                                        @for (p of projects(); track p.id) {
                                                            <nz-option [nzValue]="p.id" [nzLabel]="p.name"></nz-option>
                                                        }
                                                    </nz-select>
                                                } @else {
                                                    <span class="font-medium text-gray-900 block truncate"
                                                          nz-tooltip [nzTooltipTitle]="row.projectName">{{ row.projectName }}</span>
                                                }
                                            </td>
                                            @for (day of weekDays(); track day.date) {
                                                <td class="!text-center border-b border-gray-100 !p-2 border-r">
                                                    <input type="number"
                                                        [value]="row.days[day.date] || ''"
                                                        (change)="onHoursChange(row, day.date, $event)"
                                                        min="0" max="24" step="0.25"
                                                        class="w-14 text-center border border-gray-200 rounded-md py-1.5 px-1 text-sm text-gray-900 font-medium focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all outline-none hover:border-gray-300"
                                                        [attr.data-testid]="'timesheet-hours-' + day.date">
                                                </td>
                                            }
                                            <td class="border-b border-gray-100 !py-3 !text-center bg-gray-50/30">
                                                <span class="font-bold text-lg text-gray-900">{{ rowTotal(row) || '-' }}</span>
                                            </td>
                                            <td class="border-b border-gray-100 !py-3 !text-center">
                                                <button nz-button nzType="text" nzDanger nzShape="circle"
                                                        (click)="removeRow(i)"
                                                        nz-tooltip nzTooltipTitle="行を削除"
                                                        class="!opacity-30 hover:!opacity-100 transition-opacity">
                                                    <span nz-icon nzType="close" nzTheme="outline"></span>
                                                </button>
                                            </td>
                                        </tr>
                                    }
                                    <!-- Footer row -->
                                    @if (rows().length > 0) {
                                        <tr class="!bg-gray-50 border-t-2 border-gray-200">
                                            <td class="border-r border-gray-100">
                                                <span class="font-bold text-gray-700 uppercase tracking-wider text-xs">合計</span>
                                            </td>
                                            @for (day of weekDays(); track day.date) {
                                                <td class="!text-center border-r border-gray-100">
                                                    <span class="font-bold text-gray-900 text-base">{{ dayTotal(day.date) || '-' }}</span>
                                                </td>
                                            }
                                            <td class="!text-center !bg-primary-50 border-t-2 border-primary-200">
                                                <span class="font-black text-xl text-primary-700">{{ grandTotal() || '0' }}</span>
                                            </td>
                                            <td></td>
                                        </tr>
                                    }
                                </tbody>
                                <ng-template #emptyTpl>
                                    <div class="flex flex-col items-center justify-center py-12 text-center bg-gray-50/50">
                                        <p class="text-gray-500 font-medium mb-4 text-sm mt-0">入力項目がありません</p>
                                        <button nz-button nzType="default" (click)="addRow()">
                                            <span nz-icon nzType="plus" nzTheme="outline"></span>
                                            最初の行を追加
                                        </button>
                                    </div>
                                </ng-template>
                            </nz-table>
                        </div>
                    </div>

                    <!-- Actions -->
                    <div class="flex justify-between items-center mt-6">
                        <button nz-button nzType="default" (click)="addRow()"
                                data-testid="timesheet-add-row-btn">
                            <span nz-icon nzType="plus" nzTheme="outline"></span>
                            行を追加
                        </button>

                        <button nz-button nzType="primary" (click)="save()"
                                [disabled]="!isDirty()"
                                data-testid="timesheet-save-btn"
                                class="!rounded-lg !px-8 shadow-sm">
                            <span nz-icon nzType="save" nzTheme="outline"></span>
                            保存
                        </button>
                    </div>
                }
            </nz-card>
        </div>
    `,
    styles: [],
})
export class TimesheetWeeklyComponent implements OnInit {
    timesheetService = inject(TimesheetService);
    private http = inject(HttpClient);
    private message = inject(NzMessageService);

    // ─── State ───
    private _rows = signal<GridRow[]>([]);
    private _projects = signal<ProjectOption[]>([]);
    private _currentWeekStart = signal<Date>(this.getMonday(new Date()));
    private _isDirty = signal(false);
    private _deletedIds = signal<string[]>([]);

    readonly rows = this._rows.asReadonly();
    readonly projects = this._projects.asReadonly();
    readonly isDirty = this._isDirty.asReadonly();

    readonly weekDays = computed(() => {
        const start = this._currentWeekStart();
        const days: { date: string; label: string; dateShort: string }[] = [];
        const labels = ['月', '火', '水', '木', '金', '土', '日'];

        for (let i = 0; i < 7; i++) {
            const d = new Date(start);
            d.setDate(d.getDate() + i);
            const dateStr = d.toISOString().split('T')[0];
            days.push({
                date: dateStr,
                label: labels[i],
                dateShort: `${d.getMonth() + 1}/${d.getDate()}`,
            });
        }
        return days;
    });

    readonly displayedColumns = computed(() => {
        const dayCols = this.weekDays().map((d) => d.date);
        return ['project', ...dayCols, 'total', 'actions'];
    });

    readonly weekStartFormatted = computed(() => {
        const d = this._currentWeekStart();
        return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
    });

    readonly weekEndFormatted = computed(() => {
        const d = new Date(this._currentWeekStart());
        d.setDate(d.getDate() + 6);
        return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
    });

    ngOnInit(): void {
        this.loadProjects();
        this.loadWeekData();
    }

    // ─── Week Navigation ───

    prevWeek(): void {
        const current = this._currentWeekStart();
        const prev = new Date(current);
        prev.setDate(prev.getDate() - 7);
        this._currentWeekStart.set(prev);
        this.loadWeekData();
    }

    nextWeek(): void {
        const current = this._currentWeekStart();
        const next = new Date(current);
        next.setDate(next.getDate() + 7);
        this._currentWeekStart.set(next);
        this.loadWeekData();
    }

    goToCurrentWeek(): void {
        this._currentWeekStart.set(this.getMonday(new Date()));
        this.loadWeekData();
    }

    // ─── Row Operations ───

    addRow(): void {
        this._rows.update((rows) => [
            ...rows,
            {
                projectId: '',
                projectName: '',
                days: {},
                notes: {},
                isNew: true,
            },
        ]);
        this._isDirty.set(true);
    }

    removeRow(index: number): void {
        this._rows.update((rows) => {
            const row = rows[index];
            if (row.id) {
                this._deletedIds.update((ids) => [...ids, row.id!]);
            }
            return rows.filter((_, i) => i !== index);
        });
        this._isDirty.set(true);
    }

    onProjectChange(row: GridRow, projectId: string): void {
        const project = this._projects().find((p) => p.id === projectId);
        if (project) {
            row.projectName = project.name;
        }
        this._isDirty.set(true);
    }

    onHoursChange(row: GridRow, date: string, event: Event): void {
        const input = event.target as HTMLInputElement;
        const value = parseFloat(input.value);

        if (!isNaN(value) && value >= 0 && value <= 24) {
            row.days[date] = Math.round(value * 4) / 4; // Round to 0.25
        } else if (input.value === '') {
            delete row.days[date];
        }
        this._isDirty.set(true);
    }

    rowTotal(row: GridRow): number {
        return Object.values(row.days).reduce(
            (sum, h) => sum + (h || 0),
            0,
        );
    }

    dayTotal(date: string): number {
        return this._rows().reduce(
            (sum, row) => sum + (row.days[date] || 0),
            0,
        );
    }

    grandTotal(): number {
        return this._rows().reduce(
            (sum, row) => sum + this.rowTotal(row),
            0,
        );
    }

    // ─── Save ───

    save(): void {
        const entries: BulkUpsertRequest['entries'] = [];

        for (const row of this._rows()) {
            if (!row.projectId) continue;

            for (const [date, hours] of Object.entries(row.days)) {
                if (hours > 0) {
                    entries.push({
                        id: row.id,
                        projectId: row.projectId,
                        taskId: row.taskId,
                        workDate: date,
                        hours,
                        note: row.notes[date] || undefined,
                    });
                }
            }
        }

        const request: BulkUpsertRequest = {
            entries,
            deletedIds:
                this._deletedIds().length > 0
                    ? this._deletedIds()
                    : undefined,
        };

        this.timesheetService.upsert(request).subscribe({
            next: () => {
                this.message.success('保存しました');
                this._isDirty.set(false);
                this._deletedIds.set([]);
            },
            error: (err) => {
                const msg =
                    err.error?.error?.message || '保存に失敗しました';
                this.message.error(msg);
            },
        });
    }

    // ─── Private ───

    private loadWeekData(): void {
        const weekStart = this._currentWeekStart()
            .toISOString()
            .split('T')[0];
        this.timesheetService.loadWeekly(weekStart);

        // Subscribe to entries and rebuild grid
        // We use a simple polling approach here
        setTimeout(() => this.rebuildGrid(), 500);
    }

    private rebuildGrid(): void {
        const entries = this.timesheetService.weeklyEntries();
        const rowMap = new Map<string, GridRow>();

        for (const entry of entries) {
            const key = `${entry.projectId}:${entry.taskId || ''}`;
            if (!rowMap.has(key)) {
                rowMap.set(key, {
                    id: entry.id,
                    projectId: entry.projectId,
                    projectName: entry.project.name,
                    taskId: entry.taskId,
                    taskName: entry.task?.title,
                    days: {},
                    notes: {},
                    isNew: false,
                });
            }
            const row = rowMap.get(key)!;
            const dateStr =
                typeof entry.workDate === 'string'
                    ? entry.workDate.split('T')[0]
                    : new Date(entry.workDate).toISOString().split('T')[0];
            row.days[dateStr] = entry.hours;
            if (entry.note) row.notes[dateStr] = entry.note;
        }

        this._rows.set(Array.from(rowMap.values()));
        this._isDirty.set(false);
        this._deletedIds.set([]);
    }

    private loadProjects(): void {
        this.http
            .get<{ id: string; name: string }[]>('/api/projects')
            .subscribe({
                next: (projects) => this._projects.set(projects),
                error: () => this._projects.set([]),
            });
    }

    private getMonday(d: Date): Date {
        const date = new Date(d);
        const day = date.getDay();
        const diff = date.getDate() - day + (day === 0 ? -6 : 1);
        date.setDate(diff);
        date.setHours(0, 0, 0, 0);
        return date;
    }
}
