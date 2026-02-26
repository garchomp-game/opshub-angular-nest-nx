import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import {
    TaskStatus, TASK_STATUS_LABELS, TASK_TRANSITIONS, canTransition,
} from '@shared/types';
import { TaskService } from './task.service';

@Component({
    selector: 'app-kanban-board',
    standalone: true,
    imports: [
        RouterLink, DragDropModule, DatePipe,
        MatButtonModule, MatIconModule, MatChipsModule,
        MatProgressSpinnerModule, MatSnackBarModule,
    ],
    template: `
        <div class="kanban-container">
            <div class="header">
                <a mat-button [routerLink]="['/projects', projectId]" data-testid="back-btn">
                    <mat-icon>arrow_back</mat-icon> プロジェクト詳細
                </a>
                <h1>タスクボード</h1>
            </div>

            @if (taskService.loading()) {
                <div class="loading" data-testid="loading">
                    <mat-progress-spinner mode="indeterminate" diameter="48" />
                </div>
            } @else {
                <div class="board" data-testid="kanban-board">
                    @for (column of columns; track column.status) {
                        <div class="column">
                            <h3 class="column-header" [class]="'header-' + column.status">
                                {{ column.label }}
                                <span class="count">{{ getTasksByStatus(column.status).length }}</span>
                            </h3>
                            <div class="card-list"
                                 cdkDropList
                                 [cdkDropListData]="column.status"
                                 [id]="column.status"
                                 [cdkDropListConnectedTo]="columnIds"
                                 (cdkDropListDropped)="onDrop($event)"
                                 [attr.data-testid]="'column-' + column.status">
                                @for (task of getTasksByStatus(column.status); track task.id) {
                                    <div class="task-card" cdkDrag
                                         [cdkDragData]="task"
                                         data-testid="task-card">
                                        <div class="card-header">
                                            <span class="task-title">{{ task.title }}</span>
                                        </div>
                                        @if (task.assignee) {
                                            <div class="card-footer">
                                                <mat-icon class="avatar-icon">person</mat-icon>
                                                <span class="assignee">
                                                    {{ task.assignee?.profile?.displayName || '—' }}
                                                </span>
                                            </div>
                                        }
                                        @if (task.dueDate) {
                                            <div class="due-date">
                                                <mat-icon class="small-icon">event</mat-icon>
                                                {{ task.dueDate | date:'MM/dd' }}
                                            </div>
                                        }
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
        .kanban-container { padding: 24px; }
        .header { margin-bottom: 24px; }
        .header h1 { margin: 8px 0; }
        .loading {
            display: flex; align-items: center; justify-content: center; padding: 64px 0;
        }
        .board {
            display: flex; gap: 16px; overflow-x: auto; min-height: 400px;
        }
        .column {
            flex: 1; min-width: 280px; background: #f5f5f5;
            border-radius: 8px; display: flex; flex-direction: column;
        }
        .column-header {
            padding: 12px 16px; margin: 0; font-size: 14px;
            font-weight: 600; border-radius: 8px 8px 0 0;
            display: flex; justify-content: space-between; align-items: center;
        }
        .header-todo { background: #e0e0e0; }
        .header-in_progress { background: #fff3e0; color: #e65100; }
        .header-done { background: #e8f5e9; color: #2e7d32; }
        .count {
            background: rgba(0,0,0,.1); padding: 2px 8px;
            border-radius: 12px; font-size: 12px;
        }
        .card-list {
            flex: 1; padding: 8px; min-height: 100px;
        }
        .task-card {
            background: white; border-radius: 8px; padding: 12px;
            margin-bottom: 8px; box-shadow: 0 1px 3px rgba(0,0,0,.12);
            cursor: grab; transition: box-shadow 0.2s;
        }
        .task-card:hover { box-shadow: 0 4px 8px rgba(0,0,0,.16); }
        .task-title { font-weight: 500; }
        .card-footer {
            display: flex; align-items: center; gap: 4px;
            margin-top: 8px; font-size: 12px; color: #666;
        }
        .avatar-icon, .small-icon { font-size: 16px; width: 16px; height: 16px; }
        .due-date {
            display: flex; align-items: center; gap: 4px;
            margin-top: 4px; font-size: 12px; color: #999;
        }
        .cdk-drag-preview {
            box-shadow: 0 8px 24px rgba(0,0,0,.2); border-radius: 8px;
        }
        .cdk-drag-placeholder {
            opacity: 0.3;
        }
        .cdk-drag-animating {
            transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
        }
        .card-list.cdk-drop-list-dragging .task-card:not(.cdk-drag-placeholder) {
            transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
        }
    `],
})
export class KanbanBoardComponent implements OnInit {
    taskService = inject(TaskService);
    private route = inject(ActivatedRoute);
    private snackBar = inject(MatSnackBar);

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

    onDrop(event: CdkDragDrop<TaskStatus>) {
        if (event.previousContainer === event.container) return;

        const task = event.item.data;
        const fromStatus = event.previousContainer.data as TaskStatus;
        const toStatus = event.container.data as TaskStatus;

        // TASK_TRANSITIONS による遷移バリデーション
        if (!canTransition(TASK_TRANSITIONS, fromStatus, toStatus)) {
            this.snackBar.open(
                `${TASK_STATUS_LABELS[fromStatus]} から ${TASK_STATUS_LABELS[toStatus]} には移動できません`,
                '閉じる',
                { duration: 3000 },
            );
            return;
        }

        // API 呼び出し
        this.taskService.changeStatus(task.id, toStatus).subscribe({
            error: () => {
                this.snackBar.open('ステータス変更に失敗しました', '閉じる', { duration: 3000 });
                // リロードで元に戻す
                this.taskService.loadByProject(this.projectId);
            },
        });
    }
}
