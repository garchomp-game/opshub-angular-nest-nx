# T3: Dashboard — DaisyUI + CDK 移行

## プロジェクト情報
- Nx monorepo, Angular 21, Tailwind v3 + DaisyUI 4
- アイコン: `@ng-icons/heroicons` (Heroicons)

## 対象ファイル
- `apps/web/src/app/features/dashboard/dashboard.component.ts`
- `apps/web/src/app/features/dashboard/kpi-card.component.ts`

## やること
1. 全ての `ng-zorro-antd` import を削除
2. KPI カード: DaisyUI `stat` コンポーネント
   - `<div class="stat"><div class="stat-figure text-primary"><ng-icon name="heroUsers" class="text-3xl" /></div><div class="stat-title">...</div><div class="stat-value">...</div></div>`
   - グリッド: `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4`
3. 最近のワークフローテーブル: `table table-zebra`
4. ローディング: `loading loading-spinner loading-lg`
5. ステータスバッジ: `badge badge-success`, `badge badge-warning`, `badge badge-info`, `badge badge-ghost`

## アイコンの使い方
```typescript
import { NgIcon, provideIcons } from '@ng-icons/core';
import { heroUsers, heroDocumentText, heroBanknotes, heroChartBar } from '@ng-icons/heroicons/outline';

@Component({
  imports: [NgIcon],
  viewProviders: [provideIcons({ heroUsers, heroDocumentText, heroBanknotes, heroChartBar })],
  template: `<ng-icon name="heroUsers" class="text-3xl" />`
})
```

KPI で使うアイコン:
- ユーザー数: `heroUsers`
- 申請数: `heroDocumentText`
- 経費: `heroBanknotes`
- 売上/グラフ: `heroChartBar`
- プロジェクト: `heroBriefcase`
- 時計: `heroClock`

## 共通ルール
1. `ng-zorro-antd` の import を全て削除すること
2. DaisyUI クラスでスタイリング。Tailwind はレイアウト補助のみ
3. アイコンは `@ng-icons/heroicons/outline` から import
4. 既存ロジック (Signal, Service, Router) は変更禁止
5. data-testid 属性を主要要素に付与
6. 日本語 UI を維持
7. 完了後: `pnpm nx test web` で該当テストが PASS することを確認
