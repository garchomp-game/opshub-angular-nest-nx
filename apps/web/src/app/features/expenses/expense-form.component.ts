import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  heroArrowLeft,
  heroBanknotes,
  heroArrowUpTray,
} from '@ng-icons/heroicons/outline';
import { ExpenseService } from './expense.service';
import { EXPENSE_CATEGORIES } from '@shared/types';
import { HttpClient } from '@angular/common/http';
import { FormPageComponent } from '../../shared/ui/page-layouts/form-page.component';
import { FormFieldComponent } from '../../shared/ui/form-field/form-field.component';
import { ToastService } from '../../shared/ui/toast/toast.service';

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
    NgIcon,
    FormPageComponent,
    FormFieldComponent,
  ],
  viewProviders: [provideIcons({ heroArrowLeft, heroBanknotes, heroArrowUpTray })],
  template: `
    <div class="min-h-[calc(100vh-64px)] py-8 px-4 sm:px-6 lg:px-8">
      <div class="max-w-3xl mx-auto">
        <div class="mb-6">
          <button class="btn btn-ghost btn-sm mb-4"
              (click)="goBack()"
              data-testid="back-btn">
            <ng-icon name="heroArrowLeft" class="text-base" />
            戻る
          </button>
        </div>

        <app-form-page title="経費申請" subtitle="交通費、交際費、その他の経費を申請します">
          <form [formGroup]="form" class="space-y-5">
            <!-- 基本情報セクション -->
            <h3 class="text-base font-bold border-b border-base-200 pb-2 mb-4">申請内容</h3>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <!-- 日付 -->
              <app-form-field label="日付" [required]="true"
                [errorMessage]="form.get('expenseDate')?.touched && form.get('expenseDate')?.hasError('required') ? '日付は必須です' : ''">
                <input type="date"
                  formControlName="expenseDate"
                  class="input w-full"
                  id="expenseDate"
                  data-testid="input-date">
              </app-form-field>

              <!-- カテゴリ -->
              <app-form-field label="カテゴリ" [required]="true"
                [errorMessage]="form.get('category')?.touched && form.get('category')?.hasError('required') ? 'カテゴリを選択してください' : ''">
                <select class="select w-full"
                  formControlName="category"
                  id="category"
                  data-testid="select-category">
                  <option value="" disabled>カテゴリを選択</option>
                  @for (cat of categories; track cat) {
                    <option [value]="cat">{{ cat }}</option>
                  }
                </select>
              </app-form-field>
            </div>

            <!-- 金額 -->
            <app-form-field label="金額 (円)" [required]="true"
              [errorMessage]="getAmountError()">
              <label class="input flex items-center gap-2 w-full">
                <span class="text-base-content/60 font-bold">¥</span>
                <input type="number"
                  formControlName="amount"
                  id="amount"
                  data-testid="input-amount"
                  placeholder="0"
                  class="grow text-right font-bold text-lg border-0 outline-none bg-transparent">
              </label>
            </app-form-field>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <!-- プロジェクト -->
              <app-form-field label="関連プロジェクト" [required]="true"
                [errorMessage]="form.get('projectId')?.touched && form.get('projectId')?.hasError('required') ? 'プロジェクトを選択してください' : ''">
                <select class="select w-full"
                  formControlName="projectId"
                  id="projectId"
                  data-testid="select-project">
                  <option value="" disabled>プロジェクトを選択</option>
                  @for (p of projects; track p.id) {
                    <option [value]="p.id">{{ p.name }}</option>
                  }
                </select>
              </app-form-field>

              <!-- 承認者 -->
              <app-form-field label="承認者" [required]="true"
                [errorMessage]="form.get('approverId')?.touched && form.get('approverId')?.hasError('required') ? '承認者を選択してください' : ''">
                <select class="select w-full"
                  formControlName="approverId"
                  id="approverId"
                  data-testid="select-approver">
                  <option value="" disabled>承認者を選択</option>
                  @for (a of approvers; track a.id) {
                    <option [value]="a.id">{{ a.displayName }}</option>
                  }
                </select>
              </app-form-field>
            </div>

            <!-- 説明 -->
            <app-form-field label="説明・備考">
              <textarea class="textarea w-full" rows="4"
                formControlName="description"
                id="description"
                data-testid="input-description"
                placeholder="交通機関の区間や、交際費の詳細などを入力してください"></textarea>
            </app-form-field>

            <!-- レシート添付 -->
            <app-form-field label="レシート添付">
              <input type="file"
                class="file-input file- w-full"
                accept="image/*,.pdf"
                multiple
                data-testid="upload-receipt">
            </app-form-field>
          </form>

          <!-- アクションボタン -->
          <div slot="actions" class="flex items-center justify-end gap-3 pt-4">
            <button class="btn btn-ghost" type="button" (click)="goBack()"
                data-testid="cancel-btn">
              キャンセル
            </button>
            <button class="btn btn-outline" type="button"
                (click)="submit('draft')"
                [disabled]="submitting"
                data-testid="save-draft-btn">
              下書き保存
            </button>
            <button class="btn btn-primary" type="button"
                (click)="submit('submitted')"
                [disabled]="form.invalid || submitting"
                data-testid="submit-btn">
              @if (submitting) {
                <span class="loading loading-spinner loading-sm"></span>
              }
              申請を送信
            </button>
          </div>
        </app-form-page>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `],
})
export class ExpenseFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private toast = inject(ToastService);
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

  getAmountError(): string {
    const control = this.form.get('amount');
    if (!control?.touched) return '';
    if (control.hasError('required')) return '金額は必須です';
    if (control.hasError('min')) return '1円以上を入力してください';
    if (control.hasError('max')) return '10,000,000円以下で入力してください';
    return '';
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
        this.toast.success(
          status === 'submitted' ? '経費申請を送信しました' : '下書きを保存しました',
        );
        this.router.navigate(['/expenses']);
      },
      error: (err) => {
        this.submitting = false;
        this.toast.error(
          err.error?.message || '送信に失敗しました',
        );
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/expenses']);
  }
}
