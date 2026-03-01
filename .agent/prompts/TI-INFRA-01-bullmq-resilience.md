# TI-INFRA-01: BullMQ / Redis 接続失敗時のレジリエンス強化

## 共通ルール
// turbo-all
- `pnpm`, `npx`, `nx` 等のコマンドは自由に実行してよい
- `sudo` が必要な操作やシステム設定変更のみユーザーに確認

## 概要
Redis 未起動時に以下の問題が発生する:
1. API サーバーが大量の `ECONNREFUSED 127.0.0.1:6379` エラーログを出力
2. `POST /api/auth/forgot-password` が **レスポンスを返さずハング** する（BullMQ のキュー操作がタイムアウトするまでブロック）

Redis がダウンしても API の主要機能が動作し続けるよう、レジリエンスを強化する。

## 現在のコード

### `app.module.ts` — BullMQ 設定
```typescript
// apps/api/src/app/app.module.ts L41-46
BullModule.forRoot({
    connection: {
        host: process.env['REDIS_HOST'] || 'localhost',
        port: parseInt(process.env['REDIS_PORT'] || '6379', 10),
    },
}),
```

### `docker-compose.yml` — Redis サービス
```yaml
redis:
    image: redis:7-alpine
    container_name: opshub-redis
    restart: unless-stopped
    ports:
        - "6379:6379"
    environment:
        TZ: Asia/Tokyo
```

### `.env`
```
REDIS_HOST="localhost"
REDIS_PORT=6379
```

## 作業内容

### 1. BullMQ 接続設定の改善

- [ ] `BullModule.forRoot()` に以下の設定を追加:
  ```typescript
  BullModule.forRoot({
      connection: {
          host: process.env['REDIS_HOST'] || 'localhost',
          port: parseInt(process.env['REDIS_PORT'] || '6379', 10),
          maxRetriesPerRequest: 3,         // デフォルト 20 → 3 に
          enableReadyCheck: false,          // 接続待ちを短縮
          retryStrategy: (times: number) => Math.min(times * 200, 3000), // 最大 3 秒でバックオフ
      },
  }),
  ```
- [ ] 設定変更後、Redis 起動/未起動の両方で動作確認

### 2. forgot-password のエラーハンドリング

- [ ] メール送信（BullMQ キュー追加）が失敗した場合に即座にレスポンスを返すよう修正:
  ```typescript
  // 例: auth.service.ts or auth.controller.ts
  try {
      await this.mailQueue.add('forgot-password', { email, token });
  } catch (error) {
      this.logger.error('Failed to queue forgot-password email', error);
      // ユーザーには成功レスポンスを返す（セキュリティ: email の存在を漏らさない）
  }
  ```
- [ ] 修正後、Redis 未起動で `curl -X POST /api/auth/forgot-password` が即座にレスポンスを返すことを確認

### 3. Docker Compose の healthcheck 追加

- [ ] Redis サービスに healthcheck を追加（PostgreSQL と同様）:
  ```yaml
  redis:
      image: redis:7-alpine
      container_name: opshub-redis
      restart: unless-stopped
      ports:
          - "6379:6379"
      environment:
          TZ: Asia/Tokyo
      healthcheck:
          test: ["CMD", "redis-cli", "ping"]
          interval: 5s
          timeout: 5s
          retries: 5
  ```

### 4. ヘルスチェックの確認

- [ ] `@nestjs/terminus` でのヘルスチェック (`/api/health`) が存在する場合、Redis の状態も含まれるか確認
- [ ] Redis ダウン時にヘルスチェックが適切なステータスを返すか確認

## 対象ファイル

| パス | 変更内容 |
|------|---------|
| `apps/api/src/app/app.module.ts` | MODIFY: BullModule.forRoot の connection 設定改善 |
| `apps/api/src/modules/auth/auth.service.ts` or `auth.controller.ts` | MODIFY: forgot-password のキュー追加 try/catch |
| `docker-compose.yml` | MODIFY: redis に healthcheck 追加 |

## 検証手順

```bash
# 1. Redis 停止時のテスト
docker compose stop redis

# forgot-password が即座にレスポンスを返すか
curl -s -w "\n%{time_total}s" -X POST http://localhost:3000/api/auth/forgot-password \
  -H 'Content-Type: application/json' -d '{"email":"admin@demo.com"}'
# → 1秒以内にレスポンスが返ること

# ログインが正常に動作すること
curl -s -X POST http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' -d '{"email":"admin@demo.com","password":"Password123"}'

# 2. Redis 起動時のテスト
docker compose start redis
# 上記コマンドが正常動作すること
```

## 完了条件
- [ ] Redis 未起動でも `forgot-password` が 1 秒以内にレスポンスを返す
- [ ] Redis 未起動でもログイン・認証・主要 CRUD が正常動作する
- [ ] Redis の healthcheck が追加されている
- [ ] エラーログの量が大幅に削減されている（無限リトライ → 上限付きバックオフ）
