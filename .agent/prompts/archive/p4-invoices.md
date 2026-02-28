# P4: 請求書 — PrimeNG 移行

## プロジェクト情報
- Nx monorepo, Angular 21, PrimeNG 21 (Aura テーマ)
- パス: `apps/web/src/app/features/invoices/`
- **参照**: `.agent/llms-txt/primeNG-llms-full.txt` にコンポーネント API ドキュメントあり

## 対象ファイル (4 files)
1. `apps/web/src/app/features/invoices/invoice-list.component.ts`
2. `apps/web/src/app/features/invoices/invoice-form.component.ts`
3. `apps/web/src/app/features/invoices/invoice-detail.component.ts`
4. `apps/web/src/app/features/invoices/invoice-print-view.component.ts`

## 除外
- `invoice.service.ts`, `invoices.routes.ts` — 変更禁止

## 変換ガイド

### invoice-list.component.ts
- `table` → `<p-table>` + `<p-paginator>`
- `badge` → `<p-tag>` (ステータス)
- `btn` → `<p-button>`
- `app-list-page`, `app-data-table` を削除

### invoice-form.component.ts
- `select` → `<p-select>` (プロジェクト選択)
- `input` → `pInputText` / `<p-datepicker>` / `<p-inputnumber>`
- `textarea` → `pTextarea`
- 明細テーブル → `<p-table>` + インライン `<p-inputnumber>`
- `btn` → `<p-button>`
- `app-form-page`, `app-form-field` を削除

### invoice-detail.component.ts
- `card` → `<p-card>`
- `table` → `<p-table>` (明細)
- `badge` → `<p-tag>`
- `btn` → `<p-button>`

### invoice-print-view.component.ts
- 印刷用なので PrimeNG コンポーネントは最小限
- `table` → HTML `<table>` にインラインスタイル (印刷対応)
- `@ng-icons` を削除

## 共通ルール
1. **shared/ui コンポーネントを import しない** — PrimeNG を直接使用
2. `@ng-icons` を全て削除 → PrimeIcons (`pi pi-xxx`) で代替
3. `data-testid` 属性を維持
4. 日本語 UI を維持
5. 既存ロジック (Signal, Service, Router) は変更禁止
6. 完了後: `pnpm nx build web` で確認
