# T1: ログイン画面 — NG-ZORRO 移行

## 対象ファイル
- `apps/web/src/app/core/auth/login/login.component.ts`

## 作業内容
Angular Material → NG-ZORRO に UI を移行する。ロジック（AuthService 呼び出し、Signal、Router）は変更しない。

## 使用する NG-ZORRO コンポーネント
- `NzFormModule` — フォームレイアウト
- `NzInputModule` — メール・パスワード入力
- `NzButtonModule` — ログインボタン
- `NzCheckboxModule` — 「ログイン状態を保持」（あれば）
- `NzAlertModule` — エラーメッセージ表示
- `NzIconModule` — アイコン
- `NzCardModule` — ログインカード

## デザイン要件
- 画面中央に白いカードを配置（`nz-card`）
- 背景: グラデーション or `bg-[#001529]`（Ant Design のダークブルー）
- カード上部: OpsHub ロゴ + 「システムにログインしてください」
- メール入力: `nz-input` with prefix icon (mail)
- パスワード入力: `nz-input` type="password" with prefix icon (lock)
- ログインボタン: `nz-button` nzType="primary" nzBlock
- エラー: `nz-alert` nzType="error"
- フッター: `© 2026 OpsHub Inc.`

## 共通ルール
1. `mat-*` import を全て `nz-*` に置換
2. Tailwind はレイアウト補助のみ（`flex`, `p-*`, `m-*`）
3. スタイリングは NG-ZORRO Props で制御
4. 日本語 UI 維持
5. 既存ロジック変更禁止
