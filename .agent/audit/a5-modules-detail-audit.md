# A5: モジュール詳細・シーケンス・エラー仕様 突き合わせ監査レポート

**実施日**: 2026-02-27  
**対象ドキュメント**: `detail/modules/`, `detail/sequences/`, `detail/operations/`, `spec/errors/`, `spec/audit-logging/`, `detail/testing/`, `detail/setup/`  
**対象実装**: `opshub/apps/api/src/`, `opshub/apps/web/src/`

---

## 総括

> [!CAUTION]
> ドキュメントは **Next.js App Router + Supabase** アーキテクチャを前提に記述されているが、実装は **NestJS（API）+ Angular（Web）+ Prisma ORM + Nx モノレポ** で構築されている。アーキテクチャレベルの根本的な乖離があり、ドキュメントのほぼ全項目が実装と一致しない。

| 調査項目 | 判定 | 概要 |
|---|---|---|
| モジュール構成 | ⚠️ 部分一致 | モジュール名は概ね一致するが、レイヤー構造・ファイル構成が完全に異なる |
| 処理フロー | ⚠️ 部分一致 | ビジネスロジックの流れは類似するが、技術的実現方法が異なる |
| エラー定義 | ⚠️ 部分一致 | エラーコード体系は採用されているが、詳細が異なる |
| 監査ログ | ⚠️ 部分一致 | 監査ログは実装されているが、方式が異なる |
| テスト方針 | ⚠️ 部分一致 | テストは存在するが、ツール・方式が異なる |
| セットアップ手順 | ❌ 不一致 | ドキュメントの手順では環境構築不可 |

---

## 1. モジュール構成

### 1.1 アーキテクチャの根本的乖離

| 項目 | ドキュメント | 実装 |
|---|---|---|
| フレームワーク | Next.js App Router | NestJS（API）+ Angular（Web） |
| DB アクセス | Supabase Client | Prisma ORM (`@prisma-db`) |
| 認証方式 | Supabase Auth（`requireAuth()`, `requireRole()`） | JWT + Passport（`JwtAuthGuard`, `RolesGuard`） |
| データ操作 | Server Actions (`_actions.ts`) | REST API（Controller → Service → Prisma） |
| UI パターン | Server Component / Client Component 分離 | Angular コンポーネント + Angular Service |
| パッケージ管理 | 単一 Next.js アプリ | Nx モノレポ（`apps/api`, `apps/web`, `libs/*`） |
| 共有型 | `types/index.ts` 単一ファイル | `libs/shared/types/` パッケージ（enum/interface/constants 分割） |

### 1.2 モジュール名の対応

ドキュメント記載の11モジュールと実装の対応状況:

| Doc ID | ドキュメントモジュール | API 実装 | Web 実装 | 一致度 |
|---|---|---|---|---|
| DD-MOD-001 | ワークフロー | `modules/workflows/` | `features/workflows/` | ✅ 機能一致 |
| DD-MOD-002 | プロジェクト | `modules/projects/` | `features/projects/` | ✅ 機能一致 |
| DD-MOD-003 | 工数 | `modules/timesheets/` | `features/timesheets/` | ✅ 機能一致 |
| DD-MOD-004 | 経費 | `modules/expenses/` | `features/expenses/` | ✅ 機能一致 |
| DD-MOD-005 | 通知 | `modules/notifications/` | `shared/notification-bell/` | ✅ 機能一致 |
| DD-MOD-006 | ダッシュボード | `modules/dashboard/` | `features/dashboard/` | ✅ 機能一致 |
| DD-MOD-007 | 管理 | `modules/admin/` | `features/admin/` | ✅ 機能一致 |
| DD-MOD-008 | 請求書 | `modules/invoices/` | `features/invoices/` | ✅ 機能一致 |
| DD-MOD-009 | ドキュメント管理 | `modules/documents/` | `features/projects/documents/` | ✅ 機能一致 |
| DD-MOD-010 | 全文検索 | `modules/search/` | `features/search/` | ✅ 機能一致 |
| DD-MOD-011 | 運用基盤 | `modules/health/` | — | ✅ 機能一致 |
| — | （未記載） | `modules/auth/` | `core/auth/` | ❌ 未記載 |

### 1.3 レイヤー構造の乖離

**ドキュメント記載** (Next.js パターン):
```
ページ層 (app/) → アクション層 (_actions.ts) → ライブラリ層 (lib/)
```

