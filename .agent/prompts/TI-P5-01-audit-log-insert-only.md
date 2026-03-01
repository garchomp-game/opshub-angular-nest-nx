# TI-P5-01: I-6 監査ログ INSERT ONLY 制約（DB レベル）

## 共通ルール
// turbo-all
- `pnpm`, `npx`, `nx` 等のコマンドは自由に実行してよい
- `sudo` が必要な操作やシステム設定変更のみユーザーに確認

## 概要
監査ログ (`audit_logs` テーブル) に対する UPDATE / DELETE をデータベースレベルで禁止する。
アプリケーション層では既に `enforceAuditLogAppendOnly()` で Prisma `$extends` による保護が実装済みだが、
DB 直接操作やツールからの変更を防ぐため、PostgreSQL の `RULE` を追加する。

## 現状
- `libs/prisma-db/src/lib/middleware/audit-log.middleware.ts` でアプリ層保護済み
- DB レベルの保護は未実装

## 作業内容

### 1. Prisma マイグレーション作成
SQL マイグレーションで PostgreSQL `RULE` を作成:

```sql
-- UPDATE を禁止
CREATE RULE audit_logs_no_update AS
  ON UPDATE TO audit_logs
  DO INSTEAD NOTHING;

-- DELETE を禁止
CREATE RULE audit_logs_no_delete AS
  ON DELETE TO audit_logs
  DO INSTEAD NOTHING;
```

マイグレーション作成コマンド:
```bash
npx prisma migrate dev --create-only --name audit_log_insert_only --schema=libs/prisma-db/prisma/schema.prisma
```
生成されたマイグレーションファイルに上記 SQL を記述し、再度 migrate を実行。

### 2. テスト
- API テスト (`pnpm nx test api`) が全パスすることを確認
  - 既存の AuditLog テストが RULE と競合しないか確認
  - 必要に応じてテスト用のセットアップを調整

### 3. ビルド確認
```bash
npx prisma migrate dev --schema=libs/prisma-db/prisma/schema.prisma
pnpm nx build api
pnpm nx test api
```

## 参照ファイル
- `libs/prisma-db/src/lib/middleware/audit-log.middleware.ts` — 既存アプリ層保護
- `libs/prisma-db/prisma/schema.prisma` — AuditLog モデル定義

## 完了条件
- [ ] PostgreSQL RULE が適用され、`audit_logs` への UPDATE/DELETE が `DO INSTEAD NOTHING` になる
- [ ] Prisma マイグレーションファイルが生成されている
- [ ] 全テストがパスする
- [ ] `pnpm nx build api` 成功
