# TI-DOC-01: API エンドポイント・DTO・レスポンス形式の整合性監査

## 共通ルール
// turbo-all
- `pnpm`, `npx`, `nx` 等のコマンドは自由に実行してよい
- `sudo` が必要な操作やシステム設定変更のみユーザーに確認

## 概要
実装済みの API エンドポイント・DTO・レスポンス形式がフロントエンドと整合しているかを包括的に確認する。
また、Swagger/OpenAPI セットアップの有無を確認し、未設定であれば構築する。

> **重要**: リポジトリ内に正式な API ドキュメント（`docs/` や `apis.md`）が存在しない。
> Swagger/OpenAPI からの自動生成が必要な状態。

## 作業内容

### 1. Swagger/OpenAPI セットアップ確認・構築

- [ ] `apps/api/src/main.ts` に `SwaggerModule.setup()` が呼ばれているか確認
- [ ] `@nestjs/swagger` パッケージの存在確認: `pnpm list @nestjs/swagger`
- [ ] 未設定の場合:
  ```typescript
  // apps/api/src/main.ts に追加
  import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

  const config = new DocumentBuilder()
      .setTitle('OpsHub API')
      .setDescription('OpsHub バックエンド API')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);
  ```
- [ ] `http://localhost:3000/api/docs` で OpenAPI UI が表示されることを確認
- [ ] OpenAPI JSON を `openapi.json` として出力する設定を検討

### 2. エンドポイント照合

`apps/api/src` 配下の全コントローラをスキャンし、フロントのルーティング (`app.routes.ts`) と照合する。

| カテゴリ | フロントルート | 確認すべき API エンドポイント | チェック |
|---------|-------------|--------------------------|---------|
| 認証 | `/login`, `/forgot-password`, `/reset-password` | `POST /api/auth/login`, `/logout`, `/refresh`, `/forgot-password`, `/reset-password`, `GET /api/auth/me` | [ ] |
| ダッシュボード | `/dashboard` | ダッシュボード集計 API | [ ] |
| 申請 | `/workflows` | CRUD + ステータス変更 + 承認/却下 + 添付ファイル | [ ] |
| プロジェクト | `/projects` | CRUD + タスク CRUD (カンバン) | [ ] |
| 工数 | `/timesheets` | CRUD | [ ] |
| 経費 | `/expenses` | CRUD + 承認フロー | [ ] |
| 請求書 | `/invoices` | CRUD | [ ] |
| 検索 | `/search` | 全文検索 | [ ] |
| 通知 | `/notifications` | 一覧、既読化、全既読 | [ ] |
| 管理 | `/admin` | テナント管理 + ユーザー管理 + データエクスポート | [ ] |

### 3. エラーレスポンス形式の統一確認

アプリの `ResponseInterceptor` を確認し、以下の形式が統一されているかを検証:

- [ ] 正常系: `{ success: true, data: ... }` 形式
- [ ] バリデーションエラー (400): レスポンス形式を確認
- [ ] 認証エラー (401): レスポンス形式を確認
- [ ] 権限エラー (403): レスポンス形式を確認
- [ ] リソース未存在 (404): レスポンス形式を確認
- [ ] フロントの `catchError` ハンドリング（`err.error?.message` 等）がエラー形式と一致するか

実際にテストで確認:
```bash
# 正常系
curl -s http://localhost:3000/api/auth/login -X POST \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@demo.com","password":"Password123"}' | jq .

# バリデーションエラー
curl -s http://localhost:3000/api/auth/login -X POST \
  -H 'Content-Type: application/json' \
  -d '{"email":"","password":""}' | jq .

# 認証エラー
curl -s http://localhost:3000/api/auth/me | jq .

# 権限エラー (一般ユーザーで admin API にアクセス)
# → トークン取得後に実行
```

### 4. ロールベースアクセス制御の照合

- [ ] `app.routes.ts` の `roleGuard` 設定:
  - `/invoices`: `['accounting', 'pm', 'tenant_admin']`
  - `/admin`: `['tenant_admin', 'it_admin']`
- [ ] API 側の `@Roles()` デコレータが上記と一致するか
- [ ] サイドバー `menuItems` のロール制御が API 側と一致するか

### 5. DTO バリデーションの確認

- [ ] 各 `CreateXxxDto` / `UpdateXxxDto` に `class-validator` デコレータが適切に付与されているか
- [ ] `ValidationPipe` の設定 (`whitelist`, `forbidNonWhitelisted`, `transform`) を確認
- [ ] フロントのフォームバリデーションルールが API の DTO バリデーションと一致しているか

## 対象ファイル

| パス | 確認内容 |
|------|---------|
| `apps/api/src/main.ts` | Swagger セットアップ |
| `apps/api/src/app/app.module.ts` | ValidationPipe 設定 |
| `apps/api/src/modules/*/` | 各コントローラ・DTO |
| `apps/web/src/app/app.routes.ts` | フロントルーティング |
| `apps/web/src/app/shared/components/app-shell.component.ts` | サイドバー menuItems |

## 完了条件
- [ ] Swagger UI が `http://localhost:3000/api/docs` で利用可能
- [ ] 全エンドポイントの照合が完了し、不整合がリストアップされている
- [ ] エラーレスポンス形式が統一されていることが確認されている（or 修正されている）
- [ ] ロール制御の不整合がないことが確認されている
