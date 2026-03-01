import { Component, OnInit, inject, signal } from '@angular/core';
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
import { FileUploadModule } from 'primeng/fileupload';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import { WorkflowService, Workflow, WorkflowAttachment } from './workflow.service';
import { AuthService } from '../../core/auth/auth.service';
import { WORKFLOW_STATUS_LABELS, WORKFLOW_STATUS_COLORS, ALLOWED_MIME_TYPES, MAX_FILE_SIZE_BYTES } from '@shared/types';
import { ConfirmationService } from 'primeng/api';
import { ToastService } from '../../shared/services/toast.service';

@Component({
  selector: 'app-workflow-detail',
  standalone: true,
  imports: [
    CommonModule, RouterLink, FormsModule,
    ButtonModule, CardModule, TagModule, TimelineModule,
    ProgressSpinnerModule, MessageModule, TextareaModule,
    FileUploadModule, TableModule, TooltipModule,
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

            <!-- Attachments Section -->
            <p-card data-testid="attachments-section">
              <div class="flex justify-between items-center mb-4">
                <span class="flex items-center gap-2 text-lg font-bold">
                  <i class="pi pi-paperclip text-primary text-lg"></i>
                  添付ファイル
                  @if (attachments().length > 0) {
                    <p-tag [value]="attachments().length + '件'" severity="info" [rounded]="true" />
                  }
                </span>
              </div>

              <!-- Upload Area -->
              <div class="mb-4 p-4 border-2 border-dashed rounded-xl text-center transition-colors"
                  style="border-color: var(--p-surface-border);"
                  (dragover)="onDragOver($event)"
                  (dragleave)="onDragLeave($event)"
                  (drop)="onDrop($event)"
                  [class.border-primary]="isDragging"
                  data-testid="upload-area">
                <i class="pi pi-cloud-upload text-4xl mb-3" [class.text-primary]="isDragging" style="opacity: 0.4;"></i>
                <p class="text-sm opacity-60 mb-3">ファイルをドラッグ&ドロップ、またはクリックしてアップロード</p>
                <p-button label="ファイルを選択" icon="pi pi-plus" [outlined]="true"
                    (onClick)="fileInput.click()" data-testid="select-file-btn" />
                <input #fileInput type="file" class="hidden"
                    [accept]="acceptTypes"
                    (change)="onFileSelected($event)"
                    data-testid="file-input" />
                <p class="text-xs opacity-40 mt-3">
                  対応形式: PDF, 画像, Word, Excel, CSV, テキスト ／ 最大 10MB
                </p>
              </div>

              @if (uploading()) {
                <div class="flex items-center gap-2 mb-4 text-sm opacity-60">
                  <p-progressSpinner [style]="{ width: '20px', height: '20px' }" strokeWidth="4" />
                  アップロード中...
                </div>
              }

              <!-- Attachment List -->
              @if (attachments().length > 0) {
                <p-table [value]="attachments()" [tableStyle]="{'min-width': '100%'}" data-testid="attachments-table">
                  <ng-template #header>
                    <tr>
                      <th>ファイル名</th>
                      <th style="width: 100px;">サイズ</th>
                      <th style="width: 160px;">アップロード日時</th>
                      <th style="width: 100px;">操作</th>
                    </tr>
                  </ng-template>
                  <ng-template #body let-att>
                    <tr>
                      <td>
                        <div class="flex items-center gap-2">
                          <i [class]="getFileIcon(att.contentType)" class="text-lg"></i>
                          <span class="font-medium text-sm truncate" style="max-width: 250px;">{{ att.fileName }}</span>
                        </div>
                      </td>
                      <td class="text-sm opacity-60">{{ formatFileSize(att.fileSize) }}</td>
                      <td class="text-sm opacity-60">{{ att.createdAt | date:'MM/dd HH:mm' }}</td>
                      <td>
                        <div class="flex gap-1">
                          <p-button icon="pi pi-download" [rounded]="true" [text]="true" severity="info"
                              pTooltip="ダウンロード" tooltipPosition="top"
                              (onClick)="onDownload(att)"
                              [attr.data-testid]="'download-btn-' + att.id" />
                          @if (canDeleteAttachment(att)) {
                            <p-button icon="pi pi-trash" [rounded]="true" [text]="true" severity="danger"
                                pTooltip="削除" tooltipPosition="top"
                                (onClick)="onDeleteAttachment(att)"
                                [attr.data-testid]="'delete-att-btn-' + att.id" />
                          }
                        </div>
                      </td>
                    </tr>
                  </ng-template>
                </p-table>
              } @else {
                <div class="text-center py-6 opacity-40 text-sm" data-testid="no-attachments">
                  <i class="pi pi-inbox text-3xl mb-2 block"></i>
                  添付ファイルはありません
                </div>
              }
            </p-card>
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
  private confirmationService = inject(ConfirmationService);
  private toast = inject(ToastService);

  showRejectInput = false;
  rejectReason = '';
  isDragging = false;

  attachments = signal<WorkflowAttachment[]>([]);
  uploading = signal(false);

  readonly acceptTypes = ALLOWED_MIME_TYPES.join(',');

  private readonly typeLabels: Record<string, string> = {
    expense: '経費', leave: '休暇', purchase: '購買', other: 'その他',
  };

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.workflowService.loadOne(id);
      this.loadAttachments(id);
    }
  }

  // ─── Attachment Methods ───

  private loadAttachments(workflowId: string): void {
    this.workflowService.getAttachments(workflowId).subscribe({
      next: (data) => this.attachments.set(Array.isArray(data) ? data : []),
      error: () => this.attachments.set([]),
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.uploadFile(input.files[0]);
      input.value = '';
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
    if (event.dataTransfer?.files.length) {
      this.uploadFile(event.dataTransfer.files[0]);
    }
  }

  private uploadFile(file: File): void {
    const wf = this.workflowService.currentWorkflow();
    if (!wf) return;

    if (file.size > MAX_FILE_SIZE_BYTES) {
      this.toast.error('ファイルサイズが10MBを超えています');
      return;
    }

    this.uploading.set(true);
    this.workflowService.uploadAttachment(wf.id, file).subscribe({
      next: () => {
        this.toast.success('アップロードしました');
        this.loadAttachments(wf.id);
        this.uploading.set(false);
      },
      error: () => {
        this.toast.error('アップロードに失敗しました');
        this.uploading.set(false);
      },
    });
  }

  onDownload(att: WorkflowAttachment): void {
    const wf = this.workflowService.currentWorkflow();
    if (!wf) return;
    this.workflowService.downloadAttachment(wf.id, att.id, att.fileName);
  }

  onDeleteAttachment(att: WorkflowAttachment): void {
    const wf = this.workflowService.currentWorkflow();
    if (!wf) return;

    this.confirmationService.confirm({
      header: '削除確認',
      message: `${att.fileName} を削除しますか？`,
      acceptLabel: '削除',
      rejectLabel: 'キャンセル',
      accept: () => {
        this.workflowService.deleteAttachment(wf.id, att.id).subscribe({
          next: () => {
            this.toast.success('削除しました');
            this.loadAttachments(wf.id);
          },
          error: () => this.toast.error('削除に失敗しました'),
        });
      },
    });
  }

  canDeleteAttachment(att: WorkflowAttachment): boolean {
    const user = this.auth.currentUser();
    return att.uploadedBy === user?.id || this.auth.isAdmin();
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  getFileIcon(contentType: string): string {
    if (contentType.startsWith('image/')) return 'pi pi-image';
    if (contentType === 'application/pdf') return 'pi pi-file-pdf';
    if (contentType.includes('spreadsheet') || contentType.includes('excel') || contentType === 'text/csv') return 'pi pi-file-excel';
    if (contentType.includes('word') || contentType.includes('document')) return 'pi pi-file-word';
    return 'pi pi-file';
  }

  // ─── Status & Type Helpers ───

  getStatusLabel(status: string): string {
    return (WORKFLOW_STATUS_LABELS as Record<string, string>)[status] ?? status;
  }

  getStatusColor(status: string): string {
    return (WORKFLOW_STATUS_COLORS as Record<string, string>)[status] ?? '';
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

  getApprovalSteps(wf: Workflow): { label: string; user: string; icon: string; color: string; date: string | null; tag: string | null; tagSeverity: string | null }[] {
    const steps: { label: string; user: string; icon: string; color: string; date: string | null; tag: string | null; tagSeverity: string | null }[] = [];
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

  // ─── Workflow Actions ───

  canApprove(wf: Workflow): boolean {
    return wf.status === 'submitted' && this.auth.canApprove();
  }

  canWithdraw(wf: Workflow): boolean {
    const user = this.auth.currentUser();
    return (wf.status === 'submitted' || wf.status === 'rejected') &&
      wf.createdBy === user?.id;
  }

  canSubmit(wf: Workflow): boolean {
    const user = this.auth.currentUser();
    return wf.status === 'rejected' && wf.createdBy === user?.id;
  }

  canEdit(wf: Workflow): boolean {
    const user = this.auth.currentUser();
    return wf.status === 'draft' && wf.createdBy === user?.id;
  }

  onApprove(): void {
    this.confirmationService.confirm({
      header: '承認確認',
      message: 'この申請を承認しますか？',
      acceptLabel: '承認',
      rejectLabel: 'キャンセル',
      accept: () => {
        const wf = this.workflowService.currentWorkflow();
        if (!wf) return;
        this.workflowService.approve(wf.id).subscribe({
          next: () => {
            this.toast.success('承認しました');
            this.router.navigate(['/workflows']);
          },
        });
      },
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
    this.confirmationService.confirm({
      header: '取下げ確認',
      message: 'この申請を取下げますか？',
      acceptLabel: '取下げ',
      rejectLabel: 'キャンセル',
      accept: () => {
        const wf = this.workflowService.currentWorkflow();
        if (!wf) return;
        this.workflowService.withdraw(wf.id).subscribe({
          next: () => {
            this.toast.success('取下げしました');
            this.router.navigate(['/workflows']);
          },
        });
      },
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
