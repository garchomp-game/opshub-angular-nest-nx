# TI-P5-03: D-9 レート制限 (@nestjs/throttler)

## 共通ルール
// turbo-all
- `pnpm`, `npx`, `nx` 等のコマンドは自由に実行してよい
- `sudo` が必要な操作やシステム設定変更のみユーザーに確認

## 概要
API に `@nestjs/throttler` を導入し、DDoS / ブルートフォース攻撃対策としてレート制限を実装する。

## 現状
- レート制限なし
- 認証エンドポイント (`/api/auth/login`, `/api/auth/forgot-password`) が無制限に呼び出し可能

## 作業内容

### 1. パッケージインストール
```bash
pnpm add @nestjs/throttler
```

### 2. ThrottlerModule 設定
ファイル: `apps/api/src/app/app.module.ts`

```typescript
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,    // 1秒
        limit: 3,     // 1秒あたり3リクエスト
      },
      {
        name: 'medium',
        ttl: 10000,   // 10秒
        limit: 20,    // 10秒あたり20リクエスト
      },
      {
        name: 'long',
        ttl: 60000,   // 1分
        limit: 100,   // 1分あたり100リクエスト
      },
    ]),
    // ... 他の imports
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    // ... 他の providers
  ],
})
```

**注意**: `app.module.ts` には既に複数の `APP_GUARD` が登録されている。`ThrottlerGuard` を追加する形で記述すること（既存の `JwtAuthGuard` や `RolesGuard` は削除しないこと）。

### 3. 認証エンドポイントに厳格な制限
ファイル: `apps/api/src/modules/auth/auth.controller.ts`

`login` と `forgot-password` に個別の厳格なレート制限を追加:

```typescript
import { Throttle, SkipThrottle } from '@nestjs/throttler';

@Throttle({ short: { limit: 5, ttl: 60000 } })  // 1分に5回まで
@Post('login')
async login(...) { ... }

@Throttle({ short: { limit: 3, ttl: 60000 } })  // 1分に3回まで
@Post('forgot-password')
async forgotPassword(...) { ... }
```

### 4. ヘルスチェックはスキップ
ファイル: `apps/api/src/modules/health/health.controller.ts`

```typescript
import { SkipThrottle } from '@nestjs/throttler';

@SkipThrottle()
@Controller('health')
export class HealthController { ... }
```

### 5. テスト更新
- `auth.controller.spec.ts` — ThrottlerModule のモック追加
- 既存テストで `ThrottlerGuard` がエラーを起こさないよう、TestingModule に `ThrottlerModule.forRoot([])` を追加
- **全てのコントローラテストファイル** で ThrottlerGuard のモックが必要になる可能性あり。以下のパターンで対策:

```typescript
// テスト共通: ThrottlerGuard を無効化
const moduleRef = await Test.createTestingModule({
  imports: [ThrottlerModule.forRoot([])],
  // ...
}).overrideGuard(ThrottlerGuard).useValue({ canActivate: () => true })
  .compile();
```

### 6. ビルド・テスト確認
```bash
pnpm nx build api
pnpm nx test api
```

## 参照ファイル
- `apps/api/src/app/app.module.ts` — ルートモジュール
- `apps/api/src/modules/auth/auth.controller.ts` — 認証エンドポイント
- `apps/api/src/modules/health/health.controller.ts` — ヘルスチェック

## 完了条件
- [ ] `@nestjs/throttler` がインストールされている
- [ ] グローバルレート制限が設定されている (short/medium/long)
- [ ] `login` / `forgot-password` に個別の厳格な制限が設定されている
- [ ] ヘルスチェックはレート制限をスキップしている
- [ ] 全テストがパスする
- [ ] `pnpm nx build api` 成功
