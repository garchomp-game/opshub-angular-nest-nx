/**
 * @deprecated PrimeNG ConfirmDialog is now used via ConfirmationService.
 * This component is kept for backward compatibility but should not be used directly.
 * Use ModalService.open() instead, which delegates to PrimeNG ConfirmationService.
 */
import { Component } from '@angular/core';

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
  template: `<!-- Handled by PrimeNG p-confirmdialog in app-shell -->`,
})
export class ConfirmDialogComponent {
  data!: ConfirmDialogData;
}
