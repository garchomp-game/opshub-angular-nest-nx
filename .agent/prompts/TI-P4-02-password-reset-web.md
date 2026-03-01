# TI-P4-02: D-4 パスワードリセット — Web 画面 + テスト

## 共通ルール
// turbo-all
- `pnpm`, `npx`, `nx` 等のコマンドは自由に実行してよい
- `sudo` が必要な操作やシステム設定変更のみユーザーに確認

## 概要
パスワードリセット機能の Web 画面（forgot-password / reset-password）の実装とテスト作成。
API 基盤（エンドポイント、Service ロジック、MailService 連携、Prisma スキーマ）は PM が構築済み。
**DB マイグレーションも実施済み。**

## 前提条件（全て完了済み）
- Prisma User モデルに `resetToken` / `resetTokenExpiresAt` フィールド追加済み
- Prisma マイグレーション実施済み (`add_reset_token`)
- `POST /api/auth/forgot-password` エンドポイント実装済み
- `POST /api/auth/reset-password` エンドポイント実装済み
- `AuthService.forgotPassword()` / `AuthService.resetPassword()` 実装済み
- `MailService.sendPasswordResetEmail()` 実装済み
- `ForgotPasswordDto` / `ResetPasswordDto` (`apps/api/src/modules/auth/dto/password-reset.dto.ts`) 定義済み

## 作業内容

### 1. Angular forgot-password 画面
ファイル: `apps/web/src/app/core/auth/forgot-password/forgot-password.component.ts`
- メールアドレス入力フォーム
- 送信ボタン → `POST /api/auth/forgot-password`
- 成功メッセージ: 「パスワードリセットメールを送信しました」
- PrimeNG InputText + Button + Message コンポーネント使用
- ログイン画面へ戻るリンク

### 2. Angular reset-password 画面
ファイル: `apps/web/src/app/core/auth/reset-password/reset-password.component.ts`
- URL パラメータから `token` を取得（`/reset-password?token=xxx`）
- 新パスワード入力 + 確認入力
- パスワード要件表示（8文字以上、英数字混在）
- 送信 → `POST /api/auth/reset-password`
- 成功後 → ログインページへリダイレクト
- PrimeNG Password + Button + Message コンポーネント使用

### 3. ルーティング
`app.routes.ts` の Public セクション（login の下）に以下を追加:
```typescript
{
  path: 'forgot-password',
  loadComponent: () =>
    import('./core/auth/forgot-password/forgot-password.component')
      .then(m => m.ForgotPasswordComponent),
},
{
  path: 'reset-password',
  loadComponent: () =>
    import('./core/auth/reset-password/reset-password.component')
      .then(m => m.ResetPasswordComponent),
},
```

### 4. ログイン画面にリンク追加
`apps/web/src/app/core/auth/login/login.component.ts` のテンプレートに
「パスワードを忘れた場合」リンクを追加 → `/forgot-password` へ遷移

### 5. テスト作成
- `forgot-password.component.spec.ts` — フォーム送信・成功表示
- `reset-password.component.spec.ts` — トークン取得・パスワード変更・リダイレクト
- `auth.service.spec.ts` に `forgotPassword` / `resetPassword` のユニットテスト追加

### 6. ビルド・テスト確認
```bash
pnpm nx build api
pnpm nx build web
pnpm nx test api
pnpm nx test web
```

## 参照ファイル
- `apps/api/src/modules/auth/auth.controller.ts` (forgot-password/reset-password エンドポイント)
- `apps/api/src/modules/auth/auth.service.ts` (forgotPassword/resetPassword メソッド)
- `apps/api/src/modules/auth/dto/password-reset.dto.ts` (DTO 定義)
- `apps/api/src/modules/mail/mail.service.ts` (メール送信)
- `apps/web/src/app/core/auth/login/login.component.ts` (既存ログイン画面)
- `apps/web/src/app/app.routes.ts` (ルーティング)
- `.env` の `APP_URL` 変数 (リセットURLのベース)

## 完了条件
- [ ] forgot-password 画面が動作する
- [ ] reset-password 画面が動作する（トークン付きURL）
- [ ] ログイン画面に「パスワードを忘れた場合」リンクが表示される
- [ ] パスワードリセット後にログインできる
- [ ] 全テストがパスする
- [ ] `pnpm nx build web` + `pnpm nx build api` 成功
