import { Injectable, inject, ComponentRef } from '@angular/core';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { ToastContainerComponent, ToastData } from './toast-container.component';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

@Injectable({ providedIn: 'root' })
export class ToastService {
  private overlay = inject(Overlay);
  private containerRef: ComponentRef<ToastContainerComponent> | null = null;
  private overlayRef: OverlayRef | null = null;

  private ensureContainer(): ToastContainerComponent {
    if (!this.containerRef) {
      const positionStrategy = this.overlay
        .position().global().top('1rem').right('1rem');

      this.overlayRef = this.overlay.create({ positionStrategy });
      const portal = new ComponentPortal(ToastContainerComponent);
      this.containerRef = this.overlayRef.attach(portal);
    }
    return this.containerRef.instance;
  }

  show(message: string, type: ToastType = 'info', durationMs = 3000): void {
    const container = this.ensureContainer();
    container.addToast({ message, type, id: Date.now() });

    setTimeout(() => {
      container.removeToast(Date.now());
    }, durationMs);
  }

  success(message: string): void { this.show(message, 'success'); }
  error(message: string): void { this.show(message, 'error', 5000); }
  info(message: string): void { this.show(message, 'info'); }
  warning(message: string): void { this.show(message, 'warning'); }
}
