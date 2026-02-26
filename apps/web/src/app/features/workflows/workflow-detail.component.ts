import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { WorkflowService } from './workflow.service';
import { AuthService } from '../../core/auth/auth.service';
import { WORKFLOW_STATUS_LABELS, WORKFLOW_STATUS_COLORS } from '@shared/types';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog.component';

@Component({
    selector: 'app-workflow-detail',
    standalone: true,
    imports: [
        CommonModule, RouterLink, FormsModule,
        MatCardModule, MatButtonModule, MatIconModule, MatChipsModule,
        MatProgressSpinnerModule, MatFormFieldModule, MatInputModule,
        MatDialogModule, MatSnackBarModule, MatDividerModule,
    ],
    template: `
        <div class="workflow-detail-container">
            @if (workflowService.isLoading()) {
                <div class="loading" data-testid="loading">
                    <mat-progress-spinner mode="indeterminate" diameter="48"></mat-progress-spinner>
                </div>
            }

            @if (workflowService.currentWorkflow(); as wf) {
                <div class="header">
                    <div>
                        <a mat-button routerLink="/workflows" data-testid="back-btn">
                            <mat-icon>arrow_back</mat-icon> 一覧に戻る
                        </a>
                        <h1>{{ wf.workflowNumber }}: {{ wf.title }}</h1>
                    </div>
                    <mat-chip [color]="getStatusColor(wf.status)"
                              data-testid="workflow-status">
                        {{ getStatusLabel(wf.status) }}
                    </mat-chip>
                </div>

                <mat-card class="detail-card" data-testid="workflow-detail">
                    <mat-card-content>
                        <div class="detail-grid">
                            <div class="field">
                                <label>種別</label>
                                <span>{{ getTypeLabel(wf.type) }}</span>
                            </div>
                            <div class="field">
                                <label>申請者</label>
                                <span>{{ wf.creator?.profile?.displayName ?? '-' }}</span>
                            </div>
                            <div class="field">
                                <label>承認者</label>
                                <span>{{ wf.approver?.profile?.displayName ?? '-' }}</span>
                            </div>
                            @if (wf.amount) {
                                <div class="field">
                                    <label>金額</label>
                                    <span>¥{{ wf.amount | number }}</span>
                                </div>
                            }
                            @if (wf.dateFrom || wf.dateTo) {
                                <div class="field">
                                    <label>期間</label>
                                    <span>{{ wf.dateFrom | date:'yyyy/MM/dd' }} 〜 {{ wf.dateTo | date:'yyyy/MM/dd' }}</span>
                                </div>
                            }
                            <div class="field">
                                <label>申請日</label>
                                <span>{{ wf.createdAt | date:'yyyy/MM/dd HH:mm' }}</span>
                            </div>
                        </div>

                        @if (wf.description) {
                            <mat-divider></mat-divider>
                            <div class="description">
                                <label>説明</label>
                                <p>{{ wf.description }}</p>
                            </div>
                        }

                        @if (wf.rejectionReason) {
                            <mat-divider></mat-divider>
                            <div class="rejection-reason">
                                <label>差戻し理由</label>
                                <p>{{ wf.rejectionReason }}</p>
                            </div>
                        }
                    </mat-card-content>
                </mat-card>

                <!-- Action Buttons -->
                <div class="actions" data-testid="workflow-actions">
                    <!-- Approver actions -->
                    @if (canApprove(wf)) {
                        <button mat-raised-button color="primary"
                                (click)="onApprove()"
                                data-testid="approve-btn">
                            <mat-icon>check</mat-icon> 承認
                        </button>
                        <button mat-raised-button color="warn"
                                (click)="onReject()"
                                data-testid="reject-btn">
                            <mat-icon>close</mat-icon> 差戻し
                        </button>
                    }

                    <!-- Creator actions -->
                    @if (canWithdraw(wf)) {
                        <button mat-stroked-button
                                (click)="onWithdraw()"
                                data-testid="withdraw-btn">
                            <mat-icon>undo</mat-icon> 取下げ
                        </button>
                    }
                    @if (canSubmit(wf)) {
                        <button mat-raised-button color="primary"
                                (click)="onSubmit()"
                                data-testid="submit-btn">
                            <mat-icon>send</mat-icon> 再申請
                        </button>
                    }
                    @if (canEdit(wf)) {
                        <a mat-stroked-button [routerLink]="['/workflows', wf.id, 'edit']"
                           data-testid="edit-btn">
                            <mat-icon>edit</mat-icon> 編集
                        </a>
                    }
                </div>

                <!-- Reject dialog input -->
                @if (showRejectInput) {
                    <mat-card class="reject-card" data-testid="reject-reason-card">
                        <mat-card-content>
                            <mat-form-field appearance="outline" style="width: 100%">
                                <mat-label>差戻し理由</mat-label>
                                <textarea matInput [(ngModel)]="rejectReason" rows="3"
                                          data-testid="reject-reason-input"></textarea>
                            </mat-form-field>
                            <div class="reject-actions">
                                <button mat-button (click)="showRejectInput = false">キャンセル</button>
                                <button mat-raised-button color="warn"
                                        (click)="confirmReject()"
                                        [disabled]="!rejectReason.trim()"
                                        data-testid="confirm-reject-btn">
                                    差戻しを確定
                                </button>
                            </div>
                        </mat-card-content>
                    </mat-card>
                }
            }
        </div>
    `,
    styles: [`
        .workflow-detail-container { padding: 24px; max-width: 800px; margin: 0 auto; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; }
        .header h1 { margin: 8px 0 0; }
        .detail-card { margin-bottom: 16px; }
        .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; padding: 16px 0; }
        .field label { display: block; font-size: 12px; color: #666; margin-bottom: 4px; }
        .field span { font-size: 16px; }
        .description, .rejection-reason { padding: 16px 0; }
        .description label, .rejection-reason label { display: block; font-size: 12px; color: #666; margin-bottom: 8px; }
        .rejection-reason { color: #d32f2f; }
        .actions { display: flex; gap: 12px; margin-top: 16px; flex-wrap: wrap; }
        .loading { display: flex; justify-content: center; padding: 48px; }
        .reject-card { margin-top: 16px; }
        .reject-actions { display: flex; justify-content: flex-end; gap: 8px; }
    `],
})
export class WorkflowDetailComponent implements OnInit {
    workflowService = inject(WorkflowService);
    private auth = inject(AuthService);
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private dialog = inject(MatDialog);
    private snackBar = inject(MatSnackBar);

