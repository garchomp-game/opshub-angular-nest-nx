import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { AuthService } from './auth.service';

describe('AuthService', () => {
    let service: AuthService;
    let httpMock: HttpTestingController;

    beforeEach(() => {
        // localStorage モック
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
            expect(localStorage.getItem('accessToken')).toBe('access-123');
            expect(localStorage.getItem('refreshToken')).toBe('refresh-456');

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
            localStorage.setItem('refreshToken', 'old-refresh');

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
});
