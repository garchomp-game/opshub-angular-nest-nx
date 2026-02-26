import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
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
        MatCardModule,
        MatTabsModule,
        MatTableModule,
        MatFormFieldModule,
        MatDatepickerModule,
        MatNativeDateModule,
        MatInputModule,
        MatSelectModule,
        MatButtonModule,
        MatIconModule,
        MatProgressSpinnerModule,
    ],
    template: `
        <div class="summary-container">
            <h1>経費集計</h1>

            <!-- フィルタ -->
            <mat-card class="filter-card">
                <mat-card-content>
                    <div class="filters">
                        <mat-form-field appearance="outline">
                            <mat-label>開始日</mat-label>
                            <input matInput [matDatepicker]="startPicker" [(ngModel)]="dateFrom" data-testid="filter-date-from">
                            <mat-datepicker-toggle matSuffix [for]="startPicker"></mat-datepicker-toggle>
                            <mat-datepicker #startPicker></mat-datepicker>
                        </mat-form-field>
                        <mat-form-field appearance="outline">
                            <mat-label>終了日</mat-label>
                            <input matInput [matDatepicker]="endPicker" [(ngModel)]="dateTo" data-testid="filter-date-to">
                            <mat-datepicker-toggle matSuffix [for]="endPicker"></mat-datepicker-toggle>
                            <mat-datepicker #endPicker></mat-datepicker>
                        </mat-form-field>
                        <button mat-raised-button color="primary" (click)="loadData()" data-testid="apply-filter-btn">
                            <mat-icon>search</mat-icon>
                            適用
                        </button>
                    </div>
                </mat-card-content>
            </mat-card>

            <!-- Stats Cards -->
            @if (stats()) {
                <div class="stats-cards">
                    <mat-card class="stat-card">
                        <mat-card-content>
                            <div class="stat-icon"><mat-icon>payments</mat-icon></div>
                            <div class="stat-value">¥{{ stats()!.totalAmount | number }}</div>
                            <div class="stat-label">合計金額</div>
                        </mat-card-content>
                    </mat-card>
                    <mat-card class="stat-card">
                        <mat-card-content>
                            <div class="stat-icon"><mat-icon>receipt_long</mat-icon></div>
                            <div class="stat-value">{{ stats()!.totalCount }}</div>
                            <div class="stat-label">件数</div>
                        </mat-card-content>
                    </mat-card>
                    <mat-card class="stat-card">
                        <mat-card-content>
                            <div class="stat-icon"><mat-icon>trending_up</mat-icon></div>
                            <div class="stat-value">¥{{ stats()!.avgAmount | number }}</div>
                            <div class="stat-label">平均金額</div>
                        </mat-card-content>
                    </mat-card>
                    <mat-card class="stat-card">
                        <mat-card-content>
                            <div class="stat-icon"><mat-icon>north</mat-icon></div>
                            <div class="stat-value">¥{{ stats()!.maxAmount | number }}</div>
                            <div class="stat-label">最高金額</div>
                        </mat-card-content>
                    </mat-card>
                </div>
            }

            <!-- Loading -->
            @if (isLoading()) {
                <div class="loading"><mat-spinner diameter="40"></mat-spinner></div>
            }

            <!-- Tabs -->
            @if (!isLoading()) {
                <mat-tab-group data-testid="summary-tabs">
                    <!-- カテゴリ別 -->
                    <mat-tab label="カテゴリ別">
                        <div class="tab-content">
                            <table mat-table [dataSource]="categoryData()" class="summary-table" data-testid="category-table">
                                <ng-container matColumnDef="category">
                                    <th mat-header-cell *matHeaderCellDef>カテゴリ</th>
                                    <td mat-cell *matCellDef="let row">
                                        <span class="color-dot" [style.background-color]="getCategoryColor(row.category)"></span>
                                        {{ row.category }}
                                    </td>
                                </ng-container>
                                <ng-container matColumnDef="count">
                                    <th mat-header-cell *matHeaderCellDef>件数</th>
                                    <td mat-cell *matCellDef="let row">{{ row.count }}</td>
                                </ng-container>
                                <ng-container matColumnDef="totalAmount">
                                    <th mat-header-cell *matHeaderCellDef>合計金額</th>
                                    <td mat-cell *matCellDef="let row" class="amount-cell">¥{{ row.totalAmount | number }}</td>
                                </ng-container>
                                <ng-container matColumnDef="percentage">
                                    <th mat-header-cell *matHeaderCellDef>割合</th>
                                    <td mat-cell *matCellDef="let row">{{ row.percentage }}%</td>
                                </ng-container>
                                <tr mat-header-row *matHeaderRowDef="categoryColumns"></tr>
                                <tr mat-row *matRowDef="let row; columns: categoryColumns;"></tr>
                            </table>
                        </div>
                    </mat-tab>

                    <!-- PJ別 -->
                    <mat-tab label="プロジェクト別">
                        <div class="tab-content">
                            <table mat-table [dataSource]="projectData()" class="summary-table" data-testid="project-table">
                                <ng-container matColumnDef="projectName">
                                    <th mat-header-cell *matHeaderCellDef>プロジェクト</th>
                                    <td mat-cell *matCellDef="let row">{{ row.projectName }}</td>
                                </ng-container>
                                <ng-container matColumnDef="count">
                                    <th mat-header-cell *matHeaderCellDef>件数</th>
                                    <td mat-cell *matCellDef="let row">{{ row.count }}</td>
                                </ng-container>
                                <ng-container matColumnDef="totalAmount">
                                    <th mat-header-cell *matHeaderCellDef>合計金額</th>
                                    <td mat-cell *matCellDef="let row" class="amount-cell">¥{{ row.totalAmount | number }}</td>
                                </ng-container>
                                <tr mat-header-row *matHeaderRowDef="projectColumns"></tr>
                                <tr mat-row *matRowDef="let row; columns: projectColumns;"></tr>
                            </table>
                        </div>
                    </mat-tab>

                    <!-- 月別推移 -->
                    <mat-tab label="月別推移">
                        <div class="tab-content">
                            <table mat-table [dataSource]="monthlyData()" class="summary-table" data-testid="monthly-table">
                                <ng-container matColumnDef="month">
                                    <th mat-header-cell *matHeaderCellDef>月</th>
                                    <td mat-cell *matCellDef="let row">{{ row.month }}</td>
                                </ng-container>
                                <ng-container matColumnDef="count">
                                    <th mat-header-cell *matHeaderCellDef>件数</th>
                                    <td mat-cell *matCellDef="let row">{{ row.count }}</td>
                                </ng-container>
                                <ng-container matColumnDef="totalAmount">
                                    <th mat-header-cell *matHeaderCellDef>合計金額</th>
                                    <td mat-cell *matCellDef="let row" class="amount-cell">¥{{ row.totalAmount | number }}</td>
                                </ng-container>
                                <tr mat-header-row *matHeaderRowDef="monthlyColumns"></tr>
                                <tr mat-row *matRowDef="let row; columns: monthlyColumns;"></tr>
                            </table>
                        </div>
                    </mat-tab>
                </mat-tab-group>
            }
        </div>
    `,
    styles: [`
        .summary-container { padding: 24px; }
        h1 { margin: 0 0 16px; font-size: 24px; }
        .filter-card { margin-bottom: 16px; }
        .filters { display: flex; gap: 16px; align-items: center; }
        .stats-cards {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
            gap: 16px;
            margin-bottom: 24px;
        }
        .stat-card { text-align: center; }
        .stat-icon { margin-bottom: 8px; }
        .stat-icon mat-icon { font-size: 36px; width: 36px; height: 36px; color: #1976d2; }
        .stat-value { font-size: 24px; font-weight: 700; }
        .stat-label { font-size: 14px; color: #666; margin-top: 4px; }
        .tab-content { padding: 16px 0; }
        .summary-table { width: 100%; }
        .amount-cell { text-align: right; font-weight: 500; }
        .color-dot {
            display: inline-block; width: 12px; height: 12px;
            border-radius: 50%; margin-right: 8px; vertical-align: middle;
        }
        .loading { display: flex; justify-content: center; padding: 40px; }
    `],
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
