import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe, NgClass } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzMessageService } from 'ng-zorro-antd/message';
import {
    TaskStatus, TASK_STATUS_LABELS, TASK_TRANSITIONS, canTransition,
} from '@shared/types';
import { TaskService } from './task.service';

@Component({
    selector: 'app-kanban-board',
    standalone: true,
    imports: [
        RouterLink, DragDropModule, DatePipe, NgClass,
        NzCardModule, NzButtonModule, NzIconModule,
        NzSpinModule, NzTooltipModule, NzAvatarModule,
    ],
    template: `
        <div class="p-4 lg:p-6 max-w-[1600px] mx-auto space-y-6 flex flex-col h-[calc(100vh-64px)]">
            <div class="flex items-center gap-3 shrink-0">
                <button nz-button nzType="default" nzShape="circle"
                        [routerLink]="['/projects', projectId]" data-testid="back-btn">
                    <span nz-icon nzType="arrow-left" nzTheme="outline"></span>
                </button>
                <h1 class="text-2xl font-bold text-gray-900 m-0">タスクボード</h1>
            </div>

            @if (taskService.loading()) {
                <div class="flex justify-center items-center flex-1" data-testid="loading">
                    <nz-spin nzSimple [nzSize]="'large'"></nz-spin>
                </div>
            } @else {
                <div class="flex gap-6 overflow-x-auto overflow-y-hidden pb-4 flex-1 items-start" data-testid="kanban-board">
                    @for (column of columns; track column.status) {
                        <div class="w-80 min-w-[320px] bg-slate-50/80 rounded-xl border border-gray-200 flex flex-col max-h-full shrink-0">
                            <div class="px-4 py-3 flex items-center justify-between border-b border-gray-200 rounded-t-xl shrink-0"
                                 [ngClass]="getColumnHeaderClass(column.status)">
                                <h3 class="font-bold text-sm tracking-wide m-0">{{ column.label }}</h3>
                                <span class="bg-black/10 px-2 py-0.5 rounded-full text-xs font-bold font-mono">
                                    {{ getTasksByStatus(column.status).length }}
                                </span>
                            </div>

                            <div class="p-3 flex-1 overflow-y-auto min-h-[150px] scrollbar-thin hover:scrollbar-thumb-gray-300 scrollbar-track-transparent"
                                 cdkDropList
                                 [cdkDropListData]="column.status"
                                 [id]="column.status"
                                 [cdkDropListConnectedTo]="columnIds"
                                 (cdkDropListDropped)="onDrop($event)"
                                 [attr.data-testid]="'column-' + column.status">
                                @for (task of getTasksByStatus(column.status); track task.id) {
                                    <div class="bg-white rounded-lg p-3.5 mb-3 shadow-sm border border-gray-200 cursor-grab hover:shadow-md hover:border-blue-200 transition-all group"
                                         cdkDrag [cdkDragData]="task" data-testid="task-card">
                                        <div class="font-medium text-gray-900 mb-2 leading-snug group-hover:text-blue-700 transition-colors">
                                            {{ task.title }}
                                        </div>

                                        <div class="flex items-center justify-between mt-3 text-xs text-gray-500 font-medium">
                                            @if (task.assignee) {
                                                <div class="flex items-center gap-1.5"
                                                     nz-tooltip [nzTooltipTitle]="'担当者: ' + (task.assignee.profile?.displayName || '未設定')">
                                                    <nz-avatar [nzText]="(task.assignee.profile?.displayName ?? 'U').charAt(0)"
                                                               [nzSize]="20"
                                                               style="background-color: #e0e7ff; color: #4338ca; font-size: 10px;"></nz-avatar>
                                                    <span class="truncate max-w-[100px]">{{ task.assignee.profile?.displayName || '—' }}</span>
                                                </div>
                                            } @else {
                                                <div class="flex items-center gap-1 text-gray-400">
                                                    <span nz-icon nzType="user" nzTheme="outline" style="font-size: 14px;"></span>
                                                    <span>未設定</span>
                                                </div>
                                            }

                                            @if (task.dueDate) {
                                                <div class="flex items-center gap-1 shrink-0"
                                                     [ngClass]="{'text-red-500 font-bold': isOverdue(task.dueDate)}">
                                                    <span nz-icon
                                                          [nzType]="isOverdue(task.dueDate) ? 'warning' : 'calendar'"
                                                          nzTheme="outline"
                                                          style="font-size: 14px;"></span>
                                                    {{ task.dueDate | date:'MM/dd' }}
                                                </div>
                                            }
                                        </div>
                                    </div>
                                }
                            </div>
                        </div>
                    }
                </div>
            }
        </div>
    `,
    styles: [`
        .cdk-drag-preview {
            box-shadow: 0 10px 25px -5px rgba(0,0,0,.1), 0 8px 10px -6px rgba(0,0,0,.1);
            border-radius: 0.5rem;
            cursor: grabbing !important;
            border: 1px solid #1890ff;
        }
        .cdk-drag-placeholder {
            opacity: 0.2;
            border: 2px dashed #9ca3af;
            background: rgba(0,0,0,0.05);
        }
        .cdk-drag-animating {
            transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
        }
        .cdk-drop-list-dragging .bg-white:not(.cdk-drag-placeholder) {
            transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
        }
    `],
})
export class KanbanBoardComponent implements OnInit {
    taskService = inject(TaskService);
    private route = inject(ActivatedRoute);
    private message = inject(NzMessageService);

    projectId = '';

    columns = [
        { status: TaskStatus.TODO, label: TASK_STATUS_LABELS[TaskStatus.TODO] },
        { status: TaskStatus.IN_PROGRESS, label: TASK_STATUS_LABELS[TaskStatus.IN_PROGRESS] },
        { status: TaskStatus.DONE, label: TASK_STATUS_LABELS[TaskStatus.DONE] },
    ];

    columnIds = [TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.DONE];

    ngOnInit() {
        this.projectId = this.route.snapshot.paramMap.get('id')!;
        this.taskService.loadByProject(this.projectId);
    }

    getTasksByStatus(status: string): any[] {
        return this.taskService.tasks().filter((t) => t.status === status);
    }

    getColumnHeaderClass(status: string): string {
        switch (status) {
            case TaskStatus.TODO: return 'bg-gray-200 text-gray-800';
            case TaskStatus.IN_PROGRESS: return 'bg-amber-100 text-amber-800';
            case TaskStatus.DONE: return 'bg-green-100 text-green-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    }

    isOverdue(dueDateStr: string): boolean {
        const dueDate = new Date(dueDateStr);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return dueDate < today;
    }

    onDrop(event: CdkDragDrop<TaskStatus>) {
        if (event.previousContainer === event.container) return;

        const task = event.item.data;
        const fromStatus = event.previousContainer.data as TaskStatus;
        const toStatus = event.container.data as TaskStatus;

        // TASK_TRANSITIONS による遷移バリデーション
        if (!canTransition(TASK_TRANSITIONS, fromStatus, toStatus)) {
            this.message.error(
                `${TASK_STATUS_LABELS[fromStatus]} から ${TASK_STATUS_LABELS[toStatus]} には移動できません`,
            );
            return;
        }

        // API 呼び出し
        this.taskService.changeStatus(task.id, toStatus).subscribe({
            error: () => {
                this.message.error('ステータス変更に失敗しました');
                // リロードで元に戻す
                this.taskService.loadByProject(this.projectId);
            },
        });
    }
}
