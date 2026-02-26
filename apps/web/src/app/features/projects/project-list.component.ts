import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
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
        NzTableModule, NzButtonModule, NzIconModule,
        NzSelectModule, NzInputModule, NzTagModule,
        NzSpinModule, NzAvatarModule,
    ],
    template: `
        <div class="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h1 class="text-2xl font-bold text-gray-900 m-0">プロジェクト</h1>
                @if (auth.isPm() || auth.isAdmin()) {
                    <a nz-button nzType="primary" routerLink="new" data-testid="create-project-btn">
                        <span nz-icon nzType="plus" nzTheme="outline"></span>
                        新規作成
                    </a>
                }
            </div>

            <!-- Filters -->
            <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div class="flex flex-col sm:flex-row gap-4 items-end">
                    <div class="w-full sm:w-64">
                        <label class="block text-sm font-medium text-gray-700 mb-1.5">キーワード検索</label>
                        <nz-input-group nzPrefixIcon="search">
                            <input nz-input [(ngModel)]="searchText"
                                   (keyup.enter)="applyFilter()"
                                   placeholder="キーワード検索"
                                   data-testid="search-input" />
                        </nz-input-group>
                    </div>

                    <div class="w-full sm:w-64">
                        <label class="block text-sm font-medium text-gray-700 mb-1.5">ステータス</label>
                        <nz-select [(ngModel)]="selectedStatus"
                                   (ngModelChange)="applyFilter()"
                                   nzPlaceHolder="すべて"
                                   nzAllowClear
                                   class="w-full"
                                   data-testid="status-filter">
                            @for (status of statuses; track status) {
                                <nz-option [nzValue]="status" [nzLabel]="statusLabels?.[status] ?? status"></nz-option>
                            }
                        </nz-select>
                    </div>
                </div>
            </div>

            <!-- Content -->
            @if (projectService.loading()) {
                <div class="flex justify-center py-20" data-testid="loading">
                    <nz-spin nzSimple [nzSize]="'large'"></nz-spin>
                </div>
            } @else {
                <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    @if (projectService.projects().length === 0) {
                        <div class="flex flex-col items-center justify-center py-20 text-gray-400" data-testid="empty-state">
                            <span nz-icon nzType="folder" nzTheme="outline" class="text-5xl mb-4 opacity-50"></span>
                            <p class="text-base text-gray-500 font-medium">プロジェクトがありません</p>
                        </div>
                    } @else {
                        <nz-table #projectTable
                                  [nzData]="projectService.projects()"
                                  [nzFrontPagination]="false"
                                  [nzTotal]="projectService.meta()?.total ?? 0"
                                  [nzPageSize]="projectService.meta()?.limit ?? 20"
                                  [nzPageIndex]="projectService.meta()?.page ?? 1"
                                  (nzPageIndexChange)="onPageIndexChange($event)"
                                  (nzPageSizeChange)="onPageSizeChange($event)"
                                  [nzPageSizeOptions]="[10, 20, 50]"
                                  nzShowSizeChanger
                                  nzSize="middle"
                                  data-testid="project-table">
                            <thead>
                                <tr>
                                    <th nzWidth="200px">プロジェクト名</th>
                                    <th nzWidth="130px">ステータス</th>
                                    <th nzWidth="150px">PM</th>
                                    <th nzWidth="100px">メンバー</th>
                                    <th nzWidth="100px">タスク</th>
                                </tr>
                            </thead>
                            <tbody>
                                @for (row of projectTable.data; track row.id) {
                                    <tr class="hover:bg-blue-50/30 transition-colors">
                                        <td>
                                            <a [routerLink]="[row.id]"
                                               class="font-medium text-blue-600 hover:text-blue-800 hover:underline transition-colors flex items-center gap-2"
                                               data-testid="project-row">
                                                <span nz-icon nzType="folder" nzTheme="outline" class="text-gray-400"></span>
                                                {{ row.name }}
                                            </a>
                                        </td>
                                        <td>
                                            <nz-tag [nzColor]="getTagColor(row.status)">
                                                @if (row.status === 'completed') {
                                                    <span nz-icon nzType="check-circle" nzTheme="outline" class="mr-1"></span>
                                                } @else if (row.status === 'active') {
                                                    <span nz-icon nzType="play-circle" nzTheme="outline" class="mr-1"></span>
                                                } @else if (row.status === 'planning') {
                                                    <span nz-icon nzType="clock-circle" nzTheme="outline" class="mr-1"></span>
                                                } @else if (row.status === 'cancelled') {
                                                    <span nz-icon nzType="close-circle" nzTheme="outline" class="mr-1"></span>
                                                }
                                                {{ statusLabels[row.status] || row.status }}
                                            </nz-tag>
                                        </td>
                                        <td>
                                            <div class="flex items-center text-gray-700">
                                                @if (row.pm?.profile?.displayName) {
                                                    <nz-avatar [nzText]="row.pm.profile.displayName.charAt(0)"
                                                               nzSize="small"
                                                               class="mr-2"
                                                               style="background-color: #e0e7ff; color: #4338ca;"></nz-avatar>
                                                    {{ row.pm.profile.displayName }}
                                                } @else {
                                                    <span class="text-gray-400 font-medium tracking-wider">未設定</span>
                                                }
                                            </div>
                                        </td>
                                        <td>
                                            <div class="flex items-center gap-1.5 text-gray-600 font-medium">
                                                <span nz-icon nzType="team" nzTheme="outline" class="text-gray-400"></span>
                                                {{ row._count?.members || 0 }}名
                                            </div>
                                        </td>
                                        <td>
                                            <div class="flex items-center gap-1.5 text-gray-600 font-medium">
                                                <span nz-icon nzType="file-text" nzTheme="outline" class="text-gray-400"></span>
                                                {{ row._count?.tasks || 0 }}件
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
export class ProjectListComponent implements OnInit {
    projectService = inject(ProjectService);
    auth = inject(AuthService);
    private router = inject(Router);

    statuses = Object.values(ProjectStatus);
    statusLabels: Record<string, string> = PROJECT_STATUS_LABELS;

    searchText = '';
    selectedStatus: string | null = null;

    ngOnInit() {
        this.projectService.loadAll();
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
