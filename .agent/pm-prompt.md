# PM プロンプト — PrimeNG 移行フェーズ

## 現在の状態
- **ベースライン**: コミット `0ac00a4` (DaisyUI 版完成)
- **基盤作業済み**:
  - PrimeNG 21.1.1 + Aura テーマ + PrimeIcons インストール・設定済み
  - `app.config.ts` に `providePrimeNG` 設定済み
  - `MessageService` / `ConfirmationService` グローバル登録済み
  - `ToastService` → PrimeNG MessageService 委譲済み
  - `ModalService` → PrimeNG ConfirmationService 委譲済み
  - app-shell に `<p-toast>` / `<p-confirmdialog>` 配置済み
  - ログインフォーム・ワークフローフォーム → PrimeNG 移行済み
  - バンドルサイズ上限を 2MB に引き上げ済み

## チケット一覧

| チケット | ファイル数 | 並列可能 | 説明 |
|---|---|---|---|
| P1 | 3 | ✅ | ワークフロー (list, detail, pending) |
| P2 | 5 | ✅ | プロジェクト (list, detail, form, kanban, docs) |
| P3 | 5 | ✅ | 経費・工数 (expense ×3, timesheet ×2) |
| P4 | 4 | ✅ | 請求書 (list, form, detail, print) |
| P5 | 5 | ✅ | 管理・検索 (users, invite, tenant, audit, search) |
| P6 | 7+α | ❌ (P1-P5 後) | ダッシュボード, シェル, shared/ui 削除, DaisyUI 撤去 |

## 次のアクション
1. P1-P5 を並列で作業エージェントに割り振る
2. 全チケット完了後に P6 を実行
3. 最終検証: `pnpm nx build web` + E2E テスト
