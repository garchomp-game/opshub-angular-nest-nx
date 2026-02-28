import { Component, OnInit, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { TimelineModule } from 'primeng/timeline';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageModule } from 'primeng/message';
import { TextareaModule } from 'primeng/textarea';
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
    CommonModule, RouterLink, FormsModule,
    ButtonModule, CardModule, TagModule, TimelineModule, ProgressSpinnerModule, MessageModule, TextareaModule,
  ],
  template: `
    <div class="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      @if (workflowService.isLoading()) {
        <div class="flex flex-col items-center justify-center py-20" data-testid="loading">
          <p-progressSpinner />
          <span class="mt-4 text-sm opacity-50 font-medium">申請データを取得中...</span>
        </div>
      }

      @if (workflowService.currentWorkflow(); as wf) {
        <!-- Header Actions -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4" style="border-color: var(--p-surface-border);">
          <div class="flex items-center gap-3">
            <p-button icon="pi pi-arrow-left" [rounded]="true" [text]="true" routerLink="/workflows" data-testid="back-btn" />
            <div>
              <div class="text-sm font-medium opacity-50 flex items-center gap-2 mb-1">
                <span>{{ wf.workflowNumber }}</span>
                <span class="w-1 h-1 rounded-full" style="background: var(--p-surface-border);"></span>
                <span>{{ getTypeLabel(wf.type) }}</span>
              </div>
              <h1 class="text-2xl font-bold m-0">{{ wf.title }}</h1>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Left Column: Details -->
          <div class="lg:col-span-2 space-y-6">
            <!-- Alert for Rejection -->
            @if (wf.status === 'rejected' && wf.rejectionReason) {
              <p-message severity="error" data-testid="rejection-alert">
                <div>
                  <h3 class="font-bold m-0">差戻しされました</h3>
                  <div class="text-sm mt-1">{{ wf.rejectionReason }}</div>
                </div>
              </p-message>
            }

            <p-card data-testid="workflow-detail">
              <div class="flex justify-between items-center mb-4">
                <span class="flex items-center gap-2 text-lg font-bold">
                  <i class="pi pi-file-edit text-primary text-lg"></i>
                  申請内容
                </span>
                <p-tag [value]="getStatusLabel(wf.status)" [severity]="getSeverity(wf.status)" data-testid="workflow-status" />
              </div>

              <dl class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <dt class="text-xs font-semibold opacity-50 uppercase tracking-wider mb-1">申請者</dt>
                  <dd class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold uppercase">
                      {{ (wf.creator?.profile?.displayName ?? 'U').charAt(0) }}
                    </div>
                    <span class="font-medium">{{ wf.creator?.profile?.displayName ?? '-' }}</span>
                  </dd>
                </div>

                <div>
                  <dt class="text-xs font-semibold opacity-50 uppercase tracking-wider mb-1">申請日時</dt>
                  <dd class="flex items-center gap-2 whitespace-nowrap">
                    <i class="pi pi-calendar opacity-40"></i>
                    {{ wf.createdAt | date:'yyyy年 MM月 dd日 HH:mm' }}
                  </dd>
                </div>

                @if (wf.amount) {
                  <div>
                    <dt class="text-xs font-semibold opacity-50 uppercase tracking-wider mb-1">請求金額</dt>
                    <dd class="text-2xl font-bold tracking-tight">¥{{ wf.amount | number }}</dd>
                  </div>
                }

                @if (wf.dateFrom || wf.dateTo) {
                  <div class="md:col-span-2">
                    <dt class="text-xs font-semibold opacity-50 uppercase tracking-wider mb-1">対象期間</dt>
                    <dd>
                      <div class="flex items-center gap-3 font-medium p-3 rounded-lg w-fit" style="background: var(--p-surface-ground);">
                        <span>{{ wf.dateFrom | date:'yyyy/MM/dd' }}</span>
                        <i class="pi pi-arrow-right opacity-40"></i>
                        <span>{{ wf.dateTo | date:'yyyy/MM/dd' }}</span>
                      </div>
                    </dd>
                  </div>
                }
              </dl>

              @if (wf.description) {
                <div class="mt-6 pt-4" style="border-top: 1px solid var(--p-surface-border);">
                  <p class="text-xs font-bold opacity-50 uppercase tracking-wider mb-3">詳細説明</p>
                  <div class="p-4 rounded-lg whitespace-pre-wrap opacity-70 leading-relaxed text-sm" style="background: var(--p-surface-ground);">
                    {{ wf.description }}
                  </div>
                </div>
              }
            </p-card>

            <!-- Action Buttons -->
            <div class="flex flex-wrap items-center gap-3" data-testid="workflow-actions">
              @if (canApprove(wf)) {
                <p-button label="承認する" icon="pi pi-check" (onClick)="onApprove()" data-testid="approve-btn" />
                <p-button label="差戻し" icon="pi pi-times" severity="danger" (onClick)="onReject()" data-testid="reject-btn" />
              }

              @if (canWithdraw(wf)) {
                <p-button label="取下げ" [text]="true" (onClick)="onWithdraw()" data-testid="withdraw-btn" />
              }
              @if (canSubmit(wf)) {
                <p-button label="再申請する" icon="pi pi-refresh" (onClick)="onSubmit()" data-testid="submit-btn" />
              }
              @if (canEdit(wf)) {
                <p-button label="編集" icon="pi pi-pen-to-square" [text]="true" class="ml-auto"
                    [routerLink]="['/workflows', wf.id, 'edit']" data-testid="edit-btn" />
              }
            </div>

            <!-- Reject dialog input -->
            @if (showRejectInput) {
              <p-card data-testid="reject-reason-card">
                <h2 class="text-base font-bold m-0 mb-3">差戻し理由の入力</h2>
                <textarea pTextarea class="w-full"
                     [(ngModel)]="rejectReason"
                     rows="4"
                     placeholder="必須：具体的な理由を記載してください"
                     maxlength="500"
                     data-testid="reject-reason-input"></textarea>
                <div class="flex justify-end gap-3 mt-4">
                  <p-button label="キャンセル" [text]="true" severity="secondary" (onClick)="showRejectInput = false" />
                  <p-button label="確定して差戻す" severity="danger"
                      (onClick)="confirmReject()" [disabled]="!rejectReason.trim()" data-testid="confirm-reject-btn" />
                </div>
              </p-card>
            }
          </div>

          <!-- Right Column: Approval Flow -->
          <div class="lg:col-span-1 space-y-6">
            <p-card styleClass="sticky top-24">
              <h2 class="text-base font-bold m-0 mb-4">承認フロー</h2>

              <p-timeline [value]="getApprovalSteps(wf)">
                <ng-template #marker let-step>
                  <span class="flex w-8 h-8 items-center justify-center text-white rounded-full z-10 shadow-sm"
                      [style.background-color]="step.color">
                    <i [class]="step.icon"></i>
                  </span>
                </ng-template>
                <ng-template #content let-step>
                  <div class="py-1">
                    <p class="font-medium text-sm m-0">{{ step.label }}</p>
                    <p class="text-xs opacity-50 mb-1 mt-0.5">{{ step.user }}</p>
                    @if (step.tag) {
                      <p-tag [value]="step.tag" [severity]="step.tagSeverity" />
                    }
                    @if (step.date) {
                      <span class="text-xs px-2 py-0.5 rounded" style="background: var(--p-surface-ground);">
                        {{ step.date }} 完了
                      </span>
                    }
                  </div>
                </ng-template>
              </p-timeline>
            </p-card>
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

  getSeverity(status: string): 'success' | 'danger' | 'warn' | 'secondary' | 'info' | 'contrast' | undefined {
    switch (status) {
      case 'approved': return 'success';
      case 'rejected': return 'danger';
      case 'submitted': return 'warn';
      case 'draft': return 'secondary';
      case 'withdrawn': return 'contrast';
      default: return 'secondary';
    }
  }

  getApprovalSteps(wf: any): any[] {
    const steps: any[] = [];
    // Step 1: 申請
    if (wf.status !== 'draft') {
      steps.push({
        label: '申請',
        user: wf.creator?.profile?.displayName ?? '-',
        icon: 'pi pi-send',
        color: 'var(--p-primary-color)',
        date: new Date(wf.createdAt).toLocaleDateString('ja-JP', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }),
        tag: null,
        tagSeverity: null,
      });
    } else {
      steps.push({
        label: '申請',
        user: wf.creator?.profile?.displayName ?? '-',
        icon: 'pi pi-send',
        color: 'var(--p-surface-400)',
        date: null,
        tag: '下書き',
        tagSeverity: 'secondary',
      });
    }
    // Step 2: 決済
    let step2Color = 'var(--p-surface-400)';
    let step2Tag: string | null = null;
    let step2Severity: string | null = null;
    if (wf.status === 'approved') {
      step2Color = 'var(--p-primary-color)';
      step2Tag = '承認済み';
      step2Severity = 'success';
    } else if (wf.status === 'rejected') {
      step2Color = 'var(--p-red-500)';
      step2Tag = '差戻し';
      step2Severity = 'danger';
    } else if (wf.status === 'submitted') {
      step2Color = 'var(--p-yellow-500)';
      step2Tag = '確認待ち';
      step2Severity = 'warn';
    } else if (wf.status === 'withdrawn') {
      step2Color = 'var(--p-surface-400)';
      step2Tag = '取下げ済';
      step2Severity = 'secondary';
    }
    steps.push({
      label: '決済',
      user: wf.approver?.profile?.displayName ?? '未設定',
      icon: 'pi pi-check-circle',
      color: step2Color,
      date: null,
      tag: step2Tag,
      tagSeverity: step2Severity,
    });

    return steps;
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
