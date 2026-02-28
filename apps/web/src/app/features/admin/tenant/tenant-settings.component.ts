import { Component, OnInit, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { AdminTenantService } from '../services/tenant.service';
import { ToastService } from '../../../shared/ui/toast/toast.service';

@Component({
  selector: 'app-tenant-settings',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CardModule,
    ButtonModule,
    InputTextModule,
    ProgressSpinnerModule,
  ],
  template: `
  <div class="p-6 lg:p-8 max-w-4xl mx-auto space-y-6" data-testid="tenant-settings">
    <div class="mb-2">
      <h1 class="text-2xl font-bold m-0">テナント設定</h1>
      <p class="mt-1 text-sm" style="color: var(--p-text-muted-color)">システム全体の基本情報や危険な操作の管理を行います。</p>
    </div>

    @if (tenantService.loading()) {
      <div class="flex justify-center items-center py-24" data-testid="loading">
        <p-progressspinner strokeWidth="4" />
      </div>
    } @else if (tenantService.tenant()) {
      <p-card>
        <form [formGroup]="form" (ngSubmit)="onSave()" data-testid="tenant-form" class="space-y-4">
          <div class="flex flex-col gap-2">
            <label for="tenant-name" class="font-medium text-sm">組織名 <span class="text-red-500">*</span></label>
            <input pInputText id="tenant-name"
                formControlName="name" placeholder="株式会社〇〇"
                class="w-full"
                data-testid="tenant-name-input">
          </div>

          <div class="flex justify-end mt-4">
            <p-button label="保存する" icon="pi pi-cog" type="submit"
                [disabled]="!form.dirty"
                data-testid="save-btn" />
          </div>
        </form>
      </p-card>

      <!-- 危険な操作 -->
      <p-card styleClass="border-red-300" [style]="{ 'border': '1px solid var(--p-red-300)' }">
        <h3 class="text-base font-bold m-0 mb-4" style="color: var(--p-red-500)">危険な操作</h3>
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h4 class="font-bold mb-1 m-0">テナントの削除</h4>
            <p class="text-sm leading-relaxed m-0" style="color: var(--p-text-muted-color)">
              このテナントと、関連するすべてのプロジェクト、タスク、ユーザーデータが完全に削除されます。
              <br class="hidden sm:block">この操作は取り消すことができません。
            </p>
          </div>
          <p-button label="テナント削除" icon="pi pi-trash" severity="danger"
              (onClick)="onDelete()"
              data-testid="delete-btn" />
        </div>
      </p-card>
    }
  </div>
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
