import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatSnackBar } from '@angular/material/snack-bar';
import { KanbanBoardComponent } from './kanban-board.component';
import { TaskService } from './task.service';
import { ActivatedRoute } from '@angular/router';

describe('KanbanBoardComponent', () => {
    let component: KanbanBoardComponent;
    let fixture: ComponentFixture<KanbanBoardComponent>;

    const mockTaskService = {
        tasks: signal([
            { id: 'task-001', title: 'タスク1', status: 'todo', assignee: null },
            { id: 'task-002', title: 'タスク2', status: 'in_progress', assignee: { profile: { displayName: '太郎' } } },
            { id: 'task-003', title: 'タスク3', status: 'done', assignee: null },
        ]),
        loading: signal(false),
        loadByProject: vi.fn(),
        changeStatus: vi.fn(),
    };

    const mockSnackBar = {
        open: vi.fn(),
    };

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [KanbanBoardComponent, NoopAnimationsModule],
            providers: [
                provideRouter([]),
                { provide: TaskService, useValue: mockTaskService },
                { provide: MatSnackBar, useValue: mockSnackBar },
                {
                    provide: ActivatedRoute,
                    useValue: {
                        snapshot: { paramMap: { get: () => 'proj-001' } },
                    },
                },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(KanbanBoardComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('コンポーネントが作成されること', () => {
        expect(component).toBeTruthy();
    });

    it('3つのカラムが表示されること', () => {
        const columns = fixture.nativeElement.querySelectorAll('.column');
        expect(columns.length).toBe(3);
    });

    it('タスクカードが表示されること', () => {
        const cards = fixture.nativeElement.querySelectorAll('[data-testid="task-card"]');
        expect(cards.length).toBe(3);
    });

    it('初期化時に loadByProject が呼ばれること', () => {
        expect(mockTaskService.loadByProject).toHaveBeenCalledWith('proj-001');
    });

    it('ローディング中はスピナーが表示されること', () => {
        mockTaskService.loading.set(true);
        fixture.detectChanges();

        const spinner = fixture.nativeElement.querySelector('[data-testid="loading"]');
        expect(spinner).toBeTruthy();
    });

    it('getTasksByStatus がステータスごとのタスクを返すこと', () => {
        expect(component.getTasksByStatus('todo')).toHaveLength(1);
        expect(component.getTasksByStatus('in_progress')).toHaveLength(1);
        expect(component.getTasksByStatus('done')).toHaveLength(1);
    });
});
