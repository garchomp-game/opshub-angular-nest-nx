import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ProjectService } from './project.service';

describe('ProjectService', () => {
  let service: ProjectService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ProjectService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ProjectService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('loadAll が GET /api/projects を呼ぶこと', () => {
    const mockData = {
      success: true,
      data: {
        data: [{ id: 'proj-001', name: 'PJ1' }],
        meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
      },
    };
    service.loadAll();

    const req = httpMock.expectOne('/api/projects');
    expect(req.request.method).toBe('GET');
    req.flush(mockData);

    expect(service.projects()).toHaveLength(1);
    expect(service.loading()).toBe(false);
  });

  it('loadAll にパラメータを渡せること', () => {
    service.loadAll({ status: 'active', search: 'test' });

    const req = httpMock.expectOne('/api/projects?status=active&search=test');
    expect(req.request.method).toBe('GET');
    req.flush({ success: true, data: { data: [], meta: { total: 0, page: 1, limit: 20, totalPages: 0 } } });
  });

  it('getById が GET /api/projects/:id を呼ぶこと', () => {
    service.getById('proj-001').subscribe((res) => {
      expect(res.success).toBe(true);
    });

    const req = httpMock.expectOne('/api/projects/proj-001');
    expect(req.request.method).toBe('GET');
    req.flush({ success: true, data: { id: 'proj-001', name: 'PJ' } });
  });

  it('create が POST /api/projects を呼ぶこと', () => {
    service.create({ name: '新規PJ', pmId: 'pm-001' }).subscribe();

    const req = httpMock.expectOne('/api/projects');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ name: '新規PJ', pmId: 'pm-001' });
    req.flush({ success: true, data: { id: 'proj-new' } });
  });

  it('update が PATCH /api/projects/:id を呼ぶこと', () => {
    service.update('proj-001', { name: '更新PJ' }).subscribe();

    const req = httpMock.expectOne('/api/projects/proj-001');
    expect(req.request.method).toBe('PATCH');
    req.flush({ success: true, data: { id: 'proj-001' } });
  });

  it('addMember が POST /api/projects/:id/members を呼ぶこと', () => {
    service.addMember('proj-001', 'user-002').subscribe();

    const req = httpMock.expectOne('/api/projects/proj-001/members');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ userId: 'user-002' });
    req.flush({ success: true, data: {} });
  });

  it('removeMember が DELETE /api/projects/:id/members/:userId を呼ぶこと', () => {
    service.removeMember('proj-001', 'user-002').subscribe();

    const req = httpMock.expectOne('/api/projects/proj-001/members/user-002');
    expect(req.request.method).toBe('DELETE');
    req.flush({ success: true, data: {} });
  });
});
