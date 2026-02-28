# P1: ワークフロー — PrimeNG 移行

## プロジェクト情報
- Nx monorepo, Angular 21, PrimeNG 21 (Aura テーマ)
- パス: `apps/web/src/app/features/workflows/`
- **参照**: `.agent/llms-txt/primeNG-llms-full.txt` にコンポーネント API ドキュメントあり

## 対象ファイル (4 files)
1. `apps/web/src/app/features/workflows/workflow-list.component.ts`
2. `apps/web/src/app/features/workflows/workflow-detail.component.ts`
3. `apps/web/src/app/features/workflows/workflow-pending.component.ts`
4. `apps/web/src/app/features/workflows/workflow-form.component.ts` — **済み(参考用)**

## 除外
- `workflow.service.ts`, `workflows.routes.ts` — 変更禁止

## 変換ガイド

### workflow-list.component.ts
- DaisyUI `table` → `<p-table>` (TableModule)
- DaisyUI `select` → `<p-select>` (SelectModule) — フィルタ用
- DaisyUI `badge` → `<p-tag>` (TagModule) — ステータスバッジ
- DaisyUI `join` (ページネーション) → `<p-paginator>` (PaginatorModule)
- `btn` → `<p-button>` (ButtonModule)
- `app-list-page` ラッパーを削除 → レイアウトを直接記述
- `app-data-table` ラッパーを削除 → `<p-table>` を直接使用
- `NgIcon` / `@ng-icons` を削除 → PrimeIcons (`pi pi-xxx`) で代替

### workflow-detail.component.ts
- `card` → `<p-card>` (CardModule)
- `badge` → `<p-tag>` (TagModule)
- `btn` → `<p-button>`
- 承認履歴は `<p-timeline>` (TimelineModule) で表示検討
- `loading loading-spinner` → `<p-progressspinner>` (ProgressSpinnerModule)
- `NgIcon` を削除

### workflow-pending.component.ts
- `table` → `<p-table>`
- `btn` → `<p-button>`
- `avatar` → `<p-avatar>` (AvatarModule)
- `ModalService` / `ToastService` はそのまま使用 (内部で PrimeNG に委譲済み)

## 共通ルール
1. **shared/ui コンポーネントを import しない** — PrimeNG を直接使用
2. `@ng-icons` を全て削除 → PrimeIcons (`pi pi-xxx`) で代替
3. `data-testid` 属性を維持
4. 日本語 UI を維持
5. 既存ロジック (Signal, Service, Router) は変更禁止
6. 完了後: `pnpm nx build web` で確認