**実装** (NestJS パターン):
```
Controller → Service → PrismaService (libs/prisma-db)
```

### 1.4 共通ユーティリティの乖離

| ドキュメント記載 | 実装 | 差異 |
|---|---|---|
| `withAuth()` — Server Action ラッパー | `JwtAuthGuard` — NestJS Guard | 方式異なる（ラッパー関数 vs Guard デコレータ） |
| `writeAuditLog()` — 手動呼出 | `AuditInterceptor` — 自動記録 | 方式異なる（手動 vs インターセプタ自動） |
| `requireAuth()` → `/login` リダイレクト | `JwtAuthGuard` → 401 レスポンス | 挙動異なる |
| `requireRole(tenantId, roles)` | `@Roles()` デコレータ + `RolesGuard` | 方式異なる |
| `hasRole()` — SC での UI 分岐 | `roleGuard` — Angular Route Guard | 方式異なる |
| `getCurrentUser()` | `@CurrentUser()` デコレータ | 方式異なる |
| `createNotification()` — `lib/notifications.ts` | `NotificationsService.create()` — DI | 方式異なる（静的関数 vs DI サービス） |
| `getNotificationLink()` — `lib/notifications.ts` | `@shared/util` パッケージ | ✅ 機能は一致 |
| `escapeCsvField()` — `api/timesheets/export/route.ts` | 実装場所未確認 | — |
| `escapeLikePattern()` — `search/_actions.ts` | `search.service.ts` 内 | ✅ 存在確認 |

### 1.5 共通定数の乖離

| ドキュメント記載 | 実装 | 差異 |
|---|---|---|
| `types/index.ts` 単一ファイル | `libs/shared/types/` パッケージ | ファイル分割方法が異なる |
| `ROLE_LABELS` | `libs/shared/types/src/lib/constants/role-labels.ts` | ✅ 存在 |
| `USER_STATUS_LABELS / COLORS` | `libs/shared/types/src/lib/constants/status-labels.ts` | ✅ 存在 |
| `TASK_TRANSITIONS` | `libs/shared/types/src/lib/constants/transitions.ts` | ✅ 存在・内容一致 |
| `PROJECT_TRANSITIONS` | 同上 | ✅ 存在・内容一致 |
| `WORKFLOW_TRANSITIONS` | 同上 | ✅ 存在・内容一致 |
| `INVOICE_STATUS_TRANSITIONS` | 同上 (`INVOICE_TRANSITIONS`) | ✅ 存在・内容一致 |
| `ActionResult<T>` 統一レスポンス型 | `ApiResponse<T>` (`api-response.interface.ts`) | 名称異なるが同等 |
| `invoices/_constants.ts` | `libs/shared/types/src/lib/constants/invoice-constants.ts` | 配置異なるが同等 |
| `ALLOWED_MIME_TYPES` | `libs/shared/types/src/lib/constants/allowed-mime-types.ts` | 配置異なるが同等 |
| Ant Design カラー名参照 | DaisyUI ベース（Ant Design 未使用） | ❌ UI ライブラリが異なる |

---

## 2. 処理フロー（シーケンス図）

### 2.1 ワークフロー状態遷移

**ドキュメント記載の遷移ルール**:
```
draft → submitted → approved / rejected / withdrawn
rejected → submitted / withdrawn
```

**実装** (`libs/shared/types/src/lib/constants/transitions.ts`):
```ts
DRAFT → [SUBMITTED]
SUBMITTED → [APPROVED, REJECTED, WITHDRAWN]
REJECTED → [SUBMITTED, WITHDRAWN]
APPROVED → []
WITHDRAWN → []
```

> ✅ **一致**: 状態遷移ルール自体はドキュメントと完全に一致している。

### 2.2 プロジェクト・タスク・請求書状態遷移

| 遷移 | ドキュメント | 実装 | 判定 |
|---|---|---|---|
| プロジェクト | planning→active→completed/cancelled | ✅ 一致 | ✅ |
| タスク | todo→in_progress→done (双方向) | ✅ 一致 | ✅ |
| 請求書 | draft→sent→paid/cancelled | ✅ 一致 | ✅ |

### 2.3 シーケンス: 申請→承認フロー

