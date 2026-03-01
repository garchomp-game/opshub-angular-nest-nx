import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { getQueueToken } from '@nestjs/bullmq';
import { MailService } from './mail.service';

describe('MailService', () => {
    let service: MailService;
    let mockQueue: { add: jest.Mock };

    beforeEach(async () => {
        mockQueue = {
            add: jest.fn().mockResolvedValue({ id: 'test-job-id' }),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                MailService,
                {
                    provide: getQueueToken('mail'),
                    useValue: mockQueue,
                },
                {
                    provide: ConfigService,
                    useValue: {
                        get: jest.fn().mockImplementation((key: string, defaultValue?: string) => {
                            const config: Record<string, string> = {
                                APP_URL: 'http://localhost:4200',
                            };
                            return config[key] ?? defaultValue;
                        }),
                    },
                },
            ],
        }).compile();

        service = module.get<MailService>(MailService);
    });

    afterEach(() => jest.clearAllMocks());

    describe('sendPasswordResetEmail', () => {
        it('should add a password-reset job to the mail queue', async () => {
            await service.sendPasswordResetEmail('user@example.com', 'reset-token-123');

            expect(mockQueue.add).toHaveBeenCalledTimes(1);
            expect(mockQueue.add).toHaveBeenCalledWith(
                'password-reset',
                expect.objectContaining({
                    to: 'user@example.com',
                    subject: '【OpsHub】パスワードリセット',
                    html: expect.stringContaining('reset-token-123'),
                }),
                expect.objectContaining({
                    attempts: 3,
                    backoff: { type: 'exponential', delay: 1000 },
                }),
            );
        });

        it('should include the correct reset URL in the email HTML', async () => {
            await service.sendPasswordResetEmail('user@example.com', 'my-token');

            const jobData = mockQueue.add.mock.calls[0][1];
            expect(jobData.html).toContain('http://localhost:4200/reset-password?token=my-token');
        });

        it('should not throw when queue.add succeeds', async () => {
            await expect(
                service.sendPasswordResetEmail('user@example.com', 'token'),
            ).resolves.not.toThrow();
        });
    });
});
