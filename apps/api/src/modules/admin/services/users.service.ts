import {
    Injectable,
    NotFoundException,
    ForbiddenException,
    ConflictException,
    Logger,
} from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { PrismaService } from '@prisma-db';
import { InviteUserDto } from '../dto/invite-user.dto';
import { UpdateUserRoleDto } from '../dto/update-user-role.dto';

@Injectable()
export class UsersService {
    private readonly logger = new Logger(UsersService.name);

    constructor(private readonly prisma: PrismaService) { }

    async findAll(tenantId: string) {
        const userRoles = await this.prisma.userRole.findMany({
            where: { tenantId },
            include: {
                user: {
                    include: {
                        profile: { select: { displayName: true, avatarUrl: true } },
                    },
                },
            },
        });

        // Group by user to aggregate roles
        const userMap = new Map<string, any>();
        for (const ur of userRoles) {
            if (!userMap.has(ur.userId)) {
                userMap.set(ur.userId, {
                    id: ur.user.id,
                    email: ur.user.email,
                    displayName: ur.user.profile?.displayName ?? ur.user.email,
                    avatarUrl: ur.user.profile?.avatarUrl ?? null,
                    roles: [],
                    createdAt: ur.user.createdAt,
                });
            }
            userMap.get(ur.userId).roles.push(ur.role);
        }

        return Array.from(userMap.values());
    }

    async findOne(tenantId: string, userId: string) {
        const userRole = await this.prisma.userRole.findFirst({
            where: { tenantId, userId },
            include: {
                user: {
                    include: {
                        profile: { select: { displayName: true, avatarUrl: true } },
                        roles: { where: { tenantId }, select: { role: true } },
                    },
                },
            },
        });

        if (!userRole) {
            throw new NotFoundException({
                code: 'ERR-ADM-004',
                message: 'ユーザーが見つかりません',
            });
        }

        return {
            id: userRole.user.id,
            email: userRole.user.email,
            displayName: userRole.user.profile?.displayName ?? userRole.user.email,
            avatarUrl: userRole.user.profile?.avatarUrl ?? null,
            roles: userRole.user.roles.map((r: any) => r.role),
            createdAt: userRole.user.createdAt,
        };
    }

    async invite(tenantId: string, dto: InviteUserDto) {
        try {
            return await this.prisma.$transaction(async (tx: any) => {
                // Create or find user
                let user = await tx.user.findUnique({
                    where: { email: dto.email },
                });

                if (user) {
                    // Check if already in this tenant
                    const existingRole = await tx.userRole.findFirst({
                        where: { userId: user.id, tenantId },
                    });
                    if (existingRole) {
                        throw new ConflictException({
                            code: 'ERR-ADM-003',
                            message: 'このメールアドレスは既にテナントに登録されています',
                        });
                    }
                } else {
                    user = await tx.user.create({
                        data: { email: dto.email },
                    });
                    await tx.profile.create({
                        data: {
                            id: user.id,
                            displayName: dto.displayName ?? dto.email,
                        },
                    });
                }

                // Create UserRole
                await tx.userRole.create({
                    data: {
                        userId: user.id,
                        tenantId,
                        role: dto.role,
                    },
                });

                this.logger.log(`User invited: ${dto.email} to tenant ${tenantId}`);
                return { id: user.id, email: user.email };
            });
        } catch (error) {
            if (error instanceof ConflictException) throw error;
            if (error instanceof PrismaClientKnownRequestError) {
                if (error.code === 'P2002') {
                    throw new ConflictException({
                        code: 'ERR-ADM-003',
                        message: 'このメールアドレスは既にテナントに登録されています',
                    });
                }
            }
            throw error;
        }
    }

    async updateRole(
        tenantId: string,
        userId: string,
        dto: UpdateUserRoleDto,
        currentUserId: string,
    ) {
        if (userId === currentUserId) {
            throw new ForbiddenException({
                code: 'ERR-ADM-002',
                message: '自分のロールは変更できません',
            });
        }

        // Verify user exists in tenant
        const existingRole = await this.prisma.userRole.findFirst({
            where: { tenantId, userId },
        });

        if (!existingRole) {
            throw new NotFoundException({
                code: 'ERR-ADM-004',
                message: 'ユーザーが見つかりません',
            });
        }

        // Update the role
        const updated = await this.prisma.userRole.update({
            where: { id: existingRole.id },
            data: { role: dto.role },
        });

        this.logger.log(`User role updated: ${userId} -> ${dto.role}`);
        return updated;
    }

    async updateStatus(tenantId: string, userId: string, active: boolean) {
        // Verify user exists in tenant
        const existingRoles = await this.prisma.userRole.findMany({
            where: { tenantId, userId },
        });

        if (existingRoles.length === 0) {
            throw new NotFoundException({
                code: 'ERR-ADM-004',
                message: 'ユーザーが見つかりません',
            });
        }

        if (!active) {
            // Remove all roles for the user in this tenant (soft deactivation)
            await this.prisma.userRole.deleteMany({
                where: { tenantId, userId },
            });
            this.logger.log(`User deactivated: ${userId} in tenant ${tenantId}`);
        }

        // For reactivation, the user would need to be re-invited
    }
}
