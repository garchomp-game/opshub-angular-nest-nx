# TI-P4-01: D-3 通知ページ仕上げ + テスト

## 共通ルール
// turbo-all
- `pnpm`, `npx`, `nx` 等のコマンドは自由に実行してよい
- `sudo` が必要な操作やシステム設定変更のみユーザーに確認

## 概要
通知一覧ページ (`/notifications`) の UI 仕上げとテスト作成。
基盤（API エンドポイント、コンポーネント、ルーティング、サイドメニュー）は PM が構築済み。

## 前提条件
- API `DELETE /api/notifications/:id` は実装済み
- `NotificationListComponent` は `apps/web/src/app/features/notifications/notification-list.component.ts` に存在
- `notifications.routes.ts` は存在し、`app.routes.ts` から `/notifications` でルート接続済み
- サイドメニュー (`app-shell.component.ts`) に通知リンク追加済み
- ビルド確認済み (api + web)

## 作業内容

### 1. UI 改善
- `notification-list.component.ts` の UI を確認し、以下を調整:
  - ページネーションの動作確認
  - 空状態の表示メッセージ
  - フィルター（全件/未読のみ）のトグル動作
  - リソースリンクへのナビゲーション
  - レスポンシブ対応

### 2. テスト作成
- `notification-list.component.spec.ts` を作成:
  - コンポーネントの初期描画テスト
  - 既読/未読フィルターの切り替えテスト
  - 一括既読ボタンの動作テスト
  - 削除確認ダイアログのテスト
- `apps/api/src/modules/notifications/notification.controller.spec.ts` に DELETE テスト追加

### 3. ビルド・テスト確認
```bash
pnpm nx build web
pnpm nx build api
pnpm nx test web
pnpm nx test api
```

## 参照ファイル
- `apps/web/src/app/features/notifications/notification-list.component.ts`
- `apps/web/src/app/features/notifications/notifications.routes.ts`
- `apps/web/src/app/shared/notification-bell/notification.service.ts`
- `apps/api/src/modules/notifications/notification.controller.ts`
- `apps/api/src/modules/notifications/notifications.service.ts`

## 完了条件
- [ ] UI の全機能が正常に動作する
- [ ] フロント・バック両方のテストが作成されパスする
- [ ] `pnpm nx build web` + `pnpm nx build api` 成功