| ドキュメントのステップ | 実装 | 差異 |
|---|---|---|
| `UI → SA: submitWorkflow(formData)` | `UI → Controller (POST) → WorkflowsService.create()` | Server Action → REST API |
| `SA → requireRole(["member","pm","accounting"])` | `@Roles()` デコレータ + `RolesGuard` | 方式異なる |
| `SA → DB: INSERT workflows` | `PrismaService.workflow.create()` | Supabase → Prisma |
| `SA → DB: INSERT audit_logs` | `AuditInterceptor` が自動記録 | 手動 → 自動 |
| `SA → N: 承認者に通知作成` | `NotificationsService.create()` 呼出 | ✅ 同等 |
| `SA → UI: { success: true }` | Controller が JSON レスポンス返却 | ✅ 同等 |

### 2.4 シーケンス: 工数入力

| ドキュメントのステップ | 実装 | 差異 |
|---|---|---|
| `UI → SA: upsertTimesheet(entries[])` | `POST /api/timesheets` → `TimesheetsService` | Server Action → REST API |
| バリデーション（0-24h、0.25h単位） | `ERR-PJ-020`（0.25刻み）, `ERR-PJ-024`（24h超過）| ✅ 同等 |
| `UPSERT timesheets (ON CONFLICT)` | Prisma upsert 操作 | ✅ 同等 |
| `INSERT audit_logs` | `AuditInterceptor` 自動記録 | 手動 → 自動 |

### 2.5 ワークフロー公開 I/F の対応

| ドキュメント記載 | 実装メソッド | 判定 |
|---|---|---|
| `createWorkflow()` | `WorkflowsService.create()` | ✅ |
| `submitWorkflow()` | `WorkflowsService.submit()` | ✅ |
| `approveWorkflow()` | `WorkflowsService.approve()` | ✅ |
| `rejectWorkflow()` | `WorkflowsService.reject()` | ✅ |
| `withdrawWorkflow()` | `WorkflowsService.withdraw()` | ✅ |

---

## 3. エラー定義

### 3.1 エラーコード体系

**ドキュメント記載**:
```
ERR-{カテゴリ}-{番号}
ERR-AUTH / ERR-VAL / ERR-WF / ERR-PJ / ERR-EXP / ERR-INV / ERR-SYS
```

**実装で確認されたエラーコード**:

| コード | 実装ファイル | 用途 |
|---|---|---|
| `ERR-SYS-001` | `http-exception.filter.ts` | 500 サーバーエラー |
| `ERR-SYS-002` | 同上 / `notifications.service.ts` | 404 未検出 |
| `ERR-SYS-003` | 同上 | 409 競合 |
| `ERR-AUTH-001` | 同上 / `auth.service.ts` | 401 認証エラー |
| `ERR-AUTH-002` | 同上 / `timesheets.service.ts` | 403 認可エラー |
| `ERR-VAL-000` | 同上 | 400 バリデーション |
| `ERR-VAL-004` | `expenses.service.ts` | プロジェクト不存在 |
| `ERR-VAL-005` | `expenses.service.ts` | 承認者不存在 |
| `ERR-VAL-010` | `expenses.service.ts` | 日付範囲不正 |
| `ERR-VAL-F02` | `documents.service.ts` | ファイルバリデーション |
| `ERR-VAL-F03` | `documents.service.ts` / `documents.controller.ts` | MIME タイプ不正 |
| `ERR-EXP-001` | `expenses.service.ts` | 経費未検出 |
| `ERR-INV-001〜004` | `invoices.service.ts` | 請求書関連エラー |
| `ERR-PJ-005` | `projects.service.spec.ts` | 重複メンバー |
| `ERR-PJ-006` | `projects.service.spec.ts` | PM 削除禁止 |
| `ERR-PJ-020/024/025` | `timesheets.service.ts` | 工数バリデーション |
| `ERR-ADM-001〜004` | `tenants.service.ts` / `users.service.ts` | 管理系エラー |
| `ERR-DOC-001` | `documents.service.ts` | ドキュメント未検出 |
| `ERR-SYS-F01/F02` | `documents.service.ts` | ストレージ系エラー |

### 3.2 乖離点

