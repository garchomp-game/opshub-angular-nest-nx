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
