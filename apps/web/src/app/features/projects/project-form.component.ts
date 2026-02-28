import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

import { ProjectStatus, PROJECT_STATUS_LABELS } from '@shared/types';
import { ToastService } from '../../shared/ui';
import { ProjectService } from './project.service';
import { AuthService } from '../../core/auth/auth.service';

import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { ButtonModule } from 'primeng/button';
import { FloatLabelModule } from 'primeng/floatlabel';

interface UserItem {
  id: string;
  userId?: string;
  email: string;
  displayName?: string;
}

@Component({
  selector: 'app-project-form',
  standalone: true,
  imports: [
    RouterLink, ReactiveFormsModule,
    CardModule, InputTextModule, TextareaModule,
    SelectModule, DatePickerModule, ButtonModule,
    FloatLabelModule,
  ],

  template: `
    <div class="p-6 lg:p-8 max-w-3xl mx-auto space-y-6">
      <div class="flex items-center gap-4 mb-2">
        <p-button icon="pi pi-arrow-left" [rounded]="true" [text]="true"
            routerLink="/projects" />
        <h1 class="text-2xl font-bold m-0">{{ isEdit() ? 'プロジェクト編集' : 'プロジェクト新規作成' }}</h1>
      </div>

      <p-card>
        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-6" data-testid="project-form">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            <!-- プロジェクト名 -->
            <div class="md:col-span-2 flex flex-col gap-2">
              <label for="name" class="font-medium">プロジェクト名 <span class="text-red-500">*</span></label>
              <input id="name" type="text" pInputText class="w-full" formControlName="name"
                  placeholder="プロジェクト名を入力" data-testid="name-input" />
              @if (form.get('name')?.invalid && form.get('name')?.touched) {
                <small class="text-red-500">プロジェクト名は必須です</small>
              }
            </div>

            <!-- 説明 -->
            <div class="md:col-span-2 flex flex-col gap-2">
              <label for="description" class="font-medium">説明</label>
              <textarea id="description" pTextarea class="w-full" formControlName="description"
                  rows="4" placeholder="プロジェクトの説明"
                  data-testid="description-input"></textarea>
            </div>

            <!-- PM -->
            <div class="md:col-span-2 flex flex-col gap-2">
              <label for="pmId" class="font-medium">PM (プロジェクトマネージャー) <span class="text-red-500">*</span></label>
              <p-select id="pmId" [options]="users()" formControlName="pmId"
                  optionLabel="displayName" optionValue="id"
                  placeholder="PM を選択" styleClass="w-full"
                  data-testid="pm-select" />
              @if (form.get('pmId')?.invalid && form.get('pmId')?.touched) {
                <small class="text-red-500">PM を選択してください</small>
              }
            </div>

            <!-- 開始日 -->
            <div class="flex flex-col gap-2">
              <label for="startDate" class="font-medium">開始日</label>
              <p-datepicker id="startDate" formControlName="startDate"
                  dateFormat="yy/mm/dd" [showIcon]="true"
                  styleClass="w-full"
                  data-testid="start-date-input" />
            </div>

            <!-- 終了日 -->
            <div class="flex flex-col gap-2">
              <label for="endDate" class="font-medium">終了日</label>
              <p-datepicker id="endDate" formControlName="endDate"
                  dateFormat="yy/mm/dd" [showIcon]="true"
                  styleClass="w-full"
                  data-testid="end-date-input" />
            </div>
          </div>

          <div class="flex items-center justify-end gap-3 pt-6 border-t border-surface-200">
            <p-button label="キャンセル" severity="secondary" [text]="true"
                routerLink="/projects" />
            <p-button type="submit" [label]="isEdit() ? '更新' : '作成'"
                [disabled]="form.invalid || submitting()"
                [loading]="submitting()"
                data-testid="submit-btn" />
          </div>
        </form>
      </p-card>
    </div>
  `,
  styles: [],
})
export class ProjectFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private toast = inject(ToastService);
  private projectService = inject(ProjectService);
  private http = inject(HttpClient);
  private auth = inject(AuthService);

  isEdit = signal(false);
  submitting = signal(false);
  users = signal<UserItem[]>([]);
  private projectId = '';

  form: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    description: [''],
    pmId: ['', [Validators.required]],
    startDate: [null],
    endDate: [null],
  });

  ngOnInit() {
    // テナント内ユーザー一覧を取得
    this.http.get<any>('/api/admin/users').subscribe({
      next: (res) => {
        const list = Array.isArray(res.data) ? res.data
          : Array.isArray(res.data?.data) ? res.data.data
            : Array.isArray(res) ? res : [];
        this.users.set(list.map((u: any) => ({
          id: u.userId || u.id,
          email: u.email,
          displayName: u.displayName || u.profile?.displayName || u.email?.split('@')[0],
        })));
      },
      error: () => {
        // PM ロールの場合 admin/users にアクセスできないので、自分のみ表示
        const me = this.auth.currentUser();
        if (me) {
          this.users.set([{
            id: me.id,
            email: me.email,
            displayName: me.email?.split('@')[0] || 'Me',
          }]);
          this.form.patchValue({ pmId: me.id });
        }
      },
    });

    this.projectId = this.route.snapshot.paramMap.get('id') ?? '';
    if (this.projectId) {
      this.isEdit.set(true);
      this.projectService.getById(this.projectId).subscribe((res) => {
        if (res.success) {
          this.form.patchValue({
            name: res.data.name,
            description: res.data.description,
            pmId: res.data.pmId,
            startDate: res.data.startDate ? new Date(res.data.startDate) : null,
            endDate: res.data.endDate ? new Date(res.data.endDate) : null,
          });
        }
      });
    }
  }

  onSubmit() {
    if (this.form.invalid) return;
    this.submitting.set(true);

    const value = this.form.value;
    const dto = {
      name: value.name,
      description: value.description || undefined,
      pmId: value.pmId,
      startDate: value.startDate
        ? new Date(value.startDate).toISOString().split('T')[0]
        : undefined,
      endDate: value.endDate
        ? new Date(value.endDate).toISOString().split('T')[0]
        : undefined,
    };

    const obs = this.isEdit()
      ? this.projectService.update(this.projectId, dto)
      : this.projectService.create(dto);

    obs.subscribe({
      next: () => {
        this.toast.success(
          this.isEdit() ? '更新しました' : '作成しました',
        );
        this.router.navigate(['/projects']);
      },
      error: () => this.submitting.set(false),
    });
  }
}
