import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { NzMessageService } from 'ng-zorro-antd/message';
import { WorkflowService, Workflow } from './workflow.service';
import { WORKFLOW_STATUS_LABELS } from '@shared/types';

@Component({
    selector: 'app-workflow-pending',
    standalone: true,
    imports: [
        CommonModule,
        NzTableModule, NzButtonModule, NzIconModule, NzTagModule,
        NzSpinModule, NzPopconfirmModule, NzTooltipModule,
    ],
    template: `
        <div class="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
            <h1 class="text-2xl font-bold text-gray-900 m-0">承認待ち一覧</h1>

            @if (workflowService.isLoading()) {
                <div class="flex justify-center py-20" data-testid="loading">
                    <nz-spin nzSimple [nzSize]="'large'"></nz-spin>
                </div>
            } @else {
                <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    @if (workflowService.pendingWorkflows().length === 0) {
                        <div class="flex flex-col items-center justify-center py-20 text-gray-400" data-testid="empty-state">
                            <span nz-icon nzType="check-circle" nzTheme="outline" class="text-5xl mb-4 text-green-500 opacity-80"></span>
                            <p class="text-base text-gray-500 font-medium">承認待ちの申請はありません</p>
                            <p class="text-sm text-gray-400 mt-1">すべての申請の確認が完了しています</p>
                        </div>
                    } @else {
                        <nz-table #pendingTable
                                  [nzData]="workflowService.pendingWorkflows()"
                                  [nzFrontPagination]="false"
                                  nzSize="middle"
                                  [nzShowPagination]="false"
                                  [nzScroll]="{ x: '700px' }"
                                  data-testid="pending-table">
                            <thead>
                                <tr>
                                    <th nzWidth="130px" class="whitespace-nowrap">申請番号</th>
                                    <th nzWidth="200px">タイトル</th>
                                    <th nzWidth="150px">申請者</th>
                                    <th nzWidth="150px">申請日</th>
                                    <th nzWidth="120px" nzRight class="text-right">操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                @for (row of pendingTable.data; track row.id) {
                                    <tr class="hover:bg-blue-50/30 transition-colors"
                                        data-testid="pending-row">
                                        <td class="font-medium text-gray-900">{{ row.workflowNumber }}</td>
                                        <td class="text-gray-900 font-medium">{{ row.title }}</td>
                                        <td>
                                            <div class="flex items-center text-gray-700">
                                                <div class="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold mr-2 uppercase">
                                                    {{ (row.creator?.profile?.displayName ?? 'U').charAt(0) }}
                                                </div>
                                                {{ row.creator?.profile?.displayName ?? '-' }}
                                            </div>
                                        </td>
                                        <td class="text-gray-500 whitespace-nowrap">{{ row.createdAt | date:'yyyy/MM/dd HH:mm' }}</td>
                                        <td nzRight class="text-right">
                                            <div class="flex justify-end gap-2">
                                                <button nz-button
                                                        nzType="primary"
                                                        nzSize="small"
                                                        nz-popconfirm
                                                        nzPopconfirmTitle="この申請を承認しますか？"
                                                        nzOkText="承認"
                                                        nzCancelText="キャンセル"
                                                        (nzOnConfirm)="onApproveConfirm(row)"
                                                        (click)="$event.stopPropagation()"
                                                        nz-tooltip nzTooltipTitle="承認"
                                                        data-testid="approve-btn">
                                                    <span nz-icon nzType="check" nzTheme="outline"></span>
                                                </button>
                                                <button nz-button
                                                        nzSize="small"
                                                        (click)="onView(row)"
                                                        nz-tooltip nzTooltipTitle="詳細を見る"
                                                        data-testid="view-btn">
                                                    <span nz-icon nzType="right" nzTheme="outline"></span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                }
                            </tbody>
                        </nz-table>
                    }
                </div>
            }
        </div>
    `,
    styles: [],
})
export class WorkflowPendingComponent implements OnInit {
    workflowService = inject(WorkflowService);
    private router = inject(Router);
    private message = inject(NzMessageService);

    displayedColumns = ['workflowNumber', 'title', 'creator', 'createdAt', 'actions'];

    ngOnInit(): void {
        this.workflowService.loadPending();
    }

    onApproveConfirm(wf: Workflow): void {
        this.workflowService.approve(wf.id).subscribe({
            next: () => {
                this.message.success('承認しました');
                this.workflowService.loadPending();
            },
        });
    }

    onView(wf: Workflow): void {
        this.router.navigate(['/workflows', wf.id]);
    }
}
