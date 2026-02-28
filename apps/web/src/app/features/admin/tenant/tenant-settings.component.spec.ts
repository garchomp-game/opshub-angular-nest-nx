import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { TenantSettingsComponent } from './tenant-settings.component';
import { AdminTenantService } from '../services/tenant.service';

describe('TenantSettingsComponent', () => {
  let component: TenantSettingsComponent;
  let fixture: ComponentFixture<TenantSettingsComponent>;

  const mockTenantService = {
    tenant: signal({ id: 't-001', name: 'テストテナント' }),
    loading: signal(false),
    error: signal(null),
    loadTenant: vi.fn(),
    updateTenant: vi.fn(),
    deleteTenant: vi.fn(),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TenantSettingsComponent],
      providers: [
        provideRouter([]),
        { provide: AdminTenantService, useValue: mockTenantService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TenantSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('コンポーネントが作成されること', () => {
    expect(component).toBeTruthy();
  });

  it('初期化時に loadTenant が呼ばれること', () => {
    expect(mockTenantService.loadTenant).toHaveBeenCalled();
  });

  it('テナント設定フォームが表示されること', () => {
    const form = fixture.nativeElement.querySelector('[data-testid="tenant-form"]');
    expect(form).toBeTruthy();
  });

  it('ローディング中はスピナーが表示されること', () => {
    mockTenantService.loading.set(true);
    fixture.detectChanges();

    const spinner = fixture.nativeElement.querySelector('[data-testid="loading"]');
    expect(spinner).toBeTruthy();
  });
});
