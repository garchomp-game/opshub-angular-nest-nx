/**
 * AuditLog は append-only。
 * Prisma v6 の $extends query で UPDATE / DELETE を禁止する。
 */

const FORBIDDEN_OPERATIONS = ['update', 'updateMany', 'delete', 'deleteMany'];

/**
 * Prisma v6 $extends 用 AuditLog 保護ロジック。
 * query.$allModels.$allOperations 内で呼び出す。
 *
 * @throws AuditLog に対する UPDATE / DELETE 操作時
 */
export function enforceAuditLogAppendOnly(
    model: string,
    operation: string,
): void {
    if (model !== 'AuditLog') return;

    if (FORBIDDEN_OPERATIONS.includes(operation)) {
        throw new Error(
            'AuditLog is append-only. UPDATE and DELETE operations are forbidden.',
        );
    }
}
