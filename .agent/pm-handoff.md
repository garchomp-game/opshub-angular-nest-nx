# OpsHub PM 引き継ぎガイド

## 1. プロジェクト概要

**OpsHub** は Nx monorepo で構成された業務管理 SaaS アプリケーション。

| 項目 | 値 |
|---|---|
| モノレポ | Nx |
| バックエンド | NestJS 11 (apps/api) |
| フロントエンド | Angular 21 (apps/web) |
| DB | PostgreSQL + Prisma |
| CSS | Tailwind v4 + PostCSS |
| UI ライブラリ | DaisyUI v5 + Angular CDK |
| アイコン | ng-icons (Heroicons) |
| テスト | Vitest (API/Web), Playwright (E2E) |
| パッケージマネージャ | pnpm |

---

## 2. ドキュメント配置規則

### プロンプト・チケット

```
.agent/
├── prompts/          ← エージェント向け作業指示書
│   ├── t1-login.md ... t8-admin-search.md  ← 画面実装チケット
│   ├── v5-*.md                              ← DaisyUI v5 クラス修正チケット
│   ├── a1~a5-*-audit.md                     ← 監査レポート
│   └── d1-footer.md, d2-breadcrumb.md       ← UI 改善チケット
├── audit/            ← 詳細監査レポート
├── llms-txt/         ← LLM 向けリファレンス (DaisyUI, Tailwind)
├── pm-handoff.md     ← このファイル
├── pm-prompt.md      ← PM 引き継ぎプロンプト
└── ticket-template.md
```

### リファレンス（仕様書・設計書）

```
reference/            ← 仕様書（旧アーキテクチャ前提、要注意）
opshub-doc/           ← 旧ドキュメント (Starlight)
```

> ⚠️ `reference/` と `opshub-doc/` は**旧アーキテクチャ (Next.js/Supabase)** 前提のため、
> 現在の実装 (NestJS/Angular/Prisma) と大きく乖離している。
> 詳細は `.agent/audit/a1~a5-*.md` の監査レポートを参照。

---

## 3. 開発・テスト・ビルドコマンド

```bash
# 起動
pnpm nx serve api          # API サーバー (http://localhost:3000)
pnpm nx serve web          # Web サーバー (http://localhost:4200)

# テスト
pnpm nx test api           # API ユニットテスト (229 テスト)
pnpm nx test web           # Web ユニットテスト (139 テスト)
npx playwright test        # E2E テスト (39 テスト)

# ビルド
pnpm nx build api
pnpm nx build web

# 一括チェック
pnpm check                 # typecheck + test 全実行
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
│   │       ├── common/             ← デコレータ、ガード、インターセプター
│   │       └── modules/            ← 11 モジュール
│   │           ├── auth/           ← 認証 (JWT + Passport)
│   │           ├── workflows/      ← 申請管理
│   │           ├── projects/       ← プロジェクト + タスク管理
│   │           ├── timesheets/     ← 工数管理
│   │           ├── expenses/       ← 経費管理
│   │           ├── invoices/       ← 請求書管理
│   │           ├── documents/      ← ファイル管理
│   │           ├── notifications/  ← 通知
│   │           ├── search/         ← 全文検索
│   │           ├── dashboard/      ← ダッシュボード KPI
│   │           ├── admin/          ← 管理 (ユーザー/テナント/監査ログ)
│   │           └── health/         ← ヘルスチェック
│   │
│   └── web/                        ← Angular 21 フロントエンド
│       └── src/app/
│           ├── core/               ← AuthService, Interceptors, Guards
│           │   ├── auth/           ← AuthService, AuthGuard, RoleGuard
│           │   ├── interceptors/   ← auth, error (HttpClient)
│           │   └── services/       ← LoggerService, GlobalErrorHandler
│           ├── shared/             ← AppShell, Breadcrumb, NotFound, 通知ベル, 検索バー
│           │   └── components/
│           ├── features/           ← 各機能モジュール (8 機能)
│           └── testing/            ← テスト用ヘルパー
│
├── libs/
│   ├── prisma-db/                  ← Prisma クライアント + テナントミドルウェア
│   └── shared/
│       ├── types/                  ← 共通型・Enum・定数
│       └── util/                   ← 共通ユーティリティ
│
├── e2e/                            ← Playwright E2E テスト
├── prisma/
│   ├── schema.prisma               ← DB スキーマ
│   └── seed.ts                     ← シードデータ
│
└── postcss.config.json             ← @tailwindcss/postcss (Angular 21 用)
```

---

## 5. 既知の技術的注意点（ナレッジ）

### API 側

| 項目 | 内容 |
|---|---|
| テナント分離 | Prisma `$extends` ミドルウェアで自動 `WHERE tenantId = ?` 挿入 |
| CurrentUser | `@CurrentUser()` デコレータが `tenantIds[0]` → `tenantId` に変換 |
| グローバルプレフィックス | `api` が自動付与。コントローラーに `api/` を含めないこと |
| ヘルスチェック | `GET /api/health` — `@Public()` デコレータで認証不要 |
| 認可 | RLS 不使用。`@Roles()` デコレータ + `RolesGuard` でアプリ層制御 (ADR-0007) |
| ロギング | nestjs-pino で構造化 JSON ログ (本番は JSON、開発は pino-pretty) |
| 監査ログ | `AuditInterceptor` — POST/PATCH/PUT/DELETE 操作を自動記録。`beforeData` 付き |
| エラー応答 | `HttpExceptionFilter` — 4xx は warn、5xx は error でログ出力 |

### Web 側

