# TI-P6-07: BullMQ ジョブキュー (メール送信の非同期化)

## 共通ルール
// turbo-all
- `pnpm`, `npx`, `nx` 等のコマンドは自由に実行してよい
- `sudo` が必要な操作やシステム設定変更のみユーザーに確認

## 概要
`@nestjs/bullmq` + Redis を導入し、メール送信を非同期ジョブキューに移行する。
現在 `MailService.sendPasswordResetEmail()` は同期的に `nodemailer.sendMail()` を呼んでおり、
メール送信の失敗が API レスポンスに影響する。非同期化により UX とエラー耐性を向上させる。

## 現状
- `apps/api/src/modules/mail/mail.service.ts` — 同期的 nodemailer
- `apps/api/src/modules/mail/mail.module.ts` — 現在のモジュール
- Redis 未使用

## 作業内容

### 1. Redis を docker-compose.yml に追加
```yaml
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    restart: unless-stopped
```

### 2. パッケージインストール
```bash
pnpm add @nestjs/bullmq bullmq ioredis
```

### 3. `.env` に Redis 接続情報を追加
```
REDIS_HOST=localhost
REDIS_PORT=6379
```

### 4. BullMQ モジュール設定
ファイル: `apps/api/src/app/app.module.ts`

```typescript
import { BullModule } from '@nestjs/bullmq';

@Module({
  imports: [
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
      },
    }),
    // ...
  ],
})
```

### 5. メールキューの作成
ファイル: `apps/api/src/modules/mail/mail.module.ts`

```typescript
import { BullModule } from '@nestjs/bullmq';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'mail' }),
  ],
  providers: [MailService, MailProcessor],
  exports: [MailService],
})
```

### 6. MailProcessor (Worker) の作成
ファイル: `apps/api/src/modules/mail/mail.processor.ts` [NEW]

```typescript
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';

@Processor('mail')
export class MailProcessor extends WorkerHost {
  private readonly logger = new Logger(MailProcessor.name);
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    super();
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('SMTP_HOST'),
      port: this.configService.get('SMTP_PORT'),
      secure: false,
    });
  }

  async process(job: Job<{ to: string; subject: string; html: string }>): Promise<void> {
    const { to, subject, html } = job.data;
    this.logger.log(`Processing mail job ${job.id} to: ${to}`);

    await this.transporter.sendMail({
      from: this.configService.get('MAIL_FROM'),
      to,
      subject,
      html,
    });

    this.logger.log(`Mail sent successfully: ${job.id}`);
  }
}
```

### 7. MailService のリファクタリング
ファイル: `apps/api/src/modules/mail/mail.service.ts`

トランスポーター直接呼び出しを `Queue.add()` に変更:

```typescript
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class MailService {
  constructor(
    @InjectQueue('mail') private mailQueue: Queue,
    private configService: ConfigService,
  ) {}

  async sendPasswordResetEmail(to: string, token: string): Promise<void> {
    const resetUrl = `${this.configService.get('APP_URL')}/reset-password?token=${token}`;

    await this.mailQueue.add('password-reset', {
      to,
      subject: 'パスワードリセット — OpsHub',
      html: `<p>以下のリンクからパスワードをリセットしてください:</p>
             <a href="${resetUrl}">${resetUrl}</a>
             <p>このリンクは1時間有効です。</p>`,
    }, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 },
    });

    this.logger.log(`Password reset email queued for: ${to}`);
  }
}
```

### 8. テスト更新
- `mail.service.spec.ts` — `Queue` のモックに変更 (`add` メソッド)
- `mail.processor.spec.ts` [NEW] — `process` メソッドのテスト
- `auth.service.spec.ts` — MailService のモックが変わらないか確認

テストで BullMQ を使う場合:
```typescript
// TestingModule で Queue をモック
providers: [
  {
    provide: getQueueToken('mail'),
    useValue: { add: jest.fn().mockResolvedValue({ id: 'test-job-id' }) },
  },
],
```

### 9. ビルド・テスト確認
```bash
docker compose up -d redis  # Redis 起動
pnpm nx build api
pnpm nx test api
```

## 参照ファイル
- `apps/api/src/modules/mail/mail.service.ts` — 変更対象
- `apps/api/src/modules/mail/mail.module.ts` — 変更対象
- `apps/api/src/app/app.module.ts` — BullModule.forRoot 追加
- `docker-compose.yml` — Redis 追加
- `.env` — Redis 接続情報追加

## 完了条件
- [ ] Redis が `docker-compose.yml` に追加されている
- [ ] `@nestjs/bullmq` + `bullmq` + `ioredis` がインストールされている
- [ ] `MailProcessor` (Worker) が作成されている
- [ ] `MailService` が `Queue.add()` でジョブを投入する形式に変更されている
- [ ] リトライ設定 (3回, exponential backoff) が含まれている
- [ ] 全テストがパスする
- [ ] `pnpm nx build api` 成功
