import { OverlayRef } from '@angular/cdk/overlay';
import { Subject, Observable } from 'rxjs';

export class ModalRef<T = any, R = any> {
  private afterClosedSubject = new Subject<R | undefined>();

  constructor(
    private overlayRef: OverlayRef,
    public componentInstance: T,
  ) { }

  close(result?: R): void {
    this.overlayRef.dispose();
    this.afterClosedSubject.next(result);
    this.afterClosedSubject.complete();
  }

  afterClosed(): Observable<R | undefined> {
    return this.afterClosedSubject.asObservable();
  }
}
