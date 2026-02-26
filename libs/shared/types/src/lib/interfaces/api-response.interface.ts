export type ApiResponse<T> =
    | { success: true; data: T }
    | { success: false; error: ApiError };

export interface ApiError {
    code: string;
    message: string;
    fields?: Record<string, string>;
}
