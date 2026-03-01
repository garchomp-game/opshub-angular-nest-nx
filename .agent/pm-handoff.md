# OpsHub PM 引き継ぎガイド

## 1. プロジェクト概要

**OpsHub** は Nx monorepo で構成された業務管理 SaaS アプリケーション。

| 項目 | 値 |
|---|---|
| モノレポ | Nx |
| バックエンド | NestJS 11 (apps/api) |
| フロントエンド | Angular 21 (apps/web) |
| DB | PostgreSQL + Prisma |
| CSS | Tailwind v4 (レイアウト用ユーティリティのみ) |
| UI ライブラリ | **PrimeNG 21 (Aura テーマ)** — 移行完了 |
| アイコン | PrimeIcons (`pi pi-xxx`) |
| テスト | Jest (API), Vitest (Web), Playwright (E2E) |
| パッケージマネージャ | pnpm |
| API ドキュメント | Swagger (`/api/docs` — 開発モードのみ) |

> ✅ DaisyUI / @ng-icons は**完全撤去済み**。`shared/ui` フォルダも削除済み。

---

## 2. ドキュメント配置規則

### プロンプト・チケット

```
.agent/
├── prompts/          ← エージェント向け作業指示書
│   ├── c2-c5-*.md                             ← Phase 3 チケット (完了)
│   ├── p1-p6-*.md                             ← PrimeNG 移行チケット (完了)
│   ├── t1-t8-*.md                             ← 画面実装チケット (完了)
│   ├── v5-*.md                                ← DaisyUI v5 修正 (完了)
│   ├── a1~a5-*-audit.md                       ← 監査レポート
│   └── d1-d2-*.md                             ← UI 改善チケット (完了)
├── audit/            ← 詳細監査レポート
├── llms-txt/         ← LLM 向けリファレンス
│   ├── primeNG-llms.txt          ← PrimeNG コンポーネント索引
│   ├── primeNG-llms-full.txt     ← PrimeNG 全 API ドキュメント (48K 行)
│   └── angular-llms*.txt         ← Angular リファレンス
├── pm-handoff.md     ← このファイル
├── pm-prompt.md      ← PM 引き継ぎプロンプト (現在の状態と次アクション)
├── ticket-template.md ← チケットテンプレート
└── workflows/
    └── pm-handoff.md ← PM 引き継ぎワークフロー
```

### リファレンス

```
reference/            ← 仕様書（旧アーキテクチャ前提、要注意）
opshub-doc/           ← 旧ドキュメント (Starlight)
```

> ⚠️ `reference/` と `opshub-doc/` は**旧アーキテクチャ (Next.js/Supabase)** 前提のため、
> 現在の実装 (NestJS/Angular/Prisma) と大きく乖離している。

---

## 3. 開発・テスト・ビルドコマンド

```bash
# 起動
pnpm nx serve api          # API サーバー (http://localhost:3000)
pnpm nx serve web          # Web サーバー (http://localhost:4200)

# テスト
pnpm nx test api           # API ユニットテスト (270 テスト)
pnpm nx test web           # Web ユニットテスト (200 テスト)
npx playwright test        # E2E テスト (37 テスト)

# Lint
pnpm nx lint web           # ESLint + eslint-plugin-security (0 errors)
pnpm nx lint api

# ビルド
pnpm nx build api
pnpm nx build web          # バンドルサイズ上限: 1.5MB (現在 1.02 MB)

# Swagger
# http://localhost:3000/api/docs (開発モードで API サーバー起動後)
```

### テストアカウント

| メール | パスワード | ロール |
|---|---|---|
| admin@demo.com | Password123 | tenant_admin |
| pm@demo.com | Password123 | pm |
| member@demo.com | Password123 | member |
| approver@demo.com | Password123 | approver |
| accounting@demo.com | Password123 | accounting |
| itadmin@demo.com | Password123 | it_admin |

### DB セットアップ

