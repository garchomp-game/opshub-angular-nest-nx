import { Injectable, computed, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError, switchMap, of, timeout } from 'rxjs';
import { CurrentUser, Role, ApiResponse } from '@shared/types';
import { LoggerService } from '../services/logger.service';

interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

const TOKEN_KEY = 'opshub_access_token';
const REFRESH_KEY = 'opshub_refresh_token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private logger = inject(LoggerService).createChild('AuthService');

  // ─── State ───
  private _currentUser = signal<CurrentUser | null>(null);
  private _accessToken = signal<string | null>(null);
  private _loading = signal(false);
  private _initializing = signal(false);
  private _readyResolve!: () => void;
  private _readyPromise = new Promise<void>((resolve) => {
    this._readyResolve = resolve;
  });
  private _logoutChannel: BroadcastChannel | null = null;

  // ─── Public Signals (readonly) ───
  readonly currentUser = this._currentUser.asReadonly();
  readonly isAuthenticated = computed(() => !!this._currentUser());
  readonly loading = this._loading.asReadonly();

  /**
   * 初期化中かどうか。
   * authInterceptor が初期化中の 401 で logout() を呼ばないようにするためのフラグ。
   */
  readonly initializing = this._initializing.asReadonly();

  /** Wait for initial auth state restoration from session */
  whenReady(): Promise<void> {
    return this._readyPromise;
  }

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
    // 遅延実行: constructor 完了前に this.http を使用すると
    // インスタンスが未完成の状態でインターセプターが呼ばれる可能性がある
    // Promise.resolve() で次のマイクロタスクに延期することで安全に実行する
    Promise.resolve().then(() => this.loadFromStorage());

    // ─── NA-05: visibilitychange トークンチェック ───
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && this.isAuthenticated()) {
          this.refreshToken().subscribe({
            error: () => this.logout(),
          });
        }
      });
    }

    // ─── NA-06: BroadcastChannel 複数タブ logout 同期 ───
    try {
      this._logoutChannel = new BroadcastChannel('opshub_auth');
      this._logoutChannel.onmessage = (event) => {
        if (event.data === 'logout') {
          this.clearState();
          this.router.navigate(['/login']);
        }
      };
    } catch {
      // BroadcastChannel 非対応ブラウザ (Safari < 15.4 など)
      this.logger.warn('BroadcastChannel not supported');
    }
  }

  // ─── Auth Operations ───

  login(email: string, password: string): Observable<ApiResponse<TokenPair>> {
    this._loading.set(true);
    this.logger.info('login attempt', { email });
    return this.http
      .post<ApiResponse<TokenPair>>('/api/auth/login', { email, password })
      .pipe(
        switchMap((res) => {
          if (res.success) {
            this.logger.info('login success, fetching profile');
            this.storeTokens(res.data);
            return this.fetchProfile().pipe(switchMap(() => of(res)));
          }
          this.logger.warn('login response unsuccessful');
          this._loading.set(false);
          return of(res);
        }),
        catchError((err) => {
          this.logger.error('login failed', { status: err.status, message: err.message });
          this._loading.set(false);
          return throwError(() => err);
        }),
      );
  }

  logout(): void {
    // 初期化中は logout しない（authInterceptor からの呼び出しを防ぐ）
    if (this._initializing()) {
      this.logger.debug('logout blocked: still initializing');
      return;
    }
    this.logger.info('logging out');
    this.http.post('/api/auth/logout', {}).subscribe({ error: () => { /* ignore */ } });
    this.clearState();
    this._logoutChannel?.postMessage('logout');
    this.router.navigate(['/login']);
  }

  refreshToken(): Observable<ApiResponse<TokenPair>> {
    const refreshTokenValue = sessionStorage.getItem(REFRESH_KEY);
    if (!refreshTokenValue) {
      this.logger.warn('refreshToken: no refresh token found');
      // 初期化中はステートクリアせず、エラーだけ返す
      if (!this._initializing()) {
        this.clearState();
      }
      return throwError(() => new Error('No refresh token'));
    }
    this.logger.debug('refreshToken: attempting refresh');
    return this.http
      .post<ApiResponse<TokenPair>>('/api/auth/refresh', { refreshToken: refreshTokenValue })
      .pipe(
        tap((res) => {
          if (res.success) {
            this.logger.debug('refreshToken: success');
            this.storeTokens(res.data);
          }
        }),
      );
  }

  getAccessToken(): string | null {
    // Signal 優先、fallback で sessionStorage 直接読み取り
    return this._accessToken() ?? sessionStorage.getItem(TOKEN_KEY);
  }

  // ─── Password Reset ───

  forgotPassword(email: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>('/api/auth/forgot-password', { email });
  }

  resetPassword(token: string, newPassword: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>('/api/auth/reset-password', { token, newPassword });
  }

  // ─── Private ───

  private fetchProfile(): Observable<CurrentUser | null> {
    this.logger.debug('fetchProfile: starting request');
    return this.http.get<ApiResponse<CurrentUser>>('/api/auth/me').pipe(
      tap((res) => {
        if (res.success) {
          this.logger.debug('fetchProfile: user loaded', { email: res.data?.email });
          this._currentUser.set(res.data);
        } else {
          this.logger.warn('fetchProfile: response not successful', { res });
        }
        this._loading.set(false);
      }),
      switchMap((res) => of(res.success ? res.data : null)),
      catchError((err) => {
        // エラーは必ず記録してから null を返す
        this.logger.error('fetchProfile failed', {
          status: err.status,
          message: err.message,
          name: err.name,
        });
        this._loading.set(false);
        return of(null);
      }),
    );
  }

  private storeTokens(tokens: TokenPair): void {
    this._accessToken.set(tokens.accessToken);
    sessionStorage.setItem(TOKEN_KEY, tokens.accessToken);
    sessionStorage.setItem(REFRESH_KEY, tokens.refreshToken);
  }

  /**
   * アプリ起動時にセッションストレージからトークンを復元し、プロフィールを取得する。
   * 失敗時はサイレントにログアウト状態になる（初期化中なのでリダイレクトしない）。
   */
  private loadFromStorage(): void {
    const token = sessionStorage.getItem(TOKEN_KEY);
    this.logger.debug('loadFromStorage', { tokenExists: !!token });
    if (token) {
      this._accessToken.set(token);
      this._initializing.set(true);
      this.fetchProfile().pipe(
        timeout(10_000),
      ).subscribe({
        next: (user) => {
          this.logger.debug('loadFromStorage: profile result', { email: user?.email ?? 'NULL' });
          if (!user) {
            this.clearState();
          }
        },
        complete: () => {
          this._initializing.set(false);
          this.logger.info('loadFromStorage: complete', { isAuthenticated: this.isAuthenticated() });
          this._readyResolve();
        },
        error: (err) => {
          this.logger.error('loadFromStorage: failed (possibly timed out)', { error: err?.message });
          this._initializing.set(false);
          this.clearState();
          this._readyResolve();
        },
      });
    } else {
      this.logger.debug('loadFromStorage: no token, resolving immediately');
      this._readyResolve();
    }
  }

  private clearState(): void {
    this.logger.debug('clearState: clearing tokens and user');
    this._currentUser.set(null);
    this._accessToken.set(null);
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(REFRESH_KEY);
  }
}
