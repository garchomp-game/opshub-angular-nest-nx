import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
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

    console.log(`Seeded: ${users.length} users, 1 tenant, 1 project`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
