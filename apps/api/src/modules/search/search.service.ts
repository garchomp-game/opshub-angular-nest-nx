import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@prisma-db';
import { SearchQueryDto } from './dto/search-query.dto';
import { SearchResult, SearchResponse } from './types/search-result';

@Injectable()
export class SearchService {
    private readonly logger = new Logger(SearchService.name);

    constructor(private readonly prisma: PrismaService) { }

    // ─── Main Search ───

    async searchAll(
        tenantId: string,
        userId: string,
        roles: string[],
        query: SearchQueryDto,
    ): Promise<SearchResponse> {
        const { q, category = 'all', page = 1, limit = 20 } = query;
        const perCategory = category === 'all' ? 10 : limit;

        const [workflows, projects, tasks, expenses] = await Promise.all([
            category === 'all' || category === 'workflows'
                ? this.searchWorkflows(tenantId, q, perCategory)
                : Promise.resolve([]),
            category === 'all' || category === 'projects'
                ? this.searchProjects(tenantId, q, perCategory)
                : Promise.resolve([]),
            category === 'all' || category === 'tasks'
                ? this.searchTasks(tenantId, q, perCategory)
                : Promise.resolve([]),
            category === 'all' || category === 'expenses'
                ? this.searchExpenses(tenantId, userId, roles, q, perCategory)
                : Promise.resolve([]),
        ]);

        const allResults = [...workflows, ...projects, ...tasks, ...expenses];

        return {
            results: allResults,
            counts: {
                workflows: workflows.length,
                projects: projects.length,
                tasks: tasks.length,
                expenses: expenses.length,
                total: allResults.length,
            },
            page,
            hasMore: allResults.length >= perCategory,
        };
    }

    // ─── Per-Table Search ───

    async searchWorkflows(
        tenantId: string,
        query: string,
        limit: number,
    ): Promise<SearchResult[]> {
        const condition = this.buildSearchCondition(query);

        const workflows = await this.prisma.workflow.findMany({
            where: { tenantId, ...condition },
            select: {
                id: true,
                title: true,
                description: true,
                status: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });

        return workflows.map((w) => this.toSearchResult(w, 'workflow'));
    }

    async searchProjects(
        tenantId: string,
        query: string,
        limit: number,
    ): Promise<SearchResult[]> {
        const escaped = this.escapeLikePattern(query);

        const projects = await this.prisma.project.findMany({
            where: {
                tenantId,
                OR: [
                    { name: { contains: escaped, mode: 'insensitive' } },
                    { description: { contains: escaped, mode: 'insensitive' } },
                ],
            },
            select: {
                id: true,
                name: true,
                description: true,
                status: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });

        return projects.map((p) => ({
            id: p.id,
            type: 'project' as const,
            title: p.name,
            description: p.description ?? undefined,
            status: p.status,
            url: `/projects/${p.id}`,
            createdAt: p.createdAt.toISOString(),
        }));
    }

    async searchTasks(
        tenantId: string,
        query: string,
        limit: number,
    ): Promise<SearchResult[]> {
        const escaped = this.escapeLikePattern(query);

        const tasks = await this.prisma.task.findMany({
            where: {
                tenantId,
                title: { contains: escaped, mode: 'insensitive' },
            },
            select: {
                id: true,
                title: true,
                description: true,
                status: true,
                projectId: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });

        return tasks.map((t) => ({
            id: t.id,
            type: 'task' as const,
            title: t.title,
            description: t.description ?? undefined,
            status: t.status,
            url: `/projects/${t.projectId}/tasks`,
            createdAt: t.createdAt.toISOString(),
        }));
    }

    async searchExpenses(
        tenantId: string,
        userId: string,
        roles: string[],
        query: string,
        limit: number,
    ): Promise<SearchResult[]> {
        const escaped = this.escapeLikePattern(query);

        const where: any = {
            tenantId,
            description: { contains: escaped, mode: 'insensitive' },
        };

        // Member/PM: 自分の経費のみ、Accounting/Admin: 全件
        if (!roles.includes('accounting') && !roles.includes('tenant_admin')) {
            where.createdBy = userId;
        }

        const expenses = await this.prisma.expense.findMany({
            where,
            select: {
                id: true,
                category: true,
                amount: true,
                description: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });

        return expenses.map((e) => ({
            id: e.id,
            type: 'expense' as const,
            title: `${e.category}: ¥${Number(e.amount).toLocaleString()}`,
            description: e.description ?? undefined,
            url: '/expenses',
            createdAt: e.createdAt.toISOString(),
        }));
    }

    // ─── Helpers ───

    private buildSearchCondition(query: string) {
        const escaped = this.escapeLikePattern(query);
        return {
            OR: [
                { title: { contains: escaped, mode: 'insensitive' as const } },
                { description: { contains: escaped, mode: 'insensitive' as const } },
            ],
        };
    }

    private escapeLikePattern(pattern: string): string {
        return pattern.replace(/[%_\\]/g, (char) => `\\${char}`);
    }

    private toSearchResult(
        entity: { id: string; title: string; description?: string | null; status?: string; createdAt: Date },
        type: 'workflow' | 'project' | 'task' | 'expense',
    ): SearchResult {
        const urlMap: Record<string, string> = {
            workflow: `/workflows/${entity.id}`,
            project: `/projects/${entity.id}`,
            task: `/projects`,
            expense: `/expenses`,
        };

        return {
            id: entity.id,
            type,
            title: entity.title,
            description: entity.description ?? undefined,
            status: entity.status,
            url: urlMap[type],
            createdAt: entity.createdAt.toISOString(),
        };
    }
}
