import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { NzStepsModule } from 'ng-zorro-antd/steps';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';
import { WorkflowService } from './workflow.service';
import { AuthService } from '../../core/auth/auth.service';
import { WORKFLOW_STATUS_LABELS, WORKFLOW_STATUS_COLORS } from '@shared/types';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../shared/components/confirm-dialog.component';

@Component({
    selector: 'app-workflow-detail',
    standalone: true,
    imports: [
        CommonModule, RouterLink, FormsModule,
        NzCardModule, NzButtonModule, NzIconModule, NzTagModule,
        NzSpinModule, NzDescriptionsModule, NzStepsModule,
        NzInputModule, NzAlertModule,
    ],
    template: `
        <div class="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
            @if (workflowService.isLoading()) {
                <div class="flex flex-col items-center justify-center py-20 bg-gray-50 rounded-xl" data-testid="loading">
                    <nz-spin nzSimple [nzSize]="'large'"></nz-spin>
                    <span class="mt-4 text-sm text-gray-500 font-medium">申請データを取得中...</span>
                </div>
            }

            @if (workflowService.currentWorkflow(); as wf) {
                <!-- Header Actions -->
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-4">
                    <div class="flex items-center gap-3">
                        <button nz-button nzShape="circle" routerLink="/workflows" data-testid="back-btn">
                            <span nz-icon nzType="arrow-left" nzTheme="outline"></span>
                        </button>
                        <div>
                            <div class="text-sm font-medium text-gray-500 flex items-center gap-2 mb-1">
                                <span>{{ wf.workflowNumber }}</span>
                                <span class="w-1 h-1 rounded-full bg-gray-300"></span>
                                <span>{{ getTypeLabel(wf.type) }}</span>
                            </div>
                            <h1 class="text-2xl font-bold text-gray-900 m-0">{{ wf.title }}</h1>
                        </div>
                    </div>
                </div>

                <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <!-- Left Column: Details -->
                    <div class="lg:col-span-2 space-y-6">
                        <!-- Alert for Rejection -->
                        @if (wf.status === 'rejected' && wf.rejectionReason) {
                            <nz-alert
                                nzType="error"
                                nzShowIcon
                                nzMessage="差戻しされました"
                                [nzDescription]="wf.rejectionReason"
                                class="rounded-xl">
                            </nz-alert>
                        }

                        <nz-card [nzTitle]="detailTitleTpl" data-testid="workflow-detail">
                            <ng-template #detailTitleTpl>
                                <div class="flex justify-between items-center">
                                    <span class="flex items-center gap-2 text-lg font-bold">
                                        <span nz-icon nzType="file-text" nzTheme="outline" class="text-blue-600"></span>
                                        申請内容
                                    </span>
                                    <nz-tag [nzColor]="getTagColor(wf.status)" data-testid="workflow-status">
                                        {{ getStatusLabel(wf.status) }}
                                    </nz-tag>
                                </div>
                            </ng-template>

                            <nz-descriptions nzBordered [nzColumn]="{ xxl: 2, xl: 2, lg: 2, md: 1, sm: 1, xs: 1 }">
                                <nz-descriptions-item nzTitle="申請者">
                                    <div class="flex items-center gap-3">
                                        <div class="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-bold uppercase">
                                            {{ (wf.creator?.profile?.displayName ?? 'U').charAt(0) }}
                                        </div>
                                        <span class="font-medium">{{ wf.creator?.profile?.displayName ?? '-' }}</span>
                                    </div>
                                </nz-descriptions-item>

                                <nz-descriptions-item nzTitle="申請日時">
                                    <div class="flex items-center gap-2 whitespace-nowrap">
                                        <span nz-icon nzType="calendar" nzTheme="outline" class="text-gray-400"></span>
                                        {{ wf.createdAt | date:'yyyy年 MM月 dd日 HH:mm' }}
                                    </div>
                                </nz-descriptions-item>

                                @if (wf.amount) {
                                    <nz-descriptions-item nzTitle="請求金額">
                                        <span class="text-2xl font-bold text-gray-900 tracking-tight">¥{{ wf.amount | number }}</span>
                                    </nz-descriptions-item>
                                }

                                @if (wf.dateFrom || wf.dateTo) {
                                    <nz-descriptions-item nzTitle="対象期間" [nzSpan]="2">
                                        <div class="flex items-center gap-3 font-medium bg-gray-50 p-3 rounded-lg w-fit border border-gray-100">
                                            <span>{{ wf.dateFrom | date:'yyyy/MM/dd' }}</span>
                                            <span nz-icon nzType="arrow-right" nzTheme="outline" class="text-gray-400"></span>
                                            <span>{{ wf.dateTo | date:'yyyy/MM/dd' }}</span>
                                        </div>
                                    </nz-descriptions-item>
                                }
                            </nz-descriptions>

                            @if (wf.description) {
                                <div class="mt-6 pt-4 border-t border-gray-100">
                                    <p class="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">詳細説明</p>
                                    <div class="bg-gray-50 p-4 rounded-lg border border-gray-100 whitespace-pre-wrap text-gray-700 leading-relaxed text-sm">
                                        {{ wf.description }}
                                    </div>
                                </div>
                            }
                        </nz-card>

                        <!-- Action Buttons -->
                        <div class="flex flex-wrap items-center gap-3 bg-white p-4 rounded-xl shadow-sm border border-gray-200" data-testid="workflow-actions">
                            @if (canApprove(wf)) {
                                <button nz-button nzType="primary" (click)="onApprove()" data-testid="approve-btn">
                                    <span nz-icon nzType="check-circle" nzTheme="outline"></span>
                                    承認する
                                </button>
                                <button nz-button nzDanger (click)="onReject()" data-testid="reject-btn">
                                    <span nz-icon nzType="close-circle" nzTheme="outline"></span>
                                    差戻し
                                </button>
                            }

                            @if (canWithdraw(wf)) {
                                <button nz-button (click)="onWithdraw()" data-testid="withdraw-btn">
                                    <span nz-icon nzType="undo" nzTheme="outline"></span>
                                    取下げ
                                </button>
                            }
                            @if (canSubmit(wf)) {
                                <button nz-button nzType="primary" (click)="onSubmit()" data-testid="submit-btn">
                                    <span nz-icon nzType="send" nzTheme="outline"></span>
                                    再申請する
                                </button>
                            }
                            @if (canEdit(wf)) {
                                <a nz-button nzType="default" [routerLink]="['/workflows', wf.id, 'edit']" class="ml-auto" data-testid="edit-btn">
                                    <span nz-icon nzType="edit" nzTheme="outline"></span>
                                    編集
                                </a>
                            }
                        </div>

                        <!-- Reject dialog input -->
                        @if (showRejectInput) {
                            <nz-card nzTitle="差戻し理由の入力" class="border-red-200" data-testid="reject-reason-card">
                                <nz-textarea-count [nzMaxCharacterCount]="500">
                                    <textarea nz-input
                                              [(ngModel)]="rejectReason"
                                              rows="4"
                                              placeholder="必須：具体的な理由を記載してください"
                                              data-testid="reject-reason-input"></textarea>
                                </nz-textarea-count>
                                <div class="flex justify-end gap-3 mt-4">
                                    <button nz-button (click)="showRejectInput = false">キャンセル</button>
                                    <button nz-button nzType="primary" nzDanger
                                            (click)="confirmReject()" [disabled]="!rejectReason.trim()" data-testid="confirm-reject-btn">
                                        確定して差戻す
                                    </button>
                                </div>
                            </nz-card>
                        }
                    </div>

                    <!-- Right Column: Timeline Approval Steps -->
                    <div class="lg:col-span-1 space-y-6">
                        <nz-card class="sticky top-24">
                            <ng-template #titleTemplate>
                                <span class="flex items-center gap-2 text-lg font-bold">
                                    <span nz-icon nzType="node-index" nzTheme="outline" class="text-blue-600"></span>
                                    承認フロー
                                </span>
                            </ng-template>

                            <nz-steps [nzCurrent]="getStepsCurrent(wf)" nzDirection="vertical" [nzStatus]="getStepsStatus(wf)" nzSize="small">
                                <nz-step nzTitle="申請"
                                         [nzDescription]="step1DescTpl">
                                    <ng-template #step1DescTpl>
                                        <div class="text-xs text-gray-500 mt-1">
                                            <p class="mb-1">{{ wf.creator?.profile?.displayName ?? '-' }}</p>
                                            @if (wf.status !== 'draft') {
                                                <span class="inline-flex py-0.5 px-2 bg-gray-50 rounded-md border border-gray-100 text-xs text-gray-600">
                                                    {{ wf.createdAt | date:'MM/dd HH:mm' }} 完了
                                                </span>
                                            } @else {
                                                <nz-tag nzColor="default">下書き</nz-tag>
                                            }
                                        </div>
                                    </ng-template>
                                </nz-step>

                                <nz-step nzTitle="決済"
                                         [nzDescription]="step2DescTpl"
                                         [nzIcon]="getStepIcon(wf)">
                                    <ng-template #step2DescTpl>
                                        <div class="text-xs text-gray-500 mt-1">
                                            <p class="mb-1">{{ wf.approver?.profile?.displayName ?? '未設定' }}</p>
                                            @if (wf.status === 'approved') {
                                                <nz-tag nzColor="success">承認済み</nz-tag>
                                            } @else if (wf.status === 'rejected') {
                                                <nz-tag nzColor="error">差戻し</nz-tag>
                                            } @else if (wf.status === 'submitted') {
                                                <nz-tag nzColor="processing">確認待ち</nz-tag>
                                            } @else if (wf.status === 'withdrawn') {
                                                <nz-tag nzColor="default">取下げ済</nz-tag>
                                            }
                                        </div>
                                    </ng-template>
                                </nz-step>
                            </nz-steps>
                        </nz-card>
                    </div>
                </div>
            }
        </div>
    `,
    styles: [],
})
export class WorkflowDetailComponent implements OnInit {
    workflowService = inject(WorkflowService);
    private auth = inject(AuthService);
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private modal = inject(NzModalService);
    private message = inject(NzMessageService);

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

