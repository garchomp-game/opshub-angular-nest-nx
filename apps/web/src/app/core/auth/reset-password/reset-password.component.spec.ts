import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { ResetPasswordComponent } from './reset-password.component';
import { AuthService } from '../auth.service';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';

describe('ResetPasswordComponent', () => {
    let component: ResetPasswordComponent;
    let fixture: ComponentFixture<ResetPasswordComponent>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let authServiceMock: Record<string, any>;
    let router: Router;

    beforeEach(async () => {
        authServiceMock = {
            resetPassword: vi.fn(),
            forgotPassword: vi.fn(),
            login: vi.fn(),
            loading: signal(false),
            isAuthenticated: signal(false),
            currentUser: signal(null),
            getAccessToken: vi.fn().mockReturnValue(null),
            hasRole: vi.fn().mockReturnValue(false),
            isAdmin: signal(false),
            isPm: signal(false),
            canApprove: signal(false),
        };

        await TestBed.configureTestingModule({
            imports: [ResetPasswordComponent],
            providers: [
                { provide: AuthService, useValue: authServiceMock },
                { provide: ActivatedRoute, useValue: { queryParams: of({}) } },
                provideHttpClient(),
                provideHttpClientTesting(),
                provideRouter([
                    { path: 'login', component: ResetPasswordComponent },
                    { path: 'forgot-password', component: ResetPasswordComponent },
                ]),
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(ResetPasswordComponent);
        component = fixture.componentInstance;
        router = TestBed.inject(Router);
        vi.spyOn(router, 'navigate').mockResolvedValue(true);
        // Trigger ngOnInit first (subscribes to empty queryParams → token stays null)
        fixture.detectChanges();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    /** Helper: set token and re-render */
    function setToken(token: string) {
        component.token.set(token);
        fixture.detectChanges();
    }

    // ─── Rendering ───

    it('should render reset-password form when token is present', () => {
        setToken('test-token-123');
        const el = fixture.nativeElement as HTMLElement;
        expect(el.querySelector('[data-testid="reset-password-form"]')).toBeTruthy();
        expect(el.querySelector('[data-testid="new-password-input"]')).toBeTruthy();
        expect(el.querySelector('[data-testid="confirm-password-input"]')).toBeTruthy();
        expect(el.querySelector('[data-testid="submit-button"]')).toBeTruthy();
        expect(el.querySelector('[data-testid="password-requirements"]')).toBeTruthy();
    });

    it('should have token signal set correctly', () => {
        setToken('test-token-123');
        expect(component.token()).toBe('test-token-123');
    });

    // ─── Token missing ───

    it('should show error when no token is provided', () => {
        expect(component.token()).toBeNull();
        const el = fixture.nativeElement as HTMLElement;
        expect(el.querySelector('[data-testid="token-error"]')).toBeTruthy();
        expect(el.querySelector('[data-testid="reset-password-form"]')).toBeNull();
    });

    // ─── Validation ───

    it('should have invalid form when empty', () => {
        expect(component.form.valid).toBe(false);
    });

    it('should be invalid with short password', () => {
        component.form.setValue({ newPassword: 'Ab1', confirmPassword: 'Ab1' });
        expect(component.form.get('newPassword')?.valid).toBe(false);
    });

    it('should be invalid with non-alphanumeric password', () => {
        component.form.setValue({ newPassword: 'abcdefgh', confirmPassword: 'abcdefgh' });
        expect(component.form.get('newPassword')?.valid).toBe(false);
    });

    it('should be valid with proper password', () => {
        component.form.setValue({ newPassword: 'Password1', confirmPassword: 'Password1' });
        expect(component.form.valid).toBe(true);
    });

    it('should be invalid when passwords do not match', () => {
        component.form.setValue({ newPassword: 'Password1', confirmPassword: 'Different1' });
        expect(component.form.hasError('passwordMismatch')).toBe(true);
    });

    // ─── Submit success ───

    it('should show success message and redirect to login after successful reset', () => {
        vi.useFakeTimers();
        try {
            setToken('test-token-123');
            authServiceMock['resetPassword'].mockReturnValue(of({ message: 'ok' }));
            component.form.setValue({ newPassword: 'Password1', confirmPassword: 'Password1' });
            component.onSubmit();
            fixture.detectChanges();

            expect(authServiceMock['resetPassword']).toHaveBeenCalledWith('test-token-123', 'Password1');
            expect(component.success()).toBe(true);

            const el = fixture.nativeElement as HTMLElement;
            expect(el.querySelector('[data-testid="success-message"]')).toBeTruthy();

            vi.advanceTimersByTime(2000);
            expect(router.navigate).toHaveBeenCalledWith(['/login']);
        } finally {
            vi.useRealTimers();
        }
    });

    // ─── Submit error ───

    it('should show error message on failure', () => {
        setToken('test-token-123');
        authServiceMock['resetPassword'].mockReturnValue(
            throwError(() => ({ error: { message: 'トークンが無効です' } })),
        );
        component.form.setValue({ newPassword: 'Password1', confirmPassword: 'Password1' });
        component.onSubmit();
        fixture.detectChanges();

        expect(component.errorMessage()).toBe('トークンが無効です');
        const el = fixture.nativeElement as HTMLElement;
        expect(el.querySelector('[data-testid="error-message"]')).toBeTruthy();
    });

    // ─── No submit when invalid ───

    it('should not call service when form is invalid', () => {
        setToken('test-token-123');
        component.onSubmit();
        expect(authServiceMock['resetPassword']).not.toHaveBeenCalled();
    });
});
