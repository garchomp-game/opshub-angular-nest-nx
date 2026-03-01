# TI-P5-02: D-8 検索 GIN インデックス

## 共通ルール
// turbo-all
- `pnpm`, `npx`, `nx` 等のコマンドは自由に実行してよい
- `sudo` が必要な操作やシステム設定変更のみユーザーに確認

## 概要
横断検索 (`SearchService`) のパフォーマンスを向上させるため、PostgreSQL の `pg_trgm` 拡張 + GIN インデックスを導入する。
現在は Prisma の `contains` + `mode: 'insensitive'` による LIKE 検索で、大量データ時にフルテーブルスキャンが発生する。

## 現状
- `apps/api/src/modules/search/search.service.ts` で 4 テーブル並行検索:
  - `workflow` — `title`, `description` に `contains`
  - `project` — `name`, `description` に `contains`
  - `task` — `title` に `contains`
  - `expense` — `description` に `contains`
- GIN インデックス未使用
- `pg_trgm` 拡張未有効化

## 作業内容

### 1. Prisma マイグレーション作成
```bash
npx prisma migrate dev --create-only --name add_gin_search_indexes --schema=libs/prisma-db/prisma/schema.prisma
```

生成されたマイグレーションファイルに以下の SQL を記述:

```sql
-- pg_trgm 拡張を有効化
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Workflow: title + description の GIN インデックス
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_workflows_search
  ON workflows USING gin (title gin_trgm_ops, description gin_trgm_ops);

-- Project: name + description の GIN インデックス
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_projects_search
  ON projects USING gin (name gin_trgm_ops, description gin_trgm_ops);

-- Task: title の GIN インデックス
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_search
  ON tasks USING gin (title gin_trgm_ops);

-- Expense: description の GIN インデックス
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_expenses_search
  ON expenses USING gin (description gin_trgm_ops);
```

**注意**: `CONCURRENTLY` は `migrate dev` では使えない場合がある。その場合は外すこと。また、`description` カラムが nullable の場合、別のカラムのみで作成するか、COALESCE で対応する。

### 2. マイグレーション適用
```bash
npx prisma migrate dev --schema=libs/prisma-db/prisma/schema.prisma
```

### 3. SearchService は変更不要
Prisma の `contains` + `mode: 'insensitive'` は PostgreSQL の `ILIKE` に変換され、GIN (`gin_trgm_ops`) インデックスが自動的に使用される。サービスコードの変更は不要。

### 4. テスト・ビルド確認
```bash
pnpm nx build api
pnpm nx test api
```

## 参照ファイル
- `apps/api/src/modules/search/search.service.ts` — 検索ロジック
- `libs/prisma-db/prisma/schema.prisma` — 対象テーブル定義
- ドキュメント: `nx-angular-nestjs-doc/src/content/docs/detail/adr/decisions.md` §ADR-0007 (pg_trgm 選定理由)

## 完了条件
- [ ] `pg_trgm` 拡張が有効化されている
- [ ] 4 テーブルに GIN インデックスが作成されている
- [ ] マイグレーションファイルが生成されている
- [ ] 全テストがパスする
- [ ] `pnpm nx build api` 成功
