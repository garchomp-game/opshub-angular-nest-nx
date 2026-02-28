import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MessageService } from 'primeng/api';

import { ProjectListComponent } from './project-list.component';
import { ProjectService } from './project.service';
import { AuthService } from '../../core/auth/auth.service';

describe('ProjectListComponent', () => {
  let component: ProjectListComponent;
  let fixture: ComponentFixture<ProjectListComponent>;

  const mockProjectService = {
    projects: signal([
      { id: 'proj-001', name: 'PJ1', status: 'active', pm: { profile: { displayName: 'PM太郎' } }, _count: { members: 3, tasks: 5 } },
      { id: 'proj-002', name: 'PJ2', status: 'planning', pm: { profile: { displayName: 'PM花子' } }, _count: { members: 1, tasks: 0 } },
    ]),
    loading: signal(false),
    meta: signal({ total: 2, page: 1, limit: 20, totalPages: 1 }),
    loadAll: vi.fn(),
  };

  const mockAuthService = {
    currentUser: signal({ id: 'user-001', tenantId: 't-001', roles: [{ tenantId: 't-001', role: 'pm' }] }),
    isAuthenticated: signal(true),
    isPm: vi.fn().mockReturnValue(true),
    isAdmin: vi.fn().mockReturnValue(false),
    hasRole: vi.fn().mockReturnValue(true),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectListComponent],
      providers: [
        provideRouter([]),
        provideNoopAnimations(),
        { provide: ProjectService, useValue: mockProjectService },
        { provide: AuthService, useValue: mockAuthService },
        MessageService,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProjectListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('コンポーネントが作成されること', () => {
    expect(component).toBeTruthy();
  });

  it('プロジェクト一覧が表示されること', () => {
    const rows = fixture.nativeElement.querySelectorAll('[data-testid="project-row"]');
    expect(rows.length).toBe(2);
  });

  it('初期化時に loadAll が呼ばれること', () => {
    expect(mockProjectService.loadAll).toHaveBeenCalled();
  });

  it('PMの場合、新規作成ボタンが表示されること', () => {
    const btn = fixture.nativeElement.querySelector('[data-testid="create-project-btn"]');
    expect(btn).toBeTruthy();
  });

  it('ローディング中はスピナーが表示されること', () => {
    mockProjectService.loading.set(true);
    fixture.detectChanges();

    const spinner = fixture.nativeElement.querySelector('[data-testid="loading"]');
    expect(spinner).toBeTruthy();
  });

  it('データがない場合はempty stateが表示されること', () => {
    mockProjectService.projects.set([]);
    mockProjectService.loading.set(false);
    fixture.detectChanges();

    const empty = fixture.nativeElement.querySelector('[data-testid="empty-state"]');
    expect(empty).toBeTruthy();
  });
});
