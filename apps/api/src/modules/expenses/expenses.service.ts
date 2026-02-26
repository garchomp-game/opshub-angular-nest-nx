import {
    Injectable,
    NotFoundException,
    BadRequestException,
    Logger,
} from '@nestjs/common';
import { PrismaService } from '@prisma-db';
import type { Prisma } from '@prisma/client';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { ExpenseQueryDto } from './dto/expense-query.dto';
import { ExpenseSummaryQueryDto } from './dto/expense-summary-query.dto';

@Injectable()
export class ExpensesService {
    private readonly logger = new Logger(ExpensesService.name);

    constructor(private readonly prisma: PrismaService) { }

    // ─── findAll ───

    async findAll(tenantId: string, userId: string, query: ExpenseQueryDto) {
        const { category, status, page = 1, limit = 20 } = query;

        const where: Prisma.ExpenseWhereInput = {
            tenantId,
        };

        // カテゴリフィルタ
        if (category) {
            where.category = category;
        }

        // ステータスフィルタ (workflow のステータスで絞り込み)
        if (status) {
            where.workflow = { status: status as any };
        }

        const [expenses, total] = await Promise.all([
            this.prisma.expense.findMany({
                where,
                include: {
                    project: { select: { id: true, name: true } },
                    workflow: { select: { id: true, status: true, workflowNumber: true } },
                    creator: {
                        select: {
                            id: true,
                            profile: { select: { displayName: true } },
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            this.prisma.expense.count({ where }),
        ]);

        return {
            data: expenses.map((e) => ({
                ...e,
                createdBy: {
                    id: e.creator.id,
                    displayName: e.creator.profile?.displayName ?? '',
                },
                creator: undefined,
            })),
            total,
            page,
            limit,
        };
    }

    // ─── findOne ───

    async findOne(tenantId: string, id: string) {
        const expense = await this.prisma.expense.findUnique({
            where: { id },
            include: {
                project: { select: { id: true, name: true } },
                workflow: {
                    select: {
                        id: true,
                        status: true,
                        workflowNumber: true,
                        title: true,
                    },
                },
                creator: {
                    select: {
                        id: true,
                        profile: { select: { displayName: true } },
                    },
                },
            },
        });

        if (!expense || expense.tenantId !== tenantId) {
            throw new NotFoundException('ERR-EXP-001: 経費が見つかりません');
        }

        return {
            ...expense,
            createdBy: {
                id: expense.creator.id,
                displayName: expense.creator.profile?.displayName ?? '',
            },
            creator: undefined,
        };
    }

    // ─── create ───

    async create(tenantId: string, userId: string, dto: CreateExpenseDto) {
        // プロジェクト存在チェック
        const project = await this.prisma.project.findUnique({
            where: { id: dto.projectId },
        });
        if (!project || project.tenantId !== tenantId) {
            throw new BadRequestException('ERR-VAL-004: プロジェクトが存在しません');
        }

        // 承認者存在チェック
        const approverRole = await this.prisma.userRole.findFirst({
            where: {
                userId: dto.approverId,
                tenantId,
                role: { in: ['approver', 'accounting', 'tenant_admin'] as any },
            },
        });
        if (!approverRole) {
            throw new BadRequestException('ERR-VAL-005: 承認者が存在しないか、承認権限がありません');
        }

        return this.prisma.$transaction(async (tx) => {
            // ワークフロー連動: submitted の場合は Workflow も作成
            let workflowId: string | undefined;

            if (dto.status === 'submitted' || dto.status === 'draft') {
                // WF 採番
                const tenant = await tx.tenant.update({
                    where: { id: tenantId },
                    data: { workflowSeq: { increment: 1 } },
                });
                const workflowNumber = `WF-${String(tenant.workflowSeq).padStart(4, '0')}`;

                const workflow = await tx.workflow.create({
                    data: {
                        tenantId,
                        workflowNumber,
                        type: 'expense',
                        title: `経費申請: ${dto.category} ¥${dto.amount.toLocaleString()}`,
                        description: dto.description,
                        status: dto.status === 'submitted' ? 'submitted' : 'draft',
                        amount: dto.amount,
                        approverId: dto.approverId,
                        createdBy: userId,
                    },
                });
                workflowId = workflow.id;
            }

            // 経費レコード作成
            const expense = await tx.expense.create({
                data: {
                    tenantId,
                    workflowId,
                    projectId: dto.projectId,
                    category: dto.category,
                    amount: dto.amount,
                    expenseDate: new Date(dto.expenseDate),
                    description: dto.description,
                    createdBy: userId,
                },
                include: {
                    project: { select: { id: true, name: true } },
                    workflow: { select: { id: true, status: true, workflowNumber: true } },
                },
            });

            this.logger.log(
                `Expense created: ${expense.id} by user ${userId} in tenant ${tenantId}`,
            );

            return expense;
        });
    }

    // ─── Summary: by-category ───

    async getSummaryByCategory(tenantId: string, query: ExpenseSummaryQueryDto) {
        this.validateDateRange(query.dateFrom, query.dateTo);

        const where = this.buildSummaryWhere(tenantId, query);

        const groups = await this.prisma.expense.groupBy({
            by: ['category'],
            where,
            _sum: { amount: true },
            _count: { id: true },
        });

        const totalAmount = groups.reduce(
            (sum, g) => sum + Number(g._sum.amount ?? 0),
            0,
        );

        return groups.map((g) => ({
            category: g.category,
            count: g._count.id,
            totalAmount: Number(g._sum.amount ?? 0),
            percentage: totalAmount > 0
                ? Math.round((Number(g._sum.amount ?? 0) / totalAmount) * 1000) / 10
                : 0,
        }));
    }

    // ─── Summary: by-project ───

    async getSummaryByProject(tenantId: string, query: ExpenseSummaryQueryDto) {
        this.validateDateRange(query.dateFrom, query.dateTo);

        const where = this.buildSummaryWhere(tenantId, query);

        const groups = await this.prisma.expense.groupBy({
            by: ['projectId'],
            where,
            _sum: { amount: true },
            _count: { id: true },
        });

        // プロジェクト名を取得
        const projectIds = groups
            .map((g) => g.projectId)
            .filter((id): id is string => id !== null);

        const projects = await this.prisma.project.findMany({
            where: { id: { in: projectIds } },
            select: { id: true, name: true },
        });
        const projectMap = new Map(projects.map((p) => [p.id, p.name]));

        return groups.map((g) => ({
            projectId: g.projectId,
            projectName: projectMap.get(g.projectId ?? '') ?? '未分類',
            count: g._count.id,
            totalAmount: Number(g._sum.amount ?? 0),
        }));
    }

    // ─── Summary: by-month ───

    async getSummaryByMonth(tenantId: string, query: ExpenseSummaryQueryDto) {
        this.validateDateRange(query.dateFrom, query.dateTo);

        const where = this.buildSummaryWhere(tenantId, query);

        const expenses = await this.prisma.expense.findMany({
            where,
            select: { expenseDate: true, amount: true },
        });

        // 月別に集計
        const monthMap = new Map<string, { count: number; totalAmount: number }>();
        for (const e of expenses) {
            const month = e.expenseDate.toISOString().slice(0, 7); // YYYY-MM
            const existing = monthMap.get(month) ?? { count: 0, totalAmount: 0 };
            existing.count += 1;
            existing.totalAmount += Number(e.amount);
            monthMap.set(month, existing);
        }

        return Array.from(monthMap.entries())
            .map(([month, data]) => ({ month, ...data }))
            .sort((a, b) => a.month.localeCompare(b.month));
    }

    // ─── Summary: stats ───

    async getStats(tenantId: string, query: ExpenseSummaryQueryDto) {
        this.validateDateRange(query.dateFrom, query.dateTo);

        const where = this.buildSummaryWhere(tenantId, query);

        const agg = await this.prisma.expense.aggregate({
            where,
            _sum: { amount: true },
            _count: { id: true },
            _avg: { amount: true },
            _max: { amount: true },
        });

        return {
            totalAmount: Number(agg._sum.amount ?? 0),
            totalCount: agg._count.id,
            avgAmount: Math.round(Number(agg._avg.amount ?? 0)),
            maxAmount: Number(agg._max.amount ?? 0),
        };
    }

    // ─── Helpers ───

    private buildSummaryWhere(
        tenantId: string,
        query: ExpenseSummaryQueryDto,
    ): Prisma.ExpenseWhereInput {
        const where: Prisma.ExpenseWhereInput = {
            tenantId,
            expenseDate: {
                gte: new Date(query.dateFrom),
                lte: new Date(query.dateTo),
            },
        };

        if (query.category) {
            where.category = query.category;
        }
        if (query.projectId) {
            where.projectId = query.projectId;
        }
        if (query.approvedOnly) {
            where.workflow = { status: 'approved' };
        }

        return where;
    }

    private validateDateRange(dateFrom: string, dateTo: string): void {
        if (new Date(dateFrom) > new Date(dateTo)) {
            throw new BadRequestException(
                'ERR-VAL-010: 開始日は終了日以前である必要があります',
            );
        }
    }
}
