import { Test, TestingModule } from '@nestjs/testing';
import { StreamableFile } from '@nestjs/common';
import { TimesheetsController } from './timesheets.controller';
import { TimesheetsService } from './timesheets.service';

describe('TimesheetsController', () => {
    let controller: TimesheetsController;
    let service: any;

    const mockUser = {
        id: 'user-001',
        email: 'test@demo.com',
        displayName: 'テスト太郎',
        tenantId: 'tenant-001',
        tenantIds: ['tenant-001'],
        roles: [{ tenantId: 'tenant-001', role: 'member' as any }],
    };

    const mockEntry = {
        id: 'ts-001',
        tenantId: 'tenant-001',
        userId: 'user-001',
        projectId: 'proj-001',
        hours: 4.0,
        workDate: new Date('2026-02-25'),
        project: { id: 'proj-001', name: 'ECサイト' },
        task: null,
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [TimesheetsController],
            providers: [
                {
                    provide: TimesheetsService,
                    useValue: {
                        getDailyTimesheets: jest.fn(),
                        getWeeklyTimesheets: jest.fn(),
                        create: jest.fn(),
                        bulkUpsert: jest.fn(),
                        remove: jest.fn(),
                        getProjectSummary: jest.fn(),
                        getUserSummary: jest.fn(),
                        exportCsv: jest.fn(),
                    },
                },
            ],
        }).compile();

        controller = module.get<TimesheetsController>(TimesheetsController);
        service = module.get(TimesheetsService) as jest.Mocked<TimesheetsService>;
    });

    afterEach(() => jest.clearAllMocks());

    // ─── getDaily ───
    describe('GET /timesheets/daily', () => {
        it('Service.getDailyTimesheets に委譲すること', async () => {
            const expected = { workDate: '2026-02-25', totalHours: 4, entries: [mockEntry] } as any;
            service.getDailyTimesheets.mockResolvedValue(expected);

            const result = await controller.getDaily(mockUser as any, { workDate: '2026-02-25' });

            expect(result).toEqual(expected);
            expect(service.getDailyTimesheets).toHaveBeenCalledWith(
                'tenant-001', 'user-001', { workDate: '2026-02-25' },
            );
        });
    });

    // ─── getWeekly ───
    describe('GET /timesheets/weekly', () => {
        it('Service.getWeeklyTimesheets に委譲すること', async () => {
            const expected = { weekStart: '2026-02-23', entries: [mockEntry] } as any;
            service.getWeeklyTimesheets.mockResolvedValue(expected);

            const result = await controller.getWeekly(mockUser as any, { weekStart: '2026-02-23' });

            expect(result).toEqual(expected);
            expect(service.getWeeklyTimesheets).toHaveBeenCalledWith(
                'tenant-001', 'user-001', { weekStart: '2026-02-23' },
            );
        });
    });

    // ─── create ───
    describe('POST /timesheets', () => {
        it('Service.create に委譲すること', async () => {
            service.create.mockResolvedValue(mockEntry as any);
            const dto = { projectId: 'proj-001', workDate: '2026-02-25', hours: 4.0 };

            const result = await controller.create(mockUser as any, dto);

            expect(result).toEqual(mockEntry);
            expect(service.create).toHaveBeenCalledWith('tenant-001', 'user-001', dto);
        });
    });

    // ─── bulkUpsert ───
    describe('PUT /timesheets/bulk', () => {
        it('Service.bulkUpsert に委譲すること', async () => {
            service.bulkUpsert.mockResolvedValue([mockEntry] as any);
            const dto = { entries: [{ projectId: 'proj-001', workDate: '2026-02-25', hours: 4.0 }] };

            const result = await controller.bulkUpsert(mockUser as any, dto as any);

            expect(result).toEqual([mockEntry]);
            expect(service.bulkUpsert).toHaveBeenCalledWith('tenant-001', 'user-001', dto);
        });
    });

    // ─── remove ───
    describe('DELETE /timesheets/:id', () => {
        it('Service.remove に委譲すること', async () => {
            service.remove.mockResolvedValue(undefined);

            await controller.remove(mockUser as any, 'ts-001');

            expect(service.remove).toHaveBeenCalledWith('tenant-001', 'user-001', 'ts-001');
        });
    });

    // ─── projectSummary ───
    describe('GET /timesheets/summary/by-project', () => {
        it('Service.getProjectSummary に委譲すること', async () => {
            const expected = [{ projectId: 'proj-001', projectName: 'ECサイト', totalHours: 40 }];
            service.getProjectSummary.mockResolvedValue(expected as any);
            const query = { dateFrom: '2026-02-01', dateTo: '2026-02-28' };

            const result = await controller.projectSummary(mockUser as any, query as any);

            expect(result).toEqual(expected);
            expect(service.getProjectSummary).toHaveBeenCalledWith('tenant-001', query);
        });
    });

    // ─── memberSummary ───
    describe('GET /timesheets/summary/by-member', () => {
        it('Service.getUserSummary に委譲すること', async () => {
            const expected = [{ userId: 'user-001', userName: '田中太郎', totalHours: 80 }];
            service.getUserSummary.mockResolvedValue(expected as any);
            const query = { dateFrom: '2026-02-01', dateTo: '2026-02-28' };

            const result = await controller.memberSummary(mockUser as any, query as any);

            expect(result).toEqual(expected);
            expect(service.getUserSummary).toHaveBeenCalledWith('tenant-001', query);
        });
    });

    // ─── exportCsv ───
    describe('GET /timesheets/export', () => {
        it('StreamableFile を返すこと', async () => {
            const csvBuffer = Buffer.from('test,csv\n1,2', 'utf-8');
            service.exportCsv.mockResolvedValue(csvBuffer);
            const query = { dateFrom: '2026-02-01', dateTo: '2026-02-28' };

            const result = await controller.exportCsv(mockUser as any, query as any);

            expect(result).toBeInstanceOf(StreamableFile);
            expect(service.exportCsv).toHaveBeenCalledWith('tenant-001', query);
        });
    });
});
