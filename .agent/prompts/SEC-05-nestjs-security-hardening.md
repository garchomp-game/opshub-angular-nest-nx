# SEC-05: NestJS 追加セキュリティ強化

## 共通ルール
// turbo-all
- `pnpm`, `npx`, `nx` 等のコマンドは自由に実行してよい
- `sudo` が必要な操作やシステム設定変更のみユーザーに確認

## 概要
nodebestpractices (goldbergyoni) のセキュリティセクション 6.1-6.27 との照合結果、
未対応の 3 項目を実装する。

### 参照ベストプラクティス
- **nodebestpractices 6.14**: "Limit payload size using a reverse-proxy or a middleware"
- **nodebestpractices 6.27**: "Import built-in modules using the 'node:' protocol"
- **nodebestpractices 6.11**: "Support blocklisting JWTs" (将来検討)

## 現在の対応状況

| # | 項目 | 状態 |
|---|------|------|
| 6.1 | linter security rules | ✅ `eslint-plugin-security` 導入済み |
| 6.2 | Rate limiting | ✅ `@nestjs/throttler` 導入済み |
| 6.3 | Secret management | ✅ `.env` + Gitleaks |
| 6.4 | ORM injection prevention | ✅ TypeORM parameterized |
| 6.6 | HTTP security headers | ✅ `helmet()` 導入済み |
| 6.7 | Dependency audit | ✅ `pnpm audit` + Dependabot |
| 6.8 | bcrypt for passwords | ✅ 使用済み |
| 6.10 | JSON schema validation | ✅ `class-validator` + `ValidationPipe` |
| 6.12 | Brute-force prevention | ✅ Throttler |
| 6.14 | **Payload size limit** | ⚠️ **未設定** |
| 6.20 | Hide error details | ✅ `HttpExceptionFilter` |
| 6.27 | **`node:` protocol imports** | ❌ **未対応** |

## 作業内容

### 1. Body サイズ制限 (6.14)

```typescript
// apps/api/src/main.ts
import { json, urlencoded } from 'express';

// helmet() の直後に追加
app.use(json({ limit: '1mb' }));
app.use(urlencoded({ extended: true, limit: '1mb' }));
```

### 2. `node:` protocol imports (6.27)
NestJS バックエンドの Node.js built-in module import を `node:` プレフィックス付きに統一。

```diff
-import * as fs from 'fs';
-import * as path from 'path';
+import * as fs from 'node:fs';
+import * as path from 'node:path';
```

対象ファイルを `grep` で洗い出し:
```bash
grep -rn "from 'fs'" apps/api/src/
grep -rn "from 'path'" apps/api/src/
grep -rn "from 'crypto'" apps/api/src/
```

### 3. (将来対応) JWT ブロックリスト (6.11)
Redis に失効 JWT の ID を保存し、各リクエストで検証する仕組み。
本チケットでは設計メモのみ残し、実装は別チケットとする。

## 対象ファイル

| パス | 変更内容 |
|------|----------|
| `apps/api/src/main.ts` | MODIFY: `json()`, `urlencoded()` body size limit 追加 |
| `apps/api/src/**/*.ts` | MODIFY: `from 'fs'` → `from 'node:fs'` 等 |

## 検証手順
1. `pnpm nx build api` PASS
2. `pnpm nx test api` PASS (270+ tests)
3. `curl -X POST http://localhost:3000/api/auth/login -H 'Content-Type: application/json' -d '{"email":"a","password":"b"}'` が正常レスポンス
4. 1MB 超の body 送信時に 413 Payload Too Large を返すことを確認

## 完了条件
- [ ] `main.ts` に body size limit が設定されている
- [ ] Node.js built-in import が `node:` プレフィックス付き
- [ ] `pnpm nx build api` PASS
- [ ] `pnpm nx test api` PASS
