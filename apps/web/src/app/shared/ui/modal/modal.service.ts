import { Injectable, inject } from '@angular/core';
import { Overlay, OverlayConfig, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { ComponentType } from '@angular/cdk/overlay';
import { ModalRef } from './modal-ref';

export interface ModalConfig {
  data?: any;
  width?: string;
}

@Injectable({ providedIn: 'root' })
export class ModalService {
  private overlay = inject(Overlay);

  open<T>(component: ComponentType<T>, config?: ModalConfig): ModalRef<T> {
    const positionStrategy = this.overlay
      .position().global().centerHorizontally().centerVertically();

    const overlayConfig = new OverlayConfig({
      positionStrategy,
      hasBackdrop: true,
      backdropClass: 'bg-black/50',
      width: config?.width ?? '32rem',
    });

    const overlayRef = this.overlay.create(overlayConfig);
    const portal = new ComponentPortal(component);
    const componentRef = overlayRef.attach(portal);

    const modalRef = new ModalRef<T>(overlayRef, componentRef.instance);

    overlayRef.backdropClick().subscribe(() => modalRef.close());

    if (config?.data) {
      Object.assign(componentRef.instance as object, { data: config.data });
    }

    return modalRef;
  }
}