```bash
cd libs/prisma-db
npx prisma migrate dev     # マイグレーション実行
npx prisma db seed         # シードデータ投入
```

---

## 4. プロジェクト構造

```
opshub/
├── apps/
│   ├── api/                        ← NestJS バックエンド
│   │   └── src/
│   │       ├── common/             ← デコレータ、ガード、インターセプター、フィルタ
│   │       └── modules/            ← 12 モジュール
│   │           ├── auth/           ← 認証 (JWT + Passport)
│   │           ├── mail/           ← メール送信 (Nodemailer + MailHog)
│   │           ├── workflows/      ← 申請管理
│   │           ├── projects/       ← プロジェクト + タスク管理
│   │           ├── timesheets/     ← 工数管理
│   │           ├── expenses/       ← 経費管理
│   │           ├── invoices/       ← 請求書管理
│   │           ├── documents/      ← ファイル管理
│   │           ├── notifications/  ← 通知
│   │           ├── search/         ← 全文検索 (GIN インデックス)
│   │           ├── dashboard/      ← ダッシュボード KPI
│   │           ├── admin/          ← 管理 (ユーザー/テナント/監査ログ)
│   │           └── health/         ← ヘルスチェック
│   │
│   └── web/                        ← Angular 21 フロントエンド
│       └── src/app/
│           ├── core/               ← AuthService, Interceptors, Guards
│           │   ├── auth/           ← AuthService, AuthGuard, RoleGuard
│           │   │   ├── forgot-password/  ← パスワードリセット申請画面
│           │   │   └── reset-password/   ← パスワードリセット画面
│           │   ├── interceptors/   ← auth, error (HttpClient)
│           │   └── services/       ← LoggerService, GlobalErrorHandler
│           ├── shared/             ← AppShell, Breadcrumb, NotFound, 通知ベル, 検索バー
│           │   ├── components/     ← app-shell, breadcrumb, header-search-bar, not-found
│           │   ├── notification-bell/
│           │   ├── pipes/          ← カスタムパイプ
│           │   └── services/       ← ToastService, ModalService (PrimeNG ラッパー)
│           ├── features/           ← 各機能モジュール (9 機能)
│           │   ├── notifications/  ← 通知一覧ページ
│           └── testing/            ← テスト用ヘルパー
│
├── libs/
│   ├── prisma-db/                  ← Prisma クライアント + テナントミドルウェア
│   ├── api-client/                 ← OpenAPI 自動生成 SDK
│   └── shared/
│       ├── types/                  ← 共通型・Enum・定数
│       └── util/                   ← 共通ユーティリティ
│
├── e2e/                            ← Playwright E2E テスト
├── prisma/
│   ├── schema.prisma               ← DB スキーマ
│   └── seed.ts                     ← シードデータ
│
├── tmp/                            ← 一時ファイル (.gitignore 対象)
└── postcss.config.json             ← @tailwindcss/postcss (Angular 21 用)
```

---

## 5. UI ライブラリ状態

### PrimeNG 基盤 (設定済み)

| 設定 | 状態 |
|---|---|
| `app.config.ts` に `providePrimeNG` | ✅ Aura テーマ + darkModeSelector |
| `MessageService` / `ConfirmationService` | ✅ グローバル provider |
| `styles.css` に PrimeIcons CSS | ✅ |
| app-shell に `<p-toast>` / `<p-confirmdialog>` | ✅ |
| `ToastService` → PrimeNG `MessageService` | ✅ `shared/services/toast.service.ts` |
| `ModalService` → PrimeNG `ConfirmationService` | ✅ `shared/services/modal.service.ts` |
| バンドルサイズ上限 | 1.5 MB (現在 1.02 MB) |

### 全画面 PrimeNG 移行完了

