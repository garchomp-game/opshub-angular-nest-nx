import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { DatePickerModule } from 'primeng/datepicker';
import { TextareaModule } from 'primeng/textarea';
import { CardModule } from 'primeng/card';
import { ExpenseService } from './expense.service';
import { EXPENSE_CATEGORIES } from '@shared/types';
import { HttpClient } from '@angular/common/http';
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
    ButtonModule,
    SelectModule,
    InputTextModule,
    InputNumberModule,
    DatePickerModule,
    TextareaModule,
    CardModule,
  ],
  template: `
    <div class="min-h-[calc(100vh-64px)] py-8 px-4 sm:px-6 lg:px-8">
      <div class="max-w-3xl mx-auto">
        <div class="mb-6">
          <p-button icon="pi pi-arrow-left" label="戻る" [text]="true"
              (onClick)="goBack()"
              data-testid="back-btn" />
        </div>

        <p-card>
          <ng-template #title>
            <div class="flex flex-col gap-1">
              <span>経費申請</span>
              <span class="text-sm font-normal" style="opacity: 0.6;">交通費、交際費、その他の経費を申請します</span>
            </div>
          </ng-template>

          <form [formGroup]="form" class="space-y-5">
            <!-- 基本情報セクション -->
            <h3 class="text-base font-bold pb-2 mb-4" style="border-bottom: 1px solid var(--p-surface-border);">申請内容</h3>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <!-- 日付 -->
              <div class="flex flex-col gap-2">
                <label for="expenseDate" class="font-medium text-sm">日付 <span class="text-red-500">*</span></label>
                <p-datepicker formControlName="expenseDate" inputId="expenseDate"
                    dateFormat="yy/mm/dd" [showIcon]="true"
                    styleClass="w-full" data-testid="input-date" />
                @if (form.get('expenseDate')?.touched && form.get('expenseDate')?.hasError('required')) {
                  <small class="text-red-500">日付は必須です</small>
                }
              </div>

              <!-- カテゴリ -->
              <div class="flex flex-col gap-2">
                <label for="category" class="font-medium text-sm">カテゴリ <span class="text-red-500">*</span></label>
                <p-select formControlName="category" [options]="categoryOptions"
                    placeholder="カテゴリを選択" inputId="category"
                    styleClass="w-full" data-testid="select-category" />
                @if (form.get('category')?.touched && form.get('category')?.hasError('required')) {
                  <small class="text-red-500">カテゴリを選択してください</small>
                }
              </div>
            </div>

            <!-- 金額 -->
            <div class="flex flex-col gap-2">
              <label for="amount" class="font-medium text-sm">金額 (円) <span class="text-red-500">*</span></label>
              <p-inputnumber formControlName="amount" inputId="amount"
                  placeholder="0" mode="currency" currency="JPY" locale="ja-JP"
                  styleClass="w-full" data-testid="input-amount" />
              @if (getAmountError()) {
                <small class="text-red-500">{{ getAmountError() }}</small>
              }
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <!-- プロジェクト -->
              <div class="flex flex-col gap-2">
                <label for="projectId" class="font-medium text-sm">関連プロジェクト <span class="text-red-500">*</span></label>
                <p-select formControlName="projectId" [options]="projects"
                    optionLabel="name" optionValue="id"
                    placeholder="プロジェクトを選択" inputId="projectId"
                    styleClass="w-full" data-testid="select-project" />
                @if (form.get('projectId')?.touched && form.get('projectId')?.hasError('required')) {
                  <small class="text-red-500">プロジェクトを選択してください</small>
                }
              </div>

              <!-- 承認者 -->
              <div class="flex flex-col gap-2">
                <label for="approverId" class="font-medium text-sm">承認者 <span class="text-red-500">*</span></label>
                <p-select formControlName="approverId" [options]="approvers"
                    optionLabel="displayName" optionValue="id"
                    placeholder="承認者を選択" inputId="approverId"
                    styleClass="w-full" data-testid="select-approver" />
                @if (form.get('approverId')?.touched && form.get('approverId')?.hasError('required')) {
                  <small class="text-red-500">承認者を選択してください</small>
                }
              </div>
            </div>

            <!-- 説明 -->
            <div class="flex flex-col gap-2">
              <label for="description" class="font-medium text-sm">説明・備考</label>
              <textarea pTextarea formControlName="description" id="description"
                  rows="4" class="w-full"
                  data-testid="input-description"
                  placeholder="交通機関の区間や、交際費の詳細などを入力してください"></textarea>
            </div>

            <!-- レシート添付 -->
            <div class="flex flex-col gap-2">
              <label class="font-medium text-sm">レシート添付</label>
              <input type="file"
                  accept="image/*,.pdf"
                  multiple
                  data-testid="upload-receipt">
            </div>
          </form>

          <!-- アクションボタン -->
          <div class="flex items-center justify-end gap-3 mt-8 pt-5" style="border-top: 1px solid var(--p-surface-border);">
            <p-button label="キャンセル" severity="secondary" [text]="true"
                (onClick)="goBack()"
                data-testid="cancel-btn" />
            <p-button label="下書き保存" severity="secondary" [outlined]="true"
                (onClick)="submit('draft')"
                [disabled]="submitting"
                data-testid="save-draft-btn" />
            <p-button label="申請を送信" icon="pi pi-send"
                (onClick)="submit('submitted')"
                [disabled]="form.invalid || submitting"
                [loading]="submitting"
                data-testid="submit-btn" />
          </div>
        </p-card>
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
  categoryOptions = EXPENSE_CATEGORIES.map(cat => cat);
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
