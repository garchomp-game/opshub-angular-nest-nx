import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

import { ProjectStatus, PROJECT_STATUS_LABELS } from '@shared/types';
import { FormPageComponent, FormFieldComponent, ToastService } from '../../shared/ui';
import { ProjectService } from './project.service';
import { AuthService } from '../../core/auth/auth.service';

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
    FormPageComponent, FormFieldComponent,
  ],

  template: `
    <app-form-page [title]="isEdit() ? 'プロジェクト編集' : 'プロジェクト新規作成'">
      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-2" data-testid="project-form">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
          <app-form-field label="プロジェクト名" [required]="true"
                  [errorMessage]="form.get('name')?.invalid && form.get('name')?.touched ? 'プロジェクト名は必須です' : ''"
                  class="md:col-span-2">
            <input type="text" class="input w-full" formControlName="name"
                placeholder="プロジェクト名を入力" data-testid="name-input" />
          </app-form-field>

          <app-form-field label="説明" class="md:col-span-2">
            <textarea class="textarea w-full" formControlName="description"
                 rows="4" placeholder="プロジェクトの説明"
                 data-testid="description-input"></textarea>
          </app-form-field>

          <app-form-field label="PM (プロジェクトマネージャー)" [required]="true"
                  [errorMessage]="form.get('pmId')?.invalid && form.get('pmId')?.touched ? 'PM を選択してください' : ''"
                  class="md:col-span-2">
            <select class="select w-full" formControlName="pmId" data-testid="pm-select">
              <option value="" disabled>PM を選択</option>
              @for (u of users(); track u.id) {
                <option [value]="u.id">{{ u.displayName || u.email }}</option>
              }
            </select>
          </app-form-field>

          <app-form-field label="開始日">
            <input type="date" class="input w-full" formControlName="startDate"
                data-testid="start-date-input" />
          </app-form-field>

          <app-form-field label="終了日">
            <input type="date" class="input w-full" formControlName="endDate"
                data-testid="end-date-input" />
          </app-form-field>
        </div>

        <div class="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-base-200">
          <a routerLink="/projects" class="btn btn-ghost">キャンセル</a>
          <button type="submit" class="btn btn-primary"
              [disabled]="form.invalid || submitting()"
              data-testid="submit-btn">
            @if (submitting()) {
              <span class="loading loading-spinner loading-sm"></span>
            }
            {{ isEdit() ? '更新' : '作成' }}
          </button>
        </div>
      </form>
    </app-form-page>
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
            startDate: res.data.startDate,
            endDate: res.data.endDate,
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
