import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';

// ─── Interfaces ───

export interface SearchResult {
    id: string;
    type: 'workflow' | 'project' | 'task' | 'expense';
    title: string;
    description?: string;
    status?: string;
    url: string;
    createdAt: string;
}

export interface SearchResponse {
    results: SearchResult[];
    counts: {
        workflows: number;
        projects: number;
        tasks: number;
        expenses: number;
        total: number;
    };
    page: number;
    hasMore: boolean;
}

@Injectable({ providedIn: 'root' })
export class SearchService {
    private http = inject(HttpClient);

    // ─── Signal State ───
    private _results = signal<SearchResult[]>([]);
    private _counts = signal<SearchResponse['counts']>({
        workflows: 0,
        projects: 0,
        tasks: 0,
        expenses: 0,
        total: 0,
    });
    private _isLoading = signal(false);
    private _error = signal<string | null>(null);

    // ─── Public Signals ───
    readonly results = this._results.asReadonly();
    readonly counts = this._counts.asReadonly();
    readonly isLoading = this._isLoading.asReadonly();
    readonly error = this._error.asReadonly();

    // ─── Search ───

    search(query: string, category: string = 'all', page: number = 1): void {
        if (!query.trim()) {
            this._results.set([]);
            this._counts.set({ workflows: 0, projects: 0, tasks: 0, expenses: 0, total: 0 });
            return;
        }

        this._isLoading.set(true);
        this._error.set(null);

        let params = new HttpParams()
            .set('q', query)
            .set('category', category)
            .set('page', page.toString());

        this.http
            .get<SearchResponse>('/api/search', { params })
            .subscribe({
                next: (res) => {
                    this._results.set(res.results);
                    this._counts.set(res.counts);
                    this._isLoading.set(false);
                },
                error: (err) => {
                    this._error.set(err.error?.message || '検索に失敗しました');
                    this._isLoading.set(false);
                },
            });
    }

    // ─── Reset ───

    clear(): void {
        this._results.set([]);
        this._counts.set({ workflows: 0, projects: 0, tasks: 0, expenses: 0, total: 0 });
        this._error.set(null);
    }
}
