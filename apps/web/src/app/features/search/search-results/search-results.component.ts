import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TabsModule } from 'primeng/tabs';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { SearchService, SearchResult } from '../services/search.service';

@Component({
  selector: 'app-search-results',
  standalone: true,
  imports: [
    CommonModule, RouterLink, FormsModule, DatePipe,
    TabsModule, CardModule, TagModule, ButtonModule, InputTextModule, ProgressSpinnerModule,
  ],
  template: `
  <div class="p-6 lg:p-8 max-w-4xl mx-auto space-y-6" data-testid="search-results-page">
    <!-- Search Input -->
    <p-card>
      <div class="flex gap-2">
        <div class="flex items-center gap-2 flex-1 relative">
          <i class="pi pi-search absolute left-3" style="color: var(--p-text-muted-color)"></i>
          <input pInputText class="w-full pl-10"
              [(ngModel)]="searchQuery"
              (keyup.enter)="onSearch()"
              placeholder="キーワードを入力..."
              data-testid="search-input">
        </div>
        <p-button label="検索" (onClick)="onSearch()" />
      </div>
    </p-card>

    <!-- Loading -->
    @if (searchService.isLoading()) {
      <div class="flex justify-center items-center py-24" data-testid="loading">
        <p-progressspinner strokeWidth="4" />
      </div>
    }

    <!-- Results -->
    @if (!searchService.isLoading() && hasSearched()) {
      <!-- Tabs -->
      <p-tabs [(value)]="selectedTabIdx" (valueChange)="onTabChange($any($event))" data-testid="search-tabs">
        <p-tablist>
          <p-tab [value]="0">
            すべて
            @if (searchService.counts().total > 0) {
              <p-tag [value]="'' + searchService.counts().total" [rounded]="true" class="ml-2" severity="secondary" />
            }
          </p-tab>
          <p-tab [value]="1">
            ワークフロー
            @if (searchService.counts().workflows > 0) {
              <p-tag [value]="'' + searchService.counts().workflows" [rounded]="true" class="ml-2" severity="info" />
            }
          </p-tab>
          <p-tab [value]="2">
            プロジェクト
            @if (searchService.counts().projects > 0) {
              <p-tag [value]="'' + searchService.counts().projects" [rounded]="true" class="ml-2" severity="secondary" />
            }
          </p-tab>
          <p-tab [value]="3">
            タスク
            @if (searchService.counts().tasks > 0) {
              <p-tag [value]="'' + searchService.counts().tasks" [rounded]="true" class="ml-2" severity="success" />
            }
          </p-tab>
          <p-tab [value]="4">
            経費
            @if (searchService.counts().expenses > 0) {
              <p-tag [value]="'' + searchService.counts().expenses" [rounded]="true" class="ml-2" severity="warn" />
            }
          </p-tab>
        </p-tablist>
      </p-tabs>

      @if (filteredResults().length === 0) {
        <div class="flex flex-col items-center justify-center py-24 text-center" data-testid="no-results">
          <i class="pi pi-search text-6xl mb-6" style="color: var(--p-text-muted-color); opacity: 0.2"></i>
          <p class="text-xl font-bold mb-2">検索結果が見つかりませんでした</p>
          <p style="color: var(--p-text-muted-color)">別のキーワードでお試しください。</p>
        </div>
      }

      <div class="space-y-4">
        @for (result of filteredResults(); track result.id) {
          <p-card styleClass="hover:shadow-md transition-shadow cursor-pointer" data-testid="search-result-card">
            <div class="flex gap-4">
              <div class="w-12 h-12 rounded-lg flex-shrink-0 flex items-center justify-center"
                  style="background: var(--p-surface-100); color: var(--p-text-muted-color)">
                <i [class]="getTypeIcon(result.type)" class="text-xl"></i>
              </div>
              <div class="flex-1 min-w-0">
                <div class="mb-1">
                  <a [routerLink]="result.url"
                    class="text-lg font-bold hover:text-primary transition-colors no-underline"
                    [innerHTML]="highlightText(result.title, searchQuery)"></a>
                </div>
                <div class="flex items-center gap-3 mb-2">
                  <p-tag [value]="getTypeLabel(result.type)" [severity]="getTypeSeverity(result.type)" />
                  @if (result.status) {
                    <p-tag [value]="result.status" severity="secondary" />
                  }
                  <div class="flex items-center text-xs gap-1 ml-auto" style="color: var(--p-text-muted-color); opacity: 0.6">
                    <i class="pi pi-calendar text-xs"></i>
                    <span>{{ result.createdAt | date:'yyyy/MM/dd' }}</span>
                  </div>
                </div>
                @if (result.description) {
                  <p class="text-sm leading-relaxed m-0" style="color: var(--p-text-muted-color)" [innerHTML]="highlightText(result.description, searchQuery)"></p>
                }
              </div>
            </div>
          </p-card>
        }
      </div>
    }

    <!-- Error -->
    @if (searchService.error()) {
      <div class="flex items-center gap-3 rounded-lg p-4" style="background: var(--p-red-50); color: var(--p-red-700);">
        <i class="pi pi-exclamation-circle text-xl"></i>
        <div>
          <h3 class="font-bold m-0">エラーが発生しました</h3>
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
    workflow: 'pi pi-file',
    project: 'pi pi-folder',
    task: 'pi pi-check-circle',
    expense: 'pi pi-money-bill',
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
    return this.typeIcons[type] ?? 'pi pi-file';
  }

  getTypeLabel(type: string): string {
    return this.typeLabels[type] ?? type;
  }

  getTypeSeverity(type: string): 'info' | 'secondary' | 'success' | 'warn' | 'contrast' {
    switch (type) {
      case 'workflow': return 'info';
      case 'project': return 'secondary';
      case 'task': return 'success';
      case 'expense': return 'warn';
      default: return 'secondary';
    }
  }

  highlightText(text: string, query: string): string {
    if (!query) return text;
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escaped})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }
}
