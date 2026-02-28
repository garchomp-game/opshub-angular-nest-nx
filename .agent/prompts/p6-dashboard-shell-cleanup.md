# P6: ダッシュボード・シェル・共通 — PrimeNG 移行 + DaisyUI 撤去

## プロジェクト情報
- Nx monorepo, Angular 21, PrimeNG 21 (Aura テーマ)
- パス: `apps/web/src/app/features/dashboard/`, `apps/web/src/app/shared/`
- **参照**: `.agent/llms-txt/primeNG-llms-full.txt` にコンポーネント API ドキュメントあり

> **重要**: このチケットは P1-P5 が全て完了した後に実行すること。
> shared/ui の削除と DaisyUI 撤去を含むため、他チケットが先に完了する必要がある。

## 対象ファイル

### ダッシュボード (2 files)
1. `apps/web/src/app/features/dashboard/dashboard.component.ts`
2. `apps/web/src/app/features/dashboard/kpi-card.component.ts`

### シェル・共通 (5 files)
3. `apps/web/src/app/shared/components/app-shell.component.ts`
4. `apps/web/src/app/shared/components/breadcrumb.component.ts`
5. `apps/web/src/app/shared/components/header-search-bar/header-search-bar.component.ts`
6. `apps/web/src/app/shared/notification-bell/notification-bell.component.ts`
7. `apps/web/src/app/shared/components/not-found.component.ts`

### 後片付け
8. `apps/web/src/app/shared/ui/` — **フォルダごと削除** (ただし toast/toast.service.ts と modal/modal.service.ts は shared/services/ に移動)
9. `apps/web/src/app/shared/components/confirm-dialog.component.ts` — 削除
10. `apps/web/src/app/features/placeholder.component.ts` — PrimeNG 化
11. `apps/web/src/styles.css` — DaisyUI `@plugin` ブロックを削除
12. `package.json` — `daisyui`, `@ng-icons/core`, `@ng-icons/heroicons` を削除

## 変換ガイド

### dashboard.component.ts
- `card` → `<p-card>`
- KPI カード → `<p-card>` + PrimeIcons
- `progress` → `<p-progressbar>`
- `NgIcon` を削除

### kpi-card.component.ts
- DaisyUI `stat` → `<p-card>` ベースのレイアウト
- `NgIcon` を削除 → PrimeIcons

### app-shell.component.ts
- `drawer` → `<p-drawer>` (DrawerModule)
- `navbar` → 通常の `<header>` + PrimeNG コンポーネント
- `menu` → `<p-menu>` (MenuModule) / `<p-panelmenu>` (PanelMenuModule)
- `avatar` → `<p-avatar>`
- `NgIcon` を全て削除 → PrimeIcons

### breadcrumb.component.ts
- 自作パンくず → `<p-breadcrumb>` (BreadcrumbModule)

### header-search-bar.component.ts
- `input` → `<p-iconfield>` + `pInputText`

### notification-bell.component.ts
- `badge` → `<p-badge>` (BadgeModule) / `pBadge` directive
- dropdown → `<p-popover>` (PopoverModule)

## shared/ui フォルダ整理
```
削除:
  shared/ui/data-table/
  shared/ui/form-field/
  shared/ui/page-layouts/
  shared/ui/select/
  shared/ui/modal/confirm-dialog.component.ts
  shared/ui/modal/modal-ref.ts
  shared/ui/toast/toast-container.component.ts
  shared/ui/index.ts

移動:
  shared/ui/toast/toast.service.ts → shared/services/toast.service.ts
  shared/ui/modal/modal.service.ts → shared/services/modal.service.ts
```

> 移動後、全ファイルの import パスを更新すること。

## 共通ルール
1. PrimeNG コンポーネントを直接使用
2. `@ng-icons` を全て削除 → PrimeIcons
3. `data-testid` 属性を維持
4. 日本語 UI を維持
5. DaisyUI 関連のCSS変数 (`--base-*` 等) を PrimeNG デザイントークン (`--p-*`) に置換
6. 完了後: `pnpm nx build web` で確認
