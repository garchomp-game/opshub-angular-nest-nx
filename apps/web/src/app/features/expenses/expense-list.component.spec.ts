import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { ExpenseListComponent } from './expense-list.component';
import { ExpenseService } from './expense.service';
import { signal } from '@angular/core';

describe('ExpenseListComponent', () => {
  let component: ExpenseListComponent;
  let fixture: ComponentFixture<ExpenseListComponent>;

  const mockExpenseService = {
    expenses: signal([
      {
        id: 'exp-001',
        category: '交通費',
        amount: 15000,
        expenseDate: '2026-02-20',
        project: { id: 'proj-001', name: 'ECサイト' },
        workflow: { id: 'wf-001', status: 'submitted', workflowNumber: 'WF-0001' },
        createdBy: { id: 'user-001', displayName: '田中太郎' },
      },
    ]),
    total: signal(1),
    isLoading: signal(false),
    error: signal(null),
    loadAll: vi.fn(),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExpenseListComponent],
      providers: [
        provideRouter([]),
        provideNoopAnimations(),
        { provide: ExpenseService, useValue: mockExpenseService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ExpenseListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('コンポーネントが作成されること', () => {
    expect(component).toBeTruthy();
  });

  it('初期化時にloadAllが呼ばれること', () => {
    expect(mockExpenseService.loadAll).toHaveBeenCalled();
  });

  it('テーブルにデータが表示されること', () => {
    const table = fixture.nativeElement.querySelector('[data-testid="expense-table"]');
    expect(table).toBeTruthy();
  });

  it('カテゴリフィルタ変更でloadAllが呼ばれること', () => {
    mockExpenseService.loadAll.mockClear();
    component.selectedCategory = '交通費';
    component.onFilterChange();
    expect(mockExpenseService.loadAll).toHaveBeenCalledWith(
      expect.objectContaining({ category: '交通費' }),
    );
  });
});
