import { AsyncLocalStorage } from 'async_hooks';

/** テナントコンテキスト */
export interface TenantContext {
    tenantId: string;
    skipTenantCheck?: boolean;
}

/** AsyncLocalStorage によるリクエストスコープのテナント管理 */
export const tenantStore = new AsyncLocalStorage<TenantContext>();

/** テナント分離対象モデル */
export const TENANT_MODELS: string[] = [
    'Project', 'ProjectMember', 'Task', 'Workflow',
    'Timesheet', 'Expense', 'Notification', 'AuditLog',
    'Invoice', 'InvoiceItem', 'Document', 'WorkflowAttachment',
    'UserRole',
];

/**
 * Prisma v6 $extends 用テナント分離ロジック。
 * query.$allModels.$allOperations 内で呼び出す。
 *
 * @returns 変更後の args（tenantId 自動注入済み）。
 *          null を返した場合は注入不要。
 */
export function applyTenantFilter(
    model: string,
    operation: string,
    args: any,
): any {
    if (!TENANT_MODELS.includes(model)) return args;

    const ctx = tenantStore.getStore();
    if (ctx?.skipTenantCheck) return args;

    const tenantId = ctx?.tenantId;
    if (!tenantId) {
        throw new Error(
            `TenantMiddleware: tenantId is missing for model "${model}". ` +
            'Ensure TenantInterceptor or @SkipTenantCheck() is applied.',
        );
    }

    // READ / UPDATE / DELETE → where に tenantId 追加
    const readWriteOps = [
        'findMany', 'findFirst', 'findUnique', 'findFirstOrThrow', 'findUniqueOrThrow',
        'count', 'aggregate', 'groupBy',
        'update', 'updateMany',
        'delete', 'deleteMany',
    ];
    if (readWriteOps.includes(operation)) {
        args = args ?? {};
        args.where = { ...args.where, tenantId };
    }

    // CREATE → data に tenantId 付与
    if (operation === 'create') {
        args = args ?? {};
        args.data = { ...args.data, tenantId };
    }
    if (operation === 'createMany') {
        args = args ?? {};
        args.data = (args.data as any[]).map((item) => ({
            ...item,
            tenantId,
        }));
    }

    return args;
}
