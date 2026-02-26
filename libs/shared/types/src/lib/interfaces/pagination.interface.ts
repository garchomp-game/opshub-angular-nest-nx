export interface PaginatedResult<T> {
    data: T[];
    meta: PaginationMeta;
}

export interface PaginationMeta {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface PaginationQuery {
    page?: number;
    limit?: number;
}
