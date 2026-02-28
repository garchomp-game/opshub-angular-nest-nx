import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { MessageService } from 'primeng/api';

import { DocumentListComponent } from './document-list.component';
import { DocumentService } from './document.service';
import { ToastService } from '../../../shared/ui';
import { signal } from '@angular/core';

describe('DocumentListComponent', () => {
  let component: DocumentListComponent;
  let fixture: ComponentFixture<DocumentListComponent>;

  const mockDocumentService = {
    documents: signal([]),
    loading: signal(false),
    meta: signal(null),
    loadDocuments: vi.fn(),
    uploadDocument: vi.fn(),
    downloadDocument: vi.fn(),
    deleteDocument: vi.fn(),
  };

  const mockToast = {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DocumentListComponent, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: DocumentService, useValue: mockDocumentService },
        { provide: ToastService, useValue: mockToast },
        MessageService,
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: { get: () => 'proj-001' } },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DocumentListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('コンポーネントが作成されること', () => {
    expect(component).toBeTruthy();
  });

  it('projectIdがルートパラメータから取得されること', () => {
    expect(component.projectId).toBe('proj-001');
  });

  it('displayedColumnsが正しく設定されること', () => {
    expect(component.displayedColumns).toEqual([
      'name', 'fileSize', 'mimeType', 'uploadedBy', 'createdAt', 'actions',
    ]);
  });

  it('formatSizeがformatFileSizeを利用すること', () => {
    expect(component.formatSize(1024)).toBe('1.0 KB');
    expect(component.formatSize(0)).toBe('0 B');
  });

  it('getMimeHeroIconがMIMEタイプに応じたアイコンを返すこと', () => {
    expect(component.getMimeHeroIcon('application/pdf')).toBe('pi pi-file-pdf');
    expect(component.getMimeHeroIcon('image/png')).toBe('pi pi-image');
    expect(component.getMimeHeroIcon('text/plain')).toBe('pi pi-file');
  });

  it('getMimeLabelがMIMEタイプに応じたラベルを返すこと', () => {
    expect(component.getMimeLabel('application/pdf')).toBe('PDF');
    expect(component.getMimeLabel('image/jpeg')).toBe('JPEG');
  });
});
