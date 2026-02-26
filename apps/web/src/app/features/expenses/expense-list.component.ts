import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { ExpenseService, Expense } from './expense.service';
import {
    EXPENSE_CATEGORIES,
    EXPENSE_CATEGORY_COLORS,
    WORKFLOW_STATUS_LABELS,
    WORKFLOW_STATUS_COLORS,
} from '@shared/types';

@Component({
    selector: 'app-expense-list',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        MatTableModule,
        MatPaginatorModule,
        MatSelectModule,
        MatFormFieldModule,
        MatButtonModule,
        MatChipsModule,
        MatIconModule,
        MatProgressSpinnerModule,
        MatCardModule,
    ],
    template: `
        <div class="expense-list-container">
            <div class="header">
                <h1>経費一覧</h1>
                <div class="actions">
                    <button mat-raised-button (click)="goToSummary()" data-testid="expense-summary-btn">
                        <mat-icon>bar_chart</mat-icon>
                        集計
                    </button>
                    <button mat-raised-button color="primary" (click)="goToNew()" data-testid="expense-new-btn">
                        <mat-icon>add</mat-icon>
                        新規申請
                    </button>
                </div>
            </div>

            <!-- フィルタ -->
            <mat-card class="filter-card">
                <mat-card-content>
                    <div class="filters">
                        <mat-form-field appearance="outline">
                            <mat-label>カテゴリ</mat-label>
                            <mat-select
                                [(value)]="selectedCategory"
                                (selectionChange)="onFilterChange()"
                                data-testid="filter-category"
                            >
                                <mat-option value="">すべて</mat-option>
                                @for (cat of categories; track cat) {
                                    <mat-option [value]="cat">{{ cat }}</mat-option>
                                }
                            </mat-select>
                        </mat-form-field>

                        <mat-form-field appearance="outline">
                            <mat-label>ステータス</mat-label>
                            <mat-select
                                [(value)]="selectedStatus"
                                (selectionChange)="onFilterChange()"
                                data-testid="filter-status"
                            >
                                <mat-option value="">すべて</mat-option>
                                <mat-option value="draft">下書き</mat-option>
                                <mat-option value="submitted">申請中</mat-option>
                                <mat-option value="approved">承認済</mat-option>
                                <mat-option value="rejected">差戻し</mat-option>
                            </mat-select>
                        </mat-form-field>
                    </div>
                </mat-card-content>
            </mat-card>

            <!-- ローディング -->
            @if (expenseService.isLoading()) {
                <div class="loading">
                    <mat-spinner diameter="40"></mat-spinner>
                </div>
            }

            <!-- テーブル -->
            @if (!expenseService.isLoading()) {
                <table mat-table [dataSource]="expenseService.expenses()" class="expense-table" data-testid="expense-table">
                    <ng-container matColumnDef="workflowNumber">
                        <th mat-header-cell *matHeaderCellDef>申請番号</th>
                        <td mat-cell *matCellDef="let row">
                            {{ row.workflow?.workflowNumber || '—' }}
                        </td>
                    </ng-container>

                    <ng-container matColumnDef="category">
                        <th mat-header-cell *matHeaderCellDef>カテゴリ</th>
                        <td mat-cell *matCellDef="let row">
                            <mat-chip [style.background-color]="getCategoryColor(row.category)" class="category-chip">
                                {{ row.category }}
                            </mat-chip>
                        </td>
                    </ng-container>

                    <ng-container matColumnDef="amount">
                        <th mat-header-cell *matHeaderCellDef>金額</th>
                        <td mat-cell *matCellDef="let row" class="amount-cell">
                            ¥{{ row.amount | number }}
                        </td>
                    </ng-container>

                    <ng-container matColumnDef="expenseDate">
                        <th mat-header-cell *matHeaderCellDef>日付</th>
                        <td mat-cell *matCellDef="let row">
                            {{ row.expenseDate | date:'yyyy/MM/dd' }}
                        </td>
                    </ng-container>

                    <ng-container matColumnDef="project">
                        <th mat-header-cell *matHeaderCellDef>プロジェクト</th>
                        <td mat-cell *matCellDef="let row">
                            {{ row.project?.name || '—' }}
                        </td>
                    </ng-container>

                    <ng-container matColumnDef="status">
                        <th mat-header-cell *matHeaderCellDef>ステータス</th>
                        <td mat-cell *matCellDef="let row">
                            @if (row.workflow) {
                                <mat-chip [color]="getStatusColor(row.workflow.status)">
                                    {{ getStatusLabel(row.workflow.status) }}
                                </mat-chip>
                            } @else {
                                <mat-chip>下書き</mat-chip>
                            }
                        </td>
                    </ng-container>

                    <ng-container matColumnDef="createdBy">
                        <th mat-header-cell *matHeaderCellDef>申請者</th>
                        <td mat-cell *matCellDef="let row">
                            {{ row.createdBy?.displayName || '—' }}
                        </td>
                    </ng-container>

                    <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
                    <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
                </table>

                <mat-paginator
                    [length]="expenseService.total()"
                    [pageSize]="20"
                    [pageSizeOptions]="[10, 20, 50]"
                    (page)="onPageChange($event)"
                    data-testid="expense-paginator"
                ></mat-paginator>
            }

            <!-- エラー -->
            @if (expenseService.error()) {
                <div class="error-message">{{ expenseService.error() }}</div>
            }
        </div>
    `,
    styles: [`
        .expense-list-container { padding: 24px; }
        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 16px;
        }
        .header h1 { margin: 0; font-size: 24px; }
        .actions { display: flex; gap: 8px; }
        .filter-card { margin-bottom: 16px; }
        .filters { display: flex; gap: 16px; }
        .loading { display: flex; justify-content: center; padding: 40px; }
        .expense-table { width: 100%; }
        .amount-cell { font-weight: 500; text-align: right; }
        .category-chip { color: white !important; font-size: 12px; }
        .error-message { color: #f44336; padding: 16px; text-align: center; }
    `],
})
export class ExpenseListComponent implements OnInit {
    readonly expenseService = inject(ExpenseService);
    private router = inject(Router);

    categories = EXPENSE_CATEGORIES;
    selectedCategory = '';
    selectedStatus = '';

    displayedColumns = [
        'workflowNumber',
        'category',
        'amount',
        'expenseDate',
        'project',
        'status',
        'createdBy',
    ];

    ngOnInit(): void {
        this.expenseService.loadAll();
    }

    onFilterChange(): void {
        this.expenseService.loadAll({
            category: this.selectedCategory || undefined,
            status: this.selectedStatus || undefined,
        });
    }

    onPageChange(event: PageEvent): void {
        this.expenseService.loadAll({
            category: this.selectedCategory || undefined,
            status: this.selectedStatus || undefined,
            page: event.pageIndex + 1,
            limit: event.pageSize,
        });
    }

    getCategoryColor(category: string): string {
        return EXPENSE_CATEGORY_COLORS[category as keyof typeof EXPENSE_CATEGORY_COLORS] || '#757575';
    }

    getStatusLabel(status: string): string {
        return WORKFLOW_STATUS_LABELS[status as keyof typeof WORKFLOW_STATUS_LABELS] || status;
    }

    getStatusColor(status: string): string {
        return WORKFLOW_STATUS_COLORS[status as keyof typeof WORKFLOW_STATUS_COLORS] || '';
    }

    goToNew(): void {
        this.router.navigate(['/expenses/new']);
    }

    goToSummary(): void {
        this.router.navigate(['/expenses/summary']);
    }
}
