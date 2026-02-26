import {
    Injectable,
    NotFoundException,
    BadRequestException,
    ForbiddenException,
    ConflictException,
    Logger,
} from '@nestjs/common';
import { PrismaService } from '@prisma-db';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { escapeCsvField } from '@shared/util';
import { CreateTimesheetDto } from './dto/create-timesheet.dto';
import { BulkTimesheetDto } from './dto/bulk-timesheet.dto';
import {
    GetDailyTimesheetsQueryDto,
    GetWeeklyTimesheetsQueryDto,
    GetTimesheetSummaryQueryDto,
    ExportTimesheetsQueryDto,
} from './dto/query-timesheet.dto';

@Injectable()
export class TimesheetsService {
    private readonly logger = new Logger(TimesheetsService.name);

    constructor(private readonly prisma: PrismaService) { }

    // ─── Validation Helpers ───

    private validateHoursStep(hours: number): void {
        if (hours % 0.25 !== 0) {
            throw new BadRequestException({
                code: 'ERR-PJ-020',
                message: '工数は0.25時間刻みで入力してください',
            });
        }
    }

    private async validateDailyTotal(
        tenantId: string,
        userId: string,
        workDate: Date,
        hoursToAdd: number,
        excludeId?: string,
    ): Promise<void> {
        const existing = await this.prisma.timesheet.aggregate({
            where: {
                tenantId,
                userId,
                workDate,
                ...(excludeId ? { id: { not: excludeId } } : {}),
            },
            _sum: { hours: true },
        });

        const currentTotal = existing._sum.hours
            ? Number(existing._sum.hours)
            : 0;

        if (currentTotal + hoursToAdd > 24) {
            throw new BadRequestException({
                code: 'ERR-PJ-024',
                message: `1日の合計工数が24時間を超えます（現在: ${currentTotal}h + ${hoursToAdd}h）`,
            });
        }
    }

    // ─── Daily / Weekly 取得 ───

    async getDailyTimesheets(
        tenantId: string,
        currentUserId: string,
        query: GetDailyTimesheetsQueryDto,
    ) {
        const targetUserId = query.userId || currentUserId;
        const workDate = new Date(query.workDate);

        const entries = await this.prisma.timesheet.findMany({
            where: { tenantId, userId: targetUserId, workDate },
            include: {
                project: { select: { id: true, name: true } },
                task: { select: { id: true, title: true } },
            },
            orderBy: { createdAt: 'asc' },
        });

        const totalHours = entries.reduce(
            (sum, e) => sum + Number(e.hours),
            0,
        );

        return { workDate: query.workDate, totalHours, entries };
    }

    async getWeeklyTimesheets(
        tenantId: string,
        currentUserId: string,
        query: GetWeeklyTimesheetsQueryDto,
    ) {
        const targetUserId = query.userId || currentUserId;
        const weekStart = new Date(query.weekStart);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);

        const entries = await this.prisma.timesheet.findMany({
            where: {
                tenantId,
                userId: targetUserId,
                workDate: { gte: weekStart, lte: weekEnd },
            },
            include: {
                project: { select: { id: true, name: true } },
                task: { select: { id: true, title: true } },
            },
            orderBy: [{ projectId: 'asc' }, { workDate: 'asc' }],
        });

