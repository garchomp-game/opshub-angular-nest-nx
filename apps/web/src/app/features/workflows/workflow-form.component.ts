import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { heroArrowLeft, heroPaperAirplane } from '@ng-icons/heroicons/outline';
import { WorkflowService } from './workflow.service';
import { FormPageComponent } from '../../shared/ui/page-layouts/form-page.component';
import { FormFieldComponent } from '../../shared/ui/form-field/form-field.component';
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
    NgIcon, FormPageComponent, FormFieldComponent,
  ],
  viewProviders: [provideIcons({ heroArrowLeft, heroPaperAirplane })],
  template: `
    <app-form-page [title]="isEditMode ? '申請編集' : '新規申請'">
      <form [formGroup]="form" data-testid="workflow-form">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
          <app-form-field label="申請種別" [required]="true"
                  [errorMessage]="form.get('type')?.invalid && form.get('type')?.touched ? '申請種別を選択してください' : ''">
            <select class="select w-full"
                formControlName="type"
                id="type"
                data-testid="type-select">
              <option value="" disabled>種別を選択</option>
              <option value="expense">経費</option>
              <option value="leave">休暇</option>
              <option value="purchase">購買</option>
              <option value="other">その他</option>
            </select>
          </app-form-field>

          <app-form-field label="タイトル" [required]="true"
                  [errorMessage]="form.get('title')?.invalid && form.get('title')?.touched ? 'タイトルを入力してください（100文字以内）' : ''">
            <input class="input w-full"
                formControlName="title" id="title"
                maxlength="100" placeholder="タイトルを入力"
                data-testid="title-input" />
          </app-form-field>

          <app-form-field label="説明" class="md:col-span-2">
            <textarea class="textarea w-full"
                 formControlName="description" id="description"
                 rows="4" placeholder="詳細を入力"
                 maxlength="2000"
                 data-testid="description-input"></textarea>
          </app-form-field>

          <app-form-field label="金額">
            <label class="input flex items-center gap-2 w-full">
              <span class="text-base-content/50">¥</span>
              <input type="number" class="grow" formControlName="amount" id="amount"
                  placeholder="金額を入力"
                  data-testid="amount-input" />
            </label>
          </app-form-field>

          <app-form-field label="承認者" [required]="true"
                  [errorMessage]="form.get('approverId')?.invalid && form.get('approverId')?.touched ? '承認者を選択してください' : ''">
            <select class="select w-full"
                formControlName="approverId" id="approverId"
                data-testid="approver-select">
              <option value="" disabled>承認者を選択</option>
              @for (a of approvers(); track a.id) {
                <option [value]="a.id">{{ a.displayName || a.email }}</option>
              }
            </select>
          </app-form-field>
        </div>
      </form>

      <div slot="actions" class="flex items-center justify-end gap-3">
        <a class="btn btn-ghost" routerLink="/workflows" data-testid="cancel-btn">
          キャンセル
        </a>
        <button class="btn"
            (click)="onSaveDraft()" [disabled]="isSubmitting" data-testid="save-draft-btn">
          下書き保存
        </button>
        <button class="btn btn-primary"
            (click)="onSubmit()" [disabled]="form.invalid || isSubmitting" data-testid="submit-btn">
          <ng-icon name="heroPaperAirplane" class="text-lg" />
          送信する
        </button>
      </div>
    </app-form-page>
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
    // 承認者一覧を取得
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
      error: () => { /* PM/member は admin/users にアクセスできないので空リスト */ },
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
      // Update then submit
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
