import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@prisma-db';

interface KpiData {
    pendingApprovals: number;
    myWorkflows: number;
    myTasks: number;
    weeklyHours: number;
}

interface ProjectProgress {
    projectId: string;
    projectName: string;
    totalTasks: number;
    completedTasks: number;
    progressPercent: number;
}

interface QuickAction {
    label: string;
    icon: string;
    routerLink: string;
    roles: string[];
}

interface DashboardData {
    kpi: KpiData;
    recentNotifications: any[];
    quickActions: QuickAction[];
}

@Injectable()
export class DashboardService {
    private readonly logger = new Logger(DashboardService.name);

    constructor(private readonly prisma: PrismaService) { }

    /**
     * ダッシュボード統合データ取得（Promise.all で並行取得）
     */
    async getDashboardData(tenantId: string, userId: string, roles: string[]): Promise<DashboardData> {
        const isApprover = roles.some(r => ['approver', 'tenant_admin'].includes(r));
        const isMemberOrPm = roles.some(r => ['member', 'pm', 'tenant_admin'].includes(r));

        const [pendingApprovals, myWorkflows, myTasks, weeklyHours, notifications] = await Promise.all([
            isApprover ? this.countPendingApprovals(tenantId) : Promise.resolve(0),
            this.countMyWorkflows(tenantId, userId),
            isMemberOrPm ? this.countMyTasks(tenantId, userId) : Promise.resolve(0),
            isMemberOrPm ? this.getWeeklyHours(tenantId, userId) : Promise.resolve(0),
            this.getRecentNotifications(tenantId, userId),
        ]);

        return {
            kpi: { pendingApprovals, myWorkflows, myTasks, weeklyHours },
            recentNotifications: notifications,
            quickActions: this.getQuickActions(roles),
        };
    }

    /**
     * KPI カード用データ
     */
    async getKpi(tenantId: string, userId: string, roles: string[]): Promise<KpiData> {
        const isApprover = roles.some(r => ['approver', 'tenant_admin'].includes(r));
        const isMemberOrPm = roles.some(r => ['member', 'pm', 'tenant_admin'].includes(r));

        const [pendingApprovals, myWorkflows, myTasks, weeklyHours] = await Promise.all([
            isApprover ? this.countPendingApprovals(tenantId) : Promise.resolve(0),
            this.countMyWorkflows(tenantId, userId),
            isMemberOrPm ? this.countMyTasks(tenantId, userId) : Promise.resolve(0),
            isMemberOrPm ? this.getWeeklyHours(tenantId, userId) : Promise.resolve(0),
        ]);

        return { pendingApprovals, myWorkflows, myTasks, weeklyHours };
    }

    /**
     * プロジェクト進捗一覧（タスク完了率）
     */
    async getProjectProgress(tenantId: string): Promise<ProjectProgress[]> {
        const projects = await this.prisma.project.findMany({
            where: { tenantId, status: { in: ['planning', 'active'] } },
            select: {
                id: true,
                name: true,
                _count: { select: { tasks: true } },
                tasks: {
                    where: { status: 'done' },
                    select: { id: true },
                },
            },
            orderBy: { updatedAt: 'desc' },
            take: 10,
        });

        return projects.map(p => ({
            projectId: p.id,
            projectName: p.name,
            totalTasks: p._count.tasks,
            completedTasks: p.tasks.length,
            progressPercent: p._count.tasks > 0
                ? Math.round((p.tasks.length / p._count.tasks) * 100)
                : 0,
        }));
    }

    // ─── Private helpers ───

    private async countPendingApprovals(tenantId: string): Promise<number> {
        return this.prisma.workflow.count({
            where: { tenantId, status: 'submitted' },
        });
    }

    private async countMyWorkflows(tenantId: string, userId: string): Promise<number> {
        return this.prisma.workflow.count({
            where: { tenantId, createdBy: userId },
        });
    }

    private async countMyTasks(tenantId: string, userId: string): Promise<number> {
        return this.prisma.task.count({
            where: { tenantId, assigneeId: userId, status: { not: 'done' } },
        });
    }

    private async getWeeklyHours(tenantId: string, userId: string): Promise<number> {
        const now = new Date();
        const dayOfWeek = now.getDay();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
        startOfWeek.setHours(0, 0, 0, 0);

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);

        const result = await this.prisma.timesheet.aggregate({
            where: {
                tenantId,
                userId,
                workDate: { gte: startOfWeek, lte: endOfWeek },
            },
            _sum: { hours: true },
        });

        const hours = result._sum.hours;
        if (hours === null || hours === undefined) return 0;
        return typeof hours === 'number' ? hours : Number(hours);
    }

    private async getRecentNotifications(tenantId: string, userId: string): Promise<any[]> {
        return this.prisma.notification.findMany({
            where: { tenantId, userId, isRead: false },
            orderBy: { createdAt: 'desc' },
            take: 5,
        });
    }

    /**
     * ロールに応じたクイックアクション一覧
     */
    getQuickActions(roles: string[]): QuickAction[] {
        const allActions: QuickAction[] = [
            {
                label: '新規申請',
                icon: 'add',
                routerLink: '/workflows/new',
                roles: ['member', 'pm', 'accounting', 'approver', 'tenant_admin'],
            },
            {
                label: '工数を入力',
                icon: 'schedule',
                routerLink: '/timesheets',
                roles: ['member', 'pm'],
            },
            {
                label: 'プロジェクト一覧',
                icon: 'folder',
                routerLink: '/projects',
                roles: ['member', 'pm', 'tenant_admin'],
            },
        ];

        return allActions.filter(action =>
            action.roles.some(r => roles.includes(r)),
        );
    }
}
