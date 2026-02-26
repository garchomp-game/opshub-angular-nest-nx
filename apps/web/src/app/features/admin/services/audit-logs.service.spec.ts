import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { AdminAuditLogsService } from './audit-logs.service';

describe('AdminAuditLogsService', () => {
    let service: AdminAuditLogsService;
    let httpMock: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                AdminAuditLogsService,
                provideHttpClient(),
                provideHttpClientTesting(),
            ],
        });
        service = TestBed.inject(AdminAuditLogsService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => httpMock.verify());

    it('loadLogs が GET /api/admin/audit-logs を呼ぶこと', () => {
        const mockResult = {
            data: [{ id: 'log-001', action: 'user.invite' }],
            meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
        };
        service.loadLogs();

        const req = httpMock.expectOne('/api/admin/audit-logs');
        expect(req.request.method).toBe('GET');
        req.flush(mockResult);

        expect(service.logs()).toHaveLength(1);
        expect(service.meta().total).toBe(1);
    });

    it('loadLogs がフィルタパラメータを含むこと', () => {
        service.loadLogs({ action: 'user.invite', page: 2, limit: 50 });

        const req = httpMock.expectOne((r) =>
            r.url === '/api/admin/audit-logs' &&
            r.params.get('action') === 'user.invite' &&
            r.params.get('page') === '2' &&
            r.params.get('limit') === '50');
        expect(req.request.method).toBe('GET');
        req.flush({ data: [], meta: { total: 0, page: 2, limit: 50, totalPages: 0 } });
    });
});
