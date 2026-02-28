import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DocumentService } from './document.service';

describe('DocumentService', () => {
  let service: DocumentService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [DocumentService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(DocumentService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('loadDocuments が GET /api/projects/:id/documents を呼ぶこと', () => {
    const mockData = {
      success: true,
      data: {
        data: [{ id: 'doc-001', name: 'test.pdf' }],
        meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
      },
    };
    service.loadDocuments('proj-001');

    const req = httpMock.expectOne('/api/projects/proj-001/documents');
    expect(req.request.method).toBe('GET');
    req.flush(mockData);

    expect(service.documents()).toHaveLength(1);
    expect(service.loading()).toBe(false);
  });

  it('loadDocuments にパラメータを渡せること', () => {
    service.loadDocuments('proj-001', { page: '2', limit: '10' });

    const req = httpMock.expectOne('/api/projects/proj-001/documents?page=2&limit=10');
    expect(req.request.method).toBe('GET');
    req.flush({
      success: true,
      data: { data: [], meta: { total: 0, page: 2, limit: 10, totalPages: 0 } },
    });
  });

  it('uploadDocument が POST /api/projects/:id/documents を FormData で呼ぶこと', () => {
    const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
    service.uploadDocument('proj-001', file).subscribe();

    const req = httpMock.expectOne('/api/projects/proj-001/documents');
    expect(req.request.method).toBe('POST');
    expect(req.request.body instanceof FormData).toBe(true);
    req.flush({ success: true, data: { id: 'doc-new' } });
  });

  it('deleteDocument が DELETE /api/documents/:id を呼ぶこと', () => {
    service.deleteDocument('doc-001').subscribe();

    const req = httpMock.expectOne('/api/documents/doc-001');
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
