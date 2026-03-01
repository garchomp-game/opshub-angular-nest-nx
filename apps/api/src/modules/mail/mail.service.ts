import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class MailService {
    private readonly logger = new Logger(MailService.name);

    constructor(
        @InjectQueue('mail') private readonly mailQueue: Queue,
        private readonly configService: ConfigService,
    ) { }

    /**
     * パスワードリセットメールをキューに投入する。
     * 実際の送信は MailProcessor (Worker) が非同期に処理する。
     */
    async sendPasswordResetEmail(to: string, resetToken: string): Promise<void> {
        const appUrl = this.configService.get<string>('APP_URL', 'http://localhost:4200');
        const resetUrl = `${appUrl}/reset-password?token=${resetToken}`;

        await this.mailQueue.add('password-reset', {
            to,
            subject: '【OpsHub】パスワードリセット',
            html: `
                    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                        <h2 style="color: #1a1a2e;">パスワードリセットのご案内</h2>
                        <p>以下のリンクをクリックしてパスワードをリセットしてください。</p>
                        <p>このリンクは <strong>1時間</strong> 有効です。</p>
                        <a href="${resetUrl}"
                           style="display: inline-block; background: #6366f1; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin: 16px 0;">
                            パスワードをリセットする
                        </a>
                        <p style="color: #666; font-size: 14px; margin-top: 24px;">
                            このメールに心当たりがない場合は無視してください。
                        </p>
                        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
                        <p style="color: #999; font-size: 12px;">OpsHub — 業務管理プラットフォーム</p>
                    </div>
                `,
        }, {
            attempts: 3,
            backoff: { type: 'exponential', delay: 1000 },
        });

        this.logger.log(`Password reset email queued for: ${to}`);
    }
}
