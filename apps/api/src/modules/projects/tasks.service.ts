import {
    Injectable, NotFoundException, BadRequestException, ConflictException, Logger,
} from '@nestjs/common';
import { PrismaService } from '@prisma-db';
import { TaskStatus, TASK_TRANSITIONS, canTransition } from '@shared/types';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto, ChangeTaskStatusDto } from './dto/update-task.dto';

@Injectable()
export class TasksService {
    private readonly logger = new Logger(TasksService.name);

    constructor(private readonly prisma: PrismaService) { }

    async findByProject(tenantId: string, projectId: string) {
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

        return this.prisma.task.findMany({
            where: { tenantId, projectId },
            include: {
                assignee: {
                    include: { profile: { select: { displayName: true, avatarUrl: true } } },
                },
                creator: {
                    include: { profile: { select: { displayName: true } } },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async create(tenantId: string, projectId: string, userId: string, dto: CreateTaskDto) {
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

        // 担当者がPJメンバーか確認
        if (dto.assigneeId) {
            const isMember = await this.prisma.projectMember.findFirst({
                where: { projectId, userId: dto.assigneeId, tenantId },
            });
            if (!isMember) {
                throw new BadRequestException({
                    code: 'ERR-PJ-011',
                    message: '担当者がプロジェクトメンバーに存在しません',
                });
            }
        }

        return this.prisma.task.create({
            data: {
                tenantId,
                projectId,
                title: dto.title,
                description: dto.description,
                status: 'todo' as any,
                assigneeId: dto.assigneeId,
                dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
                createdBy: userId,
            },
            include: {
                assignee: {
                    include: { profile: { select: { displayName: true, avatarUrl: true } } },
                },
            },
        });
    }

    async update(tenantId: string, id: string, dto: UpdateTaskDto) {
        const existing = await this.prisma.task.findUnique({
            where: { id, tenantId },
        });
        if (!existing) {
            throw new NotFoundException({
                code: 'ERR-PJ-004',
                message: 'タスクが見つかりません',
            });
        }

        return this.prisma.task.update({
            where: { id, tenantId },
            data: {
                ...(dto.title !== undefined && { title: dto.title }),
                ...(dto.description !== undefined && { description: dto.description }),
                ...(dto.assigneeId !== undefined && { assigneeId: dto.assigneeId }),
                ...(dto.dueDate !== undefined && { dueDate: dto.dueDate ? new Date(dto.dueDate) : null }),
            },
            include: {
                assignee: {
                    include: { profile: { select: { displayName: true, avatarUrl: true } } },
                },
            },
        });
    }

    async changeStatus(tenantId: string, id: string, dto: ChangeTaskStatusDto) {
        const existing = await this.prisma.task.findUnique({
            where: { id, tenantId },
        });
        if (!existing) {
            throw new NotFoundException({
                code: 'ERR-PJ-004',
                message: 'タスクが見つかりません',
            });
        }

        // TASK_TRANSITIONS による遷移バリデーション
        if (!canTransition(TASK_TRANSITIONS, existing.status as TaskStatus, dto.status as TaskStatus)) {
            throw new BadRequestException({
                code: 'ERR-PJ-012',
                message: `ステータスを ${existing.status} から ${dto.status} に変更できません`,
            });
        }

        return this.prisma.task.update({
            where: { id, tenantId },
            data: { status: dto.status as any },
            include: {
                assignee: {
                    include: { profile: { select: { displayName: true, avatarUrl: true } } },
                },
            },
        });
    }

    async remove(tenantId: string, id: string) {
        const existing = await this.prisma.task.findUnique({
            where: { id, tenantId },
            include: { _count: { select: { timesheets: true } } },
        });
        if (!existing) {
            throw new NotFoundException({
                code: 'ERR-PJ-004',
                message: 'タスクが見つかりません',
            });
        }

        // タイムシートが紐づいている場合は削除不可
        if (existing._count.timesheets > 0) {
            throw new ConflictException({
                code: 'ERR-PJ-014',
                message: '工数記録が紐づいているため削除できません',
            });
        }

        await this.prisma.task.delete({
            where: { id, tenantId },
        });
    }
}
