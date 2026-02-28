import { Component, OnInit, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { heroCog6Tooth, heroTrash } from '@ng-icons/heroicons/outline';
import { AdminTenantService } from '../services/tenant.service';
import { FormPageComponent, FormFieldComponent, ToastService } from '../../../shared/ui';

@Component({
 selector: 'app-tenant-settings',
 standalone: true,
 imports: [
  CommonModule,
  ReactiveFormsModule,
  NgIcon,
  FormPageComponent,
  FormFieldComponent,
 ],
 viewProviders: [provideIcons({ heroCog6Tooth, heroTrash })],
 template: `
  <app-form-page title="テナント設定" subtitle="システム全体の基本情報や危険な操作の管理を行います。" data-testid="tenant-settings">
    @if (tenantService.loading()) {
      <div class="flex justify-center items-center py-24" data-testid="loading">
        <span class="loading loading-spinner loading-lg"></span>
      </div>
    } @else if (tenantService.tenant()) {
      <form [formGroup]="form" (ngSubmit)="onSave()" data-testid="tenant-form" class="space-y-4">
        <app-form-field label="組織名" [required]="true">
          <input class="input w-full"
              formControlName="name" placeholder="株式会社〇〇"
              data-testid="tenant-name-input">
        </app-form-field>

        <div class="flex justify-end mt-4">
          <button class="btn btn-primary gap-2" type="submit"
              [disabled]="!form.dirty"
              data-testid="save-btn">
            <ng-icon name="heroCog6Tooth" class="text-lg" />
            保存する
          </button>
        </div>
      </form>

      <!-- 危険な操作 -->
      <div class="divider"></div>
      <div class="card bg-base-100 border border-error/30 shadow-sm">
        <div class="card-body">
          <h3 class="card-title text-error text-base">危険な操作</h3>
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h4 class="font-bold text-base-content mb-1">テナントの削除</h4>
              <p class="text-sm text-base-content/60 m-0 leading-relaxed">
                このテナントと、関連するすべてのプロジェクト、タスク、ユーザーデータが完全に削除されます。
                <br class="hidden sm:block">この操作は取り消すことができません。
              </p>
            </div>
            <button class="btn btn-error gap-2"
                (click)="onDelete()"
                data-testid="delete-btn">
              <ng-icon name="heroTrash" class="text-lg" />
              テナント削除
            </button>
          </div>
        </div>
      </div>
    }
  </app-form-page>
 `,
 styles: [],
})
export class TenantSettingsComponent implements OnInit {
 tenantService = inject(AdminTenantService);
 private fb = inject(FormBuilder);
 private toast = inject(ToastService);

 form: FormGroup = this.fb.group({
  name: [''],
 });

 ngOnInit(): void {
  this.tenantService.loadTenant();
  // Patch form when tenant is loaded
  const check = setInterval(() => {
   const tenant = this.tenantService.tenant();
   if (tenant) {
    this.form.patchValue({ name: tenant.name });
    clearInterval(check);
   }
  }, 100);
 }

 onSave(): void {
  if (this.form.valid && this.form.dirty) {
   this.tenantService.updateTenant(this.form.value);
   this.form.markAsPristine();
  }
 }

 onDelete(): void {
  this.tenantService.deleteTenant();
 }
}
