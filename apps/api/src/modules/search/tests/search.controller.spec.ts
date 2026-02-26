import { Test, TestingModule } from '@nestjs/testing';
import { SearchController } from '../search.controller';
import { SearchService } from '../search.service';

describe('SearchController', () => {
    let controller: SearchController;
    let searchService: jest.Mocked<SearchService>;

    const mockSearchResponse = {
        results: [
            {
                id: 'wf-001',
                type: 'workflow' as const,
                title: '出張旅費申請',
                description: '大阪出張の交通費',
                status: 'submitted',
                url: '/workflows/wf-001',
                createdAt: '2026-02-20T09:00:00.000Z',
            },
            {
                id: 'pj-001',
                type: 'project' as const,
                title: 'ECサイトリニューアル',
                description: '既存ECサイトの全面リニューアル',
                status: 'active',
                url: '/projects/pj-001',
                createdAt: '2026-01-01T00:00:00.000Z',
            },
        ],
        counts: {
            workflows: 1,
            projects: 1,
            tasks: 0,
            expenses: 0,
            total: 2,
        },
        page: 1,
        hasMore: false,
    };

    const mockUser = {
        id: 'user-1',
        tenantId: 'tenant-1',
        roles: [{ tenantId: 'tenant-1', role: 'member' }],
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [SearchController],
            providers: [
                {
                    provide: SearchService,
                    useValue: {
                        searchAll: jest.fn().mockResolvedValue(mockSearchResponse),
                    },
                },
            ],
        }).compile();

        controller = module.get<SearchController>(SearchController);
        searchService = module.get(SearchService) as jest.Mocked<SearchService>;
    });

    afterEach(() => jest.clearAllMocks());

    // ─── GET /search ───

    describe('GET /search', () => {
        it('should delegate to SearchService.searchAll with correct params', async () => {
            const query = { q: '出張', category: 'all', page: 1, limit: 20 };

            const result = await controller.search(mockUser, query as any);

            expect(searchService.searchAll).toHaveBeenCalledWith(
                'tenant-1',
                'user-1',
                ['member'],
                query,
            );
            expect(result).toEqual(mockSearchResponse);
        });

        it('should extract roles from string array format', async () => {
            const userWithStringRoles = {
                ...mockUser,
                roles: ['pm', 'approver'],
            };
            const query = { q: 'test', category: 'all', page: 1, limit: 20 };

            await controller.search(userWithStringRoles, query as any);

            expect(searchService.searchAll).toHaveBeenCalledWith(
                'tenant-1',
                'user-1',
                ['pm', 'approver'],
                query,
            );
        });

        it('should handle category filter', async () => {
            const query = { q: 'プロジェクト', category: 'projects', page: 1, limit: 20 };

            await controller.search(mockUser, query as any);

            expect(searchService.searchAll).toHaveBeenCalledWith(
                'tenant-1',
                'user-1',
                ['member'],
                query,
            );
        });

        it('should return search results with counts', async () => {
            const query = { q: '出張', category: 'all', page: 1, limit: 20 };

            const result = await controller.search(mockUser, query as any);

            expect(result.results).toHaveLength(2);
            expect(result.counts.total).toBe(2);
            expect(result.counts.workflows).toBe(1);
            expect(result.counts.projects).toBe(1);
        });
    });
});
