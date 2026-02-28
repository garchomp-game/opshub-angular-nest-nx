import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { heroCheck, heroEye, heroCheckCircle } from '@ng-icons/heroicons/outline';
import { WorkflowService, Workflow } from './workflow.service';
import { WORKFLOW_STATUS_LABELS } from '@shared/types';
import { ModalService } from '../../shared/ui/modal/modal.service';
import { ConfirmDialogComponent } from '../../shared/ui/modal/confirm-dialog.component';
import { ToastService } from '../../shared/ui/toast/toast.service';

@Component({
  selector: 'app-workflow-pending',
  standalone: true,
  imports: [
    CommonModule, NgIcon,
  ],
  viewProviders: [provideIcons({ heroCheck, heroEye, heroCheckCircle })],
  template: `
    <div class="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <h1 class="text-2xl font-bold text-base-content m-0">承認待ち一覧</h1>

      @if (workflowService.isLoading()) {
        <div class="flex justify-center py-20" data-testid="loading">
          <span class="loading loading-spinner loading-lg"></span>
        </div>
      } @else {
        <div class="card bg-base-100 shadow-sm">
          <div class="card-body p-0">
            @if (workflowService.pendingWorkflows().length === 0) {
              <div class="flex flex-col items-center justify-center py-20 text-base-content/40" data-testid="empty-state">
                <ng-icon name="heroCheckCircle" class="text-5xl mb-4 text-success opacity-80" />
                <p class="text-base text-base-content/50 font-medium">承認待ちの申請はありません</p>
                <p class="text-sm text-base-content/40 mt-1">すべての申請の確認が完了しています</p>
              </div>
            } @else {
              <div class="overflow-x-auto" data-testid="pending-table">
                <table class="table table-zebra">
                  <thead>
                    <tr>
                      <th class="whitespace-nowrap">申請番号</th>
                      <th>タイトル</th>
                      <th>申請者</th>
                      <th>申請日</th>
                      <th class="text-right">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (row of workflowService.pendingWorkflows(); track row.id) {
                      <tr class="hover:bg-base-200/50 transition-colors"
                        data-testid="pending-row">
                        <td class="font-medium">{{ row.workflowNumber }}</td>
                        <td class="font-medium">{{ row.title }}</td>
                        <td>
                          <div class="flex items-center text-base-content/80">
                            <div class="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold mr-2 uppercase">
                              {{ (row.creator?.profile?.displayName ?? 'U').charAt(0) }}
                            </div>
                            {{ row.creator?.profile?.displayName ?? '-' }}
                          </div>
                        </td>
                        <td class="text-base-content/60 whitespace-nowrap">{{ row.createdAt | date:'yyyy/MM/dd HH:mm' }}</td>
                        <td class="text-right">
                          <div class="flex justify-end gap-2">
                            <button class="btn btn-primary btn-sm"
                                (click)="onApproveClick(row); $event.stopPropagation()"
                                data-testid="approve-btn">
                              <ng-icon name="heroCheck" class="text-sm" />
                            </button>
                            <button class="btn btn-ghost btn-sm"
                                (click)="onView(row)"
                                data-testid="view-btn">
                              <ng-icon name="heroEye" class="text-sm" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }
          </div>
        </div>
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
