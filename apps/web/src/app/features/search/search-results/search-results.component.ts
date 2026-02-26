import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SearchService, SearchResult } from '../services/search.service';

@Component({
    selector: 'app-search-results',
    standalone: true,
    imports: [
        RouterLink, FormsModule, DatePipe,
        MatTabsModule, MatCardModule, MatChipsModule,
        MatIconModule, MatFormFieldModule, MatInputModule,
        MatProgressSpinnerModule, MatBadgeModule, MatButtonModule,
    ],
    template: `
    <div class="search-container" data-testid="search-results-page">
      <!-- Search Input -->
      <mat-form-field appearance="outline" class="search-field">
        <mat-label>検索</mat-label>
        <input matInput
               [(ngModel)]="searchQuery"
               (keyup.enter)="onSearch()"
               placeholder="キーワードを入力..."
               data-testid="search-input">
        <mat-icon matSuffix (click)="onSearch()" style="cursor: pointer">search</mat-icon>
      </mat-form-field>

      <!-- Loading -->
      @if (searchService.isLoading()) {
        <div class="loading-container">
          <mat-spinner diameter="40"></mat-spinner>
        </div>
      }

      <!-- Results -->
      @if (!searchService.isLoading() && hasSearched()) {
        <mat-tab-group (selectedTabChange)="onTabChange($event)" [selectedIndex]="selectedTabIndex()">
          <mat-tab>
            <ng-template mat-tab-label>
              すべて
              @if (searchService.counts().total > 0) {
                <span class="tab-badge">{{ searchService.counts().total }}</span>
              }
            </ng-template>
          </mat-tab>
          <mat-tab>
            <ng-template mat-tab-label>
              ワークフロー
              @if (searchService.counts().workflows > 0) {
                <span class="tab-badge">{{ searchService.counts().workflows }}</span>
              }
            </ng-template>
          </mat-tab>
          <mat-tab>
            <ng-template mat-tab-label>
              プロジェクト
              @if (searchService.counts().projects > 0) {
                <span class="tab-badge">{{ searchService.counts().projects }}</span>
              }
            </ng-template>
          </mat-tab>
          <mat-tab>
            <ng-template mat-tab-label>
              タスク
              @if (searchService.counts().tasks > 0) {
                <span class="tab-badge">{{ searchService.counts().tasks }}</span>
              }
            </ng-template>
          </mat-tab>
          <mat-tab>
            <ng-template mat-tab-label>
              経費
              @if (searchService.counts().expenses > 0) {
                <span class="tab-badge">{{ searchService.counts().expenses }}</span>
              }
            </ng-template>
          </mat-tab>
        </mat-tab-group>

        @if (filteredResults().length === 0) {
          <div class="empty-state" data-testid="no-results">
            <mat-icon>search_off</mat-icon>
            <p>検索結果が見つかりませんでした</p>
          </div>
        }

        <div class="results-list">
          @for (result of filteredResults(); track result.id) {
            <mat-card class="result-card" data-testid="search-result-card">
              <mat-card-header>
                <mat-icon mat-card-avatar class="type-icon">{{ getTypeIcon(result.type) }}</mat-icon>
                <mat-card-title>
                  <a [routerLink]="result.url" [innerHTML]="highlightText(result.title, searchQuery)"></a>
                </mat-card-title>
                <mat-card-subtitle>
                  <mat-chip class="type-chip" [class]="'type-' + result.type">
                    {{ getTypeLabel(result.type) }}
                  </mat-chip>
                  @if (result.status) {
                    <mat-chip class="status-chip">{{ result.status }}</mat-chip>
                  }
                  <span class="date">{{ result.createdAt | date:'yyyy/MM/dd' }}</span>
                </mat-card-subtitle>
              </mat-card-header>
              @if (result.description) {
                <mat-card-content>
                  <p class="snippet" [innerHTML]="highlightText(result.description, searchQuery)"></p>
                </mat-card-content>
              }
            </mat-card>
          }
        </div>
      }

      <!-- Error -->
      @if (searchService.error()) {
        <div class="error-state">
          <mat-icon>error</mat-icon>
          <p>{{ searchService.error() }}</p>
        </div>
      }
    </div>
  `,
    styles: [`
    .search-container { max-width: 800px; margin: 0 auto; }
    .search-field { width: 100%; margin-bottom: 16px; }
    .loading-container { display: flex; justify-content: center; padding: 40px; }
    .results-list { margin-top: 16px; }
    .result-card { margin-bottom: 12px; cursor: pointer; }
    .result-card:hover { box-shadow: 0 4px 8px rgba(0,0,0,0.12); }
    .type-icon { font-size: 24px; color: #666; }
    .snippet { color: #666; font-size: 14px; }
    :host ::ng-deep mark { background-color: #fff176; padding: 0 2px; border-radius: 2px; }
    .tab-badge {
      display: inline-block;
      background: #e0e0e0;
      color: #333;
      border-radius: 12px;
      padding: 0 8px;
      font-size: 12px;
      margin-left: 6px;
      min-width: 20px;
      text-align: center;
    }
    .status-chip { margin-left: 8px; }
    .date { margin-left: 12px; color: #999; font-size: 12px; }
    .empty-state, .error-state {
      display: flex; flex-direction: column; align-items: center;
      padding: 60px 20px; color: #999;
    }
    .empty-state mat-icon, .error-state mat-icon { font-size: 48px; width: 48px; height: 48px; margin-bottom: 16px; }
    .error-state { color: #f44336; }
    mat-card-subtitle { display: flex; align-items: center; gap: 4px; }
  `],
})
export class SearchResultsComponent implements OnInit {
    searchService = inject(SearchService);
    private route = inject(ActivatedRoute);
    private router = inject(Router);

    searchQuery = '';
    hasSearched = signal(false);
    selectedTabIndex = signal(0);

    private readonly categories = ['all', 'workflows', 'projects', 'tasks', 'expenses'];
    private readonly typeIcons: Record<string, string> = {
        workflow: 'description',
        project: 'folder',
        task: 'check_circle',
        expense: 'payments',
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
                this.searchService.search(q, this.categories[this.selectedTabIndex()]);
            }
        });
    }

    onSearch(): void {
        if (!this.searchQuery.trim()) return;
        this.hasSearched.set(true);
        this.selectedTabIndex.set(0);
        this.router.navigate(['/search'], {
            queryParams: { q: this.searchQuery },
        });
    }

    onTabChange(event: any): void {
        this.selectedTabIndex.set(event.index);
        if (this.searchQuery.trim()) {
            this.searchService.search(this.searchQuery, this.categories[event.index]);
        }
    }

    filteredResults(): SearchResult[] {
        return this.searchService.results();
    }

    getTypeIcon(type: string): string {
        return this.typeIcons[type] ?? 'help';
    }

    getTypeLabel(type: string): string {
        return this.typeLabels[type] ?? type;
    }

    highlightText(text: string, query: string): string {
        if (!query) return text;
        const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`(${escaped})`, 'gi');
        return text.replace(regex, '<mark>$1</mark>');
    }
}
