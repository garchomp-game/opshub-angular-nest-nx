import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

export interface ConfirmDialogData {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    color?: 'primary' | 'warn';
}

@Component({
    selector: 'app-confirm-dialog',
    standalone: true,
    imports: [MatDialogModule, MatButtonModule],
    template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    <mat-dialog-content>{{ data.message }}</mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>
        {{ data.cancelText ?? 'キャンセル' }}
      </button>
      <button mat-raised-button
              [color]="data.color ?? 'warn'"
              [mat-dialog-close]="true">
        {{ data.confirmText ?? '確認' }}
      </button>
    </mat-dialog-actions>
  `,
})
export class ConfirmDialogComponent {
    data = inject<ConfirmDialogData>(MAT_DIALOG_DATA);
}
