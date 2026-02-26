import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ExpenseService } from './expense.service';
import { EXPENSE_CATEGORIES } from '@shared/types';
import { HttpClient } from '@angular/common/http';

interface SimpleItem {
    id: string;
    name: string;
}

interface ApproverItem {
    id: string;
    displayName: string;
}

@Component({
    selector: 'app-expense-form',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatDatepickerModule,
        MatNativeDateModule,
        MatButtonModule,
        MatIconModule,
        MatCardModule,
        MatSnackBarModule,
        MatProgressSpinnerModule,
    ],
    template: `
        <div class="form-container">
            <div class="header">
                <button mat-button (click)="goBack()" data-testid="back-btn">
                    <mat-icon>arrow_back</mat-icon>
                    戻る
                </button>
                <h1>経費申請</h1>
            </div>

            <mat-card>
                <mat-card-content>
                    <form [formGroup]="form" class="expense-form">
                        <!-- 日付 -->
                        <mat-form-field appearance="outline">
                            <mat-label>日付</mat-label>
                            <input matInput [matDatepicker]="datePicker" formControlName="expenseDate" data-testid="input-date">
                            <mat-datepicker-toggle matSuffix [for]="datePicker"></mat-datepicker-toggle>
                            <mat-datepicker #datePicker></mat-datepicker>
                            @if (form.get('expenseDate')?.hasError('required')) {
                                <mat-error>日付は必須です</mat-error>
                            }
                        </mat-form-field>

                        <!-- カテゴリ -->
                        <mat-form-field appearance="outline">
                            <mat-label>カテゴリ</mat-label>
                            <mat-select formControlName="category" data-testid="select-category">
                                @for (cat of categories; track cat) {
                                    <mat-option [value]="cat">{{ cat }}</mat-option>
                                }
                            </mat-select>
                            @if (form.get('category')?.hasError('required')) {
                                <mat-error>カテゴリを選択してください</mat-error>
                            }
                        </mat-form-field>

                        <!-- 金額 -->
                        <mat-form-field appearance="outline">
                            <mat-label>金額 (円)</mat-label>
                            <input matInput type="number" formControlName="amount" data-testid="input-amount">
                            <span matPrefix>¥&nbsp;</span>
                            @if (form.get('amount')?.hasError('required')) {
                                <mat-error>金額は必須です</mat-error>
                            }
                            @if (form.get('amount')?.hasError('min')) {
                                <mat-error>1円以上を入力してください</mat-error>
                            }
                            @if (form.get('amount')?.hasError('max')) {
                                <mat-error>10,000,000円以下で入力してください</mat-error>
                            }
                        </mat-form-field>

                        <!-- プロジェクト -->
                        <mat-form-field appearance="outline">
                            <mat-label>プロジェクト</mat-label>
                            <mat-select formControlName="projectId" data-testid="select-project">
                                @for (p of projects; track p.id) {
                                    <mat-option [value]="p.id">{{ p.name }}</mat-option>
                                }
                            </mat-select>
                            @if (form.get('projectId')?.hasError('required')) {
                                <mat-error>プロジェクトを選択してください</mat-error>
                            }
                        </mat-form-field>

                        <!-- 承認者 -->
                        <mat-form-field appearance="outline">
                            <mat-label>承認者</mat-label>
                            <mat-select formControlName="approverId" data-testid="select-approver">
                                @for (a of approvers; track a.id) {
                                    <mat-option [value]="a.id">{{ a.displayName }}</mat-option>
                                }
                            </mat-select>
                            @if (form.get('approverId')?.hasError('required')) {
                                <mat-error>承認者を選択してください</mat-error>
                            }
                        </mat-form-field>

                        <!-- 説明 -->
                        <mat-form-field appearance="outline" class="full-width">
                            <mat-label>説明</mat-label>
                            <textarea matInput formControlName="description" rows="3" data-testid="input-description"></textarea>
                        </mat-form-field>
                    </form>
                </mat-card-content>

                <mat-card-actions align="end">
                    <button mat-button (click)="goBack()" data-testid="cancel-btn">
                        キャンセル
                    </button>
                    <button
                        mat-stroked-button
                        (click)="submit('draft')"
                        [disabled]="submitting"
                        data-testid="save-draft-btn"
                    >
                        下書き保存
                    </button>
                    <button
                        mat-raised-button
                        color="primary"
                        (click)="submit('submitted')"
                        [disabled]="form.invalid || submitting"
                        data-testid="submit-btn"
                    >
                        @if (submitting) { <mat-spinner diameter="20"></mat-spinner> }
                        送信
                    </button>
                </mat-card-actions>
            </mat-card>
        </div>
    `,
    styles: [`
        .form-container { padding: 24px; max-width: 640px; }
        .header {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 16px;
        }
        .header h1 { margin: 0; font-size: 24px; }
        .expense-form {
            display: flex;
            flex-direction: column;
            gap: 4px;
        }
        .full-width { width: 100%; }
    `],
})
export class ExpenseFormComponent implements OnInit {
    private fb = inject(FormBuilder);
    private router = inject(Router);
    private snackBar = inject(MatSnackBar);
    private expenseService = inject(ExpenseService);
    private http = inject(HttpClient);

    categories = EXPENSE_CATEGORIES;
    projects: SimpleItem[] = [];
    approvers: ApproverItem[] = [];
    submitting = false;

    form: FormGroup = this.fb.group({
        expenseDate: [null, Validators.required],
        category: ['', Validators.required],
        amount: [null, [Validators.required, Validators.min(1), Validators.max(10_000_000)]],
        projectId: ['', Validators.required],
        approverId: ['', Validators.required],
        description: [''],
    });

    ngOnInit(): void {
        // 補助データ取得
        this.http.get<SimpleItem[]>('/api/projects').subscribe({
            next: (items) => (this.projects = items),
        });
        this.http.get<ApproverItem[]>('/api/users?role=approver').subscribe({
            next: (items) => (this.approvers = items),
        });
    }

    submit(status: 'draft' | 'submitted'): void {
        if (status === 'submitted' && this.form.invalid) return;
        this.submitting = true;

        const value = this.form.value;
        const dto = {
            ...value,
            expenseDate: value.expenseDate instanceof Date
                ? value.expenseDate.toISOString().split('T')[0]
                : value.expenseDate,
            status,
        };

        this.expenseService.create(dto).subscribe({
            next: () => {
                this.submitting = false;
                this.snackBar.open(
                    status === 'submitted' ? '経費申請を送信しました' : '下書きを保存しました',
                    '閉じる',
                    { duration: 3000 },
                );
                this.router.navigate(['/expenses']);
            },
            error: (err) => {
                this.submitting = false;
                this.snackBar.open(
                    err.error?.message || '送信に失敗しました',
                    '閉じる',
                    { duration: 5000 },
                );
            },
        });
    }

    goBack(): void {
        this.router.navigate(['/expenses']);
    }
}
