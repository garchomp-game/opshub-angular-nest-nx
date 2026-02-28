import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { AvatarModule } from 'primeng/avatar';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { WorkflowService, Workflow } from './workflow.service';
import { WORKFLOW_STATUS_LABELS } from '@shared/types';
import { ModalService } from '../../shared/ui/modal/modal.service';
import { ConfirmDialogComponent } from '../../shared/ui/modal/confirm-dialog.component';
import { ToastService } from '../../shared/ui/toast/toast.service';

@Component({
  selector: 'app-workflow-pending',
  standalone: true,
  imports: [
    CommonModule,
    TableModule, ButtonModule, AvatarModule, ProgressSpinnerModule,
  ],
  template: `
    <div class="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <h1 class="text-2xl font-bold m-0">承認待ち一覧</h1>

      @if (workflowService.isLoading()) {
        <div class="flex justify-center py-20" data-testid="loading">
          <p-progressSpinner />
        </div>
      } @else {
        @if (workflowService.pendingWorkflows().length === 0) {
          <div class="flex flex-col items-center justify-center py-20 opacity-40" data-testid="empty-state">
            <i class="pi pi-check-circle text-5xl mb-4 opacity-80" style="color: var(--p-green-500);"></i>
            <p class="text-base font-medium">承認待ちの申請はありません</p>
            <p class="text-sm opacity-60 mt-1">すべての申請の確認が完了しています</p>
          </div>
        } @else {
          <p-table [value]="workflowService.pendingWorkflows()" [tableStyle]="{ 'min-width': '50rem' }"
              [stripedRows]="true" [rowHover]="true"
              data-testid="pending-table">
            <ng-template #header>
              <tr>
                <th class="whitespace-nowrap">申請番号</th>
                <th>タイトル</th>
                <th>申請者</th>
                <th>申請日</th>
                <th class="text-right">操作</th>
              </tr>
            </ng-template>
            <ng-template #body let-row>
              <tr data-testid="pending-row">
                <td class="font-medium">{{ row.workflowNumber }}</td>
                <td class="font-medium">{{ row.title }}</td>
                <td>
                  <div class="flex items-center gap-2">
                    <p-avatar [label]="(row.creator?.profile?.displayName ?? 'U').charAt(0)"
                        shape="circle" size="normal"
                        styleClass="bg-primary/10 text-primary text-xs font-bold uppercase" />
                    <span class="opacity-80">{{ row.creator?.profile?.displayName ?? '-' }}</span>
                  </div>
                </td>
                <td class="whitespace-nowrap opacity-60">{{ row.createdAt | date:'yyyy/MM/dd HH:mm' }}</td>
                <td class="text-right">
                  <div class="flex justify-end gap-2">
                    <p-button icon="pi pi-check" [rounded]="true" size="small"
                        (onClick)="onApproveClick(row); $event.stopPropagation()"
                        data-testid="approve-btn" />
                    <p-button icon="pi pi-eye" [rounded]="true" [text]="true" size="small"
                        (onClick)="onView(row)"
                        data-testid="view-btn" />
                  </div>
                </td>
              </tr>
            </ng-template>
          </p-table>
        }
      }
    </div>
  `,
  styles: [],
})
export class WorkflowPendingComponent implements OnInit {
  workflowService = inject(WorkflowService);
  private router = inject(Router);
  private modalService = inject(ModalService);
  private toast = inject(ToastService);

  displayedColumns = ['workflowNumber', 'title', 'creator', 'createdAt', 'actions'];

  ngOnInit(): void {
    this.workflowService.loadPending();
  }

  onApproveClick(wf: Workflow): void {
    const ref = this.modalService.open(ConfirmDialogComponent, {
      data: { title: '承認確認', message: 'この申請を承認しますか？', confirmText: '承認' },
    });
    ref.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.onApproveConfirm(wf);
      }
    });
  }

  onApproveConfirm(wf: Workflow): void {
    this.workflowService.approve(wf.id).subscribe({
      next: () => {
        this.toast.success('承認しました');
        this.workflowService.loadPending();
      },
    });
  }

  onView(wf: Workflow): void {
    this.router.navigate(['/workflows', wf.id]);
  }
}
