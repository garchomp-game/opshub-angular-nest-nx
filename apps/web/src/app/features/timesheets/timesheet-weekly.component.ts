import {
  Component,
  OnInit,
  inject,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { InputNumberModule } from 'primeng/inputnumber';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { CardModule } from 'primeng/card';
import {
  TimesheetService,
  TimesheetEntry,
  BulkUpsertRequest,
} from './timesheet.service';
import { HttpClient } from '@angular/common/http';
import { ToastService } from '../../shared/ui/toast/toast.service';

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
    TableModule,
    InputNumberModule,
    ButtonModule,
    SelectModule,
    CardModule,
  ],
  template: `
    <div class="p-6 lg:p-8 max-w-[1400px] mx-auto space-y-6">
      <p-card data-testid="timesheet-grid">
        <ng-template #header>
          <div class="px-6 pt-5 pb-0">
            <div class="flex justify-between items-center mb-4">
              <div>
                <h2 class="text-lg font-bold flex items-center gap-2 m-0">
                  <i class="pi pi-clock" style="color: var(--p-primary-color);"></i>
                  工数入力
                </h2>
                <p class="text-sm mt-1" style="opacity: 0.6;">{{ weekStartFormatted() }} 〜 {{ weekEndFormatted() }}</p>
              </div>
            </div>

            <!-- Week navigation -->
            <div class="flex items-center gap-2 mb-4 rounded-lg p-2 max-w-fit mx-auto" style="background-color: var(--p-surface-50);">
              <p-button icon="pi pi-chevron-left" [rounded]="true" [text]="true"
                  (onClick)="prevWeek()" title="前の週"
                  data-testid="timesheet-prev-week" />

              <span class="text-base font-bold px-6 min-w-[200px] text-center tracking-wide">
                {{ weekStartFormatted() }} 〜 {{ weekEndFormatted() }}
              </span>

              <p-button icon="pi pi-chevron-right" [rounded]="true" [text]="true"
                  (onClick)="nextWeek()" title="次の週"
                  data-testid="timesheet-next-week" />

              <span class="mx-1" style="border-left: 1px solid var(--p-surface-border); height: 1.5rem;"></span>

              <p-button label="今週" [text]="true" size="small"
                  (onClick)="goToCurrentWeek()"
                  data-testid="timesheet-current-week" />
            </div>
          </div>
        </ng-template>

        @if (timesheetService.isLoading()) {
          <div class="flex justify-center py-16" data-testid="loading">
            <i class="pi pi-spin pi-spinner" style="font-size: 2rem; color: var(--p-primary-color);"></i>
          </div>
        } @else {
          <p-table [value]="rows()" [tableStyle]="{ 'min-width': '60rem' }"
              data-testid="timesheet-table">
            <ng-template #header>
              <tr>
                <th style="min-width: 200px;">プロジェクト</th>
                @for (day of weekDays(); track day.date) {
                  <th class="text-center" style="min-width: 70px;">
                    <div class="flex flex-col items-center justify-center gap-1">
                      <span class="text-xs font-bold" style="opacity: 0.4;">{{ day.label }}</span>
                      <span class="text-[13px] font-medium">{{ day.dateShort }}</span>
                    </div>
                  </th>
                }
                <th class="text-center" style="min-width: 80px; background-color: var(--p-primary-50); color: var(--p-primary-color);">合計</th>
                <th style="width: 48px;"></th>
              </tr>
            </ng-template>
            <ng-template #body let-row let-i="rowIndex">
              <tr data-testid="timesheet-row">
                <td>
                  @if (row.isNew) {
                    <p-select [options]="projects()" optionLabel="name" optionValue="id"
                        [(ngModel)]="row.projectId"
                        (ngModelChange)="onProjectChange(row, $event)"
                        placeholder="プロジェクト選択" styleClass="w-full" />
                  } @else {
                    <span class="font-medium block truncate" [title]="row.projectName">{{ row.projectName }}</span>
                  }
                </td>
                @for (day of weekDays(); track day.date) {
                  <td class="text-center" style="padding: 0.5rem;">
                    <p-inputnumber
                        [ngModel]="row.days[day.date] || null"
                        (ngModelChange)="onHoursInputChange(row, day.date, $event)"
                        [min]="0" [max]="24" [step]="0.25"
                        [maxFractionDigits]="2"
                        inputStyleClass="w-14 text-center"
                        [attr.data-testid]="'timesheet-hours-' + day.date" />
                  </td>
                }
                <td class="text-center" style="background-color: var(--p-surface-50);">
                  <span class="font-bold text-lg">{{ rowTotal(row) || '-' }}</span>
                </td>
                <td class="text-center">
                  <p-button icon="pi pi-times" [rounded]="true" [text]="true"
                      severity="danger" size="small"
                      (onClick)="removeRow(i)" title="行を削除"
                      [style]="{ opacity: '0.3' }" />
                </td>
              </tr>
            </ng-template>
            <ng-template #footer>
              @if (rows().length > 0) {
                <tr style="background-color: var(--p-surface-50);">
                  <td>
                    <span class="font-bold uppercase tracking-wider text-xs" style="opacity: 0.7;">合計</span>
                  </td>
                  @for (day of weekDays(); track day.date) {
                    <td class="text-center">
                      <span class="font-bold text-base">{{ dayTotal(day.date) || '-' }}</span>
                    </td>
                  }
                  <td class="text-center" style="background-color: var(--p-primary-50);">
                    <span class="font-black text-xl" style="color: var(--p-primary-color);">{{ grandTotal() || '0' }}</span>
                  </td>
                  <td></td>
                </tr>
              }
            </ng-template>
            <ng-template #emptymessage>
              <tr>
                <td [attr.colspan]="weekDays().length + 3">
                  <div class="flex flex-col items-center justify-center py-12 text-center" style="background-color: var(--p-surface-50);">
                    <p class="font-medium mb-4 text-sm" style="opacity: 0.6;">入力項目がありません</p>
                    <p-button icon="pi pi-plus" label="最初の行を追加"
                        [text]="true" size="small" (onClick)="addRow()" />
                  </div>
                </td>
              </tr>
            </ng-template>
          </p-table>

          <!-- Actions -->
          <div class="flex justify-between items-center mt-6">
            <p-button icon="pi pi-plus" label="行を追加" [text]="true"
                size="small" (onClick)="addRow()"
                data-testid="timesheet-add-row-btn" />

            <p-button label="保存" (onClick)="save()"
                [disabled]="!isDirty()"
                data-testid="timesheet-save-btn" />
          </div>
        }
      </p-card>
    </div>
  `,
  styles: [],
})
export class TimesheetWeeklyComponent implements OnInit {
  timesheetService = inject(TimesheetService);
  private http = inject(HttpClient);
  private toast = inject(ToastService);

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

  onHoursInputChange(row: GridRow, date: string, value: number | null): void {
    if (value !== null && value >= 0 && value <= 24) {
      row.days[date] = Math.round(value * 4) / 4;
    } else {
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
        this.toast.success('保存しました');
        this._isDirty.set(false);
        this._deletedIds.set([]);
      },
      error: (err) => {
        const msg =
          err.error?.error?.message || '保存に失敗しました';
        this.toast.error(msg);
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
