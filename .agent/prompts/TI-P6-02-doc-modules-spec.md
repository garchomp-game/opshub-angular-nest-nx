# TI-P6-02: nx-angular-nestjs-doc — モジュール設計 + API 仕様改訂

## 共通ルール
// turbo-all
- `pnpm`, `npx`, `nx` 等のコマンドは自由に実行してよい
- ドキュメントは全て日本語で記述する
- Starlight フォーマット (YAML frontmatter + Markdown) を維持する

## 概要
Phase 4-5 で追加・変更した機能を、仕様書とモジュール設計ドキュメントに反映する。
また、全モジュール設計の UI 参照を PrimeNG に更新する。

## 対象ファイル

### spec/ (API 仕様)
1. **`spec/apis.md`** — 以下のエンドポイントを追加:
   - `POST /api/auth/forgot-password` — パスワードリセットメール送信
   - `POST /api/auth/reset-password` — パスワードリセット実行
   - `DELETE /api/notifications/:id` — 通知削除
   - `POST /api/workflows/:id/attachments` — 添付ファイルアップロード
   - `GET /api/workflows/:id/attachments` — 添付ファイル一覧
   - `DELETE /api/workflows/:id/attachments/:attachmentId` — 添付ファイル削除
   - `GET /api/workflows/:id/attachments/:attachmentId/download` — ダウンロード

2. **`spec/error-handling.md`** — 新エラーコード追加:
   - `ERR-AUTH-010` — リセットトークン無効/期限切れ
   - `ERR-WF-ATT-001` — 許可されていないファイル形式
   - `ERR-WF-ATT-002` — ファイル未指定

3. **`spec/authz.md`** — レート制限の記述追加 (`@nestjs/throttler`)

### detail/modules/ (モジュール設計)
4. **`detail/modules/auth.md`** — パスワードリセット機能の設計追加:
   - `forgotPassword()` / `resetPassword()` メソッド
   - `ForgotPasswordDto` / `ResetPasswordDto`
   - `MailService` 連携
   - `resetToken` / `resetTokenExpiresAt` フィールド

5. **`detail/modules/notification.md`** — 通知ページ (`/notifications`) の追加:
   - `NotificationListComponent` の設計
   - `DELETE` エンドポイント
   - サイドメニュー統合

6. **`detail/modules/workflow.md`** — 添付ファイル機能の追加:
   - `WorkflowAttachment` CRUD エンドポイント
   - multer 設定
   - `FileUpload` (PrimeNG) UI 設計
   - `ALLOWED_MIME_TYPES` バリデーション

7. **`detail/modules.md`** — 全モジュール横断の UI 参照を PrimeNG に更新

8. **残りの modules/*.md** — 各ファイルの Angular UI 参照を PrimeNG に更新:
   - `admin.md`, `dashboard.md`, `document.md`, `expense.md`
   - `invoice.md`, `operations.md`, `project.md`, `search.md`, `timesheet.md`

### requirements/
9. **`requirements/screens.md`** — 以下の画面を追加:
   - `/notifications` — 通知一覧
   - `/forgot-password` — パスワードリセット申請
   - `/reset-password` — 新パスワード設定

## 参照（現在の実装の確認用）
API 側:
- `opshub/apps/api/src/modules/auth/auth.controller.ts`
- `opshub/apps/api/src/modules/auth/auth.service.ts`
- `opshub/apps/api/src/modules/auth/dto/password-reset.dto.ts`
- `opshub/apps/api/src/modules/notifications/notification.controller.ts`
- `opshub/apps/api/src/modules/workflows/workflows.controller.ts`

Web 側:
- `opshub/apps/web/src/app/features/notifications/notification-list.component.ts`
- `opshub/apps/web/src/app/core/auth/forgot-password/forgot-password.component.ts`
- `opshub/apps/web/src/app/core/auth/reset-password/reset-password.component.ts`
- `opshub/apps/web/src/app/features/workflows/workflow-detail.component.ts`

## 完了条件
- [ ] Phase 4-5 の全エンドポイントが `spec/apis.md` に記載
- [ ] 新エラーコードが `spec/error-handling.md` に記載
- [ ] auth/notification/workflow モジュール設計が最新化
- [ ] 全モジュール設計の UI 参照が PrimeNG に更新
- [ ] `requirements/screens.md` に新画面が追加
