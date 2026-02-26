# T5: 工数 + 経費 — NG-ZORRO 移行

## 対象ファイル
- `apps/web/src/app/features/timesheets/timesheet-weekly.component.ts`
- `apps/web/src/app/features/timesheets/timesheet-report.component.ts`
- `apps/web/src/app/features/expenses/expense-list.component.ts`
- `apps/web/src/app/features/expenses/expense-form.component.ts`
- `apps/web/src/app/features/expenses/expense-summary.component.ts`

## 使用する NG-ZORRO コンポーネント
- `NzTableModule` — 週間グリッド、一覧、レポート
- `NzInputNumberModule` — 工数入力
- `NzDatePickerModule` — 週選択
- `NzStatisticModule` — 合計表示、サマリ
- `NzCardModule` — セクション
- `NzTagModule` — ステータス
- `NzFormModule` + `NzInputModule` + `NzSelectModule` — 経費フォーム
- `NzUploadModule` — レシート添付
- `NzButtonModule` — 保存ボタン

## デザイン要件
### timesheet-weekly: 週間グリッド (月〜日 × プロジェクト行) + 合計行
### timesheet-report: nz-table + nz-statistic
### expense-list: nz-table + nz-tag
### expense-form: nz-form + nz-upload
### expense-summary: nz-card + nz-statistic (カテゴリ別)

## 共通ルール
1. `mat-*` → `nz-*`、2. Tailwind レイアウトのみ、3. ロジック不変、4. 日本語 UI
