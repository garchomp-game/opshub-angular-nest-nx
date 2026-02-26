import { Role } from '../enums/role.enum';

export interface CurrentUser {
    id: string;
    email: string;
    displayName: string;
    tenantId: string;
    tenantIds: string[];
    roles: TenantRole[];
}

export interface TenantRole {
    tenantId: string;
    role: Role;
}
