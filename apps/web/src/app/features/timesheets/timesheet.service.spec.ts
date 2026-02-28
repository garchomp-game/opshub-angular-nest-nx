import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { TimesheetService } from './timesheet.service';

describe('TimesheetService', () => {
  let service: TimesheetService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        TimesheetService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(TimesheetService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('loadWeekly が GET /api/timesheets/weekly を呼ぶこと', () => {
    service.loadWeekly('2026-02-23');

    const req = httpMock.expectOne(
      (r) => r.url === '/api/timesheets/weekly' && r.params.get('weekStart') === '2026-02-23',
    );
    expect(req.request.method).toBe('GET');
    req.flush({ weekStart: '2026-02-23', entries: [{ id: 'ts-001', hours: 4 }] });

    expect(service.weeklyEntries()).toHaveLength(1);
    expect(service.isLoading()).toBe(false);
  });

  it('upsert が PUT /api/timesheets/bulk を呼ぶこと', () => {
    const request = {
      entries: [{ projectId: 'proj-001', workDate: '2026-02-25', hours: 4.0 }],
    };

    service.upsert(request).subscribe();

    const req = httpMock.expectOne('/api/timesheets/bulk');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(request);
    req.flush([{ id: 'ts-001' }]);

    // It will also trigger a loadWeekly call if weekStart is set — flush that too
  });

  it('getProjectSummary が GET /api/timesheets/summary/by-project を呼ぶこと', () => {
    const query = { dateFrom: '2026-02-01', dateTo: '2026-02-28' };

    service.getProjectSummary(query).subscribe((data) => {
      expect(data).toHaveLength(1);
    });

    const req = httpMock.expectOne(
      (r) => r.url === '/api/timesheets/summary/by-project',
    );
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('dateFrom')).toBe('2026-02-01');
    req.flush([{ projectId: 'proj-001', projectName: 'ECサイト', totalHours: 40, entryCount: 10 }]);
  });

  it('getUserSummary が GET /api/timesheets/summary/by-member を呼ぶこと', () => {
    const query = { dateFrom: '2026-02-01', dateTo: '2026-02-28' };

    service.getUserSummary(query).subscribe((data) => {
      expect(data).toHaveLength(1);
    });

    const req = httpMock.expectOne(
      (r) => r.url === '/api/timesheets/summary/by-member',
    );
    expect(req.request.method).toBe('GET');
    req.flush([{ userId: 'user-001', userName: '田中太郎', totalHours: 80, entryCount: 20 }]);
  });

  it('exportCsv が GET /api/timesheets/export を Blob で呼ぶこと', () => {
    // Mock URL.createObjectURL
    const mockUrl = 'blob:mock-url';
    const originalCreateObjectURL = window.URL.createObjectURL;
    const originalRevokeObjectURL = window.URL.revokeObjectURL;
    window.URL.createObjectURL = vi.fn().mockReturnValue(mockUrl) as any;
    window.URL.revokeObjectURL = vi.fn() as any;

    const query = { dateFrom: '2026-02-01', dateTo: '2026-02-28' };
    service.exportCsv(query);

    const req = httpMock.expectOne(
      (r) => r.url === '/api/timesheets/export',
    );
    expect(req.request.method).toBe('GET');
    expect(req.request.responseType).toBe('blob');
    req.flush(new Blob(['test,csv'], { type: 'text/csv' }));

    // Restore
    window.URL.createObjectURL = originalCreateObjectURL;
    window.URL.revokeObjectURL = originalRevokeObjectURL;
  });

  it('エラー時にエラー状態を設定すること', () => {
    service.loadWeekly('2026-02-23');

    const req = httpMock.expectOne(
      (r) => r.url === '/api/timesheets/weekly',
    );
    req.flush(
      { error: { message: 'テストエラー' } },
      { status: 500, statusText: 'Internal Server Error' },
    );

    expect(service.isLoading()).toBe(false);
    expect(service.error()).toBeTruthy();
  });
});
