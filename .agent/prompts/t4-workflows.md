# T4: Workflows — DaisyUI + CDK 移行

## プロジェクト情報
- Nx monorepo, Angular 21, Tailwind v3 + DaisyUI 4
- アイコン: `@ng-icons/heroicons` (Heroicons)
- 共通コンポーネント: `apps/web/src/app/shared/ui/` (ListPageComponent, FormFieldComponent 等)

## 対象ファイル
- `apps/web/src/app/features/workflows/workflow-list.component.ts`
- `apps/web/src/app/features/workflows/workflow-list.component.spec.ts` (存在すれば)
- `apps/web/src/app/features/workflows/workflow-detail.component.ts`
- `apps/web/src/app/features/workflows/workflow-form.component.ts`
- `apps/web/src/app/features/workflows/workflow-pending.component.ts`

## やること
1. 全ての `ng-zorro-antd` import を削除
2. workflow-list: `<app-list-page title="申請一覧">` で囲む + テーブルは `table table-zebra`
3. workflow-detail: `card bg-base-100 shadow-sm` + ステータス `badge`
4. workflow-form: `<app-form-page>` + `app-form-field` + DaisyUI `input`, `select`, `textarea`
5. workflow-pending: テーブルは `table table-zebra`
6. ページネーション: `join` + `join-item btn btn-sm`
7. ステータスバッジ: `badge badge-success`(承認), `badge badge-warning`(申請中), `badge badge-error`(差戻), `badge badge-ghost`(下書き/取下)
8. spec ファイルから provideNzIcons / provideTestNzIcons を削除

## アイコンの使い方
```typescript
import { NgIcon, provideIcons } from '@ng-icons/core';
import { heroPlus, heroEye, heroPencilSquare, heroTrash } from '@ng-icons/heroicons/outline';

@Component({
  imports: [NgIcon],
  viewProviders: [provideIcons({ heroPlus, heroEye, heroPencilSquare, heroTrash })],
  template: `<ng-icon name="heroPlus" class="text-lg" />`
})
```

よく使うアイコン: `heroPlus`(新規作成), `heroEye`(詳細), `heroPencilSquare`(編集), `heroTrash`(削除), `heroCheck`(承認), `heroXMark`(差戻), `heroArrowPath`(再申請), `heroFunnel`(フィルタ)

## 共通ルール
1. `ng-zorro-antd` の import を全て削除すること
2. DaisyUI クラスでスタイリング。Tailwind はレイアウト補助のみ
3. アイコンは `@ng-icons/heroicons/outline` から import
4. 既存ロジック (Signal, Service, Router) は変更禁止
5. data-testid 属性を主要要素に付与
6. 日本語 UI を維持
7. 完了後: `pnpm nx test web` で該当テストが PASS することを確認
