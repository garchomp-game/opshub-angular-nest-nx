import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    // sessionStorage モック
    const store: Record<string, string> = {};
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key: string) => store[key] ?? null);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation((key: string, val: string) => { store[key] = val; });
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation((key: string) => { delete store[key]; });

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    vi.restoreAllMocks();
  });

  // ─── Initial state ───

  it('should start unauthenticated', () => {
    expect(service.isAuthenticated()).toBe(false);
    expect(service.currentUser()).toBeNull();
  });

  // ─── login ───

  describe('login', () => {
    it('should POST to /api/auth/login and store tokens', () => {
      const tokenPair = {
        accessToken: 'access-123',
        refreshToken: 'refresh-456',
        expiresIn: 900,
      };

      service.login('test@demo.com', 'Password123').subscribe((res) => {
        expect(res.success).toBe(true);
        if (res.success) {
          expect(res.data.accessToken).toBe('access-123');
        }
      });

      const loginReq = httpMock.expectOne('/api/auth/login');
      expect(loginReq.request.method).toBe('POST');
      expect(loginReq.request.body).toEqual({
        email: 'test@demo.com',
        password: 'Password123',
      });
      loginReq.flush({ success: true, data: tokenPair });

      // トークン保存確認
      expect(sessionStorage.getItem('opshub_access_token')).toBe('access-123');
      expect(sessionStorage.getItem('opshub_refresh_token')).toBe('refresh-456');

      // fetchProfile が呼ばれる
      const profileReq = httpMock.expectOne('/api/auth/me');
      profileReq.flush({
        success: true,
        data: {
          id: 'user-1',
          email: 'test@demo.com',
          displayName: 'テスト',
          tenantIds: ['t-1'],
          roles: [{ tenantId: 't-1', role: 'member' }],
        },
      });
    });
  });

  // ─── refreshToken ───

  describe('refreshToken', () => {
    it('should POST to /api/auth/refresh', () => {
      sessionStorage.setItem('opshub_refresh_token', 'old-refresh');

      service.refreshToken().subscribe((res) => {
        expect(res.success).toBe(true);
      });

      const req = httpMock.expectOne('/api/auth/refresh');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ refreshToken: 'old-refresh' });
      req.flush({ success: true, data: { accessToken: 'new', refreshToken: 'new-r', expiresIn: 900 } });
    });
  });

  // ─── getAccessToken ───

  describe('getAccessToken', () => {
    it('should return null when not authenticated', () => {
      expect(service.getAccessToken()).toBeNull();
    });
  });

  // ─── hasRole ───

  describe('hasRole', () => {
    it('should return false when not authenticated', () => {
      expect(service.hasRole('member')).toBe(false);
    });
  });

  // ─── forgotPassword ───

  describe('forgotPassword', () => {
    it('should POST to /api/auth/forgot-password', () => {
      service.forgotPassword('test@demo.com').subscribe((res) => {
        expect(res.message).toBeDefined();
      });

      const req = httpMock.expectOne('/api/auth/forgot-password');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ email: 'test@demo.com' });
      req.flush({ message: 'パスワードリセットメールを送信しました' });
    });
  });

  // ─── resetPassword ───

  describe('resetPassword', () => {
    it('should POST to /api/auth/reset-password', () => {
      service.resetPassword('token-123', 'NewPassword1').subscribe((res) => {
        expect(res.message).toBeDefined();
      });

      const req = httpMock.expectOne('/api/auth/reset-password');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ token: 'token-123', newPassword: 'NewPassword1' });
      req.flush({ message: 'パスワードが正常にリセットされました' });
    });
  });

  // ─── whenReady / initialization ───

  describe('whenReady (no token)', () => {
    it('should resolve immediately when no token in sessionStorage', async () => {
      // loadFromStorage runs via Promise.resolve().then(), flush microtask
      await vi.waitFor(async () => {
        await service.whenReady();
      });
      expect(service.isAuthenticated()).toBe(false);
    });
  });
});

// ─── Separate suite: initialization with token ───

