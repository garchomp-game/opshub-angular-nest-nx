# P2: プロジェクト — PrimeNG 移行

## プロジェクト情報
- Nx monorepo, Angular 21, PrimeNG 21 (Aura テーマ)
- パス: `apps/web/src/app/features/projects/`
- **参照**: `.agent/llms-txt/primeNG-llms-full.txt` にコンポーネント API ドキュメントあり

## 対象ファイル (5 files)
1. `apps/web/src/app/features/projects/project-list.component.ts`
2. `apps/web/src/app/features/projects/project-detail.component.ts`
3. `apps/web/src/app/features/projects/project-form.component.ts`
4. `apps/web/src/app/features/projects/kanban-board.component.ts`
5. `apps/web/src/app/features/projects/documents/document-list.component.ts`

## 除外
- `project.service.ts`, `projects.routes.ts`, `task.service.ts` — 変更禁止

## 変換ガイド

### project-list.component.ts
- `table` → `<p-table>` + `<p-paginator>`
- `badge` → `<p-tag>` (ステータス)
- `progress` → `<p-progressbar>` (ProgressBarModule)
- `app-list-page`, `app-data-table` を削除
- `NgIcon` を削除

### project-detail.component.ts
- `tabs` / `tab` → `<p-tabs>` / `<p-tabpanel>` (TabsModule)
- `card` → `<p-card>`
- `avatar` → `<p-avatar>`
- `badge` → `<p-tag>`
- `stat` → `<p-card>` ベースのカスタムレイアウト
- `btn` → `<p-button>`
- `NgIcon` を削除

### project-form.component.ts
- `select` → `<p-select>` (PM 選択)
- `input` → `pInputText` / `<p-datepicker>` (DatePickerModule)
- `textarea` → `pTextarea`
- `btn` → `<p-button>`
- `app-form-page`, `app-form-field` を削除
- `NgIcon` を削除

### kanban-board.component.ts
- `card` → `<p-card>` (タスクカード)
- `avatar` → `<p-avatar>`
- `tooltip` → `pTooltip` (TooltipModule)
- **Angular CDK DragDrop はそのまま維持**
- `NgIcon` を削除

### document-list.component.ts
- `table` → `<p-table>`
- `badge` → `<p-tag>`
- `btn` → `<p-button>`
- `NgIcon` を削除

## 共通ルール
1. **shared/ui コンポーネントを import しない** — PrimeNG を直接使用
2. `@ng-icons` を全て削除 → PrimeIcons (`pi pi-xxx`) で代替
3. `data-testid` 属性を維持
4. 日本語 UI を維持
5. 既存ロジック (Signal, Service, Router) は変更禁止
6. 完了後: `pnpm nx build web` で確認
