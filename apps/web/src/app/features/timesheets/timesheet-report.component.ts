import {
    Component,
    OnInit,
    inject,
    signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormControl, FormGroup } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
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
        ReactiveFormsModule,
        MatTableModule,
        MatTabsModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatButtonModule,
        MatIconModule,
        MatProgressSpinnerModule,
        MatDatepickerModule,
        MatNativeDateModule,
        MatCardModule,
        MatSnackBarModule,
    ],
    template: `
        <mat-card>
            <mat-card-header>
                <mat-card-title>工数レポート</mat-card-title>
            </mat-card-header>

            <mat-card-content>
                <!-- Filters -->
                <div class="filter-bar" data-testid="report-filter-period">
                    <mat-form-field appearance="outline">
                        <mat-label>開始日</mat-label>
                        <input matInput [matDatepicker]="startPicker"
                            [(ngModel)]="filterDateFrom">
                        <mat-datepicker-toggle matSuffix [for]="startPicker" />
                        <mat-datepicker #startPicker />
                    </mat-form-field>

                    <mat-form-field appearance="outline">
                        <mat-label>終了日</mat-label>
                        <input matInput [matDatepicker]="endPicker"
                            [(ngModel)]="filterDateTo">
                        <mat-datepicker-toggle matSuffix [for]="endPicker" />
                        <mat-datepicker #endPicker />
                    </mat-form-field>

                    <button mat-raised-button color="primary" (click)="applyFilter()"
                        data-testid="report-apply-btn">
                        <mat-icon>filter_list</mat-icon>
                        適用
                    </button>

                    <button mat-raised-button (click)="downloadCsv()"
                        data-testid="report-csv-btn">
                        <mat-icon>download</mat-icon>
                        CSV出力
                    </button>
                </div>

                @if (isLoading()) {
                    <div class="loading-container" data-testid="loading">
                        <mat-progress-spinner mode="indeterminate" diameter="40" />
                    </div>
                } @else {
                    <mat-tab-group>
                        <!-- Project Summary Tab -->
                        <mat-tab label="プロジェクト別">
                            <table mat-table [dataSource]="projectSummary()"
                                class="summary-table" data-testid="report-table">
                                <ng-container matColumnDef="projectName">
                                    <th mat-header-cell *matHeaderCellDef>プロジェクト</th>
                                    <td mat-cell *matCellDef="let row">{{ row.projectName }}</td>
                                </ng-container>

                                <ng-container matColumnDef="totalHours">
                                    <th mat-header-cell *matHeaderCellDef>合計工数(h)</th>
                                    <td mat-cell *matCellDef="let row">{{ row.totalHours }}</td>
                                </ng-container>

                                <ng-container matColumnDef="entryCount">
                                    <th mat-header-cell *matHeaderCellDef>エントリ数</th>
                                    <td mat-cell *matCellDef="let row">{{ row.entryCount }}</td>
                                </ng-container>

                                <tr mat-header-row *matHeaderRowDef="projectColumns"></tr>
                                <tr mat-row *matRowDef="let row; columns: projectColumns"
                                    data-testid="report-project-row"></tr>
                            </table>

                            @if (projectSummary().length === 0) {
                                <div class="empty-state" data-testid="empty-state">
                                    データがありません
                                </div>
                            }
                        </mat-tab>

                        <!-- User Summary Tab -->
                        <mat-tab label="メンバー別">
                            <table mat-table [dataSource]="userSummary()" class="summary-table">
                                <ng-container matColumnDef="userName">
                                    <th mat-header-cell *matHeaderCellDef>メンバー</th>
                                    <td mat-cell *matCellDef="let row">{{ row.userName }}</td>
                                </ng-container>

                                <ng-container matColumnDef="totalHours">
                                    <th mat-header-cell *matHeaderCellDef>合計工数(h)</th>
                                    <td mat-cell *matCellDef="let row">{{ row.totalHours }}</td>
                                </ng-container>

                                <ng-container matColumnDef="entryCount">
                                    <th mat-header-cell *matHeaderCellDef>エントリ数</th>
                                    <td mat-cell *matCellDef="let row">{{ row.entryCount }}</td>
                                </ng-container>

                                <tr mat-header-row *matHeaderRowDef="userColumns"></tr>
                                <tr mat-row *matRowDef="let row; columns: userColumns"
                                    data-testid="report-user-row"></tr>
                            </table>

                            @if (userSummary().length === 0) {
                                <div class="empty-state" data-testid="empty-state">
                                    データがありません
                                </div>
                            }
                        </mat-tab>
                    </mat-tab-group>
                }
            </mat-card-content>
        </mat-card>
    `,
    styles: [`
        :host { display: block; padding: 16px; }

        .filter-bar {
            display: flex;
            align-items: center;
            gap: 16px;
            margin-bottom: 16px;
            flex-wrap: wrap;
        }

        .loading-container {
            display: flex;
            justify-content: center;
            padding: 48px;
        }

        .summary-table {
            width: 100%;
            margin-top: 16px;
        }

        .empty-state {
            text-align: center;
            padding: 48px;
            color: rgba(0, 0, 0, 0.54);
        }
    `],
})
export class TimesheetReportComponent implements OnInit {
    private timesheetService = inject(TimesheetService);
    private snackBar = inject(MatSnackBar);

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
            error: () => this.snackBar.open('データの取得に失敗しました', '閉じる', { duration: 3000 }),
        });

        this.timesheetService.getUserSummary(query).subscribe({
            next: (data) => {
                this.userSummary.set(data);
                this.isLoading.set(false);
            },
            error: () => {
                this.isLoading.set(false);
                this.snackBar.open('データの取得に失敗しました', '閉じる', { duration: 3000 });
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
