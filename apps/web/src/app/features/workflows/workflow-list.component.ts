import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule } from '@angular/material/sort';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import {
    WorkflowService, Workflow,
} from './workflow.service';
import {
    WORKFLOW_STATUS_LABELS, WORKFLOW_STATUS_COLORS,
} from '@shared/types';

@Component({
    selector: 'app-workflow-list',
    standalone: true,
    imports: [
        CommonModule, RouterLink, FormsModule,
        MatTableModule, MatSortModule, MatPaginatorModule,
        MatSelectModule, MatFormFieldModule, MatButtonModule,
        MatIconModule, MatChipsModule, MatProgressSpinnerModule,
        MatCardModule,
    ],
    template: `
        <div class="workflow-list-container">
            <div class="header">
                <h1>申請一覧</h1>
                <a mat-raised-button color="primary" routerLink="new"
                   data-testid="create-workflow-btn">
                    <mat-icon>add</mat-icon> 新規申請
                </a>
            </div>

            <!-- Filters -->
            <mat-card class="filter-card" data-testid="workflow-filters">
                <mat-card-content>
                    <div class="filters">
                        <mat-form-field>
                            <mat-label>ステータス</mat-label>
                            <mat-select [(value)]="statusFilter"
                                        (selectionChange)="onFilterChange()"
                                        data-testid="status-filter">
                                <mat-option value="">すべて</mat-option>
                                <mat-option value="draft">下書き</mat-option>
                                <mat-option value="submitted">申請中</mat-option>
                                <mat-option value="approved">承認済</mat-option>
                                <mat-option value="rejected">差戻し</mat-option>
                                <mat-option value="withdrawn">取下げ</mat-option>
                            </mat-select>
                        </mat-form-field>
                        <mat-form-field>
                            <mat-label>種別</mat-label>
                            <mat-select [(value)]="typeFilter"
                                        (selectionChange)="onFilterChange()"
                                        data-testid="type-filter">
                                <mat-option value="">すべて</mat-option>
                                <mat-option value="expense">経費</mat-option>
                                <mat-option value="leave">休暇</mat-option>
                                <mat-option value="purchase">購買</mat-option>
                                <mat-option value="other">その他</mat-option>
                            </mat-select>
                        </mat-form-field>
                    </div>
                </mat-card-content>
            </mat-card>

            <!-- Loading -->
            @if (workflowService.isLoading()) {
                <div class="loading-container" data-testid="loading">
                    <mat-progress-spinner mode="indeterminate" diameter="48"></mat-progress-spinner>
                </div>
            }

            <!-- Table -->
            @if (!workflowService.isLoading()) {
                @if (workflowService.workflows().length === 0) {
                    <div class="empty-state" data-testid="empty-state">
                        <mat-icon>inbox</mat-icon>
                        <p>申請がありません</p>
                    </div>
                } @else {
                    <table mat-table [dataSource]="workflowService.workflows()"
                           matSort class="workflow-table" data-testid="workflow-table">
                        <ng-container matColumnDef="workflowNumber">
                            <th mat-header-cell *matHeaderCellDef mat-sort-header>申請番号</th>
                            <td mat-cell *matCellDef="let row">{{ row.workflowNumber }}</td>
                        </ng-container>
                        <ng-container matColumnDef="type">
                            <th mat-header-cell *matHeaderCellDef>種別</th>
                            <td mat-cell *matCellDef="let row">
                                <mat-chip>{{ getTypeLabel(row.type) }}</mat-chip>
                            </td>
                        </ng-container>
                        <ng-container matColumnDef="title">
                            <th mat-header-cell *matHeaderCellDef mat-sort-header>タイトル</th>
                            <td mat-cell *matCellDef="let row">{{ row.title }}</td>
                        </ng-container>
                        <ng-container matColumnDef="status">
                            <th mat-header-cell *matHeaderCellDef>ステータス</th>
                            <td mat-cell *matCellDef="let row">
                                <mat-chip [color]="getStatusColor(row.status)">
                                    {{ getStatusLabel(row.status) }}
                                </mat-chip>
                            </td>
                        </ng-container>
                        <ng-container matColumnDef="createdAt">
                            <th mat-header-cell *matHeaderCellDef mat-sort-header>申請日</th>
                            <td mat-cell *matCellDef="let row">{{ row.createdAt | date:'yyyy/MM/dd' }}</td>
                        </ng-container>
                        <ng-container matColumnDef="creator">
                            <th mat-header-cell *matHeaderCellDef>申請者</th>
                            <td mat-cell *matCellDef="let row">
                                {{ row.creator?.profile?.displayName ?? '-' }}
                            </td>
                        </ng-container>

                        <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
                        <tr mat-row *matRowDef="let row; columns: displayedColumns;"
                            (click)="onRowClick(row)"
                            class="clickable-row"
                            data-testid="workflow-row"></tr>
                    </table>

                    <mat-paginator
                        [length]="workflowService.totalCount()"
                        [pageSize]="20"
                        [pageSizeOptions]="[10, 20, 50]"
                        (page)="onPageChange($event)"
                        data-testid="workflow-paginator">
                    </mat-paginator>
                }
            }
        </div>
    `,
    styles: [`
        .workflow-list-container { padding: 24px; }
        .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
        .filter-card { margin-bottom: 16px; }
        .filters { display: flex; gap: 16px; flex-wrap: wrap; }
        .loading-container { display: flex; justify-content: center; padding: 48px; }
        .empty-state { text-align: center; padding: 48px; color: #666; }
        .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; }
        .workflow-table { width: 100%; }
        .clickable-row { cursor: pointer; }
        .clickable-row:hover { background-color: rgba(0, 0, 0, 0.04); }
    `],
})
export class WorkflowListComponent implements OnInit {
    workflowService = inject(WorkflowService);
    private router = inject(Router);

    displayedColumns = ['workflowNumber', 'type', 'title', 'status', 'createdAt', 'creator'];
    statusFilter = '';
    typeFilter = '';

    private readonly typeLabels: Record<string, string> = {
        expense: '経費', leave: '休暇', purchase: '購買', other: 'その他',
    };

    ngOnInit(): void {
        this.loadData();
    }

    getStatusLabel(status: string): string {
        return (WORKFLOW_STATUS_LABELS as any)[status] ?? status;
    }

    getStatusColor(status: string): string {
        return (WORKFLOW_STATUS_COLORS as any)[status] ?? '';
    }

    getTypeLabel(type: string): string {
        return this.typeLabels[type] ?? type;
    }

    onFilterChange(): void {
        this.loadData();
    }

    onPageChange(event: PageEvent): void {
        this.workflowService.loadAll({
            status: this.statusFilter || undefined,
            type: this.typeFilter || undefined,
            page: event.pageIndex + 1,
            limit: event.pageSize,
        });
    }

    onRowClick(workflow: Workflow): void {
        this.router.navigate(['/workflows', workflow.id]);
    }

    private loadData(): void {
        this.workflowService.loadAll({
            status: this.statusFilter || undefined,
            type: this.typeFilter || undefined,
        });
    }
}
