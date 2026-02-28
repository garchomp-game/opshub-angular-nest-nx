# PM プロンプト — PrimeNG 移行フェーズ

## 現在の状態
- **ベースライン**: コミット `0ac00a4` (DaisyUI 版完成)
- **現在**: コミット `0d06416` (PrimeNG 基盤 + チケット作成)

### 基盤作業済み
- PrimeNG 21.1.1 + Aura テーマ + PrimeIcons インストール・設定済み
- `app.config.ts` に `providePrimeNG` 設定済み
- `MessageService` / `ConfirmationService` グローバル登録済み
- `ToastService` → PrimeNG MessageService 委譲済み
- `ModalService` → PrimeNG ConfirmationService 委譲済み
- app-shell に `<p-toast>` / `<p-confirmdialog>` 配置済み
- ログインフォーム・ワークフローフォーム → PrimeNG 移行済み
- バンドルサイズ上限を 2MB に引き上げ済み

## チケット一覧

| チケット | ファイル数 | 並列可能 | 状態 | 説明 |
|---|---|---|---|---|
| P1 | 3 | ✅ | 🔄 作業中 | ワークフロー (list, detail, pending) |
| P2 | 5 | ✅ | 🔄 作業中 | プロジェクト (list, detail, form, kanban, docs) |
| P3 | 5 | ✅ | 🔄 作業中 | 経費・工数 (expense ×3, timesheet ×2) |
| P4 | 4 | ✅ | 🔄 作業中 | 請求書 (list, form, detail, print) |
| P5 | 5 | ✅ | 🔄 作業中 | 管理・検索 (users, invite, tenant, audit, search) |
| P6 | 7+α | ❌ (P1-P5 後) | 📋 未着手 | ダッシュボード, シェル, shared/ui 削除, DaisyUI 撤去 |

## 重要ドキュメント
- `.agent/pm-handoff.md` — 包括的なプロジェクトナレッジ
- `.agent/prompts/p0-common-rules.md` — DaisyUI→PrimeNG 変換ルール集
- `.agent/ticket-template.md` — PrimeNG 版チケットテンプレート
- `.agent/llms-txt/primeNG-llms-full.txt` — PrimeNG 全 API ドキュメント

## 次のアクション
1. P1-P5 の完了を確認 → ビルドマージ
2. P6 を実行 (ダッシュボード・シェル・DaisyUI 撤去)
3. 最終検証: `pnpm nx build web` + E2E テスト
4. `daisyui`, `@ng-icons/core`, `@ng-icons/heroicons` を package.json から削除
5. shared/ui フォルダ整理 (サービスを shared/services/ に移動)

## 将来の検討事項 (大規模プロジェクト向け)
- DTO/型安全性の強化 (Phase 1: shared interfaces, Phase 2: OpenAPI)
- 通知ページ / パスワードリセット / GDPR エクスポート
- 検索 GIN インデックス / レート制限
- ドキュメント全面改訂 (旧アーキテクチャ→現行)
