# TI-DOC-02: フロントエンド ルーティング・seed データ・ロールの整合性確認

## 共通ルール
// turbo-all
- `pnpm`, `npx`, `nx` 等のコマンドは自由に実行してよい
- `sudo` が必要な操作やシステム設定変更のみユーザーに確認

## 概要
フロントエンドのルーティング定義、サイドバー表示、seed データのロール構成、ブレッドクラムが一貫しているかを確認する。

## 作業内容

### 1. ルーティングとサイドバーの照合

`app.routes.ts` の全ルート定義:
```
[Public]
  /login
  /forgot-password
  /reset-password

[Protected — authGuard]
  /dashboard      — title: 'ダッシュボード'
  /workflows      — title: '申請'
  /projects       — title: 'プロジェクト'
  /timesheets     — title: '工数'
  /expenses       — title: '経費'
  /invoices       — title: '請求書'    [roleGuard: accounting, pm, tenant_admin]
  /search         — title: '検索'
  /admin          — title: '管理'      [roleGuard: tenant_admin, it_admin]
  /notifications  — title: '通知'
  /**             — 404
```

- [ ] 上記の全ルートがサイドバー `menuItems`（`app-shell.component.ts`）に反映されているか
- [ ] 意図的にサイドバーから非表示のルートがある場合、その理由を文書化
- [ ] `/timesheets` のサイドバー表示条件を確認（ロール制限あり？）

### 2. seed データのロール網羅性

- [ ] `libs/prisma-db/prisma/seed.ts` で作成されるユーザーを一覧化:

| ユーザー | メール | 割り当てロール | 確認 |
|---------|--------|-------------|------|
| 管理者 | admin@demo.com | ? | [ ] |
| PM | pm@demo.com | ? | [ ] |
| 承認者 | approver@demo.com | ? | [ ] |
| 経理 | accounting@demo.com | ? | [ ] |
| 一般 | member@demo.com | ? | [ ] |
| IT管理者 | it-admin@demo.com | ? | [ ] |

- [ ] 全ロール（`member`, `pm`, `approver`, `accounting`, `tenant_admin`, `it_admin`）が少なくとも 1 ユーザーに割り当てられているか
- [ ] E2E テストが `admin@demo.com` のみ使用 — このユーザーのロールでアクセスできないページがないか確認
- [ ] `/invoices`（`accounting`, `pm`, `tenant_admin`）と `/admin`（`tenant_admin`, `it_admin`）に `admin@demo.com` でアクセスできるか

### 3. `roleGuard` の挙動確認

- [ ] `role.guard.ts` の実装を確認（`authGuard` と同様に `whenReady()` を待つか？）
- [ ] 権限のないユーザーで `/invoices` にアクセスした場合の挙動:
  - 空白ページ？
  - 403 エラーページ？
  - `/dashboard` へリダイレクト？
- [ ] 挙動が UX 的に適切か（推奨: 権限不足メッセージを表示して `/dashboard` にリダイレクト）

### 4. ブレッドクラムと `data.title` の整合

- [ ] 各ルートの `data: { title: '...' }` が実際のページ表示（ブレッドクラム or ページタイトル）と一致するか
- [ ] 子ルート（`/workflows/new`, `/workflows/:id`, `/projects/:id/board` 等）にも `title` が設定されているか
- [ ] 未設定の場合、追加が必要か検討

### 5. 404 ルートの優先順位

- [ ] protected 内の `**`（L93-99）と public の `**`（L103-108）：
  - 未認証で `/nonexistent` → protected の `**` → auth guard → `/login` にリダイレクト → ✅ 期待通り？
  - 認証済みで `/nonexistent` → protected の `**` → 404 ページ → ✅ 期待通り？
- [ ] public 側の `**` は実際に到達するケースがあるか

## 対象ファイル

| パス | 確認内容 |
|------|---------|
| `apps/web/src/app/app.routes.ts` | 全ルート定義（110 行） |
| `apps/web/src/app/shared/components/app-shell.component.ts` | サイドバー menuItems (L175-190) |
| `apps/web/src/app/core/auth/role.guard.ts` | ロールガード実装 |
| `libs/prisma-db/prisma/seed.ts` | seed ユーザー・ロール定義 |
| `apps/web/src/app/features/workflows/workflows.routes.ts` | 子ルート例 |

## 完了条件
- [ ] ルーティングとサイドバーの不整合がリストアップされ、修正 or 意図的な非表示が文書化されている
- [ ] seed データの全ロールカバレッジが確認されている
- [ ] `roleGuard` の権限不足時の挙動が確認・改善されている
- [ ] ブレッドクラム / title の不一致が修正されている
