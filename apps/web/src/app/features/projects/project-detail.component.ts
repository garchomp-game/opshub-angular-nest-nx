import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  heroArrowLeft, heroViewColumns, heroInformationCircle,
  heroChartBar, heroUserGroup, heroUser, heroUserMinus,
} from '@ng-icons/heroicons/outline';
import {
  PROJECT_STATUS_LABELS, TASK_STATUS_LABELS,
} from '@shared/types';
import { ToastService } from '../../shared/ui';
import { ProjectService } from './project.service';
import { TaskService } from './task.service';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [
    RouterLink, DatePipe, NgIcon,
  ],
  viewProviders: [provideIcons({
    heroArrowLeft, heroViewColumns, heroInformationCircle,
    heroChartBar, heroUserGroup, heroUser, heroUserMinus,
  })],
  template: `
    <div class="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      @if (projectService.loading()) {
        <div class="flex flex-col items-center justify-center py-20 bg-base-200/50 rounded-xl" data-testid="loading">
          <span class="loading loading-spinner loading-lg"></span>
          <span class="mt-4 text-sm text-base-content/50 font-medium">プロジェクト情報を取得中...</span>
        </div>
      } @else if (projectService.currentProject(); as project) {
        <!-- Header Actions -->
        <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-base-200 pb-6">
          <div class="flex items-start gap-4">
            <button class="btn btn-circle btn-ghost" routerLink="/projects" data-testid="back-btn">
              <ng-icon name="heroArrowLeft" class="text-lg" />
            </button>
            <div>
              <div class="flex items-center gap-3 mb-1">
                <h1 class="text-3xl font-bold text-base-content m-0">{{ project.name }}</h1>
                <span class="badge gap-1" [class]="getBadgeClass(project.status)">
                  {{ statusLabels[project.status] || project.status }}
                </span>
              </div>
              <p class="text-sm text-base-content/50">
                期間: {{ project.startDate | date:'yyyy/MM/dd' }} 〜 {{ project.endDate | date:'yyyy/MM/dd' }}
              </p>
            </div>
          </div>
          <div class="flex gap-3">
            <a class="btn btn-primary btn-sm gap-2" [routerLink]="['/projects', project.id, 'tasks']" data-testid="kanban-btn">
              <ng-icon name="heroViewColumns" class="text-lg" />
              カンバンボードへ
            </a>
          </div>
        </div>

        <div class="card bg-base-100 shadow-sm">
          <div class="card-body p-0">
            <!-- Tabs -->
            <div role="tablist" class="tabs tabs-border px-6 pt-4" data-testid="detail-tabs">
              <button role="tab" class="tab" [class.tab-active]="activeTab() === 'overview'"
                  (click)="activeTab.set('overview')">概要</button>
              <button role="tab" class="tab" [class.tab-active]="activeTab() === 'members'"
                  (click)="activeTab.set('members')">メンバー ({{ project.members?.length || 0 }})</button>
            </div>

            <!-- 概要タブ -->
            @if (activeTab() === 'overview') {
              <div class="p-6 lg:p-8 space-y-8">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div class="space-y-6">
                    <h2 class="text-lg font-bold text-base-content flex items-center gap-2 border-b border-base-200 pb-2">
                      <ng-icon name="heroInformationCircle" class="text-primary text-lg" />
                      基本情報
                    </h2>

                    <div class="overflow-x-auto">
                      <table class="table">
                        <tbody>
                          <tr>
                            <th class="text-base-content/60 w-48">プロジェクトマネージャー</th>
                            <td>
                              <div class="flex items-center gap-3">
                                <div class="avatar avatar-placeholder">
                                  <div class="bg-primary/10 text-primary rounded-full w-6 h-6">
                                    <span class="text-xs">{{ (project.pm?.profile?.displayName ?? 'P').charAt(0) }}</span>
                                  </div>
                                </div>
                                <span class="text-base-content font-medium">{{ project.pm?.profile?.displayName || '未設定' }}</span>
                              </div>
                            </td>
                          </tr>
                          <tr>
                            <th class="text-base-content/60 w-48">プロジェクト説明</th>
                            <td>
                              <p class="text-base-content/70 leading-relaxed text-sm whitespace-pre-wrap m-0">{{ project.description || '説明はありません' }}</p>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  @if (project.taskStats) {
                    <div class="space-y-6">
                      <h2 class="text-lg font-bold text-base-content flex items-center gap-2 border-b border-base-200 pb-2">
                        <ng-icon name="heroChartBar" class="text-primary text-lg" />
                        タスク進行状況
                      </h2>

                      <div class="grid grid-cols-2 gap-4">
                        <div class="bg-base-200/50 p-4 rounded-xl flex flex-col justify-center">
                          <span class="text-3xl font-bold text-base-content">{{ project.taskStats.total }}</span>
                          <span class="text-sm font-medium text-base-content/50">全体タスク数</span>
                        </div>
                        <div class="bg-info/10 p-4 rounded-xl flex flex-col justify-center">
                          <span class="text-3xl font-bold text-info">{{ project.taskStats.todo }}</span>
                          <span class="text-sm font-medium text-info">未着手 (ToDo)</span>
                        </div>
                        <div class="bg-warning/10 p-4 rounded-xl flex flex-col justify-center">
                          <span class="text-3xl font-bold text-warning">{{ project.taskStats.inProgress }}</span>
                          <span class="text-sm font-medium text-warning">進行中 (In Progress)</span>
                        </div>
                        <div class="bg-success/10 p-4 rounded-xl flex flex-col justify-center">
                          <span class="text-3xl font-bold text-success">{{ project.taskStats.done }}</span>
                          <span class="text-sm font-medium text-success">完了 (Done)</span>
                        </div>
                      </div>
                    </div>
                  }
                </div>
              </div>
            }

            <!-- メンバータブ -->
            @if (activeTab() === 'members') {
              <div class="p-6 lg:p-8">
                <div class="mb-4">
                  <h2 class="text-lg font-bold text-base-content flex items-center gap-2">
                    <ng-icon name="heroUserGroup" class="text-primary text-lg" />
                    プロジェクト参加メンバー
                  </h2>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="member-list">
                  @for (member of project.members; track member.id) {
                    <div class="card bg-base-100 border border-base-200 shadow-sm hover:shadow-md transition-shadow group" data-testid="member-row">
                      <div class="card-body p-4 flex-row items-center justify-between">
                        <div class="flex items-center gap-3 truncate">
                          <div class="avatar avatar-placeholder">
                            <div class="bg-base-200 text-base-content/60 rounded-full w-10 h-10">
                              <ng-icon name="heroUser" class="text-lg" />
                            </div>
                          </div>
                          <div class="truncate">
                            <div class="font-bold text-base-content text-sm truncate">
                              {{ member.user?.profile?.displayName || member.user?.email }}
                            </div>
                            @if (member.userId === project.pmId) {
                              <span class="badge badge-primary badge-xs mt-1">Project Manager</span>
                            }
                          </div>
                        </div>

                        @if (member.userId !== project.pmId && (auth.isPm() || auth.isAdmin())) {
                          <div class="tooltip" data-tip="メンバーから外す">
                            <button class="btn btn-ghost btn-circle btn-sm text-error opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                                (click)="removeMember(project.id, member.userId)"
                                data-testid="remove-member-btn">
                              <ng-icon name="heroUserMinus" class="text-lg" />
                            </button>
                          </div>
                        }
                      </div>
                    </div>
                  }
                  @if (!project.members?.length) {
                    <div class="col-span-full py-12 text-center text-base-content/50 flex flex-col items-center">
                      <ng-icon name="heroUser" class="text-5xl opacity-30 mb-2" />
                      <p>参加メンバーがいません。</p>
                    </div>
                  }
                </div>
              </div>
            }
          </div>
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
  private toast = inject(ToastService);

  statusLabels: Record<string, string> = PROJECT_STATUS_LABELS;
  taskStatusLabels: Record<string, string> = TASK_STATUS_LABELS;
  activeTab = signal<'overview' | 'members'>('overview');

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.projectService.getById(id).subscribe();
  }

  getBadgeClass(status: string): string {
    switch (status) {
      case 'completed': return 'badge-success';
      case 'active': return 'badge-info';
      case 'planning': return 'badge-ghost';
      case 'cancelled': return 'badge-error';
      default: return 'badge-ghost';
    }
  }

  removeMember(projectId: string, userId: string) {
    this.projectService.removeMember(projectId, userId).subscribe({
      next: () => {
        this.toast.success('メンバーを削除しました');
        this.projectService.getById(projectId).subscribe();
      },
    });
  }
}
