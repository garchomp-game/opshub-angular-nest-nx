import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { CardModule } from 'primeng/card';
import { WorkflowService } from './workflow.service';
import { ToastService } from '../../shared/ui/toast/toast.service';

interface ApproverItem {
  id: string;
  email: string;
  displayName?: string;
}

@Component({
  selector: 'app-workflow-form',
  standalone: true,
  imports: [
    CommonModule, RouterLink, ReactiveFormsModule,
    ButtonModule, InputTextModule, TextareaModule, InputNumberModule, SelectModule, CardModule,
  ],
  template: `
    <div class="p-6 lg:p-8 max-w-4xl mx-auto">
      <div class="flex items-center gap-3 mb-6">
        <p-button icon="pi pi-arrow-left" [rounded]="true" [text]="true" routerLink="/workflows" data-testid="back-btn" />
        <h1 class="text-2xl font-bold m-0">{{ isEditMode ? '申請編集' : '新規申請' }}</h1>
      </div>

      <p-card>
        <form [formGroup]="form" data-testid="workflow-form">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
            <div class="flex flex-col gap-2">
              <label for="type" class="font-medium text-sm">申請種別 <span class="text-red-500">*</span></label>
              <p-select formControlName="type" [options]="typeOptions" optionLabel="label" optionValue="value"
                  placeholder="種別を選択" inputId="type" styleClass="w-full"
                  data-testid="type-select" />
              @if (form.get('type')?.invalid && form.get('type')?.touched) {
                <small class="text-red-500">申請種別を選択してください</small>
              }
            </div>

            <div class="flex flex-col gap-2">
              <label for="title" class="font-medium text-sm">タイトル <span class="text-red-500">*</span></label>
              <input pInputText formControlName="title" id="title" maxlength="100"
                  placeholder="タイトルを入力" class="w-full" data-testid="title-input" />
              @if (form.get('title')?.invalid && form.get('title')?.touched) {
                <small class="text-red-500">タイトルを入力してください（100文字以内）</small>
              }
            </div>

            <div class="flex flex-col gap-2 md:col-span-2">
              <label for="description" class="font-medium text-sm">説明</label>
              <textarea pTextarea formControlName="description" id="description"
                  rows="4" placeholder="詳細を入力" maxlength="2000"
                  class="w-full" data-testid="description-input"></textarea>
            </div>

            <div class="flex flex-col gap-2">
              <label for="amount" class="font-medium text-sm">金額</label>
              <p-inputnumber formControlName="amount" inputId="amount"
                  placeholder="金額を入力" mode="currency" currency="JPY" locale="ja-JP"
                  styleClass="w-full" data-testid="amount-input" />
            </div>

            <div class="flex flex-col gap-2">
              <label for="approverId" class="font-medium text-sm">承認者 <span class="text-red-500">*</span></label>
              <p-select formControlName="approverId" [options]="approvers()" optionLabel="displayName" optionValue="id"
                  placeholder="承認者を選択" inputId="approverId" styleClass="w-full"
                  data-testid="approver-select" />
              @if (form.get('approverId')?.invalid && form.get('approverId')?.touched) {
                <small class="text-red-500">承認者を選択してください</small>
              }
            </div>
          </div>
        </form>

        <div class="flex items-center justify-end gap-3 mt-8 pt-5" style="border-top: 1px solid var(--p-surface-border);">
          <p-button label="キャンセル" severity="secondary" [text]="true"
              routerLink="/workflows" data-testid="cancel-btn" />
          <p-button label="下書き保存" severity="secondary" [outlined]="true"
              (onClick)="onSaveDraft()" [disabled]="isSubmitting" data-testid="save-draft-btn" />
          <p-button label="送信する" icon="pi pi-send"
              (onClick)="onSubmit()" [disabled]="form.invalid || isSubmitting"
              [loading]="isSubmitting" data-testid="submit-btn" />
        </div>
      </p-card>
    </div>
  `,
  styles: [],
})
export class WorkflowFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private workflowService = inject(WorkflowService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private toast = inject(ToastService);
  private http = inject(HttpClient);

  form: FormGroup;
  isEditMode = false;
  isSubmitting = false;
  approvers = signal<ApproverItem[]>([]);
  private editId: string | null = null;

  typeOptions = [
    { label: '経費', value: 'expense' },
    { label: '休暇', value: 'leave' },
    { label: '購買', value: 'purchase' },
    { label: 'その他', value: 'other' },
  ];

  constructor() {
    this.form = this.fb.group({
      type: ['', Validators.required],
      title: ['', [Validators.required, Validators.maxLength(100)]],
      description: [''],
      amount: [null],
      approverId: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.http.get<any>('/api/admin/users').subscribe({
      next: (res) => {
        const list = Array.isArray(res.data) ? res.data
          : Array.isArray(res.data?.data) ? res.data.data
            : Array.isArray(res) ? res : [];
        this.approvers.set(list
          .filter((u: any) => {
            const role = u.role || u.userRole;
            return role === 'approver' || role === 'tenant_admin';
          })
          .map((u: any) => ({
            id: u.userId || u.id,
            email: u.email,
            displayName: u.displayName || u.profile?.displayName || u.email?.split('@')[0],
          })));
      },
      error: () => { },
    });

    this.editId = this.route.snapshot.paramMap.get('id');
    if (this.editId) {
      this.isEditMode = true;
      this.workflowService.getById(this.editId).subscribe((res) => {
        const data = res.success ? res.data : res;
        this.form.patchValue({
          type: data.type,
          title: data.title,
          description: data.description,
          amount: data.amount,
          approverId: data.approverId,
        });
      });
    }
  }

  onSaveDraft(): void {
    if (this.isSubmitting) return;
    this.isSubmitting = true;

    if (this.isEditMode && this.editId) {
      this.workflowService.update(this.editId, this.form.value).subscribe({
        next: () => {
          this.toast.success('下書きを保存しました');
          this.router.navigate(['/workflows']);
        },
        error: () => { this.isSubmitting = false; },
      });
    } else {
      this.workflowService.create({ ...this.form.value, action: 'draft' }).subscribe({
        next: () => {
          this.toast.success('下書きを保存しました');
          this.router.navigate(['/workflows']);
        },
        error: () => { this.isSubmitting = false; },
      });
    }
  }

  onSubmit(): void {
    if (this.form.invalid || this.isSubmitting) return;
    this.isSubmitting = true;

    if (this.isEditMode && this.editId) {
      this.workflowService.update(this.editId, this.form.value).subscribe({
        next: () => {
          this.workflowService.submit(this.editId!).subscribe({
            next: () => {
              this.toast.success('申請を送信しました');
              this.router.navigate(['/workflows']);
            },
            error: () => { this.isSubmitting = false; },
          });
        },
        error: () => { this.isSubmitting = false; },
      });
    } else {
      this.workflowService.create({ ...this.form.value, action: 'submit' }).subscribe({
        next: () => {
          this.toast.success('申請を送信しました');
          this.router.navigate(['/workflows']);
        },
        error: () => { this.isSubmitting = false; },
      });
    }
  }
}
