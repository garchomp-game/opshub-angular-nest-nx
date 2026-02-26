import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NzTableModule, NzTableQueryParams } from 'ng-zorro-antd/table';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import {
    WorkflowService, Workflow,
} from './workflow.service';
import {
    WORKFLOW_STATUS_LABELS, WORKFLOW_STATUS_COLORS,
} from '@shared/types';

@Component({
    selector: 'app-workflow-list',
    standalone: true,
    imports: [
        CommonModule, RouterLink, FormsModule,
        NzTableModule, NzSelectModule, NzButtonModule,
        NzIconModule, NzTagModule, NzSpinModule,
    ],
    template: `
        <div class="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h1 class="text-2xl font-bold text-gray-900 m-0">申請一覧</h1>
                <a nz-button nzType="primary" routerLink="new" data-testid="create-workflow-btn">
                    <span nz-icon nzType="plus" nzTheme="outline"></span>
                    新規申請
                </a>
            </div>

            <!-- Filters -->
            <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6" data-testid="workflow-filters">
                <div class="flex flex-col sm:flex-row gap-4 items-end">
                    <div class="w-full sm:w-64">
                        <label class="block text-sm font-medium text-gray-700 mb-1.5">ステータス</label>
                        <nz-select [(ngModel)]="statusFilter"
                                   (ngModelChange)="onFilterChange()"
                                   nzPlaceHolder="すべて"
                                   nzAllowClear
                                   class="w-full"
                                   data-testid="status-filter">
                            <nz-option nzValue="draft" nzLabel="下書き"></nz-option>
                            <nz-option nzValue="submitted" nzLabel="申請中"></nz-option>
                            <nz-option nzValue="approved" nzLabel="承認済"></nz-option>
                            <nz-option nzValue="rejected" nzLabel="差戻し"></nz-option>
                            <nz-option nzValue="withdrawn" nzLabel="取下げ"></nz-option>
                        </nz-select>
                    </div>

                    <div class="w-full sm:w-64">
                        <label class="block text-sm font-medium text-gray-700 mb-1.5">種別</label>
                        <nz-select [(ngModel)]="typeFilter"
                                   (ngModelChange)="onFilterChange()"
                                   nzPlaceHolder="すべて"
                                   nzAllowClear
                                   class="w-full"
                                   data-testid="type-filter">
                            <nz-option nzValue="expense" nzLabel="経費"></nz-option>
                            <nz-option nzValue="leave" nzLabel="休暇"></nz-option>
                            <nz-option nzValue="purchase" nzLabel="購買"></nz-option>
                            <nz-option nzValue="other" nzLabel="その他"></nz-option>
                        </nz-select>
                    </div>
                </div>
            </div>

            <!-- Loading -->
            @if (workflowService.isLoading()) {
                <div class="flex justify-center py-20" data-testid="loading">
                    <nz-spin nzSimple [nzSize]="'large'"></nz-spin>
                </div>
            } @else {
                <!-- Table -->
                <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    @if (workflowService.workflows().length === 0) {
                        <div class="flex flex-col items-center justify-center py-20 text-gray-400" data-testid="empty-state">
                            <span nz-icon nzType="inbox" nzTheme="outline" class="text-5xl mb-4 opacity-50"></span>
                            <p class="text-base text-gray-500 font-medium">申請がありません</p>
                        </div>
                    } @else {
                        <nz-table #workflowTable
                                  [nzData]="workflowService.workflows()"
                                  [nzFrontPagination]="false"
                                  [nzTotal]="workflowService.totalCount()"
                                  [nzPageSize]="pageSize"
                                  [nzPageIndex]="pageIndex"
                                  (nzPageIndexChange)="onPageIndexChange($event)"
                                  (nzPageSizeChange)="onPageSizeChange($event)"
                                  [nzPageSizeOptions]="[10, 20, 50]"
                                  nzShowSizeChanger
                                  nzSize="middle"
                                  [nzScroll]="{ x: '800px' }"
                                  data-testid="workflow-table">
                            <thead>
                                <tr>
                                    <th nzWidth="130px" class="whitespace-nowrap">申請番号</th>
                                    <th nzWidth="100px">種別</th>
                                    <th nzWidth="200px">タイトル</th>
                                    <th nzWidth="120px">ステータス</th>
                                    <th nzWidth="120px">申請日</th>
                                    <th nzWidth="150px">申請者</th>
                                </tr>
                            </thead>
                            <tbody>
                                @for (row of workflowTable.data; track row.id) {
                                    <tr (click)="onRowClick(row)"
                                        class="cursor-pointer hover:bg-blue-50/40 transition-colors"
                                        data-testid="workflow-row">
                                        <td class="font-medium text-gray-900">{{ row.workflowNumber }}</td>
                                        <td>
                                            <nz-tag>{{ getTypeLabel(row.type) }}</nz-tag>
                                        </td>
                                        <td class="text-gray-900">{{ row.title }}</td>
                                        <td>
                                            <nz-tag [nzColor]="getTagColor(row.status)">
                                                @if (row.status === 'approved') {
                                                    <span nz-icon nzType="check-circle" nzTheme="outline" class="mr-1"></span>
                                                } @else if (row.status === 'rejected') {
                                                    <span nz-icon nzType="close-circle" nzTheme="outline" class="mr-1"></span>
                                                } @else if (row.status === 'submitted') {
                                                    <span nz-icon nzType="clock-circle" nzTheme="outline" class="mr-1"></span>
                                                }
                                                {{ getStatusLabel(row.status) }}
                                            </nz-tag>
                                        </td>
                                        <td class="text-gray-500 whitespace-nowrap">{{ row.createdAt | date:'yyyy/MM/dd' }}</td>
                                        <td>
                                            <div class="flex items-center text-gray-700">
                                                <div class="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold mr-2 uppercase">
                                                    {{ (row.creator?.profile?.displayName ?? 'U').charAt(0) }}
                                                </div>
                                                {{ row.creator?.profile?.displayName ?? '-' }}
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
export class WorkflowListComponent implements OnInit {
    workflowService = inject(WorkflowService);
    private router = inject(Router);

    statusFilter: string | null = null;
    typeFilter: string | null = null;
    pageSize = 20;
    pageIndex = 1;

    private readonly typeLabels: Record<string, string> = {
        expense: '経費', leave: '休暇', purchase: '購買', other: 'その他',
    };

    ngOnInit(): void {
        this.loadData();
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

    onFilterChange(): void {
        this.pageIndex = 1;
        this.loadData();
    }

    onPageIndexChange(pageIndex: number): void {
        this.pageIndex = pageIndex;
        this.workflowService.loadAll({
            status: this.statusFilter || undefined,
            type: this.typeFilter || undefined,
            page: pageIndex,
            limit: this.pageSize,
        });
    }

    onPageSizeChange(pageSize: number): void {
        this.pageSize = pageSize;
        this.pageIndex = 1;
        this.workflowService.loadAll({
            status: this.statusFilter || undefined,
            type: this.typeFilter || undefined,
            page: 1,
            limit: pageSize,
        });
    }

    onRowClick(workflow: Workflow): void {
        this.router.navigate(['/workflows', workflow.id]);
    }

    private loadData(): void {
        this.workflowService.loadAll({
            status: this.statusFilter || undefined,
            type: this.typeFilter || undefined,
        });
    }
}
