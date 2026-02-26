import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { WorkflowService, Workflow } from './workflow.service';
import { WORKFLOW_STATUS_LABELS } from '@shared/types';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog.component';

@Component({
    selector: 'app-workflow-pending',
    standalone: true,
    imports: [
        CommonModule,
        MatTableModule, MatButtonModule, MatIconModule, MatChipsModule,
        MatProgressSpinnerModule, MatSnackBarModule, MatDialogModule,
    ],
    template: `
        <div class="pending-container">
            <h1>承認待ち一覧</h1>

            @if (workflowService.isLoading()) {
                <div class="loading" data-testid="loading">
                    <mat-progress-spinner mode="indeterminate" diameter="48"></mat-progress-spinner>
                </div>
            }

            @if (!workflowService.isLoading()) {
                @if (workflowService.pendingWorkflows().length === 0) {
                    <div class="empty-state" data-testid="empty-state">
                        <mat-icon>check_circle</mat-icon>
                        <p>承認待ちの申請はありません</p>
                    </div>
                } @else {
                    <table mat-table [dataSource]="workflowService.pendingWorkflows()"
                           class="pending-table" data-testid="pending-table">
                        <ng-container matColumnDef="workflowNumber">
                            <th mat-header-cell *matHeaderCellDef>申請番号</th>
                            <td mat-cell *matCellDef="let row">{{ row.workflowNumber }}</td>
                        </ng-container>
                        <ng-container matColumnDef="title">
                            <th mat-header-cell *matHeaderCellDef>タイトル</th>
                            <td mat-cell *matCellDef="let row">{{ row.title }}</td>
                        </ng-container>
                        <ng-container matColumnDef="creator">
                            <th mat-header-cell *matHeaderCellDef>申請者</th>
                            <td mat-cell *matCellDef="let row">
                                {{ row.creator?.profile?.displayName ?? '-' }}
                            </td>
                        </ng-container>
                        <ng-container matColumnDef="createdAt">
                            <th mat-header-cell *matHeaderCellDef>申請日</th>
                            <td mat-cell *matCellDef="let row">{{ row.createdAt | date:'yyyy/MM/dd' }}</td>
                        </ng-container>
                        <ng-container matColumnDef="actions">
                            <th mat-header-cell *matHeaderCellDef>操作</th>
                            <td mat-cell *matCellDef="let row">
                                <button mat-icon-button color="primary"
                                        (click)="onApprove(row, $event)"
                                        matTooltip="承認"
                                        data-testid="approve-btn">
                                    <mat-icon>check</mat-icon>
                                </button>
                                <button mat-icon-button color="warn"
                                        (click)="onView(row)"
                                        matTooltip="詳細"
                                        data-testid="view-btn">
                                    <mat-icon>visibility</mat-icon>
                                </button>
                            </td>
                        </ng-container>

                        <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
                        <tr mat-row *matRowDef="let row; columns: displayedColumns;"
                            data-testid="pending-row"></tr>
                    </table>
                }
            }
        </div>
    `,
    styles: [`
        .pending-container { padding: 24px; }
        .loading { display: flex; justify-content: center; padding: 48px; }
        .empty-state { text-align: center; padding: 48px; color: #666; }
        .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; color: #4caf50; }
        .pending-table { width: 100%; }
    `],
})
export class WorkflowPendingComponent implements OnInit {
    workflowService = inject(WorkflowService);
    private router = inject(Router);
    private dialog = inject(MatDialog);
    private snackBar = inject(MatSnackBar);

    displayedColumns = ['workflowNumber', 'title', 'creator', 'createdAt', 'actions'];

    ngOnInit(): void {
        this.workflowService.loadPending();
    }

    onApprove(wf: Workflow, event: Event): void {
        event.stopPropagation();
        const dialogRef = this.dialog.open(ConfirmDialogComponent, {
            data: { title: '承認確認', message: `「${wf.title}」を承認しますか？`, color: 'primary', confirmText: '承認' },
        });
        dialogRef.afterClosed().subscribe((confirmed) => {
            if (confirmed) {
                this.workflowService.approve(wf.id).subscribe({
                    next: () => {
                        this.snackBar.open('承認しました', '閉じる', { duration: 3000 });
                        this.workflowService.loadPending();
                    },
                });
            }
        });
    }

    onView(wf: Workflow): void {
        this.router.navigate(['/workflows', wf.id]);
    }
}
