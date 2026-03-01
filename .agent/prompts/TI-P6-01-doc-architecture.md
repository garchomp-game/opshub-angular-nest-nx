# TI-P6-01: nx-angular-nestjs-doc — アーキテクチャ/基盤ドキュメント改訂

## 共通ルール
// turbo-all
- `pnpm`, `npx`, `nx` 等のコマンドは自由に実行してよい
- ドキュメントは全て日本語で記述する
- Starlight フォーマット (YAML frontmatter + Markdown) を維持する

## 概要
`nx-angular-nestjs-doc` のアーキテクチャ・基盤ドキュメントを**現在の実装に合わせて更新**する。
ドキュメントは初期設計段階のもので、Phase 1-5 の実装を通じて技術スタックが進化している。

## 更新が必要な乖離一覧

| 項目 | ドキュメント記載 | 現在の実装 |
|---|---|---|
| Angular | 19.x | **21.x** |
| NestJS | 10.x | **11.x** |
| UI ライブラリ | Angular Material / 記載なし | **PrimeNG 21 (Aura テーマ)** |
| アイコン | Material Icons / 記載なし | **PrimeIcons** |
| DB (開発) | SQLite 対応記述あり | **PostgreSQL 16 のみ** (Docker) |
| ロガー | Winston 等 | **nestjs-pino (pino-pretty)** |
| パッケージマネージャ | npm | **pnpm** |
| テストFW (Web) | Jest | **Vitest** |
| API ドキュメント | なし | **@nestjs/swagger (Swagger UI)** |
| バリデーション | 記載なし | **ValidationPipe + class-validator DTO** |
| レート制限 | なし | **@nestjs/throttler** |

## 対象ファイル

### architecture/
1. **`architecture/tech-stack.md`** — バージョン表・選定理由を現行に修正
2. **`architecture/overview.md`** — UI ライブラリ参照、ロガー参照の更新
3. **`architecture/nx-workspace.md`** — pnpm への変更、ファイル構成の最新化

### detail/ (モジュール設計以外)
4. **`detail/index.md`** — セクション概要の更新
5. **`detail/angular-core.md`** — PrimeNG ベースの UI 設計に書き換え。Signal, Standalone Components
6. **`detail/common-infrastructure.md`** — NestJS 11 の Guard/Interceptor/Filter 構成、nestjs-pino、Swagger、ThrottlerGuard 追記
7. **`detail/prisma-setup.md`** — PostgreSQL 前提に統一、SQLite 分岐記述の削除
8. **`detail/db.md`** — User モデルの `resetToken` / `resetTokenExpiresAt` 追加、GIN インデックス追記、RULE 追記
9. **`detail/shared-types.md`** — `ALLOWED_MIME_TYPES` / `MAX_FILE_SIZE_BYTES` の追記
10. **`detail/guard-design.md`** — ThrottlerGuard の追記

### testing/
11. **`testing/strategy.md`** — テスト件数の更新 (API: 249, Web: 185)、Vitest への統一記述
12. **`testing/unit-testing.md`** — Vitest パターン
13. **`testing/e2e-testing.md`** — Playwright 設定の現行化

### adr/
14. **`adr/decisions.md`** — PrimeNG 選定 ADR の追加、ThrottlerGuard ADR の追加

### guides/
15. **`guides/agent-first.md`** — PrimeNG コンポーネント参照、turbo-all ルール追記

## 参照（現在の実装の確認用）
- `opshub/package.json` — バージョン確認
- `opshub/apps/api/src/app/app.module.ts` — ThrottlerModule, MailModule 等の imports
- `opshub/apps/api/src/main.ts` — ValidationPipe, Swagger 設定
- `opshub/apps/web/src/app/app.config.ts` — PrimeNG providePrimeNG 設定
- `opshub/.agent/pm-handoff.md` — 現状の技術ナレッジ

## 作業方針
- **既存の要件定義・REQ カタログ・ロール定義は正確なのでそのまま**
- バージョン番号・技術名を検索して機械的に置換できるものは一括置換
- 構成図・Mermaid ダイアグラムも必要に応じて更新
- 新規追加分（PrimeNG ADR、ThrottlerGuard 等）は既存フォーマットに合わせて追記

## 完了条件
- [ ] 全ドキュメントのバージョン記載が現行と一致
- [ ] UI ライブラリ参照が PrimeNG 21 に統一
- [ ] SQLite 分岐記述が削除され PostgreSQL 前提に統一
- [ ] ロガー参照が nestjs-pino に更新
- [ ] パッケージマネージャが pnpm に統一
- [ ] テストFW が Vitest (Web) / Jest (API) に正確に記載
- [ ] Phase 4-5 で追加した DB 変更 (resetToken, GIN, RULE) が db.md に反映
- [ ] ADR に PrimeNG 選定、ThrottlerGuard 追加