| 画面 | 使用 PrimeNG |
|---|---|
| ログイン | InputText, Password, IconField, Button, Message |
| ダッシュボード | Card, ProgressBar, ProgressSpinner, Button |
| ワークフロー | Table, Paginator, Tag, Button, Select, Textarea, Avatar |
| プロジェクト | Table, Paginator, Tag, Avatar, IconField, Select, Button |
| カンバン | Card, Tag, Button, Avatar |
| ドキュメント | Table, Paginator, Tag, Avatar, Button, Tooltip, ProgressBar |
| 経費 | Table, Paginator, Tag, Button, InputNumber, DatePicker, Select |
| 工数入力 | Table, InputNumber, Button, Select, Card |
| 請求書 | Table, Paginator, Tag, Button, Card |
| 管理 (Users/Tenant) | Table, Button, Card, InputText, ProgressSpinner |
| 監査ログ | Table, Paginator, Tag, Button, DatePicker, Select |
| 検索 | InputText, Button, Tag, Avatar |
| アプリシェル | Drawer, Menu, Avatar, Breadcrumb |

---

## 6. 既知の技術的注意点

### API 側

| 項目 | 内容 |
|---|---|
| テナント分離 | Prisma `$extends` ミドルウェアで自動 `WHERE tenantId = ?` 挿入 |
| CurrentUser | `@CurrentUser()` デコレータが `tenantIds[0]` → `tenantId` に変換 |
| グローバルプレフィックス | `api` が自動付与。コントローラーに `api/` を含めないこと |
| ValidationPipe | `whitelist: true`, `forbidNonWhitelisted: true`, `transform: true` |
| Swagger | `@nestjs/swagger` — `/api/docs` (開発モードのみ) |
| ヘルスチェック | `GET /api/health` — `@Public()` デコレータで認証不要 |
| 認可 | RLS 不使用。`@Roles()` デコレータ + `RolesGuard` でアプリ層制御 (ADR-0007) |
| ロギング | nestjs-pino で構造化 JSON ログ (本番は JSON、開発は pino-pretty) |
| 監査ログ | `AuditInterceptor` — POST/PATCH/PUT/DELETE を自動記録。`beforeData` + diff 付き。DB RULE で INSERT ONLY 制約 |
| PII マスキング | `HttpExceptionFilter` — `password`, `token`, `secret` フィールドをマスク |
| エラー応答 | `HttpExceptionFilter` — 4xx は warn、5xx は error でログ出力 |
| ThrottlerGuard | `@nestjs/throttler` — 3段階レート制限 (short/medium/long)。認証エンドポイントは厳格制限。ヘルスチェックは除外 |
| Body size limit | `json({ limit: '1mb' })` + `urlencoded({ limit: '1mb' })` — DDoS 緩和 |
| MailService | Nodemailer ベース。開発環境は MailHog (`localhost:1025`)。パスワードリセットメール送信に使用 |
| `node:` protocol | Node.js 組み込みモジュールは `node:fs`, `node:path`, `node:crypto` 等の `node:` プレフィックス付き import に統一 |

### Web 側

| 項目 | 内容 |
|---|---|
| UI | **PrimeNG 21 (Aura)** — 全画面移行完了 |
| PostCSS | `postcss.config.json` で `@tailwindcss/postcss` 設定 |
| アイコン | PrimeIcons (`pi pi-xxx`) のみ使用 |
| Signal | 全サービスは Signal ベースのステート管理 |
| Breadcrumb | ルートの `data.title` から自動生成 |
| 404 ページ | `NotFoundComponent` — protected shell 内と public 両方にワイルドカードルート |
| ロギング | `LoggerService` — 構造化ログ、レベル制御 (開発: DEBUG〜、本番: WARN〜) |
| エラーハンドラ | `GlobalErrorHandler` — Angular ErrorHandler を置換、NG0200 等を確実に捕捉 |
| **DI 注意** | `AuthService` コンストラクタで `Promise.resolve().then()` により HTTP 呼び出しを遅延。循環依存 (NG0200) 回避のため |
| Toast | `shared/services/toast.service.ts` — PrimeNG `MessageService` に委譲 |
| Modal | `shared/services/modal.service.ts` — PrimeNG `ConfirmationService` に委譲 |

