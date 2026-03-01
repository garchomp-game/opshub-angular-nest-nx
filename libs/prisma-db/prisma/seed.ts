import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    // ── 既存データ削除（TRUNCATE CASCADE で FK 順序不要） ──
    const tables = [
        'notifications', 'documents', 'workflow_attachments', 'workflows',
        'invoice_items', 'invoices', 'expenses', 'timesheets', 'tasks',
        'project_members', 'projects', 'audit_logs', 'user_roles', 'profiles',
        'users', 'tenants',
    ];
    for (const table of tables) {
        await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${table}" CASCADE`).catch(() => { });
    }

    // 1. テナント
    const tenant = await prisma.tenant.create({
        data: { name: 'Demo Corp', slug: 'demo-corp' },
    });

    // 2. ユーザー (6ロール分)
    const password = await bcrypt.hash('Password123', 10);
    const roles = [
        { email: 'admin@demo.com', displayName: '管理者', role: 'tenant_admin' as const },
        { email: 'pm@demo.com', displayName: 'PM太郎', role: 'pm' as const },
        { email: 'member@demo.com', displayName: 'メンバー花子', role: 'member' as const },
        { email: 'approver@demo.com', displayName: '承認者次郎', role: 'approver' as const },
        { email: 'accounting@demo.com', displayName: '経理三郎', role: 'accounting' as const },
        { email: 'itadmin@demo.com', displayName: 'IT管理者', role: 'it_admin' as const },
    ];

    const users = await Promise.all(
        roles.map(async (u) => {
            const user = await prisma.user.create({
                data: { email: u.email, password },
            });
            await prisma.profile.create({
                data: { id: user.id, displayName: u.displayName },
            });
            await prisma.userRole.create({
                data: { userId: user.id, tenantId: tenant.id, role: u.role },
            });
            return { ...user, role: u.role };
        }),
    );

    // 3. プロジェクト
    const pm = users.find((u) => u.role === 'pm')!;
    await prisma.project.create({
        data: {
            tenantId: tenant.id,
            name: 'ECサイトリニューアル',
            description: '既存ECサイトの全面リニューアルプロジェクト',
            status: 'active',
            pmId: pm.id,
            createdBy: pm.id,
        },
    });

    // 4. 通知ダミーデータ
    const admin = users.find((u) => u.role === 'tenant_admin')!;
    const member = users.find((u) => u.role === 'member')!;
    const approver = users.find((u) => u.role === 'approver')!;

    const notifications = [
        {
            tenantId: tenant.id,
            userId: admin.id,
            type: 'workflow',
            title: '新しい経費申請が提出されました',
            body: 'メンバー花子さんから「出張交通費精算」の申請が届いています。',
            resourceType: 'workflow',
            isRead: false,
        },
        {
            tenantId: tenant.id,
            userId: admin.id,
            type: 'project',
            title: 'ECサイトリニューアル: マイルストーン達成',
            body: 'フェーズ1の全タスクが完了しました。次のフェーズに進めます。',
            resourceType: 'project',
            isRead: false,
        },
        {
            tenantId: tenant.id,
            userId: member.id,
            type: 'task',
            title: '新しいタスクが割り当てられました',
            body: 'PM太郎さんから「UI デザインレビュー」が割り当てられました。',
            resourceType: 'task',
            isRead: false,
        },
        {
            tenantId: tenant.id,
            userId: approver.id,
            type: 'expense',
            title: '経費申請の承認依頼',
            body: 'メンバー花子さんの「クライアント会食費」¥15,000 の承認をお願いします。',
            resourceType: 'expense',
            isRead: true,
        },
        {
            tenantId: tenant.id,
            userId: admin.id,
            type: 'system',
            title: 'システムメンテナンスのお知らせ',
            body: '3月15日 02:00〜04:00 にシステムメンテナンスを予定しています。',
            isRead: true,
        },
        {
            tenantId: tenant.id,
            userId: admin.id,
            type: 'workflow',
            title: '申請が承認されました',
            body: '「備品購入申請」が承認者次郎さんにより承認されました。',
            resourceType: 'workflow',
            isRead: false,
        },
    ];

    await prisma.notification.createMany({ data: notifications });

    console.log(`Seeded: ${users.length} users, 1 tenant, 1 project, ${notifications.length} notifications`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
