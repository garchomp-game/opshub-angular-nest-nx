import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { provideNzIcons } from 'ng-zorro-antd/icon';
import { IconDefinition } from '@ant-design/icons-angular';
import * as AllIcons from '@ant-design/icons-angular/icons';

const antDesignIcons = Object.keys(AllIcons).reduce((acc, key) => {
    const icon = (AllIcons as any)[key] as IconDefinition;
    if (icon?.name) acc.push(icon);
    return acc;
}, [] as IconDefinition[]);
import { DocumentListComponent } from './document-list.component';
import { DocumentService } from './document.service';
import { signal } from '@angular/core';
import { NzMessageService } from 'ng-zorro-antd/message';

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

    const mockMessage = {
        success: vi.fn(),
        error: vi.fn(),
        info: vi.fn(),
    };

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [DocumentListComponent, NoopAnimationsModule],
            providers: [
                provideHttpClient(),
                provideHttpClientTesting(),
                provideRouter([]),
                provideNzIcons(antDesignIcons),
                { provide: DocumentService, useValue: mockDocumentService },
                { provide: NzMessageService, useValue: mockMessage },
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

    it('getMimeNzIconがMIMEタイプに応じたアイコンを返すこと', () => {
        expect(component.getMimeNzIcon('application/pdf')).toBe('file-pdf');
        expect(component.getMimeNzIcon('image/png')).toBe('file-image');
        expect(component.getMimeNzIcon('text/plain')).toBe('file-text');
    });

    it('getMimeLabelがMIMEタイプに応じたラベルを返すこと', () => {
        expect(component.getMimeLabel('application/pdf')).toBe('PDF');
        expect(component.getMimeLabel('image/jpeg')).toBe('JPEG');
    });
});