### ビルド・インフラ

| 項目 | 内容 |
|---|---|
| .swcrc | `jsc.target` は `es2022` (es2024 は非対応) |
| Vite | Angular 21 は Vite ベースビルド |
| プロキシ | `apps/web/proxy.conf.json` で `/api` → `localhost:3000` |
| バンドル | 上限 1.5MB (現在 1.02 MB) |
| Playwright | 失敗時スクリーンショット + trace 保存 |

---

## 7. ✅ 解決済み: 認証セッション永続化バグ

### 症状 (解決済み)
ログイン後にフルページリロード (F5) すると毎回ログインページにリダイレクトされていた。

### 根本原因
**NG0200: Circular dependency** — `AuthService` コンストラクタが同期的に `loadFromStorage()` → `fetchProfile()` → `HttpClient.get()` → `authInterceptor` → `inject(AuthService)` を呼び出し、DI の循環依存が発生。

### 修正
- `Promise.resolve().then(() => this.loadFromStorage())` で 1 マイクロタスク遅延し循環依存を回避
- `GlobalErrorHandler` を追加し、NG0200 等のフレームワークエラーを確実に捕捉
- `LoggerService` を導入し、`catchError` でエラーを返す箇所にすべて `logger.error()` を追加

---

## 8. 完了済みフェーズ

### Phase 1: 全画面実装
- NestJS 全 11 モジュール
- Angular 全画面実装
- E2E テスト (Playwright)
- セキュリティ改善 (認証永続化, 所有者チェック, 監査ログ)
- ロギング基盤 (API: nestjs-pino, Web: LoggerService + GlobalErrorHandler)

### Phase 2: PrimeNG 移行 (P1-P6)
- 全画面を PrimeNG コンポーネントに移行
- DaisyUI / @ng-icons 完全撤去
- バンドルサイズ: 1.26 MB → 1.02 MB

### Phase 3: コード品質向上 (C1-C5)
- C1: `shared/ui` 完全削除 → `shared/services/` に移動
- C2: NestJS ValidationPipe + DTO/Swagger 導入
- C3: バンドル上限 2MB → 1.5MB 引き戻し
- C5: ロギング・可観測性強化 (構造化ログ, PII マスキング, 監査 diff)

### Phase 4: 機能追加 (D-3, D-4, D-6)
- D-3: 通知ページ (`/notifications`) — ポーリング + 通知ベル連携
- D-4: パスワードリセット (メール基盤 + Web 画面 `forgot-password` / `reset-password`)
- D-6: WF 添付ファイル (multer + PrimeNG FileUpload)

### Phase 5: インフラ強化 + 技術的負債 (I-6, D-8, D-9)
- I-6: 監査ログ INSERT ONLY 制約 (PostgreSQL RULE)
- D-8: 検索 GIN インデックス (`pg_trgm` 拡張)
- D-9: レート制限 (`@nestjs/throttler` — 3段階)
- ConfirmDialogComponent 廃止 → `ConfirmationService` 直接利用に統一

---

## 9. 完了済み: Phase 6

| ID | 機能 | 状態 |
|---|---|---|
| TI-P6-05 | CI/CD パイプライン | ✅ GitHub Actions + Branch Protection |
| NA-03 | OpenAPI クライアント自動生成 | ✅ `libs/api-client/` |
| TI-INFRA-01 | BullMQ ジョブキュー | ✅ Redis resilience 含む |
| D-5 | テナントデータエクスポート (GDPR) | ✅ tenant-settings に実装済み |
| SEC-01~06 | Lint 修正 + セキュリティ強化 | ✅ 0 errors, 50 warnings, CI lint ステップ追加 |

---

## 10. マルチエージェント運用ルール

