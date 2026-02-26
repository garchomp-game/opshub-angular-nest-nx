import {
    Injectable, NotFoundException, ConflictException,
    BadRequestException, ForbiddenException, Logger,
} from '@nestjs/common';
import { PrismaService } from '@prisma-db';
import {
    ProjectStatus, PROJECT_TRANSITIONS, canTransition, PaginatedResult,
} from '@shared/types';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { QueryProjectDto } from './dto/query-project.dto';
import { AddMemberDto } from './dto/add-member.dto';

@Injectable()
export class ProjectsService {
    private readonly logger = new Logger(ProjectsService.name);

    constructor(private readonly prisma: PrismaService) { }

    async findAll(tenantId: string, _userId: string, query: QueryProjectDto): Promise<PaginatedResult<any>> {
        const { status, search, page = 1, limit = 20 } = query;

        const where: any = { tenantId };
        if (status) where.status = status;
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
            ];
        }

        const [data, total] = await Promise.all([
            this.prisma.project.findMany({
                where,
                include: {
                    pm: { include: { profile: { select: { displayName: true } } } },
                    _count: { select: { members: true, tasks: true } },
                },
                orderBy: { updatedAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            this.prisma.project.count({ where }),
        ]);

        return {
            data,
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
        };
    }

    async findOne(tenantId: string, id: string) {
        const project = await this.prisma.project.findUnique({
            where: { id, tenantId },
            include: {
                pm: { include: { profile: { select: { displayName: true, avatarUrl: true } } } },
                members: {
                    include: {
                        user: { include: { profile: { select: { displayName: true, avatarUrl: true } } } },
                    },
                },
                _count: { select: { tasks: true } },
            },
        });

        if (!project) {
            throw new NotFoundException({
                code: 'ERR-PJ-004',
                message: 'プロジェクトが見つかりません',
            });
        }

        // タスク統計を取得
        const [todoCount, inProgressCount, doneCount] = await Promise.all([
            this.prisma.task.count({ where: { tenantId, projectId: id, status: 'todo' } }),
            this.prisma.task.count({ where: { tenantId, projectId: id, status: 'in_progress' } }),
            this.prisma.task.count({ where: { tenantId, projectId: id, status: 'done' } }),
        ]);

        return {
            ...project,
            taskStats: {
                total: todoCount + inProgressCount + doneCount,
                todo: todoCount,
                inProgress: inProgressCount,
                done: doneCount,
            },
        };
    }

    async create(tenantId: string, userId: string, dto: CreateProjectDto) {
        // 終了日の検証
        if (dto.startDate && dto.endDate && new Date(dto.endDate) < new Date(dto.startDate)) {
            throw new BadRequestException({
                code: 'ERR-PJ-002',
                message: '終了日は開始日以降に設定してください',
            });
        }

        try {
            const project = await this.prisma.project.create({
                data: {
                    tenantId,
                    name: dto.name,
                    description: dto.description,
                    status: (dto.status as any) ?? 'planning',
                    startDate: dto.startDate ? new Date(dto.startDate) : null,
                    endDate: dto.endDate ? new Date(dto.endDate) : null,
                    pmId: dto.pmId,
                    createdBy: userId,
                },
                include: {
                    pm: { include: { profile: { select: { displayName: true } } } },
                },
            });

            // PM をメンバーとして自動追加
            await this.prisma.projectMember.create({
                data: {
                    projectId: project.id,
                    userId: dto.pmId,
                    tenantId,
                },
            });

            this.logger.log(`Project created: ${project.id} by ${userId}`);
            return project;
        } catch (error: any) {
            if (error.code === 'P2002') {
                throw new ConflictException({
                    code: 'ERR-PJ-001',
                    message: 'プロジェクト名が既に使用されています',
                });
            }
            throw error;
        }
    }

    async update(tenantId: string, id: string, dto: UpdateProjectDto) {
        const existing = await this.prisma.project.findUnique({
            where: { id, tenantId },
        });
        if (!existing) {
            throw new NotFoundException({
                code: 'ERR-PJ-004',
                message: 'プロジェクトが見つかりません',
            });
        }

        // ステータス遷移バリデーション
        if (dto.status && dto.status !== existing.status) {
            if (!canTransition(PROJECT_TRANSITIONS, existing.status as ProjectStatus, dto.status as ProjectStatus)) {
                throw new BadRequestException({
                    code: 'ERR-PJ-012',
                    message: `ステータスを ${existing.status} から ${dto.status} に変更できません`,
                });
            }
        }

        // 終了日チェック
        const startDate = dto.startDate ? new Date(dto.startDate) : existing.startDate;
        const endDate = dto.endDate ? new Date(dto.endDate) : existing.endDate;
        if (startDate && endDate && endDate < startDate) {
            throw new BadRequestException({
                code: 'ERR-PJ-002',
                message: '終了日は開始日以降に設定してください',
            });
        }

        return this.prisma.project.update({
            where: { id, tenantId },
            data: {
                ...(dto.name !== undefined && { name: dto.name }),
                ...(dto.description !== undefined && { description: dto.description }),
                ...(dto.status !== undefined && { status: dto.status as any }),
                ...(dto.startDate !== undefined && { startDate: new Date(dto.startDate) }),
                ...(dto.endDate !== undefined && { endDate: new Date(dto.endDate) }),
                ...(dto.pmId !== undefined && { pmId: dto.pmId }),
            },
            include: {
                pm: { include: { profile: { select: { displayName: true } } } },
            },
        });
    }

    async addMember(tenantId: string, projectId: string, dto: AddMemberDto) {
        // プロジェクト存在確認
        const project = await this.prisma.project.findUnique({
            where: { id: projectId, tenantId },
        });
        if (!project) {
            throw new NotFoundException({
                code: 'ERR-PJ-004',
                message: 'プロジェクトが見つかりません',
            });
        }

        try {
            return await this.prisma.projectMember.create({
                data: {
                    projectId,
                    userId: dto.userId,
                    tenantId,
                },
                include: {
                    user: { include: { profile: { select: { displayName: true, avatarUrl: true } } } },
                },
            });
        } catch (error: any) {
            if (error.code === 'P2002') {
                throw new ConflictException({
                    code: 'ERR-PJ-005',
                    message: 'ユーザーは既にメンバーです',
                });
            }
            throw error;
        }
    }

    async removeMember(tenantId: string, projectId: string, userId: string) {
        const project = await this.prisma.project.findUnique({
            where: { id: projectId, tenantId },
        });
        if (!project) {
            throw new NotFoundException({
                code: 'ERR-PJ-004',
                message: 'プロジェクトが見つかりません',
            });
        }

        // PM は削除不可
        if (project.pmId === userId) {
            throw new ForbiddenException({
                code: 'ERR-PJ-006',
                message: 'PMはプロジェクトから削除できません',
            });
        }

        const member = await this.prisma.projectMember.findFirst({
            where: { projectId, userId, tenantId },
        });
        if (!member) {
            throw new NotFoundException({
                code: 'ERR-PJ-004',
                message: 'メンバーが見つかりません',
            });
        }

        await this.prisma.projectMember.delete({
            where: { id: member.id },
        });
    }
}
