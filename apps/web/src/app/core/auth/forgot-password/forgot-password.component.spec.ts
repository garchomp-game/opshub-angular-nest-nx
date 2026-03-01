import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { ForgotPasswordComponent } from './forgot-password.component';
import { AuthService } from '../auth.service';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';

describe('ForgotPasswordComponent', () => {
    let component: ForgotPasswordComponent;
    let fixture: ComponentFixture<ForgotPasswordComponent>;
    let authServiceMock: any;

    beforeEach(async () => {
        authServiceMock = {
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
            imports: [ForgotPasswordComponent],
            providers: [
                { provide: AuthService, useValue: authServiceMock },
                provideHttpClient(),
                provideHttpClientTesting(),
                provideRouter([{ path: 'login', component: ForgotPasswordComponent }]),
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(ForgotPasswordComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    // ─── Rendering ───

    it('should render forgot-password form', () => {
        const el = fixture.nativeElement as HTMLElement;
        expect(el.querySelector('[data-testid="forgot-password-form"]')).toBeTruthy();
        expect(el.querySelector('[data-testid="email-input"]')).toBeTruthy();
        expect(el.querySelector('[data-testid="submit-button"]')).toBeTruthy();
        expect(el.querySelector('[data-testid="back-to-login"]')).toBeTruthy();
    });

    // ─── Validation ───

    it('should have invalid form when empty', () => {
        expect(component.form.valid).toBe(false);
    });

    it('should become valid with correct email', () => {
        component.form.setValue({ email: 'test@demo.com' });
        expect(component.form.valid).toBe(true);
    });

    it('should be invalid with bad email', () => {
        component.form.setValue({ email: 'not-email' });
        expect(component.form.get('email')!.valid).toBe(false);
    });

    // ─── Submit success ───

    it('should show success message after successful submission', () => {
        authServiceMock.forgotPassword.mockReturnValue(of({ message: 'ok' }));
        component.form.setValue({ email: 'test@demo.com' });
        component.onSubmit();
        fixture.detectChanges();

        expect(authServiceMock.forgotPassword).toHaveBeenCalledWith('test@demo.com');
        expect(component.sent()).toBe(true);
        const el = fixture.nativeElement as HTMLElement;
        expect(el.querySelector('[data-testid="success-message"]')).toBeTruthy();
        expect(el.querySelector('[data-testid="success-message"]')!.textContent).toContain(
            'パスワードリセットメールを送信しました',
        );
    });

    // ─── Submit error ───

    it('should show error message on failure', () => {
        authServiceMock.forgotPassword.mockReturnValue(
            throwError(() => ({ error: { message: 'サーバーエラー' } })),
        );
        component.form.setValue({ email: 'test@demo.com' });
        component.onSubmit();
        fixture.detectChanges();

        expect(component.errorMessage()).toBe('サーバーエラー');
        const el = fixture.nativeElement as HTMLElement;
        expect(el.querySelector('[data-testid="error-message"]')).toBeTruthy();
    });

    // ─── No submit when invalid ───

    it('should not call service when form is invalid', () => {
        component.onSubmit();
        expect(authServiceMock.forgotPassword).not.toHaveBeenCalled();
    });
});
