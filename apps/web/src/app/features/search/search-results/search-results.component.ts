import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzListModule } from 'ng-zorro-antd/list';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { SearchService, SearchResult } from '../services/search.service';

@Component({
    selector: 'app-search-results',
    standalone: true,
    imports: [
        CommonModule, RouterLink, FormsModule, DatePipe,
        NzTabsModule, NzListModule, NzIconModule, NzInputModule,
        NzSpinModule, NzButtonModule, NzTagModule, NzBadgeModule,
        NzEmptyModule,
    ],
    template: `
    <div class="min-h-[calc(100vh-64px)] bg-gray-50/50 py-8 px-4 sm:px-6 lg:px-8">
      <div class="max-w-4xl mx-auto" data-testid="search-results-page">
        <!-- Search Input -->
        <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6">
            <nz-input-group nzPrefixIcon="search" [nzSuffix]="searchSuffix" nzSize="large">
                <input nz-input
                       [(ngModel)]="searchQuery"
                       (keyup.enter)="onSearch()"
                       placeholder="キーワードを入力..."
                       data-testid="search-input">
            </nz-input-group>
            <ng-template #searchSuffix>
                <button nz-button nzType="text" (click)="onSearch()" class="text-blue-600">
                    <span nz-icon nzType="arrow-right" nzTheme="outline"></span>
                </button>
            </ng-template>
        </div>

        <!-- Loading -->
        @if (searchService.isLoading()) {
            <div class="flex justify-center items-center py-24 bg-white rounded-2xl shadow-sm border border-gray-100" data-testid="loading">
                <nz-spin nzSimple [nzSize]="'large'"></nz-spin>
            </div>
        }

        <!-- Results -->
        @if (!searchService.isLoading() && hasSearched()) {
            <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
                <nz-tabs [nzSelectedIndex]="selectedTabIdx" (nzSelectedIndexChange)="onTabChange($event)">
                    <nz-tab>
                        <ng-template nz-tab-label>
                            すべて
                            @if (searchService.counts().total > 0) {
                                <nz-badge [nzCount]="searchService.counts().total" class="ml-2" [nzStyle]="{ backgroundColor: '#f3f4f6', color: '#374151', boxShadow: 'none' }"></nz-badge>
                            }
                        </ng-template>
                    </nz-tab>
                    <nz-tab>
                        <ng-template nz-tab-label>
                            ワークフロー
                            @if (searchService.counts().workflows > 0) {
                                <nz-badge [nzCount]="searchService.counts().workflows" class="ml-2" [nzStyle]="{ backgroundColor: '#dbeafe', color: '#1d4ed8', boxShadow: 'none' }"></nz-badge>
                            }
                        </ng-template>
                    </nz-tab>
                    <nz-tab>
                        <ng-template nz-tab-label>
                            プロジェクト
                            @if (searchService.counts().projects > 0) {
                                <nz-badge [nzCount]="searchService.counts().projects" class="ml-2" [nzStyle]="{ backgroundColor: '#e0e7ff', color: '#4338ca', boxShadow: 'none' }"></nz-badge>
                            }
                        </ng-template>
                    </nz-tab>
                    <nz-tab>
                        <ng-template nz-tab-label>
                            タスク
                            @if (searchService.counts().tasks > 0) {
                                <nz-badge [nzCount]="searchService.counts().tasks" class="ml-2" [nzStyle]="{ backgroundColor: '#dcfce7', color: '#15803d', boxShadow: 'none' }"></nz-badge>
                            }
                        </ng-template>
                    </nz-tab>
                    <nz-tab>
                        <ng-template nz-tab-label>
                            経費
                            @if (searchService.counts().expenses > 0) {
                                <nz-badge [nzCount]="searchService.counts().expenses" class="ml-2" [nzStyle]="{ backgroundColor: '#ffedd5', color: '#c2410c', boxShadow: 'none' }"></nz-badge>
                            }
                        </ng-template>
                    </nz-tab>
                </nz-tabs>
            </div>

            @if (filteredResults().length === 0) {
                <div class="flex flex-col items-center justify-center py-24 bg-white rounded-2xl shadow-sm border border-gray-100" data-testid="no-results">
                    <span nz-icon nzType="file-search" nzTheme="outline" class="text-6xl text-gray-300 mb-6"></span>
                    <p class="text-xl font-bold text-gray-900 mb-2">検索結果が見つかりませんでした</p>
                    <p class="text-gray-500">別のキーワードでお試しください。</p>
                </div>
            }

            <nz-list nzItemLayout="vertical" class="space-y-4">
                @for (result of filteredResults(); track result.id) {
                    <nz-list-item class="!bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer !p-5 !mb-4" data-testid="search-result-card">
                        <div class="flex gap-4">
                            <div class="w-12 h-12 rounded-lg bg-gray-50 flex-shrink-0 flex items-center justify-center text-gray-500">
                                <span nz-icon [nzType]="getTypeIcon(result.type)" nzTheme="outline" class="text-xl"></span>
                            </div>
                            <div class="flex-1 min-w-0">
                                <div class="mb-1">
                                    <a [routerLink]="result.url"
                                       class="text-lg font-bold text-gray-900 hover:text-blue-600 transition-colors no-underline"
                                       [innerHTML]="highlightText(result.title, searchQuery)"></a>
                                </div>
                                <div class="flex items-center gap-3 mb-2">
                                    <nz-tag [nzColor]="getTypeColor(result.type)">{{ getTypeLabel(result.type) }}</nz-tag>
                                    @if (result.status) {
                                        <nz-tag>{{ result.status }}</nz-tag>
                                    }
                                    <div class="flex items-center text-gray-400 text-xs gap-1 ml-auto">
                                        <span nz-icon nzType="calendar" nzTheme="outline" class="text-xs"></span>
                                        <span>{{ result.createdAt | date:'yyyy/MM/dd' }}</span>
                                    </div>
                                </div>
                                @if (result.description) {
                                    <p class="text-sm text-gray-600 leading-relaxed m-0" [innerHTML]="highlightText(result.description, searchQuery)"></p>
                                }
                            </div>
                        </div>
                    </nz-list-item>
                }
            </nz-list>
        }

        <!-- Error -->
        @if (searchService.error()) {
            <div class="flex flex-col items-center justify-center py-16 bg-red-50 rounded-2xl border border-red-100 mt-6">
                <span nz-icon nzType="exclamation-circle" nzTheme="outline" class="text-5xl text-red-500 mb-4"></span>
                <p class="text-lg font-bold text-red-700 mb-1">エラーが発生しました</p>
                <p class="text-red-500 m-0">{{ searchService.error() }}</p>
            </div>
        }
      </div>
    </div>
  `,
    styles: [`
        :host ::ng-deep mark {
            background-color: rgb(254 240 138);
            color: rgb(133 77 14);
            padding: 0 4px;
            border-radius: 4px;
            font-weight: 600;
        }
    `],
})
export class SearchResultsComponent implements OnInit {
    searchService = inject(SearchService);
    private route = inject(ActivatedRoute);
    private router = inject(Router);

