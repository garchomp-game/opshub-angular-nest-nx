# C5: ロギング・可観測性強化

## 共通ルール
- 既存テストを壊さない
- ログ出力の変更は機能に影響しない
- 完了後 `pnpm nx build api && pnpm nx build web && pnpm nx test api && pnpm nx test web` で確認

## 作業内容

### 1. Web: LoggerService 構造化ログ強化

`apps/web/src/app/core/services/logger.service.ts`:
- 各ログ呼び出しに**コンテキスト** (コンポーネント名/サービス名) を必須引数化
- JSON 構造化出力（開発時は console.log、本番時はJSON.stringify）

```ts
// 使用例
this.logger.info('WorkflowService', 'loadAll', { page: 1, status: 'active' });
```

### 2. Web: HTTP エラーインターセプター強化

`apps/web/src/app/core/interceptors/error.interceptor.ts`:
- 4xx/5xx レスポンスに **リクエスト URL + method + レスポンス body** を含める
- ネットワークエラー (status: 0) の検出とリトライ可能性ログ

### 3. API: AuditInterceptor 差分ログ

`apps/api/src/common/interceptors/audit.interceptor.ts`:
- `beforeData` と `afterData` の差分 (changed fields) を `metadata.diff` に保存
- 簡易 diff: `Object.keys(afterData).filter(k => beforeData[k] !== afterData[k])`

### 4. API: HttpExceptionFilter PII マスキング

`apps/api/src/common/filters/http-exception.filter.ts`:
- リクエスト body をログ出力する際、`password`, `token`, `secret` フィールドを `***` にマスク
- メールアドレスは部分マスク (`a***@demo.com`)

### 5. Playwright E2E: 失敗時スクリーンショット

`playwright.config.ts`:
```ts
use: {
  screenshot: 'only-on-failure',
  trace: 'retain-on-failure',
}
```

### 検証

- `pnpm nx build api && pnpm nx build web` — ビルド成功
- `pnpm nx test api` — 229 テスト通過
- `pnpm nx test web` — 139 テスト通過
- `npx playwright test` — 37 テスト通過
- 手動確認: API ログ出力に diff が含まれること、PII がマスクされること
