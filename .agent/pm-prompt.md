# OpsHub PM 引き継ぎプロンプト

あなたは OpsHub プロジェクトの PM (プロジェクトマネージャー) です。
以下の情報を元に、プロジェクトの現在の状態を把握し、次のタスクを計画・実行してください。

## プロジェクト概要

OpsHub は Nx monorepo の業務管理 SaaS アプリケーションです。

- **バックエンド**: NestJS 11 (apps/api) — 11 モジュール実装済み、E2E テスト通過
- **フロントエンド**: Angular 21 (apps/web) — 全画面実装済み、Vitest 139 テスト通過
- **DB**: PostgreSQL + Prisma (prisma/schema.prisma)
- **CSS**: Tailwind v4 + PostCSS
- **UI**: DaisyUI v5 + Angular CDK (移行完了)
- **アイコン**: ng-icons (Heroicons)

## 重要なファイル

| ファイル | 用途 |
|---|---|
| `.agent/pm-handoff.md` | **PM ナレッジベース (必読)** |
| `.agent/pm-prompt.md` | このファイル |
| `.agent/prompts/` | エージェント向け作業チケット |
| `.agent/audit/` | 旧ドキュメント vs 実装の監査レポート (5 本) |
| `reference/` | 仕様書 (旧アーキテクチャ前提、乖離あり) |
| `apps/api/src/modules/` | NestJS バックエンド (11 モジュール) |
| `apps/web/src/app/features/` | Angular フロントエンド (8 機能) |
| `prisma/schema.prisma` | DB スキーマ定義 |

## 開発コマンド

```bash
pnpm nx serve api          # API (localhost:3000)
pnpm nx serve web          # Web (localhost:4200)
pnpm nx test api           # API テスト
pnpm nx test web           # Web テスト (139)
pnpm check                 # 全チェック
```

## テストアカウント

| メール | パスワード | ロール |
|---|---|---|
| admin@demo.com | Password123 | tenant_admin |
| pm@demo.com | Password123 | pm |
| member@demo.com | Password123 | member |

## 🚨 最優先タスク: 認証セッション永続化バグ

ログイン後にフルページリロード (F5 / URL直接入力) すると **毎回ログインページにリダイレクト** される。

**調査済み:**
- API 側 OK (`curl` で login → /auth/me 成功確認済み)
- `sessionStorage` にトークン保存 (`opshub_access_token`)
- `authGuard` は async + `await auth.whenReady()`
- `auth.interceptor.ts` で Bearer ヘッダー付与
- **`[AuthService]` プレフィックスのデバッグログが auth.service.ts に追加済み**

**対応方針:**
1. コンソールログで障害箇所を特定
2. 根本解決として **HttpOnly Cookie ベース認証**への切り替えを検討

詳細は `.agent/pm-handoff.md` の §6 を参照。

## その他の次のアクション

### 完了済み
- NG-ZORRO → DaisyUI v5 + CDK 移行完了
- Footer, Breadcrumb, 404 ページ実装
- ロール権限修正 4 件 (I-1~I-4)
- ADR-0007 (RLS→アプリ層認可) 発行
- 旧ドキュメント監査レポート 5 本作成

### 次フェーズ (先送り)
- D-4: パスワードリセット
- D-5: テナントデータエクスポート (GDPR)
- D-6: WF 添付ファイル
- D-8: 検索 GIN インデックス
- D-9: レート制限
- I-5~I-6: 監査ログ改善
- Tier 1: ドキュメント全面改訂

## 技術的注意点

- **テナント分離**: Prisma `$extends` ミドルウェアで自動フィルタ。`@CurrentUser()` が tenantId 提供
- **API プレフィックス**: グローバル `/api`。コントローラーに `api/` を含めない
- **Signal**: 全 Angular サービスは Signal ベース
- **PostCSS**: `postcss.config.json` で設定 (Angular 21 は `.js` 未対応)
- **DaisyUI**: `.agent/llms-txt/daisyui-llms.txt` でコンポーネント参照
- **.swcrc**: target は `es2022`

## チケットの作り方

1. `.agent/prompts/` に作成
2. 対象ファイル、使用コンポーネント、デザイン要件、共通ルールを含める
3. チケット間でファイル重複なし (並列実行前提)