    searchQuery = '';
    hasSearched = signal(false);
    selectedTabIdx = 0;

    private readonly categories = ['all', 'workflows', 'projects', 'tasks', 'expenses'];
    private readonly typeIcons: Record<string, string> = {
        workflow: 'file-text',
        project: 'folder',
        task: 'check-circle',
        expense: 'pay-circle',
    };
    private readonly typeLabels: Record<string, string> = {
        workflow: 'ワークフロー',
        project: 'プロジェクト',
        task: 'タスク',
        expense: '経費',
    };

    ngOnInit(): void {
        this.route.queryParams.subscribe((params) => {
            const q = params['q'];
            if (q) {
                this.searchQuery = q;
                this.hasSearched.set(true);
                this.searchService.search(q, this.categories[this.selectedTabIdx]);
            }
        });
    }

    onSearch(): void {
        if (!this.searchQuery.trim()) return;
        this.hasSearched.set(true);
        this.selectedTabIdx = 0;
        this.router.navigate(['/search'], {
            queryParams: { q: this.searchQuery },
        });
    }

    onTabChange(index: number): void {
        this.selectedTabIdx = index;
        if (this.searchQuery.trim()) {
            this.searchService.search(this.searchQuery, this.categories[index]);
        }
    }

    filteredResults(): SearchResult[] {
        return this.searchService.results();
    }

    getTypeIcon(type: string): string {
        return this.typeIcons[type] ?? 'question-circle';
    }

    getTypeLabel(type: string): string {
        return this.typeLabels[type] ?? type;
    }

    getTypeColor(type: string): string {
        switch (type) {
            case 'workflow': return 'blue';
            case 'project': return 'purple';
            case 'task': return 'green';
            case 'expense': return 'orange';
            default: return 'default';
        }
    }

    highlightText(text: string, query: string): string {
        if (!query) return text;
        const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`(${escaped})`, 'gi');
        return text.replace(regex, '<mark>$1</mark>');
    }
}
