# P5: 管理・検索 — PrimeNG 移行

## プロジェクト情報
- Nx monorepo, Angular 21, PrimeNG 21 (Aura テーマ)
- パス: `apps/web/src/app/features/admin/`, `apps/web/src/app/features/search/`
- **参照**: `.agent/llms-txt/primeNG-llms-full.txt` にコンポーネント API ドキュメントあり

## 対象ファイル (5 files)
1. `apps/web/src/app/features/admin/users/user-list.component.ts`
2. `apps/web/src/app/features/admin/users/invite-modal.component.ts`
3. `apps/web/src/app/features/admin/tenant/tenant-settings.component.ts`
4. `apps/web/src/app/features/admin/audit-logs/audit-log-viewer.component.ts`
5. `apps/web/src/app/features/search/search-results/search-results.component.ts`

## 除外
- 各 service ファイル、routes — 変更禁止

## 変換ガイド

### user-list.component.ts
- `table` → `<p-table>`
- `badge` → `<p-tag>` (ロール表示)
- `btn` → `<p-button>`
- `app-list-page`, `app-data-table` を削除

### invite-modal.component.ts
- DaisyUI `modal` → `<p-dialog>` (DialogModule)
- `input` → `pInputText`
- `select` → `<p-select>` (ロール選択)
- `btn` → `<p-button>`

### tenant-settings.component.ts
- `card` → `<p-card>`
- `input` → `pInputText`
- `btn` → `<p-button>`

### audit-log-viewer.component.ts
- `table` → `<p-table>` + `<p-paginator>`
- `badge` → `<p-tag>`
- フィルタ → `<p-select>`
- `NgIcon` を削除

### search-results.component.ts
- `tabs` → `<p-tabs>` / `<p-tabpanel>`
- `card` → `<p-card>` (検索結果カード)
- `badge` → `<p-tag>`

## 共通ルール
1. **shared/ui コンポーネントを import しない** — PrimeNG を直接使用
2. `@ng-icons` を全て削除 → PrimeIcons (`pi pi-xxx`) で代替
3. `data-testid` 属性を維持
4. 日本語 UI を維持
5. 既存ロジック (Signal, Service, Router) は変更禁止
6. 完了後: `pnpm nx build web` で確認
