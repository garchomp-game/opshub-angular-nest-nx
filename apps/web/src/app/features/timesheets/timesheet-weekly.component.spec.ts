import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TimesheetWeeklyComponent } from './timesheet-weekly.component';
import { TimesheetService } from './timesheet.service';

describe('TimesheetWeeklyComponent', () => {
  let component: TimesheetWeeklyComponent;
  let fixture: ComponentFixture<TimesheetWeeklyComponent>;

  const mockTimesheetService = {
    weeklyEntries: signal([]),
    isLoading: signal(false),
    error: signal(null),
    weekStart: signal('2026-02-23'),
    weeklyTotal: signal(0),
    loadWeekly: vi.fn(),
    upsert: vi.fn(),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TimesheetWeeklyComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideNoopAnimations(),
        { provide: TimesheetService, useValue: mockTimesheetService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TimesheetWeeklyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => vi.clearAllMocks());

  it('コンポーネントが作成されること', () => {
    expect(component).toBeTruthy();
  });

  it('グリッドが表示されること', () => {
    const grid = fixture.nativeElement.querySelector('[data-testid="timesheet-grid"]');
    expect(grid).toBeTruthy();
  });

  it('行追加ボタンが表示されること', () => {
    const addBtn = fixture.nativeElement.querySelector('[data-testid="timesheet-add-row-btn"]');
    expect(addBtn).toBeTruthy();
  });

  it('保存ボタンが表示されること', () => {
    const saveBtn = fixture.nativeElement.querySelector('[data-testid="timesheet-save-btn"]');
    expect(saveBtn).toBeTruthy();
  });

  it('初期化時に loadWeekly が呼ばれること', () => {
    expect(mockTimesheetService.loadWeekly).toHaveBeenCalled();
  });

  it('ローディング中はスピナーが表示されること', () => {
    mockTimesheetService.isLoading.set(true);
    fixture.detectChanges();

    const spinner = fixture.nativeElement.querySelector('[data-testid="loading"] .loading');
    expect(spinner).toBeTruthy();
  });

  it('行追加で新しい行が追加されること', () => {
    const initialCount = component.rows().length;
    component.addRow();
    expect(component.rows().length).toBe(initialCount + 1);
    expect(component.isDirty()).toBe(true);
  });

  it('weekDays が7日分を返すこと', () => {
    const days = component.weekDays();
    expect(days).toHaveLength(7);
    expect(days[0].label).toBe('月');
    expect(days[6].label).toBe('日');
  });
});