### チケット分割の原則
- **ファイル競合ゼロ**: 各チケットは独立したファイルセットを対象にする
- **共通部分は先行チケット**: shared コンポーネントや設定は事前に完了
- **自己完結プロンプト**: `.agent/prompts/` に対象ファイル・要件・ルールを全て記載

### エージェントへの共通指示
```
1. 対象ファイルのみ変更すること
2. 既存ロジック (Signal, Service, Router) は変更禁止
3. PrimeNG コンポーネントを直接使用。shared/services のサービスのみ利用可
4. PrimeIcons (pi pi-xxx) を使用
5. 日本語 UI を維持
6. data-testid 属性を主要要素に付与
7. 完了後 pnpm nx build web && pnpm nx test web で確認
```

---

## 11. コミット履歴

| Hash | 内容 |
|---|---|
| — | Phase 5: I-6 監査ログ INSERT ONLY + D-8 GIN インデックス + D-9 レート制限 + ConfirmDialog 廃止 |
| — | Phase 4: D-3 通知ページ + D-4 パスワードリセット + D-6 WF 添付ファイル |
| `2de3ee0` | C2 + C5: DTO/Swagger + ロギング強化 |
| `af7918a` | C3: バンドル上限 1.5MB |
| `5af4f3b` | C1: shared/ui 削除 → shared/services 移動 |
| `8e806ba` | .gitignore クリーンアップ |
| `b33539f` | テスト修正 — 全 139 + E2E 37 GREEN |
| `9c1bb82` | PrimeNG 移行完了 — DaisyUI / ng-icons 完全撤去 |
| `217ffc8` | PM引き継ぎドキュメント改訂 |
| `0d06416` | PrimeNG 基盤セットアップ + チケット作成 |
| `0ac00a4` | E2E修正・フォームUX改善・ダッシュボード強化 |
| `bf2bc7e` | 一旦完成 (全画面実装) |
| `973fc9b` | E2E完了・Tailwind導入 |
| `dee23af` | チケット1-11完了 |
| `b35a9f6` | Initial commit |

---

## 12. 技術的負債・ゴッチャ（次の PM が踏まないために）

### ✅ 解決済み: `ConfirmDialogComponent`

Phase 5 で `ConfirmDialogComponent` を廃止し、`ConfirmationService` 直接利用に統一。`workflow-detail.component.ts` と `workflow-pending.component.ts` から import を削除済み。

### ⚠️ 環境変数 (.env)

`.env` ファイルにハードコードされた開発用シークレット:
```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/opshub?schema=public"
JWT_SECRET="opshub-jwt-secret-dev-only"
JWT_REFRESH_SECRET="opshub-jwt-refresh-secret-dev-only"
```
本番デプロイ時は必ず差し替えること。`.env` は `.gitignore` に**含まれていない**ため、本番シークレットをコミットしないよう注意。

### ⚠️ Prisma スキーマの場所

```
libs/prisma-db/prisma/schema.prisma  ← ここ (ルートの prisma/ ではない)
```

### ⚠️ PROJECT_STATUS_LABELS フォールバック

`project-list.component.ts` で `PROJECT_STATUS_LABELS` に `??` フォールバックを追加している（`5af4f3b`）。これは Vitest のモジュール解決順序で `@shared/types` の barrel export が `undefined` になる場合がある問題への防御コード。本番では不要だがテスト安定性のために残している。

### ⚠️ PrimeNG テストでの `MessageService` 必須

PrimeNG コンポーネントを使うテストでは、`ToastService` → `MessageService` の依存チェーンがあるため、TestBed の providers に **`MessageService`** を追加する必要がある。忘れると `NullInjectorError` が出る。

### ⚠️ E2E テストの webServer タイムアウト

`playwright.config.ts` の `webServer` 設定で API + Web 両サーバーの起動を待つ。初回起動やマシン負荷が高い場合に30秒でタイムアウトすることがある。その場合はリトライすれば通る。
