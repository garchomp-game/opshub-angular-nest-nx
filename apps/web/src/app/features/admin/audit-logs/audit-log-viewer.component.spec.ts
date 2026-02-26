import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { AuditLogViewerComponent } from './audit-log-viewer.component';
import { AdminAuditLogsService } from '../services/audit-logs.service';

describe('AuditLogViewerComponent', () => {
    let component: AuditLogViewerComponent;
    let fixture: ComponentFixture<AuditLogViewerComponent>;

    const mockAuditLogsService = {
        logs: signal([
            {
                id: 'log-001',
                action: 'user.invite',
                resourceType: 'user',
                resourceId: 'user-002',
                userName: '管理者',
                createdAt: '2026-02-25T10:00:00Z',
            },
        ]),
        meta: signal({ total: 1, page: 1, limit: 20, totalPages: 1 }),
        loading: signal(false),
        loadLogs: vi.fn(),
    };

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [AuditLogViewerComponent, NoopAnimationsModule],
            providers: [
                provideRouter([]),
                { provide: AdminAuditLogsService, useValue: mockAuditLogsService },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(AuditLogViewerComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('コンポーネントが作成されること', () => {
        expect(component).toBeTruthy();
    });

    it('初期化時に loadLogs が呼ばれること', () => {
        expect(mockAuditLogsService.loadLogs).toHaveBeenCalled();
    });

    it('監査ログテーブルが表示されること', () => {
        const table = fixture.nativeElement.querySelector('[data-testid="audit-logs-table"]');
        expect(table).toBeTruthy();
    });

    it('ローディング中はスピナーが表示されること', () => {
        mockAuditLogsService.loading.set(true);
        fixture.detectChanges();

        const spinner = fixture.nativeElement.querySelector('[data-testid="loading"]');
        expect(spinner).toBeTruthy();
    });
});
