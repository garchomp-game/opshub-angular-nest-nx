import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { InvoicesService } from './invoices.service';

describe('InvoicesService', () => {
    let service: InvoicesService;
    let httpMock: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [InvoicesService, provideHttpClient(), provideHttpClientTesting()],
        });
        service = TestBed.inject(InvoicesService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => httpMock.verify());

    it('getAll が GET /api/invoices を呼ぶこと', () => {
        const mockData = { success: true, data: { data: [{ id: 'inv-001' }], meta: { total: 1 } } };
        service.getAll().subscribe((res) => {
            expect(res.data.data).toHaveLength(1);
        });

        const req = httpMock.expectOne('/api/invoices');
        expect(req.request.method).toBe('GET');
        req.flush(mockData);
    });

    it('getAll にフィルタパラメータが渡ること', () => {
        service.getAll({ status: 'draft', page: 2, limit: 10 }).subscribe();

        const req = httpMock.expectOne((r) =>
            r.url === '/api/invoices' &&
            r.params.get('status') === 'draft' &&
            r.params.get('page') === '2' &&
            r.params.get('limit') === '10',
        );
        expect(req.request.method).toBe('GET');
        req.flush({ success: true, data: { data: [], meta: { total: 0 } } });
    });

    it('getById が GET /api/invoices/:id を呼ぶこと', () => {
        service.getById('inv-001').subscribe();

        const req = httpMock.expectOne('/api/invoices/inv-001');
        expect(req.request.method).toBe('GET');
        req.flush({ success: true, data: { id: 'inv-001' } });
    });

    it('create が POST /api/invoices を呼ぶこと', () => {
        const dto = { clientName: 'テスト', issuedDate: '2026-02-01', dueDate: '2026-03-01', taxRate: 10, items: [] };
        service.create(dto).subscribe();

        const req = httpMock.expectOne('/api/invoices');
        expect(req.request.method).toBe('POST');
        expect(req.request.body).toEqual(dto);
        req.flush({ success: true, data: { id: 'inv-new' } });
    });

    it('update が PATCH /api/invoices/:id を呼ぶこと', () => {
        const dto = { clientName: '更新' };
        service.update('inv-001', dto).subscribe();

        const req = httpMock.expectOne('/api/invoices/inv-001');
        expect(req.request.method).toBe('PATCH');
        req.flush({ success: true, data: { id: 'inv-001' } });
    });

    it('updateStatus が PATCH /api/invoices/:id/status を呼ぶこと', () => {
        service.updateStatus('inv-001', 'sent').subscribe();

        const req = httpMock.expectOne('/api/invoices/inv-001/status');
        expect(req.request.method).toBe('PATCH');
        expect(req.request.body).toEqual({ status: 'sent' });
        req.flush({ success: true, data: { id: 'inv-001', status: 'sent' } });
    });

    it('deleteInvoice が DELETE /api/invoices/:id を呼ぶこと', () => {
        service.deleteInvoice('inv-001').subscribe();

        const req = httpMock.expectOne('/api/invoices/inv-001');
        expect(req.request.method).toBe('DELETE');
        req.flush(null);
    });

    it('エラー時にエラーレスポンスを返すこと', () => {
        service.getAll().subscribe({
            error: (err) => expect(err.status).toBe(403),
        });

        const req = httpMock.expectOne('/api/invoices');
        req.flush(
            { success: false, error: { code: 'ERR-AUTH-002', message: '権限がありません' } },
            { status: 403, statusText: 'Forbidden' },
        );
    });
});
