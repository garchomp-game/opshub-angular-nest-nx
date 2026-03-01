import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

export interface MailJobData {
    to: string;
    subject: string;
    html: string;
}

@Processor('mail')
export class MailProcessor extends WorkerHost {
    private readonly logger = new Logger(MailProcessor.name);
    private transporter: nodemailer.Transporter;

    constructor(private readonly configService: ConfigService) {
        super();
        this.transporter = nodemailer.createTransport({
            host: this.configService.get<string>('SMTP_HOST', 'localhost'),
            port: this.configService.get<number>('SMTP_PORT', 1025),
            ignoreTLS: true, // MailHog は TLS 不要
        });
    }

    async process(job: Job<MailJobData>): Promise<void> {
        const { to, subject, html } = job.data;
        this.logger.log(`Processing mail job ${job.id} to: ${to}`);

        const from = this.configService.get<string>('MAIL_FROM', 'noreply@opshub.local');

        await this.transporter.sendMail({
            from,
            to,
            subject,
            html,
        });

        this.logger.log(`Mail sent successfully: ${job.id}`);
    }
}
