import { Component, OnInit, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AdminAuditLogsService } from '../services/audit-logs.service';

const ACTION_LABELS: Record<string, string> = {
    'workflow.create': '申請作成',
    'workflow.approve': '申請承認',
    'workflow.reject': '申請差戻し',
    'project.create': 'PJ作成',
    'project.update': 'PJ更新',
    'task.create': 'タスク作成',
    'task.status_change': 'ステータス変更',
    'user.invite': 'ユーザー招待',
    'user.role_change': 'ロール変更',
    'tenant.update': 'テナント更新',
    'tenant.delete': 'テナント削除',
};

@Component({
    selector: 'app-audit-log-viewer',
    standalone: true,
    imports: [
        ReactiveFormsModule,
        DatePipe,
        MatTableModule,
        MatPaginatorModule,
        MatCardModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatDatepickerModule,
        MatNativeDateModule,
        MatChipsModule,
        MatButtonModule,
        MatProgressSpinnerModule,
    ],
    template: `
    <div class="audit-log-viewer" data-testid="audit-log-viewer">
      <h2>監査ログ</h2>

      <mat-card class="filter-card">
        <mat-card-content>
          <div class="filter-row">
            <mat-form-field>
              <mat-label>アクション種別</mat-label>
              <mat-select (selectionChange)="onFilterChange()" [(value)]="selectedAction" data-testid="filter-action">
                <mat-option value="">すべて</mat-option>
                @for (action of actionOptions; track action.value) {
                  <mat-option [value]="action.value">{{ action.label }}</mat-option>
                }
              </mat-select>
            </mat-form-field>

            <mat-form-field>
              <mat-label>リソース種別</mat-label>
              <mat-select (selectionChange)="onFilterChange()" [(value)]="selectedResourceType" data-testid="filter-resource">
                <mat-option value="">すべて</mat-option>
                <mat-option value="workflow">ワークフロー</mat-option>
                <mat-option value="project">プロジェクト</mat-option>
                <mat-option value="task">タスク</mat-option>
                <mat-option value="user">ユーザー</mat-option>
                <mat-option value="tenant">テナント</mat-option>
              </mat-select>
            </mat-form-field>

            <button mat-stroked-button (click)="onReset()" data-testid="filter-reset-btn">
              リセット
            </button>
          </div>
        </mat-card-content>
      </mat-card>

      @if (auditLogsService.loading()) {
        <mat-progress-spinner mode="indeterminate" diameter="40" data-testid="loading"></mat-progress-spinner>
      } @else {
        <table mat-table [dataSource]="auditLogsService.logs()" class="full-width" data-testid="audit-logs-table">
          <ng-container matColumnDef="createdAt">
            <th mat-header-cell *matHeaderCellDef>日時</th>
            <td mat-cell *matCellDef="let log">{{ log.createdAt | date:'yyyy/MM/dd HH:mm:ss' }}</td>
          </ng-container>

          <ng-container matColumnDef="userName">
            <th mat-header-cell *matHeaderCellDef>操作者</th>
            <td mat-cell *matCellDef="let log">{{ log.userName }}</td>
          </ng-container>

          <ng-container matColumnDef="action">
            <th mat-header-cell *matHeaderCellDef>アクション</th>
            <td mat-cell *matCellDef="let log">
              <mat-chip>{{ getActionLabel(log.action) }}</mat-chip>
            </td>
          </ng-container>

          <ng-container matColumnDef="resourceType">
            <th mat-header-cell *matHeaderCellDef>リソース種別</th>
            <td mat-cell *matCellDef="let log">{{ log.resourceType }}</td>
          </ng-container>

          <ng-container matColumnDef="resourceId">
            <th mat-header-cell *matHeaderCellDef>リソースID</th>
            <td mat-cell *matCellDef="let log">{{ log.resourceId?.substring(0, 8) }}…</td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;" data-testid="audit-log-row"></tr>
        </table>

        <mat-paginator
          [length]="auditLogsService.meta().total"
          [pageSize]="auditLogsService.meta().limit"
          [pageSizeOptions]="[10, 20, 50, 100]"
          (page)="onPageChange($event)"
          data-testid="audit-paginator">
        </mat-paginator>
      }
    </div>
  `,
    styles: [`
    .filter-card { margin-bottom: 16px; }
    .filter-row { display: flex; gap: 16px; align-items: center; flex-wrap: wrap; }
    .full-width { width: 100%; }
    mat-chip { font-size: 12px; }
  `],
})
export class AuditLogViewerComponent implements OnInit {
    auditLogsService = inject(AdminAuditLogsService);

    displayedColumns = ['createdAt', 'userName', 'action', 'resourceType', 'resourceId'];

    selectedAction = '';
    selectedResourceType = '';

    actionOptions = Object.entries(ACTION_LABELS).map(([value, label]) => ({ value, label }));

    ngOnInit(): void {
        this.auditLogsService.loadLogs();
    }

    getActionLabel(action: string): string {
        return ACTION_LABELS[action] ?? action;
    }

    onFilterChange(): void {
        this.auditLogsService.loadLogs({
            action: this.selectedAction || undefined,
            resourceType: this.selectedResourceType || undefined,
        });
    }

    onReset(): void {
        this.selectedAction = '';
        this.selectedResourceType = '';
        this.auditLogsService.loadLogs();
    }

    onPageChange(event: PageEvent): void {
        this.auditLogsService.loadLogs({
            page: event.pageIndex + 1,
            limit: event.pageSize,
            action: this.selectedAction || undefined,
            resourceType: this.selectedResourceType || undefined,
        });
    }
}
