import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import {
    PROJECT_STATUS_LABELS, TASK_STATUS_LABELS,
} from '@shared/types';
import { ProjectService } from './project.service';
import { TaskService } from './task.service';
import { AuthService } from '../../core/auth/auth.service';

@Component({
    selector: 'app-project-detail',
    standalone: true,
    imports: [
        RouterLink, DatePipe,
        MatTabsModule, MatButtonModule, MatIconModule, MatListModule,
        MatChipsModule, MatProgressSpinnerModule, MatDialogModule, MatSnackBarModule,
    ],
    template: `
        <div class="project-detail-container">
            @if (projectService.loading()) {
                <div class="loading" data-testid="loading">
                    <mat-progress-spinner mode="indeterminate" diameter="48" />
                </div>
            } @else if (projectService.currentProject(); as project) {
                <div class="header">
                    <div>
                        <a mat-button routerLink="/projects" data-testid="back-btn">
                            <mat-icon>arrow_back</mat-icon> 一覧に戻る
                        </a>
                        <h1>{{ project.name }}</h1>
                        <span class="status-chip" [class]="'status-' + project.status">
                            {{ statusLabels[project.status] || project.status }}
                        </span>
                    </div>
                    <div class="actions">
                        <a mat-raised-button color="primary"
                           [routerLink]="['/projects', project.id, 'tasks']"
                           data-testid="kanban-btn">
                            <mat-icon>view_kanban</mat-icon>
                            カンバン
                        </a>
                    </div>
                </div>

                <mat-tab-group data-testid="detail-tabs">
                    <!-- 概要タブ -->
                    <mat-tab label="概要">
                        <div class="tab-content">
                            <div class="info-grid">
                                <div class="info-item">
                                    <label>PM</label>
                                    <span>{{ project.pm?.profile?.displayName || '—' }}</span>
                                </div>
                                <div class="info-item">
                                    <label>説明</label>
                                    <p>{{ project.description || '—' }}</p>
                                </div>
                                <div class="info-item">
                                    <label>期間</label>
                                    <span>
                                        {{ project.startDate | date:'yyyy/MM/dd' }}
                                        — {{ project.endDate | date:'yyyy/MM/dd' }}
                                    </span>
                                </div>
                            </div>

                            @if (project.taskStats) {
                                <div class="task-stats">
                                    <h3>タスク統計</h3>
                                    <div class="stats-grid">
                                        <div class="stat">
                                            <span class="stat-value">{{ project.taskStats.total }}</span>
                                            <span class="stat-label">合計</span>
                                        </div>
                                        <div class="stat">
                                            <span class="stat-value">{{ project.taskStats.todo }}</span>
                                            <span class="stat-label">未着手</span>
                                        </div>
                                        <div class="stat">
                                            <span class="stat-value">{{ project.taskStats.inProgress }}</span>
                                            <span class="stat-label">進行中</span>
                                        </div>
                                        <div class="stat">
                                            <span class="stat-value">{{ project.taskStats.done }}</span>
                                            <span class="stat-label">完了</span>
                                        </div>
                                    </div>
                                </div>
                            }
                        </div>
                    </mat-tab>

                    <!-- メンバータブ -->
                    <mat-tab label="メンバー ({{ project.members?.length || 0 }})">
                        <div class="tab-content">
                            <mat-list data-testid="member-list">
                                @for (member of project.members; track member.id) {
                                    <mat-list-item data-testid="member-row">
                                        <mat-icon matListItemIcon>person</mat-icon>
                                        <span matListItemTitle>
                                            {{ member.user?.profile?.displayName || member.user?.email }}
                                        </span>
                                        @if (member.userId === project.pmId) {
                                            <span matListItemMeta class="pm-badge">PM</span>
                                        } @else if (auth.isPm() || auth.isAdmin()) {
                                            <button mat-icon-button matListItemMeta
                                                    (click)="removeMember(project.id, member.userId)"
                                                    data-testid="remove-member-btn">
                                                <mat-icon>close</mat-icon>
                                            </button>
                                        }
                                    </mat-list-item>
                                }
                            </mat-list>
                        </div>
                    </mat-tab>
                </mat-tab-group>
            }
        </div>
    `,
    styles: [`
        .project-detail-container { padding: 24px; }
        .header {
            display: flex; justify-content: space-between;
            align-items: flex-start; margin-bottom: 24px;
        }
        .header h1 { margin: 8px 0; }
        .loading {
            display: flex; align-items: center; justify-content: center; padding: 64px 0;
        }
        .tab-content { padding: 24px 0; }
        .info-grid { display: grid; gap: 16px; }
        .info-item label { font-weight: 500; color: #666; display: block; margin-bottom: 4px; }
        .status-chip {
            padding: 4px 12px; border-radius: 16px; font-size: 12px;
        }
        .status-planning { background: #e0e0e0; }
        .status-active { background: #c8e6c9; color: #2e7d32; }
        .status-completed { background: #bbdefb; color: #1565c0; }
        .status-cancelled { background: #ffcdd2; color: #c62828; }
        .task-stats { margin-top: 24px; }
        .stats-grid { display: flex; gap: 24px; margin-top: 8px; }
        .stat {
            text-align: center; padding: 16px 24px;
            border-radius: 8px; background: #f5f5f5;
        }
        .stat-value { display: block; font-size: 24px; font-weight: 700; }
        .stat-label { font-size: 12px; color: #666; }
        .pm-badge {
            background: var(--mat-primary); color: white;
            padding: 2px 8px; border-radius: 12px; font-size: 12px;
        }
        .actions { display: flex; gap: 8px; }
    `],
})
export class ProjectDetailComponent implements OnInit {
    projectService = inject(ProjectService);
    taskService = inject(TaskService);
    auth = inject(AuthService);
    private route = inject(ActivatedRoute);
    private snackBar = inject(MatSnackBar);

    statusLabels: Record<string, string> = PROJECT_STATUS_LABELS;
    taskStatusLabels: Record<string, string> = TASK_STATUS_LABELS;

    ngOnInit() {
        const id = this.route.snapshot.paramMap.get('id')!;
        this.projectService.getById(id).subscribe();
    }

    removeMember(projectId: string, userId: string) {
        this.projectService.removeMember(projectId, userId).subscribe({
            next: () => {
                this.snackBar.open('メンバーを削除しました', '閉じる', { duration: 3000 });
                this.projectService.getById(projectId).subscribe();
            },
        });
    }
}
