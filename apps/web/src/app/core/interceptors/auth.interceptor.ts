import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../auth/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const auth = inject(AuthService);
    const token = auth.getAccessToken();

    // トークンがあれば Bearer ヘッダーを付与
    if (token && !req.url.includes('/auth/login') && !req.url.includes('/auth/refresh')) {
        req = req.clone({
            setHeaders: { Authorization: `Bearer ${token}` },
        });
    }

    return next(req).pipe(
        catchError((error: HttpErrorResponse) => {
            // 401 → トークンリフレッシュを試行
            if (error.status === 401 && !req.url.includes('/auth/')) {
                return auth.refreshToken().pipe(
                    switchMap((res) => {
                        if (res.success) {
                            const retryReq = req.clone({
                                setHeaders: { Authorization: `Bearer ${res.data.accessToken}` },
                            });
                            return next(retryReq);
                        }
                        auth.logout();
                        return throwError(() => error);
                    }),
                    catchError(() => {
                        auth.logout();
                        return throwError(() => error);
                    }),
                );
            }
            return throwError(() => error);
        }),
    );
};
