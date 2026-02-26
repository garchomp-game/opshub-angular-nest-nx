import {
    Component,
    OnInit,
    inject,
    signal,
    computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCardModule } from '@angular/material/card';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
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
        MatTableModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatButtonModule,
        MatIconModule,
        MatProgressSpinnerModule,
        MatSnackBarModule,
        MatDialogModule,
        MatDatepickerModule,
        MatNativeDateModule,
        MatCardModule,
        MatToolbarModule,
        MatTooltipModule,
    ],
    template: `
        <mat-card data-testid="timesheet-grid">
            <mat-card-header>
                <mat-card-title>工数入力</mat-card-title>
                <mat-card-subtitle>
                    {{ weekStartFormatted() }} 〜 {{ weekEndFormatted() }}
                </mat-card-subtitle>
            </mat-card-header>

            <mat-card-content>
                <!-- Week navigation -->
                <div class="week-nav">
                    <button mat-icon-button (click)="prevWeek()" matTooltip="前の週"
                        data-testid="timesheet-prev-week">
                        <mat-icon>chevron_left</mat-icon>
                    </button>

                    <span class="week-label">
                        {{ weekStartFormatted() }} 〜 {{ weekEndFormatted() }}
                    </span>

                    <button mat-icon-button (click)="nextWeek()" matTooltip="次の週"
                        data-testid="timesheet-next-week">
                        <mat-icon>chevron_right</mat-icon>
                    </button>

                    <button mat-stroked-button (click)="goToCurrentWeek()"
                        data-testid="timesheet-current-week">
                        今週
                    </button>
                </div>

                @if (timesheetService.isLoading()) {
                    <div class="loading-container" data-testid="loading">
                        <mat-progress-spinner mode="indeterminate" diameter="40" />
                    </div>
                } @else {
                    <!-- Grid table -->
                    <table mat-table [dataSource]="rows()" class="timesheet-table">
                        <!-- Project Column -->
                        <ng-container matColumnDef="project">
                            <th mat-header-cell *matHeaderCellDef>プロジェクト</th>
                            <td mat-cell *matCellDef="let row" data-testid="timesheet-row">
                                @if (row.isNew) {
                                    <mat-form-field appearance="outline" class="project-select">
                                        <mat-select [(value)]="row.projectId"
                                            placeholder="プロジェクト選択"
                                            (selectionChange)="onProjectChange(row, $event.value)">
                                            @for (p of projects(); track p.id) {
                                                <mat-option [value]="p.id">{{ p.name }}</mat-option>
                                            }
                                        </mat-select>
                                    </mat-form-field>
                                } @else {
                                    {{ row.projectName }}
                                }
                            </td>
                            <td mat-footer-cell *matFooterCellDef><strong>合計</strong></td>
                        </ng-container>

                        <!-- Day Columns (Mon-Sun) -->
                        @for (day of weekDays(); track day.date) {
                            <ng-container [matColumnDef]="day.date">
                                <th mat-header-cell *matHeaderCellDef class="day-header">
                                    {{ day.label }}<br>
                                    <small>{{ day.dateShort }}</small>
                                </th>
                                <td mat-cell *matCellDef="let row" class="day-cell">
                                    <input type="number"
                                        [value]="row.days[day.date] || ''"
                                        (change)="onHoursChange(row, day.date, $event)"
                                        min="0" max="24" step="0.25"
                                        class="hours-input"
                                        [attr.data-testid]="'timesheet-hours-' + day.date">
                                </td>
                                <td mat-footer-cell *matFooterCellDef class="day-cell">
                                    <strong>{{ dayTotal(day.date) }}</strong>
                                </td>
                            </ng-container>
                        }

                        <!-- Total Column -->
                        <ng-container matColumnDef="total">
                            <th mat-header-cell *matHeaderCellDef class="total-header">合計</th>
                            <td mat-cell *matCellDef="let row" class="total-cell">
                                <strong>{{ rowTotal(row) }}</strong>
                            </td>
                            <td mat-footer-cell *matFooterCellDef class="total-cell">
                                <strong>{{ grandTotal() }}</strong>
                            </td>
                        </ng-container>

                        <!-- Actions Column -->
                        <ng-container matColumnDef="actions">
                            <th mat-header-cell *matHeaderCellDef></th>
                            <td mat-cell *matCellDef="let row; let i = index">
                                <button mat-icon-button color="warn" (click)="removeRow(i)"
                                    matTooltip="行を削除">
                                    <mat-icon>delete</mat-icon>
                                </button>
                            </td>
                            <td mat-footer-cell *matFooterCellDef></td>
                        </ng-container>

                        <tr mat-header-row *matHeaderRowDef="displayedColumns()"></tr>
                        <tr mat-row *matRowDef="let row; columns: displayedColumns()"></tr>
                        <tr mat-footer-row *matFooterRowDef="displayedColumns()"></tr>
                    </table>

                    <!-- Actions -->
                    <div class="actions-bar">
                        <button mat-stroked-button (click)="addRow()"
                            data-testid="timesheet-add-row-btn">
                            <mat-icon>add</mat-icon>
                            行を追加
                        </button>

                        <button mat-raised-button color="primary" (click)="save()"
                            [disabled]="!isDirty()"
                            data-testid="timesheet-save-btn">
                            <mat-icon>save</mat-icon>
                            保存
                        </button>
                    </div>
                }
            </mat-card-content>
        </mat-card>
    `,
    styles: [`
        :host { display: block; padding: 16px; }

        .week-nav {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 16px;
        }

        .week-label {
            font-size: 16px;
            font-weight: 500;
            flex: 1;
            text-align: center;
        }

        .loading-container {
            display: flex;
            justify-content: center;
            padding: 48px;
        }

        .timesheet-table {
            width: 100%;
        }

        .project-select {
            width: 200px;
        }

        .day-header {
            text-align: center;
            min-width: 80px;
        }

        .day-cell, .total-cell {
            text-align: center;
        }

        .total-header {
            text-align: center;
            min-width: 60px;
        }

        .hours-input {
            width: 60px;
            text-align: center;
            border: 1px solid #ccc;
            border-radius: 4px;
            padding: 4px;
            font-size: 14px;
        }

        .hours-input:focus {
            border-color: #3f51b5;
            outline: none;
        }

        .actions-bar {
            display: flex;
            justify-content: space-between;
            margin-top: 16px;
            padding: 8px 0;
        }
    `],
})
export class TimesheetWeeklyComponent implements OnInit {
    timesheetService = inject(TimesheetService);
    private http = inject(HttpClient);
    private snackBar = inject(MatSnackBar);

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
                this.snackBar.open('保存しました', '閉じる', {
                    duration: 3000,
                });
                this._isDirty.set(false);
                this._deletedIds.set([]);
            },
            error: (err) => {
                const message =
                    err.error?.error?.message || '保存に失敗しました';
                this.snackBar.open(message, '閉じる', { duration: 5000 });
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
