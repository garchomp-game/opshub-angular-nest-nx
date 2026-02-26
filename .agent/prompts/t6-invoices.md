# T6: 請求書 — NG-ZORRO 移行

## 対象ファイル
- `apps/web/src/app/features/invoices/invoice-list.component.ts`
- `apps/web/src/app/features/invoices/invoice-detail.component.ts`
- `apps/web/src/app/features/invoices/invoice-form.component.ts`
- `apps/web/src/app/features/invoices/invoice-print-view.component.ts`

## 使用する NG-ZORRO コンポーネント
- `NzTableModule` — 一覧、明細テーブル
- `NzTagModule` — ステータス (draft, sent, paid, overdue)
- `NzDescriptionsModule` — 請求書詳細ヘッダー
- `NzFormModule` + `NzInputModule` + `NzSelectModule` + `NzDatePickerModule` — フォーム
- `NzInputNumberModule` — 金額・数量入力
- `NzButtonModule` — アクション
- `NzDividerModule` — セクション区切り
- `NzCardModule` — セクション

## デザイン要件
### invoice-list: nz-table + nz-tag (ステータスフィルタ)
### invoice-detail: nz-descriptions（ヘッダー）+ nz-table（明細行）
### invoice-form: nz-form + 動的明細行追加/削除
### invoice-print-view: CSS `@media print` で A4 最適化、NG-ZORRO 最小限

## 共通ルール
1. `mat-*` → `nz-*`、2. Tailwind レイアウトのみ、3. ロジック不変、4. 日本語 UI
