import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  heroArrowLeft, heroCheck, heroXMark, heroPencilSquare,
  heroArrowPath, heroDocumentText, heroCalendar, heroArrowRight,
  heroExclamationTriangle,
} from '@ng-icons/heroicons/outline';
import { WorkflowService } from './workflow.service';
import { AuthService } from '../../core/auth/auth.service';
import { WORKFLOW_STATUS_LABELS, WORKFLOW_STATUS_COLORS } from '@shared/types';
import { ModalService } from '../../shared/ui/modal/modal.service';
import { ConfirmDialogComponent } from '../../shared/ui/modal/confirm-dialog.component';
import { ToastService } from '../../shared/ui/toast/toast.service';

@Component({
  selector: 'app-workflow-detail',
  standalone: true,
  imports: [
    CommonModule, RouterLink, FormsModule, NgIcon,
  ],
  viewProviders: [provideIcons({
    heroArrowLeft, heroCheck, heroXMark, heroPencilSquare,
    heroArrowPath, heroDocumentText, heroCalendar, heroArrowRight,
    heroExclamationTriangle,
  })],
  template: `
    <div class="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      @if (workflowService.isLoading()) {
        <div class="flex flex-col items-center justify-center py-20 bg-base-200/30 rounded-xl" data-testid="loading">
          <span class="loading loading-spinner loading-lg"></span>
          <span class="mt-4 text-sm text-base-content/50 font-medium">申請データを取得中...</span>
        </div>
      }

      @if (workflowService.currentWorkflow(); as wf) {
        <!-- Header Actions -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-base-200 pb-4">
          <div class="flex items-center gap-3">
            <a class="btn btn-circle btn-ghost" routerLink="/workflows" data-testid="back-btn">
              <ng-icon name="heroArrowLeft" class="text-lg" />
            </a>
            <div>
              <div class="text-sm font-medium text-base-content/50 flex items-center gap-2 mb-1">
                <span>{{ wf.workflowNumber }}</span>
                <span class="w-1 h-1 rounded-full bg-base-300"></span>
                <span>{{ getTypeLabel(wf.type) }}</span>
              </div>
              <h1 class="text-2xl font-bold text-base-content m-0">{{ wf.title }}</h1>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Left Column: Details -->
          <div class="lg:col-span-2 space-y-6">
            <!-- Alert for Rejection -->
            @if (wf.status === 'rejected' && wf.rejectionReason) {
              <div role="alert" class="alert alert-error" data-testid="rejection-alert">
                <ng-icon name="heroExclamationTriangle" class="text-lg" />
                <div>
                  <h3 class="font-bold">差戻しされました</h3>
                  <div class="text-sm">{{ wf.rejectionReason }}</div>
                </div>
              </div>
            }

            <div class="card bg-base-100 shadow-sm" data-testid="workflow-detail">
              <div class="card-body">
                <div class="flex justify-between items-center mb-4">
                  <span class="flex items-center gap-2 text-lg font-bold">
                    <ng-icon name="heroDocumentText" class="text-primary text-lg" />
                    申請内容
                  </span>
                  <span class="badge" [ngClass]="getBadgeClass(wf.status)" data-testid="workflow-status">
                    {{ getStatusLabel(wf.status) }}
                  </span>
                </div>

                <dl class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <dt class="text-xs font-semibold text-base-content/50 uppercase tracking-wider mb-1">申請者</dt>
                    <dd class="flex items-center gap-3">
                      <div class="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold uppercase">
                        {{ (wf.creator?.profile?.displayName ?? 'U').charAt(0) }}
                      </div>
                      <span class="font-medium">{{ wf.creator?.profile?.displayName ?? '-' }}</span>
                    </dd>
                  </div>

                  <div>
                    <dt class="text-xs font-semibold text-base-content/50 uppercase tracking-wider mb-1">申請日時</dt>
                    <dd class="flex items-center gap-2 whitespace-nowrap">
                      <ng-icon name="heroCalendar" class="text-base-content/40" />
                      {{ wf.createdAt | date:'yyyy年 MM月 dd日 HH:mm' }}
                    </dd>
                  </div>

                  @if (wf.amount) {
                    <div>
                      <dt class="text-xs font-semibold text-base-content/50 uppercase tracking-wider mb-1">請求金額</dt>
                      <dd class="text-2xl font-bold tracking-tight">¥{{ wf.amount | number }}</dd>
                    </div>
                  }

                  @if (wf.dateFrom || wf.dateTo) {
                    <div class="md:col-span-2">
                      <dt class="text-xs font-semibold text-base-content/50 uppercase tracking-wider mb-1">対象期間</dt>
                      <dd>
                        <div class="flex items-center gap-3 font-medium bg-base-200/50 p-3 rounded-lg w-fit">
                          <span>{{ wf.dateFrom | date:'yyyy/MM/dd' }}</span>
                          <ng-icon name="heroArrowRight" class="text-base-content/40" />
                          <span>{{ wf.dateTo | date:'yyyy/MM/dd' }}</span>
                        </div>
                      </dd>
                    </div>
                  }
                </dl>

                @if (wf.description) {
                  <div class="mt-6 pt-4 border-t border-base-200">
                    <p class="text-xs font-bold text-base-content/50 uppercase tracking-wider mb-3">詳細説明</p>
                    <div class="bg-base-200/50 p-4 rounded-lg whitespace-pre-wrap text-base-content/70 leading-relaxed text-sm">
                      {{ wf.description }}
                    </div>
                  </div>
                }
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="flex flex-wrap items-center gap-3 card bg-base-100 shadow-sm p-4" data-testid="workflow-actions">
              @if (canApprove(wf)) {
                <button class="btn btn-primary" (click)="onApprove()" data-testid="approve-btn">
                  <ng-icon name="heroCheck" class="text-lg" />
                  承認する
                </button>
                <button class="btn btn-error" (click)="onReject()" data-testid="reject-btn">
                  <ng-icon name="heroXMark" class="text-lg" />
                  差戻し
                </button>
              }

              @if (canWithdraw(wf)) {
                <button class="btn btn-ghost" (click)="onWithdraw()" data-testid="withdraw-btn">
                  取下げ
                </button>
              }
              @if (canSubmit(wf)) {
                <button class="btn btn-primary" (click)="onSubmit()" data-testid="submit-btn">
                  <ng-icon name="heroArrowPath" class="text-lg" />
                  再申請する
                </button>
              }
              @if (canEdit(wf)) {
                <a class="btn btn-ghost ml-auto" [routerLink]="['/workflows', wf.id, 'edit']" data-testid="edit-btn">
                  <ng-icon name="heroPencilSquare" class="text-lg" />
                  編集
                </a>
              }
            </div>

            <!-- Reject dialog input -->
            @if (showRejectInput) {
              <div class="card bg-base-100 shadow-sm border border-error/20" data-testid="reject-reason-card">
                <div class="card-body">
                  <h2 class="card-title text-base">差戻し理由の入力</h2>
                  <textarea class="textarea w-full"
                       [(ngModel)]="rejectReason"
                       rows="4"
                       placeholder="必須：具体的な理由を記載してください"
                       maxlength="500"
                       data-testid="reject-reason-input"></textarea>
                  <div class="flex justify-end gap-3 mt-4">
                    <button class="btn btn-ghost" (click)="showRejectInput = false">キャンセル</button>
                    <button class="btn btn-error"
                        (click)="confirmReject()" [disabled]="!rejectReason.trim()" data-testid="confirm-reject-btn">
                      確定して差戻す
                    </button>
                  </div>
                </div>
              </div>
            }
          </div>

          <!-- Right Column: Approval Flow -->
          <div class="lg:col-span-1 space-y-6">
            <div class="card bg-base-100 shadow-sm sticky top-24">
              <div class="card-body">
                <h2 class="card-title text-base mb-4">承認フロー</h2>

                <ul class="steps steps-vertical w-full">
                  <li class="step" [ngClass]="wf.status !== 'draft' ? 'step-primary' : ''">
                    <div class="text-left py-2">
                      <p class="font-medium text-sm">申請</p>
                      <p class="text-xs text-base-content/50 mb-1">{{ wf.creator?.profile?.displayName ?? '-' }}</p>
                      @if (wf.status !== 'draft') {
                        <span class="text-xs bg-base-200 px-2 py-0.5 rounded">
                          {{ wf.createdAt | date:'MM/dd HH:mm' }} 完了
                        </span>
                      } @else {
                        <span class="badge badge-ghost badge-sm">下書き</span>
                      }
                    </div>
                  </li>
                  <li class="step" [ngClass]="getStep2Class(wf)">
                    <div class="text-left py-2">
                      <p class="font-medium text-sm">決済</p>
                      <p class="text-xs text-base-content/50 mb-1">{{ wf.approver?.profile?.displayName ?? '未設定' }}</p>
                      @if (wf.status === 'approved') {
                        <span class="badge badge-success badge-sm">承認済み</span>
                      } @else if (wf.status === 'rejected') {
                        <span class="badge badge-error badge-sm">差戻し</span>
                      } @else if (wf.status === 'submitted') {
                        <span class="badge badge-warning badge-sm">確認待ち</span>
                      } @else if (wf.status === 'withdrawn') {
                        <span class="badge badge-ghost badge-sm">取下げ済</span>
                      }
                    </div>
                  </li>
                </ul>
              </div>
            </div>
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
  private modalService = inject(ModalService);
  private toast = inject(ToastService);

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

  getBadgeClass(status: string): string {
    switch (status) {
      case 'approved': return 'badge-success';
      case 'rejected': return 'badge-error';
      case 'submitted': return 'badge-warning';
      case 'draft': return 'badge-ghost';
      case 'withdrawn': return 'badge-ghost';
      default: return 'badge-ghost';
    }
  }

  getStep2Class(wf: any): string {
    if (wf.status === 'approved') return 'step-primary';
    if (wf.status === 'rejected') return 'step-error';
    return '';
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
    const ref = this.modalService.open(ConfirmDialogComponent, {
      data: { title: '承認確認', message: 'この申請を承認しますか？', confirmText: '承認' },
    });
    ref.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        const wf = this.workflowService.currentWorkflow();
        if (!wf) return;
        this.workflowService.approve(wf.id).subscribe({
          next: () => {
            this.toast.success('承認しました');
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
        this.toast.success('差戻ししました');
        this.router.navigate(['/workflows']);
      },
    });
  }

  onWithdraw(): void {
    const ref = this.modalService.open(ConfirmDialogComponent, {
      data: { title: '取下げ確認', message: 'この申請を取下げますか？' },
    });
    ref.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        const wf = this.workflowService.currentWorkflow();
        if (!wf) return;
        this.workflowService.withdraw(wf.id).subscribe({
          next: () => {
            this.toast.success('取下げしました');
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
        this.toast.success('再申請しました');
        this.router.navigate(['/workflows']);
      },
    });
  }
}
