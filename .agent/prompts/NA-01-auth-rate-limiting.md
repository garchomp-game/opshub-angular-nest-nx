# NA-01: 認証エンドポイントのレート制限見直し

## 共通ルール
// turbo-all
- `pnpm`, `npx`, `nx` 等のコマンドは自由に実行してよい
- `sudo` が必要な操作やシステム設定変更のみユーザーに確認

## 概要
TI-E2E-01 で `ThrottlerException: 429` が E2E テスト失敗の直接原因と判明。
現行のグローバルスロットル（`short: 1s/3req`）が認証エンドポイントにも適用されており、テスト時や正規のリフレッシュフローで過剰にブロックされる。
認証エンドポイントに適切な個別制限を設定する。

## 現在の設定

```typescript
// apps/api/src/app/app.module.ts
ThrottlerModule.forRoot([
    { name: 'short',  ttl: 1000,   limit: 3  },
    { name: 'medium', ttl: 10000,  limit: 20 },
    { name: 'long',   ttl: 60000,  limit: 100 },
])
```

- `ThrottlerGuard` が `APP_GUARD` として全エンドポイントに適用
- `HealthController` のみ `@SkipThrottle()` で除外
- テスト環境では `THROTTLE_SKIP=true` で全無効化（TI-INFRA-02 で追加済み）

## 作業内容

### 1. AuthController のスロットル設定

```typescript
// apps/api/src/modules/auth/auth.controller.ts
import { SkipThrottle, Throttle } from '@nestjs/throttler';

@Controller('auth')
@SkipThrottle()  // グローバルスロットルから除外
export class AuthController {

    @Post('login')
    @Throttle({ login: { ttl: 60_000, limit: 10 } })  // 1分あたり10回
    async login(@Body() dto: LoginDto) { ... }

    @Post('forgot-password')
    @Throttle({ forgot: { ttl: 60_000, limit: 3 } })  // 1分あたり3回
    async forgotPassword(@Body() dto: ForgotPasswordDto) { ... }

    // /me, /refresh, /logout は SkipThrottle のまま（内部トークン更新）
    @Get('me')
    async me() { ... }

    @Post('refresh')
    async refresh() { ... }

    @Post('logout')
    async logout() { ... }
}
```

### 2. テスト追加

- [ ] `auth.controller.spec.ts` に ThrottlerGuard のモック追加
- [ ] レート制限超過時に 429 を返すテスト（可能であれば）

### 3. E2E テスト確認

- [ ] `playwright.config.ts` の `THROTTLE_SKIP` を一時的に除去して E2E テスト実行
- [ ] 28/28 PASS を確認（認証エンドポイントが個別制限に切り替わったため 429 が発生しないこと）

## 対象ファイル

| パス | 変更内容 |
|------|---------|
| `apps/api/src/modules/auth/auth.controller.ts` | MODIFY: `@SkipThrottle()` + 個別 `@Throttle()` |
| `apps/api/src/modules/auth/auth.controller.spec.ts` | MODIFY: テスト追加 |

## 完了条件
- [ ] `AuthController` にクラスレベルの `@SkipThrottle()` が適用されている
- [ ] `login` と `forgot-password` に個別レート制限が設定されている
- [ ] `pnpm nx test api` PASS
- [ ] `pnpm playwright test --project=ui-smoke` が `THROTTLE_SKIP` なしで PASS
