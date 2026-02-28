import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { WorkflowService } from './workflow.service';

describe('WorkflowService', () => {
  let service: WorkflowService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [WorkflowService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(WorkflowService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('getAll が GET /api/workflows を呼ぶこと', () => {
    const mockData = { success: true, data: { data: [{ id: 'wf-001' }], meta: { total: 1 } } };
    service.getAll().subscribe((res) => {
      expect(res.success).toBe(true);
    });

    const req = httpMock.expectOne('/api/workflows');
    expect(req.request.method).toBe('GET');
    req.flush(mockData);
  });

  it('getAll がクエリパラメータを渡すこと', () => {
    service.getAll({ status: 'submitted', page: 2 }).subscribe();

    const req = httpMock.expectOne('/api/workflows?status=submitted&page=2');
    expect(req.request.method).toBe('GET');
    req.flush({ success: true, data: [] });
  });

  it('getPending が GET /api/workflows/pending を呼ぶこと', () => {
    service.getPending().subscribe();

    const req = httpMock.expectOne('/api/workflows/pending');
    expect(req.request.method).toBe('GET');
    req.flush({ success: true, data: [] });
  });

  it('getById が GET /api/workflows/:id を呼ぶこと', () => {
    service.getById('wf-001').subscribe();

    const req = httpMock.expectOne('/api/workflows/wf-001');
    expect(req.request.method).toBe('GET');
    req.flush({ success: true, data: { id: 'wf-001' } });
  });

  it('create が POST /api/workflows を呼ぶこと', () => {
    const dto = { type: 'expense', title: 'テスト', approverId: 'a1', action: 'draft' };
    service.create(dto).subscribe();

    const req = httpMock.expectOne('/api/workflows');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(dto);
    req.flush({ success: true, data: { id: 'wf-new' } });
  });

  it('update が PATCH /api/workflows/:id を呼ぶこと', () => {
    service.update('wf-001', { title: '更新' }).subscribe();

    const req = httpMock.expectOne('/api/workflows/wf-001');
    expect(req.request.method).toBe('PATCH');
    req.flush({ success: true, data: { id: 'wf-001' } });
  });

  it('submit が POST /api/workflows/:id/submit を呼ぶこと', () => {
    service.submit('wf-001').subscribe();

    const req = httpMock.expectOne('/api/workflows/wf-001/submit');
    expect(req.request.method).toBe('POST');
    req.flush({ success: true, data: { id: 'wf-001', status: 'submitted' } });
  });

  it('approve が POST /api/workflows/:id/approve を呼ぶこと', () => {
    service.approve('wf-001').subscribe();

    const req = httpMock.expectOne('/api/workflows/wf-001/approve');
    expect(req.request.method).toBe('POST');
    req.flush({ success: true, data: { id: 'wf-001', status: 'approved' } });
  });

  it('reject が POST /api/workflows/:id/reject を呼ぶこと', () => {
    service.reject('wf-001', '内容不備').subscribe();

    const req = httpMock.expectOne('/api/workflows/wf-001/reject');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ reason: '内容不備' });
    req.flush({ success: true, data: { id: 'wf-001', status: 'rejected' } });
  });

  it('withdraw が POST /api/workflows/:id/withdraw を呼ぶこと', () => {
    service.withdraw('wf-001').subscribe();

    const req = httpMock.expectOne('/api/workflows/wf-001/withdraw');
    expect(req.request.method).toBe('POST');
    req.flush({ success: true, data: { id: 'wf-001', status: 'withdrawn' } });
  });

  it('エラー時にエラーレスポンスを返すこと', () => {
    service.getAll().subscribe({
      error: (err) => expect(err.status).toBe(403),
    });

    const req = httpMock.expectOne('/api/workflows');
    req.flush(
      { success: false, error: { code: 'ERR-AUTH-002', message: '権限がありません' } },
      { status: 403, statusText: 'Forbidden' },
    );
  });
});
