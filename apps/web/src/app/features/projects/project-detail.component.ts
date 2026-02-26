import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzProgressModule } from 'ng-zorro-antd/progress';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { NzMessageService } from 'ng-zorro-antd/message';
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
        NzTabsModule, NzButtonModule, NzIconModule, NzDescriptionsModule,
        NzTagModule, NzSpinModule, NzAvatarModule, NzProgressModule,
        NzTooltipModule,
    ],
    template: `
        <div class="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
            @if (projectService.loading()) {
                <div class="flex flex-col items-center justify-center py-20 bg-gray-50 rounded-xl" data-testid="loading">
                    <nz-spin nzSimple [nzSize]="'large'"></nz-spin>
                    <span class="mt-4 text-sm text-gray-500 font-medium">プロジェクト情報を取得中...</span>
                </div>
            } @else if (projectService.currentProject(); as project) {
                <!-- Header Actions -->
                <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-gray-200 pb-6">
                    <div class="flex items-start gap-4">
                        <button nz-button nzType="default" nzShape="circle" routerLink="/projects" data-testid="back-btn">
                            <span nz-icon nzType="arrow-left" nzTheme="outline"></span>
                        </button>
                        <div>
                            <div class="flex items-center gap-3 mb-1">
                                <h1 class="text-3xl font-bold text-gray-900 m-0">{{ project.name }}</h1>
                                <nz-tag [nzColor]="getTagColor(project.status)">
                                    {{ statusLabels[project.status] || project.status }}
                                </nz-tag>
                            </div>
                            <p class="text-sm text-gray-500">
                                期間: {{ project.startDate | date:'yyyy/MM/dd' }} 〜 {{ project.endDate | date:'yyyy/MM/dd' }}
                            </p>
                        </div>
                    </div>
                    <div class="flex gap-3">
                        <a nz-button nzType="primary" [routerLink]="['/projects', project.id, 'tasks']" data-testid="kanban-btn">
                            <span nz-icon nzType="appstore" nzTheme="outline" class="mr-1"></span>
                            カンバンボードへ
                        </a>
                    </div>
                </div>

                <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <nz-tabs data-testid="detail-tabs" [nzAnimated]="false">
                        <!-- 概要タブ -->
                        <nz-tab nzTitle="概要">
                            <div class="p-6 lg:p-8 space-y-8">
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div class="space-y-6">
                                        <h2 class="text-lg font-bold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-2">
                                            <span nz-icon nzType="info-circle" nzTheme="outline" class="text-blue-600"></span>
                                            基本情報
                                        </h2>

                                        <nz-descriptions nzBordered [nzColumn]="1" nzSize="small">
                                            <nz-descriptions-item nzTitle="プロジェクトマネージャー">
                                                <div class="flex items-center gap-3">
                                                    <nz-avatar [nzText]="(project.pm?.profile?.displayName ?? 'P').charAt(0)"
                                                               nzSize="small"
                                                               style="background-color: #e0e7ff; color: #4338ca;"></nz-avatar>
                                                    <span class="text-gray-900 font-medium">{{ project.pm?.profile?.displayName || '未設定' }}</span>
                                                </div>
                                            </nz-descriptions-item>
                                            <nz-descriptions-item nzTitle="プロジェクト説明">
                                                <p class="text-gray-700 leading-relaxed text-sm whitespace-pre-wrap m-0">{{ project.description || '説明はありません' }}</p>
                                            </nz-descriptions-item>
                                        </nz-descriptions>
                                    </div>

                                    @if (project.taskStats) {
                                        <div class="space-y-6">
                                            <h2 class="text-lg font-bold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-2">
                                                <span nz-icon nzType="bar-chart" nzTheme="outline" class="text-blue-600"></span>
                                                タスク進行状況
                                            </h2>

                                            <div class="grid grid-cols-2 gap-4">
                                                <div class="bg-gray-50 p-4 rounded-xl border border-gray-100 flex flex-col justify-center">
                                                    <span class="text-3xl font-bold text-gray-900">{{ project.taskStats.total }}</span>
                                                    <span class="text-sm font-medium text-gray-500">全体タスク数</span>
                                                </div>
                                                <div class="bg-blue-50 p-4 rounded-xl border border-blue-100 flex flex-col justify-center">
                                                    <span class="text-3xl font-bold text-blue-700">{{ project.taskStats.todo }}</span>
                                                    <span class="text-sm font-medium text-blue-600">未着手 (ToDo)</span>
                                                </div>
                                                <div class="bg-amber-50 p-4 rounded-xl border border-amber-100 flex flex-col justify-center">
                                                    <span class="text-3xl font-bold text-amber-700">{{ project.taskStats.inProgress }}</span>
                                                    <span class="text-sm font-medium text-amber-600">進行中 (In Progress)</span>
                                                </div>
                                                <div class="bg-green-50 p-4 rounded-xl border border-green-100 flex flex-col justify-center">
                                                    <span class="text-3xl font-bold text-green-700">{{ project.taskStats.done }}</span>
                                                    <span class="text-sm font-medium text-green-600">完了 (Done)</span>
                                                </div>
                                            </div>
                                        </div>
                                    }
                                </div>
                            </div>
                        </nz-tab>

                        <!-- メンバータブ -->
                        <nz-tab [nzTitle]="'メンバー (' + (project.members?.length || 0) + ')'">
                            <div class="p-6 lg:p-8">
                                <div class="mb-4">
                                    <h2 class="text-lg font-bold text-gray-900 flex items-center gap-2">
                                        <span nz-icon nzType="team" nzTheme="outline" class="text-blue-600"></span>
                                        プロジェクト参加メンバー
                                    </h2>
                                </div>

                                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="member-list">
                                    @for (member of project.members; track member.id) {
                                        <div class="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between hover:shadow-md transition-shadow group" data-testid="member-row">
                                            <div class="flex items-center gap-3 truncate">
                                                <nz-avatar nzIcon="user" nzSize="default"
                                                           style="background-color: #f3f4f6; color: #4b5563;"></nz-avatar>
                                                <div class="truncate">
                                                    <div class="font-bold text-gray-900 text-sm truncate">
                                                        {{ member.user?.profile?.displayName || member.user?.email }}
                                                    </div>
                                                    @if (member.userId === project.pmId) {
                                                        <span class="inline-flex mt-1 text-[10px] font-bold text-blue-700 px-2 py-0.5 bg-blue-50 rounded-full border border-blue-200">
                                                            Project Manager
                                                        </span>
                                                    }
                                                </div>
                                            </div>

                                            @if (member.userId !== project.pmId && (auth.isPm() || auth.isAdmin())) {
                                                <button nz-button nzType="text" nzShape="circle" nzDanger
                                                        (click)="removeMember(project.id, member.userId)"
                                                        nz-tooltip nzTooltipTitle="メンバーから外す"
                                                        class="opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                                                        data-testid="remove-member-btn">
                                                    <span nz-icon nzType="user-delete" nzTheme="outline"></span>
                                                </button>
                                            }
                                        </div>
                                    }
                                    @if (!project.members?.length) {
                                        <div class="col-span-full py-12 text-center text-gray-500 flex flex-col items-center">
                                            <span nz-icon nzType="user" nzTheme="outline" class="text-5xl opacity-30 mb-2"></span>
                                            <p>参加メンバーがいません。</p>
                                        </div>
                                    }
                                </div>
                            </div>
                        </nz-tab>
                    </nz-tabs>
                </div>
            }
        </div>
    `,
    styles: [],
})
export class ProjectDetailComponent implements OnInit {
    projectService = inject(ProjectService);
    taskService = inject(TaskService);
    auth = inject(AuthService);
    private route = inject(ActivatedRoute);
    private message = inject(NzMessageService);

    statusLabels: Record<string, string> = PROJECT_STATUS_LABELS;
    taskStatusLabels: Record<string, string> = TASK_STATUS_LABELS;

    ngOnInit() {
        const id = this.route.snapshot.paramMap.get('id')!;
        this.projectService.getById(id).subscribe();
    }

    getTagColor(status: string): string {
        switch (status) {
            case 'completed': return 'blue';
            case 'active': return 'success';
            case 'planning': return 'default';
            case 'cancelled': return 'error';
            default: return 'default';
        }
    }

    removeMember(projectId: string, userId: string) {
        this.projectService.removeMember(projectId, userId).subscribe({
            next: () => {
                this.message.success('メンバーを削除しました');
                this.projectService.getById(projectId).subscribe();
            },
        });
    }
}
