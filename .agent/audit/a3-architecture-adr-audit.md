# A3: アーキテクチャ + ADR 突き合わせ監査レポート

> **実施日**: 2026-02-27
> **対象ドキュメント**: `opsHub-doc/src/content/docs/architecture/` (3件), `adr/` (6件), `spec/architecture/` (1件)
> **対象実装**: `opshub/` 全体

---

## エグゼクティブサマリー

ドキュメントと実装の間に**根本的なスタック変更**が発生している。ドキュメントは **Next.js + Ant Design + Supabase** アーキテクチャを記述しているが、現在の実装は **Angular 21 + NestJS 11 + Prisma + DaisyUI v5 + Tailwind v4** で構築されている。この変更はすべてのアーキテクチャ文書と6件すべてのADRに影響する。

> [!CAUTION]
> 実装コードベースに `supabase` への参照は**ゼロ**。フレームワーク・DB アクセス・認証のすべてが全面的に置き換わっている。

---

## 1. 技術スタック比較

### 1.1 `architecture/tech-stack.md` vs 実装

| カテゴリ | ドキュメント記載 | 実装（`package.json` / コード） | 状態 |
|---|---|---|---|
| フレームワーク | Next.js (App Router) 16.x | **Angular ~21.1.0** + **NestJS ^11.0.0** | ❌ 完全不一致 |
| 言語 | TypeScript 5.x | TypeScript ~5.9.2 | ✅ 一致 |
| UI ライブラリ | Ant Design 5.x | **DaisyUI ^5.5.19** + **Tailwind ^4.2.1** | ❌ 完全不一致 |
| SSR 統合 | `@ant-design/nextjs-registry` | なし（Angular CSR） | ❌ 不要 |
| BaaS | Supabase (Docker self-hosting) | **なし** — 自前 NestJS API | ❌ 完全不一致 |
| 認証連携 | `@supabase/ssr` | **@nestjs/passport** + **@nestjs/jwt** + bcrypt | ❌ 完全不一致 |
| データベース | PostgreSQL 15.x (Supabase管理) | PostgreSQL **16**-alpine (Docker Compose 直接) | ⚠️ バージョン差異 |
| ORM/データアクセス | Supabase Client SDK (PostgREST) | **Prisma ^6.19.2** (`@prisma/client`) | ❌ 完全不一致 |
| アイコン | (記載なし) | `@ng-icons/heroicons ^33.1.0` | ➕ ドキュメント未記載 |
| ビルドシステム | (記載なし) | **Nx 22.5.2** モノレポ | ➕ ドキュメント未記載 |
| パッケージマネージャ | (記載なし) | **pnpm 10.30.1** | ➕ ドキュメント未記載 |

### 1.2 `spec/architecture/index.md` vs 実装

| 項目 | ドキュメント記載 | 実装 | 状態 |
|---|---|---|---|
| システム構成図 | Next.js → Kong → PostgREST/GoTrue → PostgreSQL | Angular → NestJS API → Prisma → PostgreSQL | ❌ 全面不一致 |
| プレゼンテーション層 | React Server Components + Ant Design | Angular Components + DaisyUI | ❌ |
| アプリケーション層 | Server Actions / Route Handlers | NestJS Controllers / Services | ❌ |
| 認証/認可 | Supabase Auth + Middleware | NestJS Passport + JWT Guards | ❌ |
| データアクセス | Supabase Client SDK (PostgREST) | Prisma ORM | ❌ |
| データ保護 | PostgreSQL RLS | **アプリ層**（NestJS Guards + Interceptors） | ❌ 方式変更 |
| データフロー（読み取り） | Server Component → Supabase SDK → PostgREST → RLS | Angular → HTTP → NestJS → Prisma | ❌ |
| データフロー（書き込み） | Server Action → Supabase SDK → PostgREST → RLS → 監査ログ | Angular → HTTP → NestJS → Prisma → AuditInterceptor | ❌ |

---

## 2. ディレクトリ構成比較

### `architecture/directory-structure.md` vs 実装

| ドキュメント記載の構成 | 実装の構成 | 状態 |
|---|---|---|
| `starlight-test/app/` — Next.js アプリ | `opshub/apps/web/` — Angular アプリ | ❌ パス・構成完全不一致 |
| `app/src/app/` — App Router ページ | `apps/web/src/app/` — Angular ルーティング | ❌ ファイルベースルーティングではなく `app.routes.ts` によるルート定義 |
| `app/src/lib/supabase/` — Supabase クライアント | 存在しない | ❌ |
| `app/supabase/` — Supabase Docker 環境 | 存在しない（`docker-compose.yml` は PostgreSQL のみ） | ❌ |
| `docs/` — Astro Starlight ドキュメント | `starlight-test/opsHub-doc/` — 別リポジトリ相当 | ⚠️ 分離済 |
| (記載なし) | `opshub/apps/api/` — NestJS バックエンド | ➕ ドキュメント未記載 |
| (記載なし) | `opshub/libs/prisma-db/` — Prisma スキーマ・ライブラリ | ➕ ドキュメント未記載 |
| (記載なし) | `opshub/libs/shared/` — 共有型定義・ユーティリティ | ➕ ドキュメント未記載 |

