# P3: 経費・工数 — PrimeNG 移行

## プロジェクト情報
- Nx monorepo, Angular 21, PrimeNG 21 (Aura テーマ)
- パス: `apps/web/src/app/features/expenses/`, `apps/web/src/app/features/timesheets/`
- **参照**: `.agent/llms-txt/primeNG-llms-full.txt` にコンポーネント API ドキュメントあり

## 対象ファイル (5 files)
1. `apps/web/src/app/features/expenses/expense-list.component.ts`
2. `apps/web/src/app/features/expenses/expense-form.component.ts`
3. `apps/web/src/app/features/expenses/expense-summary.component.ts`
4. `apps/web/src/app/features/timesheets/timesheet-weekly.component.ts`
5. `apps/web/src/app/features/timesheets/timesheet-report.component.ts`

## 除外
- `expense.service.ts`, `timesheet.service.ts` — 変更禁止

## 変換ガイド

### expense-list.component.ts
- `table` → `<p-table>` + `<p-paginator>`
- `select` → `<p-select>` (フィルタ)
- `badge` → `<p-tag>`
- `btn` → `<p-button>`
- `app-list-page`, `app-data-table` を削除

### expense-form.component.ts
- `select` → `<p-select>` (カテゴリ, プロジェクト)
- `input` → `pInputText` / `<p-datepicker>` / `<p-inputnumber>`
- `textarea` → `pTextarea`
- `btn` → `<p-button>`
- `app-form-page`, `app-form-field` を削除

### expense-summary.component.ts
- `stat` → `<p-card>` ベース
- `table` → `<p-table>`
- `btn` → `<p-button>`

### timesheet-weekly.component.ts
- `table` (手動) → `<p-table>` (InputNumber 列を含む)
- `input[type=number]` → `<p-inputnumber>`
- `DatePicker` → `<p-datepicker>`
- `btn` → `<p-button>`
- `select` → `<p-select>` (プロジェクト選択)

### timesheet-report.component.ts
- `card` → `<p-card>`
- `stat` → `<p-card>` ベース
- オプション: `<p-chart>` (ChartModule) で集計グラフ表示

## 共通ルール
1. **shared/ui コンポーネントを import しない** — PrimeNG を直接使用
2. `@ng-icons` を全て削除 → PrimeIcons (`pi pi-xxx`) で代替
3. `data-testid` 属性を維持
4. 日本語 UI を維持
5. 既存ロジック (Signal, Service, Router) は変更禁止
6. 完了後: `pnpm nx build web` で確認
