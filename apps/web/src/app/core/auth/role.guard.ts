import { CanActivateFn, ActivatedRouteSnapshot, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
    const auth = inject(AuthService);
    const router = inject(Router);
    const requiredRoles = route.data['roles'] as string[] | undefined;

    if (!requiredRoles || requiredRoles.length === 0) return true;
    if (auth.hasRole(...requiredRoles)) return true;

    router.navigate(['/dashboard']);
    return false;
};
