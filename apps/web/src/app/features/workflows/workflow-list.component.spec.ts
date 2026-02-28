import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { WorkflowListComponent } from './workflow-list.component';
import { WorkflowService } from './workflow.service';
import { AuthService } from '../../core/auth/auth.service';

describe('WorkflowListComponent', () => {
  let component: WorkflowListComponent;
  let fixture: ComponentFixture<WorkflowListComponent>;

  const mockWorkflowService = {
    workflows: signal([
      { id: 'wf-001', workflowNumber: 'WF-001', type: 'expense', title: '経費申請', status: 'submitted', createdAt: '2025-01-01', creator: { profile: { displayName: 'テスト太郎' } } },
      { id: 'wf-002', workflowNumber: 'WF-002', type: 'leave', title: '休暇申請', status: 'approved', createdAt: '2025-01-02', creator: { profile: { displayName: '承認花子' } } },
    ]),
    pendingWorkflows: signal([]),
    currentWorkflow: signal(null),
    isLoading: signal(false),
    totalCount: signal(2),
    loadAll: vi.fn(),
    loadPending: vi.fn(),
  };

  const mockAuthService = {
    currentUser: signal({ id: 'user-001', tenantId: 't-001', roles: [] }),
    isAuthenticated: signal(true),
    hasRole: vi.fn().mockReturnValue(true),
    canApprove: signal(true),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorkflowListComponent],
      providers: [
        provideRouter([]),
        provideNoopAnimations(),
        provideHttpClient(),
        { provide: WorkflowService, useValue: mockWorkflowService },
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(WorkflowListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('コンポーネントが作成されること', () => {
    expect(component).toBeTruthy();
  });

  it('ワークフロー一覧が表示されること', () => {
    const rows = fixture.nativeElement.querySelectorAll('[data-testid="workflow-row"]');
    expect(rows.length).toBe(2);
  });

  it('初期化時に loadAll が呼ばれること', () => {
    expect(mockWorkflowService.loadAll).toHaveBeenCalled();
  });

  it('ローディング中はスピナーが表示されること', () => {
    mockWorkflowService.isLoading.set(true);
    fixture.detectChanges();

    const spinner = fixture.nativeElement.querySelector('p-progressspinner');
    expect(spinner).toBeTruthy();
  });

  it('データなし時はempty-stateが表示されること', () => {
    mockWorkflowService.workflows.set([]);
    mockWorkflowService.isLoading.set(false);
    fixture.detectChanges();

    const empty = fixture.nativeElement.querySelector('[data-testid="empty-state"]');
    expect(empty).toBeTruthy();
  });

  it('新規作成ボタンが表示されること', () => {
    const createBtn = fixture.nativeElement.querySelector('[data-testid="create-workflow-btn"]');
    expect(createBtn).toBeTruthy();
  });
});
