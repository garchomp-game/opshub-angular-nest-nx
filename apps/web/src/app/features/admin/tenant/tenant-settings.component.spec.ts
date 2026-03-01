import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { FormsModule } from '@angular/forms';
import { TenantSettingsComponent } from './tenant-settings.component';
import { AdminTenantService } from '../services/tenant.service';
import { MessageService } from 'primeng/api';

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
    // Export state
    exportJobId: signal(null as string | null),
    exportStatus: signal(null),
    exporting: signal(false),
    requestExport: vi.fn(),
    downloadExport: vi.fn(),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TenantSettingsComponent, FormsModule],
      providers: [
        provideRouter([]),
        provideNoopAnimations(),
        { provide: AdminTenantService, useValue: mockTenantService },
        MessageService,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TenantSettingsComponent);
    component = fixture.componentInstance;

    // Reset signals to prevent state leakage between tests
    mockTenantService.tenant.set({ id: 't-001', name: 'テストテナント' });
    mockTenantService.loading.set(false);
    mockTenantService.error.set(null);
    mockTenantService.exportJobId.set(null);
    mockTenantService.exportStatus.set(null);
    mockTenantService.exporting.set(false);

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

  // ── Export tests ──

  it('エクスポートセクションが表示されること', () => {
    const section = fixture.nativeElement.querySelector('[data-testid="export-section"]');
    expect(section).toBeTruthy();
  });

  it('エクスポートボタンが表示されること', () => {
    const btn = fixture.nativeElement.querySelector('[data-testid="export-btn"]');
    expect(btn).toBeTruthy();
  });

  it('テーブル未選択時はエクスポートボタンが無効であること', () => {
    component.selectedTables = [];
    fixture.detectChanges();

    const wrapper = fixture.nativeElement.querySelector('[data-testid="export-btn"]');
    const btn = wrapper?.querySelector('button');
    expect(btn?.disabled).toBe(true);
  });

  it('onExport が正しい DTO で requestExport を呼ぶこと', () => {
    component.selectedFormat = 'csv';
    component.selectedTables = ['users', 'expenses'];

    component.onExport();

    expect(mockTenantService.requestExport).toHaveBeenCalledWith({
      format: 'csv',
      include: ['users', 'expenses'],
    });
  });

  it('エクスポート完了時にダウンロードボタンが表示されること', () => {
    mockTenantService.exportStatus.set({
      jobId: 'job-001',
      status: 'completed',
      progress: 100,
    } as any);
    fixture.detectChanges();

    const btn = fixture.nativeElement.querySelector('[data-testid="download-btn"]');
    expect(btn).toBeTruthy();
  });

  it('onDownload が downloadExport を呼ぶこと', () => {
    mockTenantService.exportJobId.set('job-001');

    component.onDownload();

    expect(mockTenantService.downloadExport).toHaveBeenCalledWith('job-001');
  });
});
