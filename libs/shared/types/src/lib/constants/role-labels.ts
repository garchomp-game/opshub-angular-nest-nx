import { Role } from '../enums/role.enum';

export const ROLE_LABELS: Record<Role, string> = {
    [Role.MEMBER]: 'メンバー',
    [Role.APPROVER]: '承認者',
    [Role.PM]: 'プロジェクトマネージャー',
    [Role.ACCOUNTING]: '経理',
    [Role.IT_ADMIN]: 'IT管理者',
    [Role.TENANT_ADMIN]: 'テナント管理者',
};
