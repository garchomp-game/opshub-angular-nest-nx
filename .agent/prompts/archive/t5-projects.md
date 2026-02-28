# T5: Projects — DaisyUI + CDK 移行

## プロジェクト情報
- Nx monorepo, Angular 21, Tailwind v3 + DaisyUI 4
- アイコン: `@ng-icons/heroicons` (Heroicons)
- 共通コンポーネント: `apps/web/src/app/shared/ui/`

## 対象ファイル
- `apps/web/src/app/features/projects/project-list.component.ts`
- `apps/web/src/app/features/projects/project-list.component.spec.ts`
- `apps/web/src/app/features/projects/project-detail.component.ts`
- `apps/web/src/app/features/projects/project-form.component.ts`
- `apps/web/src/app/features/projects/kanban-board.component.ts`
- `apps/web/src/app/features/projects/kanban-board.component.spec.ts`
- `apps/web/src/app/features/projects/documents/document-list.component.ts`
- `apps/web/src/app/features/projects/documents/document-list.component.spec.ts`

## やること
1. 全ての `ng-zorro-antd` import を削除
2. project-list: `<app-list-page title="プロジェクト">` + `table table-zebra`
3. project-detail: `card bg-base-100 shadow-sm`, タブは DaisyUI `tabs tabs-bordered`
4. project-form: `<app-form-page>` + `app-form-field`
5. kanban-board: CDK DragDrop はそのまま維持 + カード `card bg-base-100 shadow-sm compact`
6. document-list: `table table-zebra`
7. ステータスバッジ: `badge badge-success`(完了), `badge badge-info`(進行中), `badge badge-ghost`(計画中), `badge badge-error`(中止)
8. spec ファイルから provideNzIcons / provideTestNzIcons を削除

## 注意: kanban-board
CDK DragDropModule の import は維持すること。DaisyUI に置き換えるのはスタイルのみ。

## アイコンの使い方
```typescript
import { NgIcon, provideIcons } from '@ng-icons/core';
import { heroPlus, heroEye, heroDocument, heroArrowsUpDown } from '@ng-icons/heroicons/outline';

@Component({
  imports: [NgIcon],
  viewProviders: [provideIcons({ heroPlus, heroEye, heroDocument })],
  template: `<ng-icon name="heroPlus" class="text-lg" />`
})
```

よく使うアイコン: `heroPlus`(新規), `heroEye`(詳細), `heroDocument`(ドキュメント), `heroArrowUpTray`(アップロード), `heroArrowDownTray`(ダウンロード), `heroTrash`(削除), `heroViewColumns`(カンバン)

## 共通ルール
1. `ng-zorro-antd` の import を全て削除すること
2. DaisyUI クラスでスタイリング。Tailwind はレイアウト補助のみ
3. アイコンは `@ng-icons/heroicons/outline` から import
4. 既存ロジック (Signal, Service, Router) は変更禁止
5. data-testid 属性を主要要素に付与
6. 日本語 UI を維持
7. 完了後: `pnpm nx test web` で該当テストが PASS することを確認