### 実際のディレクトリ構成

```
opshub/
├── apps/
│   ├── web/                    # Angular 21 フロントエンド
│   │   └── src/app/
│   │       ├── core/           # auth, interceptors, services
│   │       ├── features/       # dashboard, workflows, projects, etc.
│   │       ├── shared/         # 共有コンポーネント
│   │       └── testing/        # テストユーティリティ
│   └── api/                    # NestJS 11 バックエンド
│       └── src/
│           ├── common/         # filters, interceptors, guards
│           └── modules/        # auth, admin, projects, workflows, etc.
├── libs/
│   ├── prisma-db/              # Prisma スキーマ・サービス
│   └── shared/                 # 共有型定義 (types, util)
├── docker-compose.yml          # PostgreSQL 16 のみ
├── nx.json                     # Nx モノレポ設定
└── package.json                # pnpm ワークスペース
```

---

## 3. ADR 有効性評価

### ADR-0001: RBAC/RLS 方式の選定

| 決定事項 | 実装状態 | 評価 |
|---|---|---|
| `user_roles` テーブルで RBAC | ✅ Prisma スキーマに `UserRole` モデルあり（`user_id`, `tenant_id`, `role`） | 概念一致 |
| PostgreSQL RLS で DB 層アクセス制御 | ❌ **RLS 不使用**。アプリ層で `TenantInterceptor` + `RoleGuard` で制御 | **方式乖離** |
| `auth.uid()` ベースの RLS ポリシー | ❌ Supabase `auth` スキーマ不使用 | 不要 |
| 画面レベルは Middleware + Server Component | ❌ Angular `authGuard` + `roleGuard` で制御 | フレームワーク変更 |

> [!WARNING]
> ADR-0001 は「RLS による DB 層での強制的アクセス制御（防御の深さ）」を採用理由として挙げているが、現在の実装では**アプリ層のみ**で認可を行っている。これは ADR が却下した「案C: アプリ層のみで制御（RLS不使用）」と同等の方式。

### ADR-0002: 監査ログ方式

| 決定事項 | 実装状態 | 評価 |
|---|---|---|
| イベントログ中心 | ✅ `AuditInterceptor` で NestJS レイヤーでの監査ログ記録 | 概念一致 |
| 重要テーブルに DB トリガー併用 | ❌ DB トリガーの実装なし（Prisma マイグレーションに trigger 定義なし） | **未実装** |
| `audit_logs` テーブル | ✅ Prisma スキーマに `AuditLog` モデルあり | 一致 |
| INSERT ONLY (UPDATE/DELETE 禁止) | ⚠️ Prisma レベルでは制約なし、アプリ層でのみ制御 | DB 層の保護なし |
| Supabase SDK でイベントログ記録 | ❌ NestJS `AuditInterceptor` で Prisma 経由 | フレームワーク変更 |

### ADR-0003: マルチテナント分離戦略

| 決定事項 | 実装状態 | 評価 |
|---|---|---|
| 全テーブルに `tenant_id NOT NULL` | ✅ Prisma スキーマで全業務テーブルに `tenantId` あり | ✅ 一致 |
| RLS で `tenant_id` フィルタ | ❌ **RLS 不使用**。`TenantInterceptor` でアプリ層フィルタ | **方式乖離** |
| Index は `(tenant_id, ...)` 先頭 | ✅ Prisma スキーマの `@@index` で `tenantId` 先頭のインデックス定義 | ✅ 一致 |
| 単一 DB・単一スキーマ | ✅ PostgreSQL 単一 DB | ✅ 一致 |

> [!WARNING]
> ADR-0003 は「RLS ポリシー漏れ＝テナント間データ漏洩の直接リスク」を負の影響として挙げていたが、RLS を使用しないことで、**アプリコードの実装漏れがテナント間漏洩の直接リスク**となっている。

### ADR-0004: profiles テーブル導入

| 決定事項 | 実装状態 | 評価 |
|---|---|---|
| `public.profiles` テーブル | ✅ Prisma スキーマに `Profile` モデルあり（`id`, `displayName`, `avatarUrl`） | ✅ 一致 |
| `auth.users` と 1:1 | ✅ `User` と 1:1 関係（`onDelete: Cascade`） | ✅ 一致 |
| auth トリガーによる自動同期 | ❌ DB トリガー不使用。`AuthService.register()` 内で手動作成 | **方式乖離** |
| `select("*, profiles(display_name)")` で JOIN | ❌ Prisma `include: { profile: ... }` で取得 | フレームワーク変更（意図は同じ） |

### ADR-0005: Supabase CLI vs Docker Compose