| 項目 | ドキュメント | 実装 | 差異 |
|---|---|---|---|
| `ERR-WF` プレフィックス | 記載あり | **未使用** | ❌ ワークフロー固有コードが存在しない |
| `ERR-ADM` プレフィックス | 記載なし | 実装あり | ❌ ドキュメント未記載 |
| `ERR-DOC` プレフィックス | 記載なし | 実装あり | ❌ ドキュメント未記載 |
| `ERR-VAL-F*` パターン | 記載なし | 実装あり | ❌ ファイル系バリデーション未記載 |
| `ERR-SYS-F*` パターン | 記載なし | 実装あり | ❌ ストレージ系未記載 |
| `ERR-AUTH-003` | 記載あり（`requireRole`失敗時） | **未使用** | ❌ 実装では `ERR-AUTH-002` を使用 |
| HTTP 429 レート制限 | 記載あり | **未実装** | ❌ レート制限機構なし |
| エラーレスポンス形式 | `ActionResult<T>` | `HttpExceptionFilter` で統一 JSON 出力 | 方式異なるが出力形式は同等 |
| 画面表示方針 | Ant Design `message.error()` / `Form.Item` | DaisyUI ベース + Angular | UI ライブラリが異なる |

---

## 4. 監査ログ

### 4.1 記録方式の乖離

| 項目 | ドキュメント | 実装 |
|---|---|---|
| 方式 | `writeAuditLog()` 手動呼出 | `AuditInterceptor` 自動記録 |
| 記録タイミング | Server Action 内で DB 操作直後 | Controller レスポンス返却時に自動 |
| トランザクション | 業務操作と同一トランザクション | 業務操作完了後に非同期で記録 |
| 失敗時挙動 | 両方ロールバック（同一トランザクション） | 監査ログ記録失敗はサイレント（業務操作に影響しない） |

> [!WARNING]
> ドキュメントでは「業務操作と同一トランザクション内」としているが、実装では非同期の後処理として記録しており、監査ログ記録失敗時に業務操作はロールバックされない。

### 4.2 記録内容の乖離

| ドキュメント記載フィールド | 実装の対応フィールド | 判定 |
|---|---|---|
| `id` | `id` (UUID) | ✅ |
| `tenant_id` | `tenantId` | ✅ |
| `user_id` | `userId` | ✅ |
| `action` | `action` (`resolveAction()` で自動生成) | ✅ |
| `resource_type` | `resourceType` (`extractResourceType()` で自動抽出) | ✅ |
| `resource_id` | `resourceId` (レスポンスから自動取得) | ✅ |
| `before` (変更前データ) | **未記録** | ❌ `beforeData` フィールド未使用 |
| `after` (変更後データ) | `afterData` (リクエスト body) | ⚠️ リクエストbodyを記録（変更後DBデータではない） |
| `metadata` | `metadata` (url, method, duration, userAgent, ip) | ✅ |
| `created_at` | `createdAt` (Prisma 自動) | ✅ |

### 4.3 記録対象の操作

| ドキュメント記載操作 | 実装 | 判定 |
|---|---|---|
| 申請作成 `workflow.create` | ✅ 自動記録（POST） | ✅ |
| 申請送信 `workflow.submit` | ✅ 自動記録（URL に `/submit` 含む） | ✅ |
| 承認 `workflow.approve` | ✅ 自動記録 | ✅ |
| 差戻し `workflow.reject` | ✅ 自動記録 | ✅ |
| プロジェクト CRUD | ✅ 自動記録 | ✅ |
| タスク CRUD | ✅ 自動記録 | ✅ |
| 経費申請 | ✅ 自動記録 | ✅ |
| 請求書操作 | ✅ 自動記録 | ✅ |
| ユーザー招待/ロール変更 | ✅ 自動記録 | ✅ |
| ログイン/ログアウト | ❓ Auth モジュール側で処理 | 要確認 |
| 工数入力 | ✅ 自動記録（全 POST/PUT） | ✅（ドキュメントでは「量が多いため要検討」） |

### 4.4 改ざん防止

| ドキュメント | 実装 | 差異 |
|---|---|---|
| INSERT ONLY（RLS で UPDATE/DELETE 禁止） | Prisma スキーマ上の制約なし | ❌ INSERT ONLY 制約未確認 |
| DB レベルの TRIGGER で防止 | 未確認 | ❌ |
| 保持期間最低1年 | 制約未確認 | ❌ |

### 4.5 監査ログビューア

| ドキュメント | 実装 | 判定 |
|---|---|---|
| IT Admin / Tenant Admin が閲覧 | `admin/audit-logs` で `AuditLogsController` 実装 | ✅ |
| フィルタ: 期間、ユーザー、アクション、リソース | `AuditLogFilterDto` で対応 | ✅ |
| 5分以内の操作者特定 | UI + フィルタで可能 | ✅ |

---

## 5. テスト方針

### 5.1 テストツールの乖離

