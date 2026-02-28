import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AdminUsersService } from './users.service';

describe('AdminUsersService', () => {
  let service: AdminUsersService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AdminUsersService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MatSnackBar, useValue: { open: vi.fn() } },
      ],
    });
    service = TestBed.inject(AdminUsersService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('loadUsers が GET /api/admin/users を呼ぶこと', () => {
    const mockUsers = [{ id: 'u-001', email: 'user@demo.com' }];
    service.loadUsers();

    const req = httpMock.expectOne('/api/admin/users');
    expect(req.request.method).toBe('GET');
    req.flush(mockUsers);

    expect(service.users()).toEqual(mockUsers);
  });

  it('inviteUser が POST /api/admin/users/invite を呼ぶこと', () => {
    service.inviteUser({ email: 'new@demo.com', role: 'member' });

    const req = httpMock.expectOne('/api/admin/users/invite');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ email: 'new@demo.com', role: 'member' });
    req.flush({ id: 'new' });

    // loadUsers will fire after
    const reloadReq = httpMock.expectOne('/api/admin/users');
    reloadReq.flush([]);
  });

  it('updateRole が PATCH /api/admin/users/:id/role を呼ぶこと', () => {
    service.updateRole('u-001', { role: 'approver' });

    const req = httpMock.expectOne('/api/admin/users/u-001/role');
    expect(req.request.method).toBe('PATCH');
    req.flush({});

    const reloadReq = httpMock.expectOne('/api/admin/users');
    reloadReq.flush([]);
  });

  it('updateStatus が PATCH /api/admin/users/:id/status を呼ぶこと', () => {
    service.updateStatus('u-001', false);

    const req = httpMock.expectOne('/api/admin/users/u-001/status');
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ active: false });
    req.flush({});

    const reloadReq = httpMock.expectOne('/api/admin/users');
    reloadReq.flush([]);
  });
});
