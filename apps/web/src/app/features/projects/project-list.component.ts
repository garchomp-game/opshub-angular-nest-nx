import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { PaginatorModule } from 'primeng/paginator';
import { TagModule } from 'primeng/tag';
import { AvatarModule } from 'primeng/avatar';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import {
  ProjectStatus, PROJECT_STATUS_LABELS, PROJECT_STATUS_COLORS,
} from '@shared/types';
import { ProjectService } from './project.service';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [
    RouterLink, FormsModule,
    TableModule, PaginatorModule, TagModule, AvatarModule,
    InputTextModule, SelectModule, ButtonModule,
    IconFieldModule, InputIconModule,
  ],
  template: `
    <div class="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold m-0">プロジェクト</h1>
        @if (auth.isPm() || auth.isAdmin()) {
          <p-button label="新規作成" icon="pi pi-plus" size="small"
              routerLink="new" data-testid="create-project-btn" />
        }
      </div>

      <!-- Filters -->
      <div class="flex flex-col sm:flex-row gap-4 items-end">
        <div class="w-full sm:w-64">
          <label class="block font-medium mb-2">キーワード検索</label>
          <p-iconfield>
            <p-inputicon styleClass="pi pi-search" />
            <input type="text" pInputText class="w-full" [(ngModel)]="searchText"
                (keyup.enter)="applyFilter()"
                placeholder="キーワード検索"
                data-testid="search-input" />
          </p-iconfield>
        </div>

        <div class="w-full sm:w-64">
          <label class="block font-medium mb-2">ステータス</label>
          <p-select [options]="statusOptions" [(ngModel)]="selectedStatus"
              (ngModelChange)="applyFilter()"
              optionLabel="label" optionValue="value"
              placeholder="すべて" [showClear]="true"
              styleClass="w-full"
              data-testid="status-filter" />
        </div>
      </div>

      <!-- Content -->
      @if (projectService.loading()) {
        <div class="flex justify-center py-20" data-testid="loading">
          <i class="pi pi-spin pi-spinner" style="font-size: 2rem;"></i>
        </div>
      } @else {
        @if (projectService.projects().length === 0) {
          <div class="flex flex-col items-center justify-center py-20 text-surface-400" data-testid="empty-state">
            <i class="pi pi-folder text-5xl mb-4" style="opacity: 0.5;"></i>
            <p class="text-base font-medium">プロジェクトがありません</p>
          </div>
        } @else {
          <p-table [value]="projectService.projects()" [tableStyle]="{'min-width': '50rem'}"
              data-testid="project-table">
            <ng-template #header>
              <tr>
                <th>プロジェクト名</th>
                <th>ステータス</th>
                <th>PM</th>
                <th>メンバー</th>
                <th>タスク</th>
              </tr>
            </ng-template>
            <ng-template #body let-row>
              <tr>
                <td>
                  <a [routerLink]="[row.id]"
                    class="font-medium no-underline hover:underline flex items-center gap-2 text-primary"
                    data-testid="project-row">
                    <i class="pi pi-folder" style="opacity: 0.5;"></i>
                    {{ row.name }}
                  </a>
                </td>
                <td>
                  <p-tag [value]="getStatusLabel(row.status)" [severity]="getTagSeverity(row.status)" />
                </td>
                <td>
                  <div class="flex items-center gap-2">
                    @if (row.pm?.profile?.displayName) {
                      <p-avatar [label]="row.pm.profile.displayName.charAt(0)"
                          shape="circle" size="normal"
                          [style]="{'background-color': 'var(--p-primary-100)', 'color': 'var(--p-primary-700)'}" />
                      {{ row.pm.profile.displayName }}
                    } @else {
                      <span class="text-surface-400 font-medium tracking-wider">未設定</span>
                    }
                  </div>
                </td>
                <td>
                  <div class="flex items-center gap-1.5 text-surface-500 font-medium">
                    <i class="pi pi-users" style="opacity: 0.5;"></i>
                    {{ row._count?.members || 0 }}名
                  </div>
                </td>
                <td>
                  <div class="flex items-center gap-1.5 text-surface-500 font-medium">
                    <i class="pi pi-file" style="opacity: 0.5;"></i>
                    {{ row._count?.tasks || 0 }}件
                  </div>
                </td>
              </tr>
            </ng-template>
          </p-table>
          <p-paginator
            [first]="((projectService.meta()?.page ?? 1) - 1) * (projectService.meta()?.limit ?? 20)"
            [rows]="projectService.meta()?.limit ?? 20"
            [totalRecords]="projectService.meta()?.total ?? 0"
            (onPageChange)="onPaginatorChange($event)" />
        }
      }
    </div>
  `,
  styles: [],
})
export class ProjectListComponent implements OnInit {
  projectService = inject(ProjectService);
  auth = inject(AuthService);
  private router = inject(Router);

  statuses = Object.values(ProjectStatus);
  private statusLabels: Record<string, string> = PROJECT_STATUS_LABELS;

  statusOptions = this.statuses.map(s => ({ label: this.statusLabels[s] ?? s, value: s }));

  getStatusLabel(status: string): string {
    return this.statusLabels?.[status] ?? status;
  }

  searchText = '';
  selectedStatus: string | null = null;

  ngOnInit() {
    this.projectService.loadAll();
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

  applyFilter() {
    const params: Record<string, string> = {};
    if (this.searchText) params['search'] = this.searchText;
    if (this.selectedStatus) params['status'] = this.selectedStatus;
    this.projectService.loadAll(params);
  }

  onPaginatorChange(event: any) {
    const page = Math.floor(event.first / event.rows) + 1;
    const params: Record<string, string> = {
      page: String(page),
      limit: String(event.rows),
    };
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
