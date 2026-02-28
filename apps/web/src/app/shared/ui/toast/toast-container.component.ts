import { Component, signal } from '@angular/core';

export interface ToastData {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

const ALERT_CLASS: Record<string, string> = {
  success: 'alert-success',
  error: 'alert-error',
  info: 'alert-info',
  warning: 'alert-warning',
};

@Component({
  selector: 'app-toast-container',
  standalone: true,
  template: `
    <div class="flex flex-col gap-2 min-w-72">
      @for (toast of toasts(); track toast.id) {
        <div class="alert shadow-lg" [class]="getAlertClass(toast.type)"
           role="alert">
          <span>{{ toast.message }}</span>
          <button class="btn btn-ghost btn-xs" (click)="removeToast(toast.id)">✕</button>
        </div>
      }
    </div>
  `,
})
export class ToastContainerComponent {
  toasts = signal<ToastData[]>([]);

  getAlertClass(type: string): string {
    return ALERT_CLASS[type] ?? 'alert-info';
  }

  addToast(toast: ToastData): void {
    this.toasts.update(list => [...list, toast]);
  }

  removeToast(id: number): void {
    this.toasts.update(list => list.filter(t => t.id !== id));
  }
}
