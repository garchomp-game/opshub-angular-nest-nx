import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { UsersService } from '../services/users.service';
import { PrismaService } from '@prisma-db';
import { Role } from '@shared/types';

describe('UsersService', () => {
    let service: UsersService;

    const mockPrisma = {
        userRole: {
            findMany: jest.fn(),
            findFirst: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            deleteMany: jest.fn(),
        },
        user: {
            findUnique: jest.fn(),
            create: jest.fn(),
        },
        profile: {
            create: jest.fn(),
        },
        $transaction: jest.fn((fn: any) => fn(mockPrisma)),
    };

    const tenantId = 'tenant-001';
    const userId = 'user-001';
    const adminId = 'admin-001';

    const mockUserRole = {
        id: 'ur-001',
        userId,
        tenantId,
        role: 'member',
        user: {
            id: userId,
            email: 'user@demo.com',
            createdAt: new Date(),
            profile: { displayName: 'テストユーザー', avatarUrl: null },
            roles: [{ role: 'member' }],
        },
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UsersService,
                { provide: PrismaService, useValue: mockPrisma },
            ],
        }).compile();

        service = module.get<UsersService>(UsersService);
        jest.clearAllMocks();
    });

    describe('findAll', () => {
        it('テナント内のユーザー一覧を返すこと', async () => {
            mockPrisma.userRole.findMany.mockResolvedValue([mockUserRole]);

            const result = await service.findAll(tenantId);

            expect(result).toHaveLength(1);
            expect(result[0].email).toBe('user@demo.com');
        });
    });

    describe('findOne', () => {
        it('ユーザー詳細を返すこと', async () => {
            mockPrisma.userRole.findFirst.mockResolvedValue(mockUserRole);

            const result = await service.findOne(tenantId, userId);

            expect(result.email).toBe('user@demo.com');
            expect(result.displayName).toBe('テストユーザー');
        });

        it('存在しない場合 NotFoundException を投げること', async () => {
            mockPrisma.userRole.findFirst.mockResolvedValue(null);

            await expect(service.findOne(tenantId, 'nonexist'))
                .rejects.toThrow(NotFoundException);
        });
    });

    describe('invite', () => {
        it('新規ユーザーを招待できること', async () => {
            mockPrisma.user.findUnique.mockResolvedValue(null);
            mockPrisma.user.create.mockResolvedValue({ id: 'new-user', email: 'new@demo.com' });
            mockPrisma.profile.create.mockResolvedValue({});
            mockPrisma.userRole.create.mockResolvedValue({});

            const result = await service.invite(tenantId, {
                email: 'new@demo.com',
                role: Role.MEMBER,
            });

            expect(result.email).toBe('new@demo.com');
        });

        it('既にテナントに存在する場合 ConflictException を投げること', async () => {
            mockPrisma.user.findUnique.mockResolvedValue({ id: userId, email: 'user@demo.com' });
            mockPrisma.userRole.findFirst.mockResolvedValue(mockUserRole);

            await expect(
                service.invite(tenantId, { email: 'user@demo.com', role: Role.MEMBER }),
            ).rejects.toThrow(ConflictException);
        });
    });

    describe('updateRole', () => {
        it('ロールを変更できること', async () => {
            mockPrisma.userRole.findFirst.mockResolvedValue(mockUserRole);
            mockPrisma.userRole.update.mockResolvedValue({ ...mockUserRole, role: 'approver' });

            const result = await service.updateRole(
                tenantId, userId, { role: Role.APPROVER }, adminId,
            );

            expect(result.role).toBe('approver');
        });

        it('自分自身のロール変更は ForbiddenException を投げること', async () => {
            await expect(
                service.updateRole(tenantId, adminId, { role: Role.MEMBER }, adminId),
            ).rejects.toThrow(ForbiddenException);
        });

        it('存在しないユーザーは NotFoundException を投げること', async () => {
            mockPrisma.userRole.findFirst.mockResolvedValue(null);

            await expect(
                service.updateRole(tenantId, 'nonexist', { role: Role.APPROVER }, adminId),
            ).rejects.toThrow(NotFoundException);
        });
    });

    describe('updateStatus', () => {
        it('ユーザーを無効化できること', async () => {
            mockPrisma.userRole.findMany.mockResolvedValue([mockUserRole]);
            mockPrisma.userRole.deleteMany.mockResolvedValue({ count: 1 });

            await service.updateStatus(tenantId, userId, false);

            expect(mockPrisma.userRole.deleteMany).toHaveBeenCalledWith({
                where: { tenantId, userId },
            });
        });

        it('存在しないユーザーは NotFoundException を投げること', async () => {
            mockPrisma.userRole.findMany.mockResolvedValue([]);

            await expect(
                service.updateStatus(tenantId, 'nonexist', false),
            ).rejects.toThrow(NotFoundException);
        });
    });
});
