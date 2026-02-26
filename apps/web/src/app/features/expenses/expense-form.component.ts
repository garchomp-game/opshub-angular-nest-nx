import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzUploadModule } from 'ng-zorro-antd/upload';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzMessageService } from 'ng-zorro-antd/message';
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
        NzFormModule,
        NzInputModule,
        NzInputNumberModule,
        NzSelectModule,
        NzDatePickerModule,
        NzButtonModule,
        NzIconModule,
        NzCardModule,
        NzUploadModule,
        NzSpinModule,
    ],
    template: `
        <div class="min-h-[calc(100vh-64px)] bg-gray-50/50 py-8 px-4 sm:px-6 lg:px-8">
            <div class="max-w-3xl mx-auto">
                <div class="mb-6">
                    <button nz-button nzType="text" (click)="goBack()"
                            data-testid="back-btn"
                            class="!text-gray-500 hover:!text-gray-900 !px-2 mb-4 transition-colors">
                        <span nz-icon nzType="arrow-left" nzTheme="outline" class="mr-1"></span>
                        戻る
                    </button>
                    <div class="flex items-center gap-3">
                        <div class="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600 shadow-sm">
                            <span nz-icon nzType="file-add" nzTheme="outline" class="text-2xl"></span>
                        </div>
                        <div>
                            <h1 class="text-2xl font-bold text-gray-900 m-0 tracking-tight">経費申請</h1>
                            <p class="text-gray-500 mt-1 mb-0 text-sm">交通費、交際費、その他の経費を申請します</p>
                        </div>
                    </div>
                </div>

                <form nz-form [formGroup]="form" nzLayout="vertical" class="space-y-6">
                    <!-- 基本情報セクション -->
                    <nz-card [nzBordered]="true"
                             class="!rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div class="bg-gray-50/50 px-6 py-4 border-b border-gray-100 -mx-6 -mt-6 mb-6">
                            <h2 class="text-base font-bold text-gray-900 m-0">申請内容</h2>
                        </div>
                        <div class="space-y-5">
                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <!-- 日付 -->
                                <nz-form-item>
                                    <nz-form-label nzFor="expenseDate">日付</nz-form-label>
                                    <nz-form-control nzErrorTip="日付は必須です">
                                        <nz-date-picker formControlName="expenseDate"
                                            nzFormat="yyyy/MM/dd"
                                            class="w-full"
                                            id="expenseDate"
                                            data-testid="input-date">
                                        </nz-date-picker>
                                    </nz-form-control>
                                </nz-form-item>

                                <!-- カテゴリ -->
                                <nz-form-item>
                                    <nz-form-label nzFor="category">カテゴリ</nz-form-label>
                                    <nz-form-control nzErrorTip="カテゴリを選択してください">
                                        <nz-select formControlName="category"
                                            nzPlaceHolder="カテゴリを選択"
                                            id="category"
                                            data-testid="select-category">
                                            @for (cat of categories; track cat) {
                                                <nz-option [nzValue]="cat" [nzLabel]="cat"></nz-option>
                                            }
                                        </nz-select>
                                    </nz-form-control>
                                </nz-form-item>
                            </div>

                            <!-- 金額 -->
                            <nz-form-item>
                                <nz-form-label nzFor="amount">金額 (円)</nz-form-label>
                                <nz-form-control [nzErrorTip]="amountErrorTpl">
                                    <nz-input-group nzPrefix="¥" nzSize="large">
                                        <input nz-input type="number"
                                            formControlName="amount"
                                            id="amount"
                                            data-testid="input-amount"
                                            placeholder="0"
                                            class="text-right font-bold text-lg">
                                    </nz-input-group>
                                    <ng-template #amountErrorTpl let-control>
                                        @if (control.hasError('required')) {
                                            金額は必須です
                                        } @else if (control.hasError('min')) {
                                            1円以上を入力してください
                                        } @else if (control.hasError('max')) {
                                            10,000,000円以下で入力してください
                                        }
                                    </ng-template>
                                </nz-form-control>
                            </nz-form-item>

                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <!-- プロジェクト -->
                                <nz-form-item>
                                    <nz-form-label nzFor="projectId">関連プロジェクト</nz-form-label>
                                    <nz-form-control nzErrorTip="プロジェクトを選択してください">
                                        <nz-select formControlName="projectId"
                                            nzPlaceHolder="プロジェクトを選択"
                                            nzShowSearch
                                            id="projectId"
                                            data-testid="select-project">
                                            @for (p of projects; track p.id) {
                                                <nz-option [nzValue]="p.id" [nzLabel]="p.name"></nz-option>
                                            }
                                        </nz-select>
                                    </nz-form-control>
                                </nz-form-item>

                                <!-- 承認者 -->
                                <nz-form-item>
                                    <nz-form-label nzFor="approverId">承認者</nz-form-label>
                                    <nz-form-control nzErrorTip="承認者を選択してください">
                                        <nz-select formControlName="approverId"
                                            nzPlaceHolder="承認者を選択"
                                            nzShowSearch
                                            id="approverId"
                                            data-testid="select-approver">
                                            @for (a of approvers; track a.id) {
                                                <nz-option [nzValue]="a.id" [nzLabel]="a.displayName"></nz-option>
                                            }
                                        </nz-select>
                                    </nz-form-control>
                                </nz-form-item>
                            </div>

                            <!-- 説明 -->
                            <nz-form-item>
                                <nz-form-label nzFor="description">説明・備考</nz-form-label>
                                <nz-form-control>
                                    <textarea nz-input formControlName="description"
                                        [nzAutosize]="{ minRows: 4, maxRows: 8 }"
                                        id="description"
                                        data-testid="input-description"
                                        placeholder="交通機関の区間や、交際費の詳細などを入力してください"></textarea>
                                </nz-form-control>
                            </nz-form-item>

                            <!-- レシート添付 -->
                            <nz-form-item>
                                <nz-form-label>レシート添付</nz-form-label>
                                <nz-form-control>
                                    <nz-upload
                                        nzAction="/api/uploads"
                                        nzListType="picture-card"
                                        [nzLimit]="3"
                                        nzAccept="image/*,.pdf"
                                        data-testid="upload-receipt">
                                        <div>
                                            <span nz-icon nzType="plus" nzTheme="outline"></span>
                                            <div class="mt-2 text-xs text-gray-500">アップロード</div>
                                        </div>
                                    </nz-upload>
                                </nz-form-control>
                            </nz-form-item>
                        </div>
                    </nz-card>

                    <!-- アクションボタン -->
                    <div class="flex items-center justify-end gap-3 pt-4">
                        <button nz-button nzType="text" type="button" (click)="goBack()"
                                data-testid="cancel-btn"
                                class="!px-6 !text-gray-600 hover:!bg-gray-100">
                            キャンセル
                        </button>
                        <button nz-button nzType="default" type="button"
                                (click)="submit('draft')"
                                [disabled]="submitting"
                                data-testid="save-draft-btn"
                                class="!px-6">
                            下書き保存
                        </button>
                        <button nz-button nzType="primary" type="button"
                                (click)="submit('submitted')"
                                [disabled]="form.invalid || submitting"
                                [nzLoading]="submitting"
                                data-testid="submit-btn"
                                class="!px-8 !rounded-lg shadow-sm font-bold min-w-[120px]">
                            申請を送信
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `,
    styles: [`
        :host {
            display: block;
        }
        ::ng-deep .ant-form-vertical .ant-form-item {
            margin-bottom: 0;
        }
    `],
})
export class ExpenseFormComponent implements OnInit {
    private fb = inject(FormBuilder);
    private router = inject(Router);
    private message = inject(NzMessageService);
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
                this.message.success(
                    status === 'submitted' ? '経費申請を送信しました' : '下書きを保存しました',
                );
                this.router.navigate(['/expenses']);
            },
            error: (err) => {
                this.submitting = false;
                this.message.error(
                    err.error?.message || '送信に失敗しました',
                );
            },
        });
    }

    goBack(): void {
        this.router.navigate(['/expenses']);
    }
}