    showRejectInput = false;
    rejectReason = '';

    private readonly typeLabels: Record<string, string> = {
        expense: '経費', leave: '休暇', purchase: '購買', other: 'その他',
    };

    ngOnInit(): void {
        const id = this.route.snapshot.paramMap.get('id');
        if (id) this.workflowService.loadOne(id);
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

    canApprove(wf: any): boolean {
        return wf.status === 'submitted' && this.auth.canApprove();
    }

    canWithdraw(wf: any): boolean {
        const user = this.auth.currentUser();
        return (wf.status === 'submitted' || wf.status === 'rejected') &&
            wf.createdBy === user?.id;
    }

    canSubmit(wf: any): boolean {
        const user = this.auth.currentUser();
        return wf.status === 'rejected' && wf.createdBy === user?.id;
    }

    canEdit(wf: any): boolean {
        const user = this.auth.currentUser();
        return wf.status === 'draft' && wf.createdBy === user?.id;
    }

    onApprove(): void {
        const dialogRef = this.dialog.open(ConfirmDialogComponent, {
            data: { title: '承認確認', message: 'この申請を承認しますか？', color: 'primary', confirmText: '承認' },
        });
        dialogRef.afterClosed().subscribe((confirmed) => {
            if (confirmed) {
                const wf = this.workflowService.currentWorkflow();
                if (!wf) return;
                this.workflowService.approve(wf.id).subscribe({
                    next: () => {
                        this.snackBar.open('承認しました', '閉じる', { duration: 3000 });
                        this.router.navigate(['/workflows']);
                    },
                });
            }
        });
    }

    onReject(): void {
        this.showRejectInput = true;
    }

    confirmReject(): void {
        const wf = this.workflowService.currentWorkflow();
        if (!wf || !this.rejectReason.trim()) return;
        this.workflowService.reject(wf.id, this.rejectReason).subscribe({
            next: () => {
                this.snackBar.open('差戻ししました', '閉じる', { duration: 3000 });
                this.router.navigate(['/workflows']);
            },
        });
    }

    onWithdraw(): void {
        const dialogRef = this.dialog.open(ConfirmDialogComponent, {
            data: { title: '取下げ確認', message: 'この申請を取下げますか？' },
        });
        dialogRef.afterClosed().subscribe((confirmed) => {
            if (confirmed) {
                const wf = this.workflowService.currentWorkflow();
                if (!wf) return;
                this.workflowService.withdraw(wf.id).subscribe({
                    next: () => {
                        this.snackBar.open('取下げしました', '閉じる', { duration: 3000 });
                        this.router.navigate(['/workflows']);
                    },
                });
            }
        });
    }

    onSubmit(): void {
        const wf = this.workflowService.currentWorkflow();
        if (!wf) return;
        this.workflowService.submit(wf.id).subscribe({
            next: () => {
                this.snackBar.open('再申請しました', '閉じる', { duration: 3000 });
                this.router.navigate(['/workflows']);
            },
        });
    }
}