    getTagColor(status: string): string {
        switch (status) {
            case 'approved': return 'success';
            case 'rejected': return 'error';
            case 'submitted': return 'processing';
            default: return 'default';
        }
    }

    getStepsCurrent(wf: any): number {
        if (wf.status === 'draft') return 0;
        if (wf.status === 'submitted') return 1;
        return 1; // approved, rejected, withdrawn → step 2 completed/failed
    }

    getStepsStatus(wf: any): 'wait' | 'process' | 'finish' | 'error' {
        if (wf.status === 'rejected') return 'error';
        if (wf.status === 'approved') return 'finish';
        if (wf.status === 'submitted') return 'process';
        return 'wait';
    }

    getStepIcon(wf: any): string | undefined {
        // Return undefined to use default step icon
        return undefined;
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
        const ref = this.modal.create({
            nzContent: ConfirmDialogComponent,
            nzData: { title: '承認確認', message: 'この申請を承認しますか？', color: 'primary', confirmText: '承認' } as ConfirmDialogData,
            nzFooter: null,
            nzClosable: true,
            nzWidth: 420,
        });
        ref.afterClose.subscribe((confirmed) => {
            if (confirmed) {
                const wf = this.workflowService.currentWorkflow();
                if (!wf) return;
                this.workflowService.approve(wf.id).subscribe({
                    next: () => {
                        this.message.success('承認しました');
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
                this.message.success('差戻ししました');
                this.router.navigate(['/workflows']);
            },
        });
    }

    onWithdraw(): void {
        const ref = this.modal.create({
            nzContent: ConfirmDialogComponent,
            nzData: { title: '取下げ確認', message: 'この申請を取下げますか？' } as ConfirmDialogData,
            nzFooter: null,
            nzClosable: true,
            nzWidth: 420,
        });
        ref.afterClose.subscribe((confirmed) => {
            if (confirmed) {
                const wf = this.workflowService.currentWorkflow();
                if (!wf) return;
                this.workflowService.withdraw(wf.id).subscribe({
                    next: () => {
                        this.message.success('取下げしました');
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
                this.message.success('再申請しました');
                this.router.navigate(['/workflows']);
            },
        });
    }
}
