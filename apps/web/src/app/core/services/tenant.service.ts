import { Injectable, signal, computed, inject } from '@angular/core';
import { AuthService } from '../auth/auth.service';

@Injectable({ providedIn: 'root' })
export class TenantService {
    private auth = inject(AuthService);

    /** アクティブテナント ID (Signal) */
    private _activeTenantId = signal<string | null>(null);

    readonly activeTenantId = this._activeTenantId.asReadonly();

    /** テナント ID 一覧 */
    readonly tenantIds = computed(() => this.auth.currentUser()?.tenantIds ?? []);

    /** テナント切替 */
    switchTenant(tenantId: string): void {
        if (!this.tenantIds().includes(tenantId)) {
            throw new Error(`User is not a member of tenant: ${tenantId}`);
        }
        this._activeTenantId.set(tenantId);
        localStorage.setItem('activeTenantId', tenantId);
    }

    /** 初期化時に復元 */
    initialize(): void {
        const stored = localStorage.getItem('activeTenantId');
        const userTenantIds = this.tenantIds();
        if (stored && userTenantIds.includes(stored)) {
            this._activeTenantId.set(stored);
        } else if (userTenantIds.length > 0) {
            this._activeTenantId.set(userTenantIds[0]);
        }
    }
}
