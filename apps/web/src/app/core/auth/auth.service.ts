import { Injectable, computed, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { CurrentUser, Role, ApiResponse } from '@shared/types';

interface TokenPair {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
    private http = inject(HttpClient);
    private router = inject(Router);

    // ─── State ───
    private _currentUser = signal<CurrentUser | null>(null);
    private _accessToken = signal<string | null>(null);
    private _loading = signal(false);

    // ─── Public Signals (readonly) ───
    readonly currentUser = this._currentUser.asReadonly();
    readonly isAuthenticated = computed(() => !!this._currentUser());
    readonly loading = this._loading.asReadonly();

    /** ロール判定 */
    hasRole(...roles: (Role | string)[]): boolean {
        const user = this._currentUser();
        if (!user) return false;
        return user.roles.some((r) => roles.includes(r.role));
    }

    /** よく使うロール判定 computed */
    readonly isAdmin = computed(() => this.hasRole(Role.TENANT_ADMIN, Role.IT_ADMIN));
    readonly isPm = computed(() => this.hasRole(Role.PM));
    readonly canApprove = computed(() => this.hasRole(Role.APPROVER, Role.TENANT_ADMIN));

    constructor() {
        this.loadFromStorage();
    }

    // ─── Auth Operations ───

    login(email: string, password: string): Observable<ApiResponse<TokenPair>> {
        this._loading.set(true);
        return this.http
            .post<ApiResponse<TokenPair>>('/api/auth/login', { email, password })
            .pipe(
                tap((res) => {
                    if (res.success) {
                        this.storeTokens(res.data);
                        this.fetchProfile();
                    }
                }),
                catchError((err) => {
                    this._loading.set(false);
                    return throwError(() => err);
                }),
            );
    }

    logout(): void {
        this.http.post('/api/auth/logout', {}).subscribe({ error: () => { } });
        this.clearState();
        this.router.navigate(['/login']);
    }

    refreshToken(): Observable<ApiResponse<TokenPair>> {
        const refreshTokenValue = localStorage.getItem('refreshToken');
        if (!refreshTokenValue) {
            this.clearState();
            return throwError(() => new Error('No refresh token'));
        }
        return this.http
            .post<ApiResponse<TokenPair>>('/api/auth/refresh', { refreshToken: refreshTokenValue })
            .pipe(
                tap((res) => {
                    if (res.success) this.storeTokens(res.data);
                }),
            );
    }

    getAccessToken(): string | null {
        return this._accessToken();
    }

    // ─── Private ───

    private fetchProfile(): void {
        this.http.get<ApiResponse<CurrentUser>>('/api/auth/me').subscribe({
            next: (res) => {
                if (res.success) this._currentUser.set(res.data);
                this._loading.set(false);
            },
            error: () => this._loading.set(false),
        });
    }

    private storeTokens(tokens: TokenPair): void {
        this._accessToken.set(tokens.accessToken);
        localStorage.setItem('accessToken', tokens.accessToken);
        localStorage.setItem('refreshToken', tokens.refreshToken);
    }

    private loadFromStorage(): void {
        const token = localStorage.getItem('accessToken');
        if (token) {
            this._accessToken.set(token);
            this.fetchProfile();
        }
    }

    private clearState(): void {
        this._currentUser.set(null);
        this._accessToken.set(null);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
    }
}
