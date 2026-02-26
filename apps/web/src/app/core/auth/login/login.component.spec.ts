import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { LoginComponent } from './login.component';
import { AuthService } from '../auth.service';
import { signal } from '@angular/core';

describe('LoginComponent', () => {
    let component: LoginComponent;
    let fixture: ComponentFixture<LoginComponent>;
    let authServiceMock: any;

    beforeEach(async () => {
        authServiceMock = {
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
            imports: [LoginComponent, NoopAnimationsModule],
            providers: [
                { provide: AuthService, useValue: authServiceMock },
                provideHttpClient(),
                provideHttpClientTesting(),
                provideRouter([{ path: 'dashboard', component: LoginComponent }]),
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(LoginComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    // ─── Rendering ───

    it('should render login form', () => {
        const el = fixture.nativeElement as HTMLElement;
        expect(el.querySelector('[data-testid="login-form"]')).toBeTruthy();
        expect(el.querySelector('[data-testid="email-input"]')).toBeTruthy();
        expect(el.querySelector('[data-testid="password-input"]')).toBeTruthy();
        expect(el.querySelector('[data-testid="login-button"]')).toBeTruthy();
    });

    // ─── Validation ───

    it('should have invalid form when empty', () => {
        expect(component.form.valid).toBe(false);
    });

    it('should become valid with correct input', () => {
        component.form.setValue({ email: 'test@demo.com', password: 'Password123' });
        expect(component.form.valid).toBe(true);
    });

    it('should be invalid with bad email', () => {
        component.form.setValue({ email: 'not-email', password: 'Password123' });
        expect(component.form.get('email')!.valid).toBe(false);
    });

    // ─── Login button ───

    it('should disable login button when form is invalid', () => {
        fixture.detectChanges();
        const btn = fixture.nativeElement.querySelector('[data-testid="login-button"]') as HTMLButtonElement;
        expect(btn.disabled).toBe(true);
    });

    // ─── Error message ───

    it('should not display error message initially', () => {
        expect(fixture.nativeElement.querySelector('[data-testid="error-message"]')).toBeNull();
    });

    it('should display error message when set', () => {
        component.errorMessage.set('ログイン失敗');
        fixture.detectChanges();
        const el = fixture.nativeElement.querySelector('[data-testid="error-message"]');
        expect(el).toBeTruthy();
        expect(el.textContent).toContain('ログイン失敗');
    });

    // ─── Password toggle ───

    it('should toggle password visibility', () => {
        expect(component.hidePassword()).toBe(true);
        component.hidePassword.set(false);
        expect(component.hidePassword()).toBe(false);
    });
});
