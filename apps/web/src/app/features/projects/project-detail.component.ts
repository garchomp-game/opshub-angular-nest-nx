import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TabsModule } from 'primeng/tabs';
import { CardModule } from 'primeng/card';
import { AvatarModule } from 'primeng/avatar';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
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
    RouterLink, DatePipe,
    TabsModule, CardModule, AvatarModule, TagModule,
    ButtonModule, TooltipModule,
  ],
  template: `
    <div class="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      @if (projectService.loading()) {
        <div class="flex flex-col items-center justify-center py-20" data-testid="loading">
          <i class="pi pi-spin pi-spinner" style="font-size: 2rem;"></i>
          <span class="mt-4 text-sm text-surface-400 font-medium">プロジェクト情報を取得中...</span>
        </div>
      } @else if (projectService.currentProject(); as project) {
        <!-- Header Actions -->
        <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-surface-200 pb-6">
          <div class="flex items-start gap-4">
            <p-button icon="pi pi-arrow-left" [rounded]="true" [text]="true"
                routerLink="/projects" data-testid="back-btn" />
            <div>
              <div class="flex items-center gap-3 mb-1">
                <h1 class="text-3xl font-bold m-0">{{ project.name }}</h1>
                <p-tag [value]="statusLabels[project.status] || project.status"
                    [severity]="getTagSeverity(project.status)" />
              </div>
              <p class="text-sm text-surface-400">
                期間: {{ project.startDate | date:'yyyy/MM/dd' }} 〜 {{ project.endDate | date:'yyyy/MM/dd' }}
              </p>
            </div>
          </div>
          <div class="flex gap-3">
            <p-button label="カンバンボードへ" icon="pi pi-th-large" size="small"
                [routerLink]="['/projects', project.id, 'tasks']"
                data-testid="kanban-btn" />
          </div>
        </div>

        <p-card data-testid="detail-tabs">
          <p-tabs [(value)]="activeTabValue">
            <p-tablist>
              <p-tab value="overview">概要</p-tab>
              <p-tab value="members">メンバー ({{ project.members?.length || 0 }})</p-tab>
            </p-tablist>
            <p-tabpanels>
              <!-- 概要タブ -->
              <p-tabpanel value="overview">
                <div class="p-2 lg:p-4 space-y-8">
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div class="space-y-6">
                      <h2 class="text-lg font-bold flex items-center gap-2 border-b border-surface-200 pb-2">
                        <i class="pi pi-info-circle text-primary"></i>
                        基本情報
                      </h2>

                      <div class="overflow-x-auto">
                        <table class="w-full">
                          <tbody>
                            <tr class="border-b border-surface-100">
                              <th class="text-left text-surface-500 w-48 py-3 pr-4 font-medium">プロジェクトマネージャー</th>
                              <td class="py-3">
                                <div class="flex items-center gap-3">
                                  <p-avatar [label]="(project.pm?.profile?.displayName ?? 'P').charAt(0)"
                                      shape="circle" size="small"
                                      [style]="{'background-color': 'var(--p-primary-100)', 'color': 'var(--p-primary-700)'}" />
                                  <span class="font-medium">{{ project.pm?.profile?.displayName || '未設定' }}</span>
                                </div>
                              </td>
                            </tr>
                            <tr>
                              <th class="text-left text-surface-500 w-48 py-3 pr-4 font-medium">プロジェクト説明</th>
                              <td class="py-3">
                                <p class="text-surface-600 leading-relaxed text-sm whitespace-pre-wrap m-0">{{ project.description || '説明はありません' }}</p>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    @if (project.taskStats) {
                      <div class="space-y-6">
                        <h2 class="text-lg font-bold flex items-center gap-2 border-b border-surface-200 pb-2">
                          <i class="pi pi-chart-bar text-primary"></i>
                          タスク進行状況
                        </h2>

                        <div class="grid grid-cols-2 gap-4">
                          <p-card [style]="{'background-color': 'var(--p-surface-100)'}">
                            <span class="text-3xl font-bold">{{ project.taskStats.total }}</span>
                            <span class="block text-sm font-medium text-surface-400">全体タスク数</span>
                          </p-card>
                          <p-card [style]="{'background-color': 'color-mix(in srgb, var(--p-blue-500) 10%, transparent)'}">
                            <span class="text-3xl font-bold" style="color: var(--p-blue-500);">{{ project.taskStats.todo }}</span>
                            <span class="block text-sm font-medium" style="color: var(--p-blue-500);">未着手 (ToDo)</span>
                          </p-card>
                          <p-card [style]="{'background-color': 'color-mix(in srgb, var(--p-yellow-500) 10%, transparent)'}">
                            <span class="text-3xl font-bold" style="color: var(--p-yellow-500);">{{ project.taskStats.inProgress }}</span>
                            <span class="block text-sm font-medium" style="color: var(--p-yellow-500);">進行中 (In Progress)</span>
                          </p-card>
                          <p-card [style]="{'background-color': 'color-mix(in srgb, var(--p-green-500) 10%, transparent)'}">
                            <span class="text-3xl font-bold" style="color: var(--p-green-500);">{{ project.taskStats.done }}</span>
                            <span class="block text-sm font-medium" style="color: var(--p-green-500);">完了 (Done)</span>
                          </p-card>
                        </div>
                      </div>
                    }
                  </div>
                </div>
              </p-tabpanel>

              <!-- メンバータブ -->
              <p-tabpanel value="members">
                <div class="p-2 lg:p-4">
                  <div class="mb-4">
                    <h2 class="text-lg font-bold flex items-center gap-2">
                      <i class="pi pi-users text-primary"></i>
                      プロジェクト参加メンバー
                    </h2>
                  </div>

                  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="member-list">
                    @for (member of project.members; track member.id) {
                      <p-card styleClass="hover:shadow-lg transition-shadow" data-testid="member-row">
                        <div class="flex items-center justify-between">
                          <div class="flex items-center gap-3 truncate">
                            <p-avatar icon="pi pi-user" shape="circle"
                                [style]="{'background-color': 'var(--p-surface-200)', 'color': 'var(--p-surface-500)'}" />
                            <div class="truncate">
                              <div class="font-bold text-sm truncate">
                                {{ member.user?.profile?.displayName || member.user?.email }}
                              </div>
                              @if (member.userId === project.pmId) {
                                <p-tag value="Project Manager" severity="info" [style]="{'font-size': '0.65rem', 'padding': '0.1rem 0.4rem', 'margin-top': '0.25rem'}" />
                              }
                            </div>
                          </div>

                          @if (member.userId !== project.pmId && (auth.isPm() || auth.isAdmin())) {
                            <p-button icon="pi pi-user-minus" [rounded]="true" [text]="true"
                                severity="danger" size="small"
                                pTooltip="メンバーから外す"
                                (onClick)="removeMember(project.id, member.userId)"
                                data-testid="remove-member-btn"
                                [style]="{'opacity': '0', 'transition': 'opacity 0.2s'}"
                                styleClass="member-remove-btn" />
                          }
                        </div>
                      </p-card>
                    }
                    @if (!project.members?.length) {
                      <div class="col-span-full py-12 text-center text-surface-400 flex flex-col items-center">
                        <i class="pi pi-user text-5xl mb-2" style="opacity: 0.3;"></i>
                        <p>参加メンバーがいません。</p>
                      </div>
                    }
                  </div>
                </div>
              </p-tabpanel>
            </p-tabpanels>
          </p-tabs>
        </p-card>
      }
    </div>
  `,
  styles: [`
    :host ::ng-deep .p-card:hover .member-remove-btn {
      opacity: 1 !important;
    }
  `],
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
  activeTabValue = 'overview';

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.projectService.getById(id).subscribe();
  }

  getTagSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' | undefined {
    switch (status) {
      case 'completed': return 'success';
      case 'active': return 'info';
      case 'planning': return 'secondary';
      case 'cancelled': return 'danger';
      default: return 'secondary';
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
