import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule } from '@angular/material/sort';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
    ProjectStatus, PROJECT_STATUS_LABELS, PROJECT_STATUS_COLORS,
} from '@shared/types';
import { ProjectService } from './project.service';
import { AuthService } from '../../core/auth/auth.service';

@Component({
    selector: 'app-project-list',
    standalone: true,
    imports: [
        RouterLink, FormsModule,
        MatTableModule, MatSortModule, MatPaginatorModule,
        MatButtonModule, MatIconModule, MatSelectModule,
        MatFormFieldModule, MatInputModule, MatChipsModule,
        MatProgressSpinnerModule,
    ],
    template: `
        <div class="project-list-container">
            <div class="header">
                <h1>プロジェクト</h1>
                @if (auth.isPm() || auth.isAdmin()) {
                    <a mat-raised-button color="primary" routerLink="new"
                       data-testid="create-project-btn">
                        <mat-icon>add</mat-icon>
                        新規作成
                    </a>
                }
            </div>

            <div class="filters">
                <mat-form-field appearance="outline">
                    <mat-label>検索</mat-label>
                    <input matInput [(ngModel)]="searchText"
                           (keyup.enter)="applyFilter()"
                           data-testid="search-input">
                    <mat-icon matSuffix>search</mat-icon>
                </mat-form-field>

                <mat-form-field appearance="outline">
                    <mat-label>ステータス</mat-label>
                    <mat-select [(ngModel)]="selectedStatus"
                                (selectionChange)="applyFilter()"
                                data-testid="status-filter">
                        <mat-option value="">すべて</mat-option>
                        @for (status of statuses; track status) {
                            <mat-option [value]="status">
                                {{ statusLabels[status] }}
                            </mat-option>
                        }
                    </mat-select>
                </mat-form-field>
            </div>

            @if (projectService.loading()) {
                <div class="loading" data-testid="loading">
                    <mat-progress-spinner mode="indeterminate"
                                          diameter="48" />
                </div>
            } @else if (projectService.projects().length === 0) {
                <div class="empty-state" data-testid="empty-state">
                    <mat-icon>folder_off</mat-icon>
                    <p>プロジェクトがありません</p>
                </div>
            } @else {
                <table mat-table [dataSource]="projectService.projects()"
                       matSort data-testid="project-table">

                    <ng-container matColumnDef="name">
                        <th mat-header-cell *matHeaderCellDef mat-sort-header>名前</th>
                        <td mat-cell *matCellDef="let row">
                            <a [routerLink]="[row.id]" class="project-link"
                               data-testid="project-row">
                                {{ row.name }}
                            </a>
                        </td>
                    </ng-container>

                    <ng-container matColumnDef="status">
                        <th mat-header-cell *matHeaderCellDef mat-sort-header>ステータス</th>
                        <td mat-cell *matCellDef="let row">
                            <span class="status-chip"
                                  [class]="'status-' + row.status">
                                {{ statusLabels[row.status] || row.status }}
                            </span>
                        </td>
                    </ng-container>

                    <ng-container matColumnDef="pm">
                        <th mat-header-cell *matHeaderCellDef>PM</th>
                        <td mat-cell *matCellDef="let row">
                            {{ row.pm?.profile?.displayName || '—' }}
                        </td>
                    </ng-container>

                    <ng-container matColumnDef="members">
                        <th mat-header-cell *matHeaderCellDef>メンバー</th>
                        <td mat-cell *matCellDef="let row">
                            {{ row._count?.members || 0 }}名
                        </td>
                    </ng-container>

                    <ng-container matColumnDef="tasks">
                        <th mat-header-cell *matHeaderCellDef>タスク</th>
                        <td mat-cell *matCellDef="let row">
                            {{ row._count?.tasks || 0 }}件
                        </td>
                    </ng-container>

                    <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
                    <tr mat-row *matRowDef="let row; columns: displayedColumns;"
                        class="clickable-row"></tr>
                </table>

                @if (projectService.meta(); as meta) {
                    <mat-paginator [length]="meta.total"
                                   [pageSize]="meta.limit"
                                   [pageIndex]="meta.page - 1"
                                   [pageSizeOptions]="[10, 20, 50]"
                                   (page)="onPage($event)"
                                   data-testid="paginator" />
                }
            }
        </div>
    `,
    styles: [`
        .project-list-container { padding: 24px; }
        .header {
            display: flex; justify-content: space-between;
            align-items: center; margin-bottom: 16px;
        }
        .filters {
            display: flex; gap: 16px; margin-bottom: 16px;
        }
        .loading, .empty-state {
            display: flex; flex-direction: column;
            align-items: center; justify-content: center;
            padding: 64px 0; color: #888;
        }
        .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; }
        .project-link { text-decoration: none; color: inherit; font-weight: 500; }
        .project-link:hover { color: var(--mat-primary); }
        .clickable-row:hover { background: rgba(0,0,0,.04); }
        .status-chip {
            padding: 4px 12px; border-radius: 16px; font-size: 12px;
        }
        .status-planning { background: #e0e0e0; }
        .status-active { background: #c8e6c9; color: #2e7d32; }
        .status-completed { background: #bbdefb; color: #1565c0; }
        .status-cancelled { background: #ffcdd2; color: #c62828; }
    `],
})
export class ProjectListComponent implements OnInit {
    projectService = inject(ProjectService);
    auth = inject(AuthService);
    private router = inject(Router);

    displayedColumns = ['name', 'status', 'pm', 'members', 'tasks'];
    statuses = Object.values(ProjectStatus);
    statusLabels: Record<string, string> = PROJECT_STATUS_LABELS;

    searchText = '';
    selectedStatus = '';

    ngOnInit() {
        this.projectService.loadAll();
    }

    applyFilter() {
        const params: Record<string, string> = {};
        if (this.searchText) params['search'] = this.searchText;
        if (this.selectedStatus) params['status'] = this.selectedStatus;
        this.projectService.loadAll(params);
    }

    onPage(event: PageEvent) {
        const params: Record<string, string> = {
            page: String(event.pageIndex + 1),
            limit: String(event.pageSize),
        };
        if (this.searchText) params['search'] = this.searchText;
        if (this.selectedStatus) params['status'] = this.selectedStatus;
        this.projectService.loadAll(params);
    }
}
