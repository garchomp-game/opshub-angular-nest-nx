import { Component, OnInit, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AdminTenantService } from '../services/tenant.service';

@Component({
    selector: 'app-tenant-settings',
    standalone: true,
    imports: [
        ReactiveFormsModule,
        MatCardModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatProgressSpinnerModule,
        MatDialogModule,
    ],
    template: `
    <div class="tenant-settings" data-testid="tenant-settings">
      <h2>テナント設定</h2>

      @if (tenantService.loading()) {
        <mat-progress-spinner mode="indeterminate" diameter="40" data-testid="loading"></mat-progress-spinner>
      } @else if (tenantService.tenant()) {
        <mat-card>
          <mat-card-header>
            <mat-card-title>基本情報</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <form [formGroup]="form" (ngSubmit)="onSave()" data-testid="tenant-form">
              <mat-form-field class="full-width">
                <mat-label>組織名</mat-label>
                <input matInput formControlName="name" data-testid="tenant-name-input">
              </mat-form-field>

              <div class="actions">
                <button mat-raised-button color="primary" type="submit"
                        [disabled]="!form.dirty"
                        data-testid="save-btn">
                  保存
                </button>
                <button mat-raised-button color="warn" type="button"
                        (click)="onDelete()"
                        data-testid="delete-btn">
                  テナント削除
                </button>
              </div>
            </form>
          </mat-card-content>
        </mat-card>
      }
    </div>
  `,
    styles: [`
    .tenant-settings { max-width: 600px; }
    .full-width { width: 100%; }
    .actions { display: flex; gap: 16px; margin-top: 16px; }
  `],
})
export class TenantSettingsComponent implements OnInit {
    tenantService = inject(AdminTenantService);
    private fb = inject(FormBuilder);
    private dialog = inject(MatDialog);
    private snackBar = inject(MatSnackBar);

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
        if (confirm('テナントを本当に削除しますか？この操作は取り消せません。')) {
            this.tenantService.deleteTenant();
        }
    }
}
