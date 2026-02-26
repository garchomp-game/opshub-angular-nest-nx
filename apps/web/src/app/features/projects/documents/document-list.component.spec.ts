import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { describe, it, expect, beforeEach } from 'vitest';
import { DocumentListComponent } from './document-list.component';
import { DocumentService } from './document.service';
import { signal } from '@angular/core';

describe('DocumentListComponent', () => {
    let component: DocumentListComponent;
    let fixture: ComponentFixture<DocumentListComponent>;

    const mockDocumentService = {
        documents: signal([]),
        loading: signal(false),
        meta: signal(null),
        loadDocuments: () => { },
        uploadDocument: () => { },
        downloadDocument: () => { },
        deleteDocument: () => { },
    };

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [DocumentListComponent, NoopAnimationsModule],
            providers: [
                provideHttpClient(),
                provideHttpClientTesting(),
                provideRouter([]),
                { provide: DocumentService, useValue: mockDocumentService },
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

    it('getMimeIconがMIMEタイプに応じたアイコンを返すこと', () => {
        expect(component.getMimeIcon('application/pdf')).toBe('picture_as_pdf');
        expect(component.getMimeIcon('image/png')).toBe('image');
        expect(component.getMimeIcon('text/plain')).toBe('description');
    });

    it('getMimeLabelがMIMEタイプに応じたラベルを返すこと', () => {
        expect(component.getMimeLabel('application/pdf')).toBe('PDF');
        expect(component.getMimeLabel('image/jpeg')).toBe('JPEG');
    });
});