describe('AuthService initialization with token', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let store: Record<string, string>;

  beforeEach(() => {
    store = { opshub_access_token: 'test-token' };
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key: string) => store[key] ?? null);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation((key: string, val: string) => { store[key] = val; });
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation((key: string) => { delete store[key]; });

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    vi.restoreAllMocks();
  });

  it('should resolve whenReady after successful profile fetch', async () => {
    // Wait for microtask to fire loadFromStorage
    await new Promise(resolve => setTimeout(resolve, 0));

    // Respond to fetchProfile
    const profileReq = httpMock.expectOne('/api/auth/me');
    profileReq.flush({
      success: true,
      data: {
        id: 'user-1',
        email: 'test@demo.com',
        displayName: 'テスト',
        tenantIds: ['t-1'],
        roles: [{ tenantId: 't-1', role: 'member' }],
      },
    });

    await service.whenReady();
    expect(service.isAuthenticated()).toBe(true);
  });

  it('should resolve whenReady after failed profile fetch', async () => {
    await new Promise(resolve => setTimeout(resolve, 0));

    // fetchProfile catches error and returns of(null)
    const profileReq = httpMock.expectOne('/api/auth/me');
    profileReq.flush({ success: false }, { status: 200, statusText: 'OK' });

    await service.whenReady();
    expect(service.isAuthenticated()).toBe(false);
  });

  it('should block logout while initializing', async () => {
    await new Promise(resolve => setTimeout(resolve, 0));

    // At this point fetchProfile is in-flight, _initializing is true
    expect(service.initializing()).toBe(true);

    // logout should be no-op
    service.logout();
    // Token should still be in storage (not cleared)
    expect(store['opshub_access_token']).toBe('test-token');

    // Complete the pending request
    const profileReq = httpMock.expectOne('/api/auth/me');
    profileReq.flush({
      success: true,
      data: {
        id: 'user-1',
        email: 'test@demo.com',
        displayName: 'テスト',
        tenantIds: ['t-1'],
        roles: [{ tenantId: 't-1', role: 'member' }],
      },
    });

    await service.whenReady();
    expect(service.initializing()).toBe(false);
  });
});

// ─── NA-05: visibilitychange token check ───

describe('AuthService visibilitychange', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    const store: Record<string, string> = {};
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key: string) => store[key] ?? null);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation((key: string, val: string) => { store[key] = val; });
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation((key: string) => { delete store[key]; });

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    vi.restoreAllMocks();
  });

  it('should call refreshToken on visibilitychange when authenticated', () => {
    // Mock isAuthenticated to return true
    Object.defineProperty(service, 'isAuthenticated', { value: () => true });
    const refreshSpy = vi.spyOn(service, 'refreshToken').mockReturnValue(
      new Observable<never>((subscriber) => subscriber.complete()),
    );

    // Simulate visibility change
    Object.defineProperty(document, 'visibilityState', { value: 'visible', writable: true });
    document.dispatchEvent(new Event('visibilitychange'));

    expect(refreshSpy).toHaveBeenCalled();
  });

  it('should not call refreshToken when not authenticated', () => {
    const refreshSpy = vi.spyOn(service, 'refreshToken');

    Object.defineProperty(document, 'visibilityState', { value: 'visible', writable: true });
    document.dispatchEvent(new Event('visibilitychange'));

    expect(refreshSpy).not.toHaveBeenCalled();
  });

  it('should call logout when refreshToken fails on visibilitychange', () => {
    Object.defineProperty(service, 'isAuthenticated', { value: () => true });
    vi.spyOn(service, 'refreshToken').mockReturnValue(
      new Observable<never>((subscriber) => subscriber.error(new Error('token expired'))),
    );
    const logoutSpy = vi.spyOn(service, 'logout').mockImplementation(() => { /* noop */ });

    Object.defineProperty(document, 'visibilityState', { value: 'visible', writable: true });
    document.dispatchEvent(new Event('visibilitychange'));

    expect(logoutSpy).toHaveBeenCalled();
  });
});

// ─── NA-06: BroadcastChannel logout sync ───

describe('AuthService BroadcastChannel', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    const store: Record<string, string> = {};
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key: string) => store[key] ?? null);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation((key: string, val: string) => { store[key] = val; });
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation((key: string) => { delete store[key]; });

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([{ path: '**', children: [] }]),
      ],
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    // logout() が POST /api/auth/logout を発行するので flush する
    httpMock.match('/api/auth/logout').forEach((req) => req.flush({}));
    httpMock.verify();
    vi.restoreAllMocks();
  });

  it('should broadcast logout message when logout is called', () => {
    const postMessageSpy = vi.spyOn(BroadcastChannel.prototype, 'postMessage');

    service.logout();

    expect(postMessageSpy).toHaveBeenCalledWith('logout');
  });

  it('should gracefully handle missing _logoutChannel (BroadcastChannel fallback)', () => {
    // _logoutChannel を null にしてもエラーにならないこと（optional chaining で安全）
    (service as unknown as Record<string, unknown>)['_logoutChannel'] = null;

    expect(() => service.logout()).not.toThrow();
  });
});