| 項目 | ドキュメント | 実装 |
|---|---|---|
| ユニットテスト | Vitest | Jest（Nx 標準） |
| 結合テスト | Vitest + Supabase Local (Docker) | Jest + Prisma モック |
| RLS テスト | pgTAP or Vitest | **未実装**（RLS 自体が存在しない: Prisma ORM 使用） |
| E2E テスト | Playwright | Playwright（`playwright.config.ts` 存在） |

### 5.2 テストファイルの対応

**API テスト** (28ファイル):

| モジュール | Controller テスト | Service テスト | 判定 |
|---|---|---|---|
| Workflows | ✅ | ✅ | ✅ |
| Projects | ✅ | ✅ | ✅ |
| Tasks | ✅ | ✅ | ✅ |
| Timesheets | ✅ | ✅ | ✅ |
| Expenses | ✅ | ✅ | ✅ |
| Invoices | ✅ | ✅ | ✅ |
| Notifications | ✅ | ✅ | ✅ |
| Dashboard | ✅ | ✅ | ✅ |
| Documents | ✅ | ✅ | ✅ |
| Search | ✅ (tests/) | — | ⚠️ Service テスト無し |
| Health | ✅ (tests/) | — | ⚠️ Indicator テスト無し |
| Auth | ✅ | ✅ | ✅ |
| Admin (Tenants) | ✅ | ✅ | ✅ |
| Admin (Users) | ✅ | ✅ | ✅ |
| Admin (AuditLogs) | ✅ | ✅ | ✅ |

**Web テスト** (25ファイル):

| 機能 | コンポーネントテスト | サービステスト | 判定 |
|---|---|---|---|
| Auth | ✅ (`login`, `auth.service`) | — | ✅ |
| Workflows | ✅ (`workflow-list`) | ✅ | ✅ |
| Projects | ✅ (`project-list`, `kanban-board`) | ✅ (`project`, `task`) | ✅ |
| Documents | ✅ (`document-list`) | ✅ | ✅ |
| Timesheets | ✅ (`timesheet-weekly`) | ✅ | ✅ |
| Expenses | ✅ (`expense-list`) | ✅ | ✅ |
| Invoices | — | ✅ | ⚠️ コンポーネントテスト無し |
| Search | ✅ (`search-results`) | ✅ | ✅ |
| Admin | ✅ (`audit-log-viewer`, `tenant-settings`, `user-list`) | ✅ (3ファイル) | ✅ |
| Notifications | ✅ (`notification-bell`) | ✅ | ✅ |

### 5.3 テスト方針の乖離

| ドキュメント | 実装 | 差異 |
|---|---|---|
| カバレッジ80%以上（lib/配下） | 基準未設定 | ❌ |
| Supabase Local (Docker) で結合テスト | Prisma モックベース | ❌ 実 DB テストではない |
| RLS テスト 8ケース記載 | RLS 自体が存在しない（Prisma + NestJS Guard ベース） | ❌ 根本的に異なる |
| CI/CD 統合（PR時ユニット+結合、Nightly E2E） | Nx ベースのテスト実行 | 未確認 |
| E2E 4フロー記載 | `e2e/` ディレクトリ存在 | 内容未確認 |

---

## 6. セットアップ手順

### 6.1 手順の乖離

| ステップ | ドキュメント | 実装 | 差異 |
|---|---|---|---|
| 1. クローン | `cd opshub` | ✅ 同じ | ✅ |
| 2. Supabase セットアップ | `docker compose up -d` (Supabase self-host) | `docker-compose.yml` は PostgreSQL のみ（Supabase なし） | ❌ |
| 3. 環境変数 | `NEXT_PUBLIC_SUPABASE_URL` 等 | `DATABASE_URL` 等（Prisma 用） | ❌ |
| 4. DB マイグレーション | `npx supabase db push --local` | `npx prisma migrate dev` 等 | ❌ |
| 5. シードデータ | `npx supabase db seed --local` | `libs/prisma-db/prisma/seed.ts` | ❌ |
| 6. 型生成 | `npx supabase gen types typescript` | `npx prisma generate` | ❌ |
| 7. アプリ起動 | `pnpm dev` (Next.js) | `pnpm nx serve api` + `pnpm nx serve web` | ❌ |
| Supabase Studio | `http://localhost:3100` | 不要（Supabase 未使用） | ❌ |

### 6.2 ディレクトリ構成の乖離

