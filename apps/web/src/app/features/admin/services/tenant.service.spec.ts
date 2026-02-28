import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AdminTenantService } from './tenant.service';

describe('AdminTenantService', () => {
  let service: AdminTenantService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AdminTenantService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MatSnackBar, useValue: { open: vi.fn() } },
      ],
    });
    service = TestBed.inject(AdminTenantService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('loadTenant が GET /api/admin/tenant を呼ぶこと', () => {
    const mockTenant = { id: 't-001', name: 'テスト' };
    service.loadTenant();

    const req = httpMock.expectOne('/api/admin/tenant');
    expect(req.request.method).toBe('GET');
    req.flush(mockTenant);

    expect(service.tenant()).toEqual(mockTenant);
    expect(service.loading()).toBe(false);
  });

  it('updateTenant が PATCH /api/admin/tenant を呼ぶこと', () => {
    service.updateTenant({ name: '更新テナント' });

    const req = httpMock.expectOne('/api/admin/tenant');
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ name: '更新テナント' });
    req.flush({ id: 't-001', name: '更新テナント' });
  });

  it('deleteTenant が DELETE /api/admin/tenant を呼ぶこと', () => {
    service.deleteTenant();

    const req = httpMock.expectOne('/api/admin/tenant');
    expect(req.request.method).toBe('DELETE');
    req.flush({});
  });
});
