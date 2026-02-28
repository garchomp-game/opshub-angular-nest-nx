import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { UserListComponent } from './user-list.component';
import { AdminUsersService } from '../services/users.service';

describe('UserListComponent', () => {
  let component: UserListComponent;
  let fixture: ComponentFixture<UserListComponent>;

  const mockUsersService = {
    users: signal([
      { id: 'u-001', displayName: 'テストユーザー', email: 'test@demo.com', roles: ['member'] },
    ]),
    loading: signal(false),
    loadUsers: vi.fn(),
    inviteUser: vi.fn(),
    updateRole: vi.fn(),
    updateStatus: vi.fn(),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserListComponent],
      providers: [
        provideRouter([]),
        { provide: AdminUsersService, useValue: mockUsersService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UserListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('コンポーネントが作成されること', () => {
    expect(component).toBeTruthy();
  });

  it('初期化時に loadUsers が呼ばれること', () => {
    expect(mockUsersService.loadUsers).toHaveBeenCalled();
  });

  it('ユーザー一覧テーブルが表示されること', () => {
    const table = fixture.nativeElement.querySelector('[data-testid="users-table"]');
    expect(table).toBeTruthy();
  });

  it('招待ボタンが表示されること', () => {
    const btn = fixture.nativeElement.querySelector('[data-testid="invite-btn"]');
    expect(btn).toBeTruthy();
  });

  it('ローディング中はスピナーが表示されること', () => {
    mockUsersService.loading.set(true);
    fixture.detectChanges();

    const spinner = fixture.nativeElement.querySelector('[data-testid="loading"]');
    expect(spinner).toBeTruthy();
  });
});
