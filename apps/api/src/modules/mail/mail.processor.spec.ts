import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { Job } from 'bullmq';
import { MailProcessor, MailJobData } from './mail.processor';

// nodemailer をモック
jest.mock('nodemailer', () => ({
    createTransport: jest.fn().mockReturnValue({
        sendMail: jest.fn().mockResolvedValue({ messageId: 'test-msg-id' }),
    }),
}));
import * as nodemailer from 'nodemailer';

describe('MailProcessor', () => {
    let processor: MailProcessor;
    let mockTransporter: { sendMail: jest.Mock };

    beforeEach(async () => {
        // nodemailer モックをリセット
        mockTransporter = {
            sendMail: jest.fn().mockResolvedValue({ messageId: 'test-msg-id' }),
        };
        (nodemailer.createTransport as jest.Mock).mockReturnValue(mockTransporter);

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                MailProcessor,
                {
                    provide: ConfigService,
                    useValue: {
                        get: jest.fn().mockImplementation((key: string, defaultValue?: string) => {
                            const config: Record<string, string> = {
                                SMTP_HOST: 'localhost',
                                SMTP_PORT: '1025',
                                MAIL_FROM: 'noreply@opshub.local',
                            };
                            return config[key] ?? defaultValue;
                        }),
                    },
                },
            ],
        }).compile();

        processor = module.get<MailProcessor>(MailProcessor);
    });

    afterEach(() => jest.clearAllMocks());

    describe('process', () => {
        it('should send email via nodemailer transporter', async () => {
            const mockJob = {
                id: 'job-1',
                data: {
                    to: 'user@example.com',
                    subject: '【OpsHub】パスワードリセット',
                    html: '<p>リセットリンク</p>',
                },
            } as Job<MailJobData>;

            await processor.process(mockJob);

            expect(mockTransporter.sendMail).toHaveBeenCalledTimes(1);
            expect(mockTransporter.sendMail).toHaveBeenCalledWith({
                from: 'noreply@opshub.local',
                to: 'user@example.com',
                subject: '【OpsHub】パスワードリセット',
                html: '<p>リセットリンク</p>',
            });
        });

        it('should throw when sendMail fails', async () => {
            mockTransporter.sendMail.mockRejectedValue(new Error('SMTP connection failed'));

            const mockJob = {
                id: 'job-2',
                data: {
                    to: 'user@example.com',
                    subject: 'テスト',
                    html: '<p>テスト</p>',
                },
            } as Job<MailJobData>;

            await expect(processor.process(mockJob)).rejects.toThrow('SMTP connection failed');
        });
    });
});
