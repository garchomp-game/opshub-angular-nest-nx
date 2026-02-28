# T7: Invoices — DaisyUI + CDK 移行

## プロジェクト情報
- Nx monorepo, Angular 21, Tailwind v3 + DaisyUI 4
- アイコン: `@ng-icons/heroicons` (Heroicons)
- 共通コンポーネント: `apps/web/src/app/shared/ui/`

## 対象ファイル
- `apps/web/src/app/features/invoices/invoice-list.component.ts`
- `apps/web/src/app/features/invoices/invoice-detail.component.ts`
- `apps/web/src/app/features/invoices/invoice-form.component.ts`
- `apps/web/src/app/features/invoices/invoice-print-view.component.ts`

## やること
1. 全ての `ng-zorro-antd` import を削除
2. invoice-list: `<app-list-page title="請求書一覧">` + `table table-zebra`
3. invoice-detail: `card bg-base-100 shadow-sm` + 明細テーブル `table`
4. invoice-form: `<app-form-page>` + `app-form-field` + DaisyUI `input`, `select`
5. invoice-print-view: `table` (シンプル印刷用レイアウト)
6. ステータスバッジ: `badge badge-success`(支払済), `badge badge-warning`(送付済), `badge badge-ghost`(下書き), `badge badge-error`(期限超過)
7. 金額表示: `text-right font-mono`

## アイコンの使い方
```typescript
import { NgIcon, provideIcons } from '@ng-icons/core';
import { heroPlus, heroEye, heroPrinter, heroPaperAirplane } from '@ng-icons/heroicons/outline';

@Component({
  imports: [NgIcon],
  viewProviders: [provideIcons({ heroPlus, heroEye, heroPrinter })],
  template: `<ng-icon name="heroPlus" class="text-lg" />`
})
```

よく使うアイコン: `heroPlus`(新規), `heroEye`(詳細), `heroPrinter`(印刷), `heroPaperAirplane`(送付), `heroCurrencyYen`(金額), `heroDocumentDuplicate`(請求書)

## 共通ルール
1. `ng-zorro-antd` の import を全て削除すること
2. DaisyUI クラスでスタイリング。Tailwind はレイアウト補助のみ
3. アイコンは `@ng-icons/heroicons/outline` から import
4. 既存ロジック (Signal, Service, Router) は変更禁止
5. data-testid 属性を主要要素に付与
6. 日本語 UI を維持
7. 完了後: `pnpm nx test web` で該当テストが PASS することを確認
