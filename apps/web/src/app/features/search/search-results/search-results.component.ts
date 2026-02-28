import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  heroMagnifyingGlass, heroDocumentText, heroFolder,
  heroCheckCircle, heroCurrencyYen, heroCalendar,
  heroArrowRight, heroExclamationCircle,
} from '@ng-icons/heroicons/outline';
import { SearchService, SearchResult } from '../services/search.service';

@Component({
  selector: 'app-search-results',
  standalone: true,
  imports: [
    CommonModule, RouterLink, FormsModule, DatePipe,
    NgIcon,
  ],
  viewProviders: [provideIcons({
    heroMagnifyingGlass, heroDocumentText, heroFolder,
    heroCheckCircle, heroCurrencyYen, heroCalendar,
    heroArrowRight, heroExclamationCircle,
  })],
  template: `
  <div class="p-6 lg:p-8 max-w-4xl mx-auto space-y-6" data-testid="search-results-page">
    <!-- Search Input -->
    <div class="card bg-base-100 shadow-sm">
      <div class="card-body">
        <div class="join w-full">
          <label class="input join-item flex-1 flex items-center gap-2">
            <ng-icon name="heroMagnifyingGlass" class="text-base-content/40" />
            <input class="grow"
                [(ngModel)]="searchQuery"
                (keyup.enter)="onSearch()"
                placeholder="キーワードを入力..."
                data-testid="search-input">
          </label>
          <button class="btn btn-primary join-item" (click)="onSearch()">
            検索
          </button>
        </div>
      </div>
    </div>

    <!-- Loading -->
    @if (searchService.isLoading()) {
      <div class="flex justify-center items-center py-24 card bg-base-100 shadow-sm" data-testid="loading">
        <span class="loading loading-spinner loading-lg"></span>
      </div>
    }

    <!-- Results -->
    @if (!searchService.isLoading() && hasSearched()) {
      <!-- Tabs -->
      <div class="tabs tabs-border" role="tablist" data-testid="search-tabs">
        <button class="tab" [class.tab-active]="selectedTabIdx === 0" (click)="onTabChange(0)">
          すべて
          @if (searchService.counts().total > 0) {
            <span class="badge badge-sm ml-2">{{ searchService.counts().total }}</span>
          }
        </button>
        <button class="tab" [class.tab-active]="selectedTabIdx === 1" (click)="onTabChange(1)">
          ワークフロー
          @if (searchService.counts().workflows > 0) {
            <span class="badge badge-sm badge-info ml-2">{{ searchService.counts().workflows }}</span>
          }
        </button>
        <button class="tab" [class.tab-active]="selectedTabIdx === 2" (click)="onTabChange(2)">
          プロジェクト
          @if (searchService.counts().projects > 0) {
            <span class="badge badge-sm badge-secondary ml-2">{{ searchService.counts().projects }}</span>
          }
        </button>
        <button class="tab" [class.tab-active]="selectedTabIdx === 3" (click)="onTabChange(3)">
          タスク
          @if (searchService.counts().tasks > 0) {
            <span class="badge badge-sm badge-success ml-2">{{ searchService.counts().tasks }}</span>
          }
        </button>
        <button class="tab" [class.tab-active]="selectedTabIdx === 4" (click)="onTabChange(4)">
          経費
          @if (searchService.counts().expenses > 0) {
            <span class="badge badge-sm badge-warning ml-2">{{ searchService.counts().expenses }}</span>
          }
        </button>
      </div>

      @if (filteredResults().length === 0) {
        <div class="flex flex-col items-center justify-center py-24 card bg-base-100 shadow-sm" data-testid="no-results">
          <ng-icon name="heroMagnifyingGlass" class="text-6xl text-base-content/20 mb-6" />
          <p class="text-xl font-bold text-base-content mb-2">検索結果が見つかりませんでした</p>
          <p class="text-base-content/60">別のキーワードでお試しください。</p>
        </div>
      }

      <div class="space-y-4">
        @for (result of filteredResults(); track result.id) {
          <div class="card bg-base-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer" data-testid="search-result-card">
            <div class="card-body p-5">
              <div class="flex gap-4">
                <div class="w-12 h-12 rounded-lg bg-base-200 flex-shrink-0 flex items-center justify-center text-base-content/50">
                  <ng-icon [name]="getTypeIcon(result.type)" class="text-xl" />
                </div>
                <div class="flex-1 min-w-0">
                  <div class="mb-1">
                    <a [routerLink]="result.url"
                      class="text-lg font-bold hover:text-primary transition-colors no-underline"
                      [innerHTML]="highlightText(result.title, searchQuery)"></a>
                  </div>
                  <div class="flex items-center gap-3 mb-2">
                    <span class="badge" [class]="getTypeBadgeClass(result.type)">{{ getTypeLabel(result.type) }}</span>
                    @if (result.status) {
                      <span class="badge badge-ghost">{{ result.status }}</span>
                    }
                    <div class="flex items-center text-base-content/40 text-xs gap-1 ml-auto">
                      <ng-icon name="heroCalendar" class="text-xs" />
                      <span>{{ result.createdAt | date:'yyyy/MM/dd' }}</span>
                    </div>
                  </div>
                  @if (result.description) {
                    <p class="text-sm text-base-content/60 leading-relaxed m-0" [innerHTML]="highlightText(result.description, searchQuery)"></p>
                  }
                </div>
              </div>
            </div>
          </div>
        }
      </div>
    }

    <!-- Error -->
    @if (searchService.error()) {
      <div class="alert alert-error">
        <ng-icon name="heroExclamationCircle" class="text-xl" />
        <div>
          <h3 class="font-bold">エラーが発生しました</h3>
          <div class="text-sm">{{ searchService.error() }}</div>
        </div>
      </div>
    }
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
    workflow: 'heroDocumentText',
    project: 'heroFolder',
    task: 'heroCheckCircle',
    expense: 'heroCurrencyYen',
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
    return this.typeIcons[type] ?? 'heroDocumentText';
  }

  getTypeLabel(type: string): string {
    return this.typeLabels[type] ?? type;
  }

  getTypeBadgeClass(type: string): string {
    switch (type) {
      case 'workflow': return 'badge-info';
      case 'project': return 'badge-secondary';
      case 'task': return 'badge-success';
      case 'expense': return 'badge-warning';
      default: return 'badge-ghost';
    }
  }

  highlightText(text: string, query: string): string {
    if (!query) return text;
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escaped})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }
}
