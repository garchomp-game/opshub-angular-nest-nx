# OpsHub

![CI](https://github.com/garchomp-game/opshub-angular-nest-nx/actions/workflows/ci.yml/badge.svg)

マルチテナント対応の業務管理アプリケーション。ワークフロー申請・承認、プロジェクト管理（カンバン）、工数管理、経費管理、請求書管理、通知など、業務に必要な機能を統合的に提供します。

## 技術スタック

| カテゴリ | 技術 |
|---------|------|
| モノレポ管理 | [Nx](https://nx.dev) 22.x |
| フロントエンド | Angular 21 + PrimeNG 21 (Aura テーマ) |
| バックエンド | NestJS 11 + Passport JWT |
| ORM | Prisma 6 (PostgreSQL 16) |
| キュー | BullMQ + Redis |
| テスト | Vitest (Unit/Integration) + Playwright (E2E) |
| CI/CD | GitHub Actions |
| 言語 | TypeScript 5.9 |

## セットアップ

### 前提条件

- Node.js 22.x LTS
- bun 10.x
- Docker (PostgreSQL + Redis + MailHog)

### 手順

```bash
# 依存関係のインストール
bun install

# Docker サービス起動
docker compose up -d

# DB マイグレーション + シードデータ
npx prisma migrate deploy --schema=libs/prisma-db/prisma/schema.prisma
npx prisma db seed --schema=libs/prisma-db/prisma/schema.prisma

# 開発サーバー起動
bun nx serve api   # http://localhost:3000
bun nx serve web   # http://localhost:4200
```

### テストアカウント

| ユーザー | メール | パスワード | ロール |
|---------|--------|-----------|--------|
| 管理者 | admin@demo.com | Password123 | tenant_admin |
| PM | pm@demo.com | Password123 | pm |
| 承認者 | approver@demo.com | Password123 | approver |
| 経理 | accounting@demo.com | Password123 | accounting |
| メンバー | member@demo.com | Password123 | member |
| IT管理者 | itadmin@demo.com | Password123 | it_admin |

## 開発コマンド

```bash
# ビルド
bun nx build api
bun nx build web

# Lint
bun nx lint web    # ESLint + eslint-plugin-security
bun nx lint api

# ユニットテスト
bun nx test api    # 32 suites / 270 tests
bun nx test web    # 28 suites / 200 tests

# E2E テスト (Playwright)
bun playwright test                       # 全テスト (37 tests)
bun playwright test --project=ui-smoke    # UI スモーク (16 tests)
bun playwright test --project=api-smoke   # API スモーク (21 tests)

# OpenAPI クライアント生成
bun generate:api-client

# Swagger UI (開発モード)
open http://localhost:3000/api/docs
```

## プロジェクト構成

```
opshub/
├── apps/
│   ├── api/          # NestJS バックエンド
│   └── web/          # Angular フロントエンド
├── libs/
│   ├── prisma-db/    # Prisma スキーマ + マイグレーション
│   ├── shared/       # 共有型・ユーティリティ
│   └── api-client/   # OpenAPI 自動生成 SDK
├── e2e/              # Playwright E2E テスト
│   ├── fixtures.ts   # authenticatedPage カスタム fixture
│   ├── auth.setup.ts # 認証セットアップ
│   └── ui.smoke.spec.ts
├── docker-compose.yml
└── playwright.config.ts
```

## 主要機能

- **認証・認可**: JWT + ロールベースアクセス制御 (6ロール)
- **ワークフロー**: 申請・承認・差戻し + 添付ファイル
- **プロジェクト管理**: CRUD + カンバンボード (ドラッグ&ドロップ)
- **工数管理**: 週次グリッド入力 + レポート集計 + CSV エクスポート
- **経費管理**: 申請・承認フロー + カテゴリ別集計
- **請求書管理**: 発行・ステータス管理 + 印刷
- **通知**: リアルタイム通知 + 既読管理
- **検索**: 横断全文検索
- **管理**: テナント設定・ユーザー管理・監査ログ
- **ヘルスチェック**: DB + Redis 状態監視 (`GET /api/health`)

## ドキュメント

詳細なドキュメント（要件定義・基本設計・詳細設計・ADR・テスト戦略）は Starlight で管理しています:

```bash
cd ../nx-angular-nestjs-doc
bun install
bun dev   # http://localhost:4321
```