| 項目 | 内容 |
|---|---|
| UI | DaisyUI v5 クラス + Tailwind v4。CDK は overlay のみ使用中 |
| PostCSS | `postcss.config.json` で `@tailwindcss/postcss` 設定 (Angular 21 は .js 未対応) |
| アイコン | ng-icons + Heroicons (heroXxx 形式) |
| Signal | 全サービスは Signal ベースのステート管理 |
| Breadcrumb | ルートの `data.title` から自動生成。`app.routes.ts` に定義 |
| 404 ページ | `NotFoundComponent` — protected shell 内と public 両方にワイルドカードルート |
| ロギング | `LoggerService` — ログレベル制御 (開発: DEBUG〜、本番: WARN〜) |
| エラーハンドラ | `GlobalErrorHandler` — Angular ErrorHandler を置換、NG0200 等を確実に捕捉 |
| **DI 注意** | `AuthService` コンストラクタで `Promise.resolve().then()` により HTTP 呼び出しを遅延。`AuthService → HttpClient → authInterceptor → AuthService` の循環依存 (NG0200) 回避のため |

### ビルド・インフラ

| 項目 | 内容 |
|---|---|
| .swcrc | `jsc.target` は `es2022` (es2024 は非対応) |
| Vite | Angular 21 は Vite ベースビルド |
| プロキシ | `apps/web/proxy.conf.json` で `/api` → `localhost:3000` |

---

## 6. ✅ 解決済み: 認証セッション永続化バグ

### 症状 (解決済み)
ログイン後にフルページリロード (F5) すると毎回ログインページにリダイレクトされていた。

### 根本原因
**NG0200: Circular dependency** — `AuthService` コンストラクタが同期的に `loadFromStorage()` → `fetchProfile()` → `HttpClient.get()` → `authInterceptor` → `inject(AuthService)` を呼び出し、DI の循環依存が発生。`catchError(() => of(null))` がエラーを握り潰し、プロフィール取得失敗 → 未認証 → ログインリダイレクトとなっていた。

### 修正
- `Promise.resolve().then(() => this.loadFromStorage())` で 1 マイクロタスク遅延し循環依存を回避
- `GlobalErrorHandler` を追加し、NG0200 等のフレームワークエラーを確実に捕捉するようにした
- `LoggerService` を導入し、`catchError` でエラーを返す箇所にはすべて `logger.error()` を追加

### 教訓
> `providedIn: 'root'` サービスのコンストラクタで HTTP リクエストを発行してはいけない。HttpClient のインターセプターチェーンが同じサービスを inject する場合、初回構築時に循環依存が発生する。

---

## 7. 現在の状態

### ✅ 完了済み

#### 実装
- NestJS 全 11 モジュール
- Angular 全画面実装 + Vitest 139 テスト通過
- NG-ZORRO → DaisyUI v5 + CDK 移行完了
- **Footer** / **Breadcrumb** / **404 ページ**

#### セキュリティ改善
- 認証セッション永続化バグ修正 (NG0200 循環依存)
- `workflows.update()` に `createdBy` 所有者チェック追加
- `AuditInterceptor` に `beforeData` (変更前データ) 記録追加
- `AuditInterceptor` で `@Public()` エンドポイント (login/register) をスキップ

#### ロギング基盤
- **API**: nestjs-pino 構造化ログ導入 (開発: pino-pretty, 本番: JSON)
- **Web**: `LoggerService` (レベル制御) + `GlobalErrorHandler` (NG0200 捕捉)
- `HttpExceptionFilter`: 4xx → warn / 5xx → error + リクエストコンテキスト
- `AuthService` / `authInterceptor` / `errorInterceptor` に構造化ログ追加

#### ロール権限修正 (Tier 2)
- I-1: 監査ログに `it_admin` 追加
- I-2: 請求書 PM を閲覧のみに制限
- I-3: タスク作成に `tenant_admin` 追加
- I-4: WF 申請作成から `approver` 除外

#### テスト
- API ユニットテスト: 229 テスト
- Web ユニットテスト: 139 テスト
- E2E テスト: 39 テスト (Playwright)
  - セキュリティ: トークンリフレッシュ, RBAC, createdBy 認可, バリデーション
  - セッション: F5 リロード (複数ページ), ログアウト→再ログイン
  - CRUD: ワークフロー状態遷移 (draft→submit→approve/reject), 経費作成

#### ADR / 監査レポート
- ADR-0007: RLS → アプリ層認可の正式決定
- `.agent/audit/a1~a5` : API, 画面, アーキテクチャ, DB, モジュール詳細

### 🔜 次フェーズ (先送り)
- D-3: 通知ページ ("/notifications") or Popover
- D-4: パスワードリセット
- D-5: テナントデータエクスポート (GDPR)
- D-6: WF 添付ファイル
- D-8: 検索 GIN インデックス
- D-9: レート制限
- I-6: 監査ログ INSERT ONLY 制約
- Tier 1: ドキュメント全面改訂 (旧アーキテクチャ→現行)

---

## 8. マルチエージェント運用ルール

### チケット分割の原則
- **ファイル競合ゼロ**: 各チケットは独立したファイルセットを対象にする
- **共通部分は先行チケット (T0)**: shared コンポーネントや設定は事前に完了
- **自己完結プロンプト**: `.agent/prompts/` に対象ファイル・要件・ルールを全て記載

### LLM リファレンス
- `.agent/llms-txt/daisyui-llms.txt` — DaisyUI v5 コンポーネントリファレンス
- `.agent/llms-txt/tailwindcss-llms.txt` — Tailwind v4 リファレンス

### エージェントへの共通指示テンプレート
```
1. 対象ファイルのみ変更すること
2. 既存ロジック (Signal, Service, Router) は変更禁止
3. DaisyUI v5 クラスを使用。llms-txt を参照すること
4. 日本語 UI を維持
5. data-testid 属性を主要要素に付与
6. 完了後 pnpm nx test web で確認
```