**ドキュメント記載**:
```
opshub/
├── docker-compose.yml      # Supabase self-host
├── supabase/              # Supabase マイグレーション
├── src/                   # Next.js 単一アプリ
│   ├── app/
│   ├── lib/
│   └── types/
```

**実装**:
```
opshub/
├── docker-compose.yml      # PostgreSQL
├── apps/
│   ├── api/               # NestJS バックエンド
│   └── web/               # Angular フロントエンド
├── libs/
│   ├── prisma-db/         # Prisma ORM + マイグレーション
│   └── shared/            # 共有型・ユーティリティ
├── e2e/                   # Playwright E2E
├── nx.json                # Nx 設定
```

### 6.3 テスト用ログイン情報

| ドキュメント記載 | 実装 | 差異 |
|---|---|---|
| 6ロール × 固定パスワード `password123` | `libs/prisma-db/prisma/seed.ts` で管理 | 内容未確認（ファイル存在は確認） |

---

## 7. 運用手順書 (operations)

ドキュメントは Supabase + Vercel ベースの運用を前提としている。

| 項目 | ドキュメント | 実装 | 差異 |
|---|---|---|---|
| バックアップ | Supabase Pro Plan 日次自動 | PostgreSQL 直接（Supabase なし） | ❌ |
| デプロイ | Vercel 自動デプロイ | 未確認（Nx ベースビルド） | ❌ |
| ヘルスチェック | `/api/health` | `modules/health/` 実装あり | ✅ 存在 |
| 構造化ログ | `lib/logger.ts` (JSON) | `LoggingInterceptor` (NestJS Logger) | ⚠️ 方式異なる |
| 監視 | UptimeRobot + Vercel Logs | 未確認 | ❌ |
| DR 手順 | Supabase ダッシュボードからの復元 | 適用不可 | ❌ |

---

## 乖離サマリー一覧

| # | カテゴリ | 乖離内容 | 深刻度 |
|---|---|---|---|
| 1 | アーキテクチャ | Next.js + Supabase → NestJS + Angular + Prisma | 🔴 Critical |
| 2 | モジュール構成 | ファイル配置・レイヤー構造が異なる（機能名は一致） | 🟡 Medium |
| 3 | 認証方式 | Supabase Auth → JWT + Passport | 🔴 Critical |
| 4 | DB アクセス | Supabase Client → Prisma ORM | 🔴 Critical |
| 5 | 監査ログ方式 | `writeAuditLog()` 手動 → `AuditInterceptor` 自動 | 🟡 Medium |
| 6 | 監査ログ: 変更前データ | `before` フィールド記録なし | 🟠 High |
| 7 | 監査ログ: トランザクション | 同一トランザクション → 非同期後処理 | 🟠 High |
| 8 | エラーコード | `ERR-WF` 未使用、`ERR-ADM`/`ERR-DOC` 未記載 | 🟡 Medium |
| 9 | エラーコード: `ERR-AUTH-003` | ドキュメント記載あり、実装なし | 🟡 Medium |
| 10 | レート制限 | HTTP 429 記載あり、実装なし | 🟡 Medium |
| 11 | テストツール | Vitest → Jest | 🟡 Medium |
| 12 | RLS テスト | 記載あり、RLS 自体が存在しない | 🔴 Critical |
| 13 | セットアップ手順 | 全ステップが実装と不一致 | 🔴 Critical |
| 14 | デプロイ | Vercel ベース、実装と不一致 | 🔴 Critical |
| 15 | バックアップ/DR | Supabase ベース、適用不可 | 🔴 Critical |
| 16 | UI ライブラリ | Ant Design 6 → DaisyUI | 🟡 Medium |
| 17 | 構造化ログ | `lib/logger.ts` → NestJS `LoggingInterceptor` | 🟡 Medium |
| 18 | 改ざん防止 | INSERT ONLY 制約未確認 | 🟠 High |

---

## 推奨アクション（参考）

1. **ドキュメント全面改訂**: アーキテクチャ前提が根本的に異なるため、全ドキュメントの改訂が必要
2. **セットアップ手順の再作成**: NestJS + Angular + Prisma + Nx 環境に合わせた手順書が必要
3. **エラーコード体系の整理**: 実装に存在するが未記載のコード（`ERR-ADM`, `ERR-DOC`）を文書化
4. **監査ログ仕様の更新**: `AuditInterceptor` ベースの自動記録方式を文書化
5. **運用手順書の再作成**: Supabase/Vercel 前提を廃止し、実際のインフラに合わせた手順が必要