| 決定事項 | 実装状態 | 評価 |
|---|---|---|
| Supabase CLI (`npx supabase start`) 採用 | ❌ Supabase 自体を**不使用**。`docker-compose.yml` で PostgreSQL 16 単体を起動 | **前提消滅** |
| `supabase/config.toml` で設定管理 | ❌ 存在しない | 不要 |
| CLI でマイグレーション管理 | ❌ Prisma マイグレーション (`prisma:generate`) で管理 | フレームワーク変更 |

> [!IMPORTANT]
> ADR-0005 は Supabase の利用を前提とした決定であり、Supabase → Prisma + NestJS 移行により**ADR 全体が陳腐化**している。

### ADR-0006: 検索方式の選定

| 決定事項 | 実装状態 | 評価 |
|---|---|---|
| `pg_trgm` + GIN インデックス | ❌ `pg_trgm` 使用なし。Prisma の `contains` + `mode: 'insensitive'` (`ILIKE`) で検索 | **方式乖離** |
| GIN インデックス作成 | ❌ Prisma マイグレーションに GIN インデックス定義なし | **未実装** |
| RLS がそのまま適用される | ❌ RLS 不使用。`SearchService` 内で `tenantId` フィルタをアプリで付与 | フレームワーク変更 |
| 検索対象テーブル・カラム | ⚠️ `workflows` (title, description), `projects` (name, description), `tasks` (title), `expenses` (description) — 一致 | ✅ 検索対象は一致 |

---

## 4. `architecture/supabase.md` の有効性

| 項目 | ドキュメント記載 | 実装 | 状態 |
|---|---|---|---|
| Kong API Gateway (:8000) | なし | ❌ 不要 |
| GoTrue 認証 | NestJS Passport + JWT | ❌ |
| PostgREST | Prisma ORM | ❌ |
| Realtime (WebSocket) | 未実装 | ❌ |
| Storage (S3 互換) | ローカルファイルストレージ（`documents` テーブル + `filePath`） | ❌ |
| Studio (:3100) | なし | ❌ |
| PostgreSQL 15.8 | PostgreSQL **16**-alpine | ⚠️ |
| Inbucket (テスト用メール) | なし | ❌ |
| 環境変数 (`ANON_KEY`, `SERVICE_ROLE_KEY` 等) | `JWT_SECRET`, `JWT_REFRESH_SECRET`, `DATABASE_URL` | ❌ |
| 操作コマンド (`cd app/supabase && docker compose up -d`) | `docker compose up -d`（ルートの `docker-compose.yml`） | ❌ |

> この文書は**全面的に陳腐化**している。

---

## 5. 総合まとめ

### 陳腐化レベル分類

| レベル | 文書 | 説明 |
|---|---|---|
| 🔴 全面陳腐化 | `architecture/tech-stack.md` | Next.js + Ant Design + Supabase → Angular + DaisyUI + NestJS + Prisma |
| 🔴 全面陳腐化 | `architecture/directory-structure.md` | ディレクトリ構成が完全に異なる（Nx モノレポ化） |
| 🔴 全面陳腐化 | `architecture/supabase.md` | Supabase 自体を不使用 |
| 🔴 全面陳腐化 | `spec/architecture/index.md` | システム構成図・レイヤー構成・データフローすべて不一致 |
| 🔴 全面陳腐化 | ADR-0005 (Supabase CLI) | 前提（Supabase 使用）が消滅 |
| 🟡 概念一致・方式乖離 | ADR-0001 (RBAC/RLS) | RBAC の概念は維持、RLS → アプリ層認可に変更 |
| 🟡 概念一致・方式乖離 | ADR-0003 (マルチテナント) | `tenant_id` による分離は維持、RLS → アプリ層フィルタに変更 |
| 🟡 概念一致・方式乖離 | ADR-0006 (検索方式) | `ILIKE` 検索は使用、GIN インデックス未作成 |
| 🟢 概念一致 | ADR-0002 (監査ログ) | アプリ層イベントログは実装済み（DB トリガーは未実装） |
| 🟢 概念一致 | ADR-0004 (profiles テーブル) | profiles テーブル存在、自動同期はアプリ層で代替 |

### ドキュメント更新で新規 ADR が必要な変更

1. **ADR-NEW: Next.js → Angular + NestJS 移行** — フレームワーク全面変更の意思決定記録
2. **ADR-NEW: Supabase → Prisma + 自前 API 移行** — BaaS 脱却の意思決定記録
3. **ADR-NEW: RLS → アプリ層認可** — ADR-0001 の Superseded/Amended 宣言
4. **ADR-NEW: Ant Design → DaisyUI + Tailwind 移行** — UI ライブラリ変更の記録

### セキュリティに関する注意事項

| 懸念事項 | 説明 |
|---|---|
| RLS 廃止による防御の深さの喪失 | ADR-0001 が重視した「DB 層でのセキュリティ保証」が失われている |
| テナント分離がアプリ層依存 | `TenantInterceptor` の実装漏れがデータ漏洩リスクに直結 |
| 監査ログの DB 保護なし | `audit_logs` の UPDATE/DELETE が Prisma レベルでは防止されていない |
| DB トリガー未実装 | ADR-0002 で決定した重要テーブルのトリガーが存在しない |