        return { weekStart: query.weekStart, entries };
    }

    // ─── Create (Single) ───

    async create(
        tenantId: string,
        userId: string,
        dto: CreateTimesheetDto,
    ) {
        this.validateHoursStep(dto.hours);

        const workDate = new Date(dto.workDate);
        await this.validateDailyTotal(tenantId, userId, workDate, dto.hours);

        try {
            return await this.prisma.timesheet.create({
                data: {
                    tenantId,
                    userId,
                    projectId: dto.projectId,
                    taskId: dto.taskId || null,
                    workDate,
                    hours: dto.hours,
                    note: dto.note || null,
                },
                include: {
                    project: { select: { id: true, name: true } },
                    task: { select: { id: true, title: true } },
                },
            });
        } catch (error) {
            if (error instanceof PrismaClientKnownRequestError) {
                if (error.code === 'P2002') {
                    throw new ConflictException({
                        code: 'ERR-PJ-025',
                        message:
                            '同一プロジェクト/タスク/日付の工数が既に登録されています',
                    });
                }
            }
            throw error;
        }
    }

    // ─── Bulk Upsert ───

    async bulkUpsert(
        tenantId: string,
        userId: string,
        dto: BulkTimesheetDto,
    ) {
        // Validate all entries
        for (const entry of dto.entries) {
            this.validateHoursStep(entry.hours);
        }

        return this.prisma.$transaction(async (tx) => {
            // Delete specified entries
            if (dto.deletedIds && dto.deletedIds.length > 0) {
                // Verify ownership before deleting
                const toDelete = await tx.timesheet.findMany({
                    where: {
                        id: { in: dto.deletedIds },
                        tenantId,
                    },
                });

                for (const entry of toDelete) {
                    if (entry.userId !== userId) {
                        throw new ForbiddenException({
                            code: 'ERR-AUTH-002',
                            message: '他のユーザーの工数は削除できません',
                        });
                    }
                }

                await tx.timesheet.deleteMany({
                    where: {
                        id: { in: dto.deletedIds },
                        tenantId,
                        userId,
                    },
                });
            }

            // Upsert entries
            const results = [];
            for (const entry of dto.entries) {
                const workDate = new Date(entry.workDate);

                if (entry.id) {
                    // Update existing
                    const existing = await tx.timesheet.findUnique({
                        where: { id: entry.id },
                    });

                    if (!existing) {
                        throw new NotFoundException({
                            code: 'ERR-SYS-002',
                            message: `工数レコードが見つかりません: ${entry.id}`,
                        });
                    }

                    if (existing.userId !== userId) {
                        throw new ForbiddenException({
                            code: 'ERR-AUTH-002',
                            message: '他のユーザーの工数は更新できません',
                        });
                    }

                    const updated = await tx.timesheet.update({
                        where: { id: entry.id },
                        data: {
                            projectId: entry.projectId,
                            taskId: entry.taskId || null,
                            workDate,
                            hours: entry.hours,
                            note: entry.note || null,
                        },
                        include: {
                            project: { select: { id: true, name: true } },
                            task: { select: { id: true, title: true } },
                        },
                    });
                    results.push(updated);
                } else {
                    // Create new
                    try {
                        const created = await tx.timesheet.create({
                            data: {
                                tenantId,
                                userId,
                                projectId: entry.projectId,
                                taskId: entry.taskId || null,
                                workDate,
                                hours: entry.hours,
                                note: entry.note || null,
                            },
                            include: {
                                project: {
                                    select: { id: true, name: true },
                                },
                                task: { select: { id: true, title: true } },
                            },
                        });
                        results.push(created);
                    } catch (error) {
                        if (
                            error instanceof
                            PrismaClientKnownRequestError
                        ) {
                            if (error.code === 'P2002') {
                                throw new ConflictException({
                                    code: 'ERR-PJ-025',
                                    message:
                                        '同一プロジェクト/タスク/日付の工数が既に登録されています',
                                });
                            }
                        }
                        throw error;
                    }
                }
            }

            return results;
        });
    }

    // ─── Delete ───

    async remove(tenantId: string, userId: string, id: string) {
        const entry = await this.prisma.timesheet.findUnique({
            where: { id },
        });

        if (!entry || entry.tenantId !== tenantId) {
            throw new NotFoundException({
                code: 'ERR-SYS-002',
                message: '工数レコードが見つかりません',
            });
        }

        if (entry.userId !== userId) {
            throw new ForbiddenException({
                code: 'ERR-AUTH-002',
                message: '他のユーザーの工数は削除できません',
            });
        }

        await this.prisma.timesheet.delete({ where: { id } });
    }

    // ─── Summary ───

    async getProjectSummary(
        tenantId: string,
        query: GetTimesheetSummaryQueryDto,
    ) {
        const dateFrom = new Date(query.dateFrom);
        const dateTo = new Date(query.dateTo);

        const where: any = {
            tenantId,
            workDate: { gte: dateFrom, lte: dateTo },
        };

        if (query.projectIds && query.projectIds.length > 0) {
            where.projectId = { in: query.projectIds };
        }

        const result = await this.prisma.timesheet.groupBy({
            by: ['projectId'],
            where,
            _sum: { hours: true },
            _count: { id: true },
        });

        // Resolve project names
        const projectIds = result.map((r) => r.projectId);
        const projects = await this.prisma.project.findMany({
            where: { id: { in: projectIds } },
            select: { id: true, name: true },
        });

        const projectMap = new Map(projects.map((p) => [p.id, p.name]));

        return result.map((r) => ({
            projectId: r.projectId,
            projectName: projectMap.get(r.projectId) || '不明',
            totalHours: Number(r._sum.hours),
            entryCount: r._count.id,
        }));
    }

    async getUserSummary(
        tenantId: string,
        query: GetTimesheetSummaryQueryDto,
    ) {
        const dateFrom = new Date(query.dateFrom);
        const dateTo = new Date(query.dateTo);

        const where: any = {
            tenantId,
            workDate: { gte: dateFrom, lte: dateTo },
        };

        if (query.projectIds && query.projectIds.length > 0) {
            where.projectId = { in: query.projectIds };
        }

        const result = await this.prisma.timesheet.groupBy({
            by: ['userId'],
            where,
            _sum: { hours: true },
            _count: { id: true },
        });

        // Resolve user names
        const userIds = result.map((r) => r.userId);
        const profiles = await this.prisma.profile.findMany({
            where: { id: { in: userIds } },
            select: { id: true, displayName: true },
        });

        const profileMap = new Map(
            profiles.map((p) => [p.id, p.displayName]),
        );

        return result.map((r) => ({
            userId: r.userId,
            userName: profileMap.get(r.userId) || '不明',
            totalHours: Number(r._sum.hours),
            entryCount: r._count.id,
        }));
    }

    // ─── CSV Export ───

    async exportCsv(
        tenantId: string,
        query: ExportTimesheetsQueryDto,
    ): Promise<Buffer> {
        const dateFrom = new Date(query.dateFrom);
        const dateTo = new Date(query.dateTo);

        const where: any = {
            tenantId,
            workDate: { gte: dateFrom, lte: dateTo },
        };

        if (query.projectId) {
            where.projectId = query.projectId;
        }

        const entries = await this.prisma.timesheet.findMany({
            where,
            include: {
                project: { select: { name: true } },
                task: { select: { title: true } },
                user: {
                    select: {
                        profile: { select: { displayName: true } },
                    },
                },
            },
            orderBy: [
                { workDate: 'asc' },
                { userId: 'asc' },
                { projectId: 'asc' },
            ],
        });

        // Build CSV
        const header = [
            'プロジェクト名',
            'メンバー名',
            '日付',
            '工数(h)',
            'タスク名',
            '備考',
        ];

        const rows = entries.map((e) => [
            escapeCsvField(e.project.name),
            escapeCsvField(e.user.profile?.displayName || ''),
            escapeCsvField(
                e.workDate.toISOString().split('T')[0],
            ),
            escapeCsvField(Number(e.hours)),
            escapeCsvField(e.task?.title || ''),
            escapeCsvField(e.note || ''),
        ]);

        const csvContent = [
            header.map((h) => escapeCsvField(h)).join(','),
            ...rows.map((r) => r.join(',')),
        ].join('\n');

        return Buffer.from(csvContent, 'utf-8');
    }
}
