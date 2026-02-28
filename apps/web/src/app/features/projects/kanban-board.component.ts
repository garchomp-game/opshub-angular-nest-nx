import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe, NgClass } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { CardModule } from 'primeng/card';
import { AvatarModule } from 'primeng/avatar';
import { TooltipModule } from 'primeng/tooltip';
import { ButtonModule } from 'primeng/button';
import {
  TaskStatus, TASK_STATUS_LABELS, TASK_TRANSITIONS, canTransition,
} from '@shared/types';
import { ToastService } from '../../shared/ui';
import { TaskService } from './task.service';

@Component({
  selector: 'app-kanban-board',
  standalone: true,
  imports: [
    RouterLink, DragDropModule, DatePipe, NgClass,
    CardModule, AvatarModule, TooltipModule, ButtonModule,
  ],
  template: `
    <div class="p-4 lg:p-6 max-w-[1600px] mx-auto space-y-6 flex flex-col h-[calc(100vh-64px)]">
      <div class="flex items-center gap-3 shrink-0">
        <p-button icon="pi pi-arrow-left" [rounded]="true" [text]="true"
            [routerLink]="['/projects', projectId]" data-testid="back-btn" />
        <h1 class="text-2xl font-bold m-0">タスクボード</h1>
      </div>

      @if (taskService.loading()) {
        <div class="flex justify-center items-center flex-1" data-testid="loading">
          <i class="pi pi-spin pi-spinner" style="font-size: 2rem;"></i>
        </div>
      } @else {
        <div class="flex gap-6 overflow-x-auto overflow-y-hidden pb-4 flex-1 items-start" data-testid="kanban-board">
          @for (column of columns; track column.status) {
            <div class="w-80 min-w-[320px] bg-surface-100 rounded-xl border border-surface-200 flex flex-col max-h-full shrink-0">
              <div class="px-4 py-3 flex items-center justify-between border-b border-surface-200 rounded-t-xl shrink-0"
                 [ngClass]="getColumnHeaderClass(column.status)">
                <h3 class="font-bold text-sm tracking-wide m-0">{{ column.label }}</h3>
                <span class="bg-black/10 px-2 py-0.5 rounded-full text-xs font-bold font-mono">
                  {{ getTasksByStatus(column.status).length }}
                </span>
              </div>

              <div class="p-3 flex-1 overflow-y-auto min-h-[150px]"
                 cdkDropList
                 [cdkDropListData]="column.status"
                 [id]="column.status"
                 [cdkDropListConnectedTo]="columnIds"
                 (cdkDropListDropped)="onDrop($event)"
                 [attr.data-testid]="'column-' + column.status">
                @for (task of getTasksByStatus(column.status); track task.id) {
                  <div class="bg-white shadow-sm rounded-lg mb-3 cursor-grab hover:shadow-md hover:border-primary/30 transition-all group border border-surface-200 p-3.5"
                     cdkDrag [cdkDragData]="task" data-testid="task-card">
                    <div class="font-medium leading-snug group-hover:text-primary transition-colors">
                      {{ task.title }}
                    </div>

                    <div class="flex items-center justify-between mt-3 text-xs text-surface-400 font-medium">
                      @if (task.assignee) {
                        <div class="flex items-center gap-1.5"
                            pTooltip="担当者: {{ task.assignee.profile?.displayName || '未設定' }}">
                          <p-avatar [label]="(task.assignee.profile?.displayName ?? 'U').charAt(0)"
                              shape="circle" size="small"
                              [style]="{'background-color': 'var(--p-primary-100)', 'color': 'var(--p-primary-700)', 'width': '1.25rem', 'height': '1.25rem', 'font-size': '0.625rem'}" />
                          <span class="truncate max-w-[100px]">{{ task.assignee.profile?.displayName || '—' }}</span>
                        </div>
                      } @else {
                        <div class="flex items-center gap-1 text-surface-300">
                          <i class="pi pi-user" style="font-size: 0.875rem;"></i>
                          <span>未設定</span>
                        </div>
                      }

                      @if (task.dueDate) {
                        <div class="flex items-center gap-1 shrink-0"
                           [ngClass]="{'text-red-500 font-bold': isOverdue(task.dueDate)}">
                          <i [class]="isOverdue(task.dueDate) ? 'pi pi-exclamation-triangle' : 'pi pi-calendar'"
                             style="font-size: 0.875rem;"></i>
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
      border: 1px solid var(--p-primary-color);
    }
    .cdk-drag-placeholder {
      opacity: 0.2;
      border: 2px dashed rgba(0,0,0,0.15);
      background: rgba(0,0,0,0.05);
    }
    .cdk-drag-animating {
      transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
    }
    .cdk-drop-list-dragging div:not(.cdk-drag-placeholder) {
      transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
    }
  `],
})
export class KanbanBoardComponent implements OnInit {
  taskService = inject(TaskService);
  private route = inject(ActivatedRoute);
  private toast = inject(ToastService);

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
      case TaskStatus.TODO: return 'bg-surface-200';
      case TaskStatus.IN_PROGRESS: return 'bg-yellow-100';
      case TaskStatus.DONE: return 'bg-green-100';
      default: return 'bg-surface-200';
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
      this.toast.error(
        `${TASK_STATUS_LABELS[fromStatus]} から ${TASK_STATUS_LABELS[toStatus]} には移動できません`,
      );
      return;
    }

    // API 呼び出し
    this.taskService.changeStatus(task.id, toStatus).subscribe({
      error: () => {
        this.toast.error('ステータス変更に失敗しました');
        // リロードで元に戻す
        this.taskService.loadByProject(this.projectId);
      },
    });
  }
}
