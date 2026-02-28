import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  heroPlus, heroFolder, heroCheckCircle, heroPlayCircle,
  heroClock, heroXCircle, heroUserGroup, heroDocumentText,
  heroMagnifyingGlass,
} from '@ng-icons/heroicons/outline';
import {
  ProjectStatus, PROJECT_STATUS_LABELS, PROJECT_STATUS_COLORS,
} from '@shared/types';
import { ListPageComponent, DataTableComponent } from '../../shared/ui';
import { ProjectService } from './project.service';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [
    RouterLink, FormsModule, NgIcon,
    ListPageComponent, DataTableComponent,
  ],
  viewProviders: [provideIcons({
    heroPlus, heroFolder, heroCheckCircle, heroPlayCircle,
    heroClock, heroXCircle, heroUserGroup, heroDocumentText,
    heroMagnifyingGlass,
  })],
  template: `
    <app-list-page title="プロジェクト">
      <ng-container slot="actions">
        @if (auth.isPm() || auth.isAdmin()) {
          <a routerLink="new" class="btn btn-primary btn-sm gap-2" data-testid="create-project-btn">
            <ng-icon name="heroPlus" class="text-lg" />
            新規作成
          </a>
        }
      </ng-container>

      <ng-container slot="filters">
        <div class="card bg-base-100 shadow-sm">
          <div class="card-body p-4">
            <div class="flex flex-col sm:flex-row gap-4 items-end">
              <div class="w-full sm:w-64">
                <label class="label font-medium">キーワード検索</label>
                <label class="input flex items-center gap-2">
                  <ng-icon name="heroMagnifyingGlass" class="text-base-content/40" />
                  <input type="text" class="grow" [(ngModel)]="searchText"
                      (keyup.enter)="applyFilter()"
                      placeholder="キーワード検索"
                      data-testid="search-input" />
                </label>
              </div>

              <div class="w-full sm:w-64">
                <label class="label font-medium">ステータス</label>
                <select class="select w-full"
                    [(ngModel)]="selectedStatus"
                    (ngModelChange)="applyFilter()"
                    data-testid="status-filter">
                  <option [ngValue]="null">すべて</option>
                  @for (status of statuses; track status) {
                    <option [ngValue]="status">{{ getStatusLabel(status) }}</option>
                  }
                </select>
              </div>
            </div>
          </div>
        </div>
      </ng-container>

      <!-- Content -->
      @if (projectService.loading()) {
        <div class="flex justify-center py-20" data-testid="loading">
          <span class="loading loading-spinner loading-lg"></span>
        </div>
      } @else {
        @if (projectService.projects().length === 0) {
          <div class="flex flex-col items-center justify-center py-20 text-base-content/40" data-testid="empty-state">
            <ng-icon name="heroFolder" class="text-5xl opacity-50 mb-4" />
            <p class="text-base text-base-content/60 font-medium">プロジェクトがありません</p>
          </div>
        } @else {
          <app-data-table
            [page]="projectService.meta()?.page ?? 1"
            [pageSize]="projectService.meta()?.limit ?? 20"
            [total]="projectService.meta()?.total ?? 0"
            (pageChange)="onPageIndexChange($event)"
            data-testid="project-table">
            <thead>
              <tr>
                <th>プロジェクト名</th>
                <th>ステータス</th>
                <th>PM</th>
                <th>メンバー</th>
                <th>タスク</th>
              </tr>
            </thead>
            <tbody>
              @for (row of projectService.projects(); track row.id) {
                <tr class="hover:bg-base-200/40">
                  <td>
                    <a [routerLink]="[row.id]"
                      class="font-medium link link-primary no-underline hover:underline flex items-center gap-2"
                      data-testid="project-row">
                      <ng-icon name="heroFolder" class="text-base-content/40" />
                      {{ row.name }}
                    </a>
                  </td>
                  <td>
                    <span class="badge gap-1" [class]="getBadgeClass(row.status)">
                      {{ getStatusLabel(row.status) }}
                    </span>
                  </td>
                  <td>
                    <div class="flex items-center text-base-content">
                      @if (row.pm?.profile?.displayName) {
                        <div class="avatar avatar-placeholder mr-2">
                          <div class="bg-primary/10 text-primary rounded-full w-6 h-6">
                            <span class="text-xs">{{ row.pm.profile.displayName.charAt(0) }}</span>
                          </div>
                        </div>
                        {{ row.pm.profile.displayName }}
                      } @else {
                        <span class="text-base-content/40 font-medium tracking-wider">未設定</span>
                      }
                    </div>
                  </td>
                  <td>
                    <div class="flex items-center gap-1.5 text-base-content/60 font-medium">
                      <ng-icon name="heroUserGroup" class="text-base-content/40" />
                      {{ row._count?.members || 0 }}名
                    </div>
                  </td>
                  <td>
                    <div class="flex items-center gap-1.5 text-base-content/60 font-medium">
                      <ng-icon name="heroDocumentText" class="text-base-content/40" />
                      {{ row._count?.tasks || 0 }}件
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </app-data-table>
        }
      }
    </app-list-page>
  `,
  styles: [],
})
export class ProjectListComponent implements OnInit {
  projectService = inject(ProjectService);
  auth = inject(AuthService);
  private router = inject(Router);

  statuses = Object.values(ProjectStatus);
  private statusLabels: Record<string, string> = PROJECT_STATUS_LABELS;

  getStatusLabel(status: string): string {
    return this.statusLabels?.[status] ?? status;
  }

  searchText = '';
  selectedStatus: string | null = null;

  ngOnInit() {
    this.projectService.loadAll();
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

  applyFilter() {
    const params: Record<string, string> = {};
    if (this.searchText) params['search'] = this.searchText;
    if (this.selectedStatus) params['status'] = this.selectedStatus;
    this.projectService.loadAll(params);
  }

  onPageIndexChange(page: number) {
    const params: Record<string, string> = {
      page: String(page),
      limit: String(this.projectService.meta()?.limit ?? 20),
    };
    if (this.searchText) params['search'] = this.searchText;
    if (this.selectedStatus) params['status'] = this.selectedStatus;
    this.projectService.loadAll(params);
  }

  onPageSizeChange(size: number) {
    const params: Record<string, string> = {
      page: '1',
      limit: String(size),
    };
    if (this.searchText) params['search'] = this.searchText;
    if (this.selectedStatus) params['status'] = this.selectedStatus;
    this.projectService.loadAll(params);
  }
}
