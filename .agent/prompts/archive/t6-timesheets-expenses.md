# T6: Timesheets + Expenses — DaisyUI + CDK 移行

## プロジェクト情報
- Nx monorepo, Angular 21, Tailwind v3 + DaisyUI 4
- アイコン: `@ng-icons/heroicons` (Heroicons)
- 共通コンポーネント: `apps/web/src/app/shared/ui/`

## 対象ファイル
- `apps/web/src/app/features/timesheets/timesheet-weekly.component.ts`
- `apps/web/src/app/features/timesheets/timesheet-weekly.component.spec.ts`
- `apps/web/src/app/features/timesheets/timesheet-report.component.ts`
- `apps/web/src/app/features/expenses/expense-list.component.ts`
- `apps/web/src/app/features/expenses/expense-list.component.spec.ts`
- `apps/web/src/app/features/expenses/expense-form.component.ts`
- `apps/web/src/app/features/expenses/expense-summary.component.ts`

## やること
1. 全ての `ng-zorro-antd` import を削除
2. timesheet-weekly: `table table-zebra` (入力行テーブル)
3. timesheet-report: `card bg-base-100 shadow-sm` + `stat` (集計)
4. expense-list: `<app-list-page title="経費一覧">` + `table table-zebra`
5. expense-form: `<app-form-page>` + `app-form-field` + DaisyUI `input`, `select`
6. expense-summary: `stats shadow` or `card` + `stat`
7. spec ファイルから provideNzIcons / provideTestNzIcons / provideNzI18n を削除

## アイコンの使い方
```typescript
import { NgIcon, provideIcons } from '@ng-icons/core';
import { heroPlus, heroClock, heroBanknotes, heroReceiptPercent } from '@ng-icons/heroicons/outline';

@Component({
  imports: [NgIcon],
  viewProviders: [provideIcons({ heroPlus, heroClock, heroBanknotes })],
  template: `<ng-icon name="heroPlus" class="text-lg" />`
})
```

よく使うアイコン: `heroPlus`(新規), `heroClock`(工数), `heroBanknotes`(経費), `heroReceiptPercent`(領収書), `heroCalendarDays`(カレンダー), `heroCalculator`(集計), `heroArrowUpTray`(ファイルアップロード)

## 共通ルール
1. `ng-zorro-antd` の import を全て削除すること
2. DaisyUI クラスでスタイリング。Tailwind はレイアウト補助のみ
3. アイコンは `@ng-icons/heroicons/outline` から import
4. 既存ロジック (Signal, Service, Router) は変更禁止
5. data-testid 属性を主要要素に付与
6. 日本語 UI を維持
7. 完了後: `pnpm nx test web` で該当テストが PASS することを確認
