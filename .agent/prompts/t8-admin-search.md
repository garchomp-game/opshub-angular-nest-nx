# T8: Admin + Search + Placeholder — DaisyUI + CDK 移行

## プロジェクト情報
- Nx monorepo, Angular 21, Tailwind v3 + DaisyUI 4
- アイコン: `@ng-icons/heroicons` (Heroicons)
- 共通コンポーネント: `apps/web/src/app/shared/ui/`

## 対象ファイル
- `apps/web/src/app/features/admin/users/user-list.component.ts`
- `apps/web/src/app/features/admin/users/user-list.component.spec.ts`
- `apps/web/src/app/features/admin/users/invite-modal.component.ts`
- `apps/web/src/app/features/admin/audit-logs/audit-log-viewer.component.ts`
- `apps/web/src/app/features/admin/audit-logs/audit-log-viewer.component.spec.ts`
- `apps/web/src/app/features/admin/tenant/tenant-settings.component.ts`
- `apps/web/src/app/features/admin/tenant/tenant-settings.component.spec.ts`
- `apps/web/src/app/features/search/search-results/search-results.component.ts`
- `apps/web/src/app/features/placeholder.component.ts`

## やること
1. 全ての `ng-zorro-antd` import を削除
2. user-list: `<app-list-page title="ユーザー管理">` + `table table-zebra`
3. invite-modal: `modal-box` + `modal-action` + `app-form-field` + DaisyUI `input`
4. audit-log-viewer: `<app-list-page title="監査ログ">` + `table table-zebra` + フィルタ
5. tenant-settings: `<app-form-page title="テナント設定">` + `app-form-field`
6. search-results: `card bg-base-100 shadow-sm` でリスト表示
7. placeholder: シンプルな `hero bg-base-200 rounded-2xl` + テキスト
8. ステータスバッジ (ユーザー): `badge badge-success`(有効), `badge badge-warning`(招待中), `badge badge-ghost`(無効)
9. アクションバッジ (監査ログ): `badge badge-info`
10. spec ファイルから provideNzIcons / provideTestNzIcons を削除

## アイコンの使い方
```typescript
import { NgIcon, provideIcons } from '@ng-icons/core';
import { heroPlus, heroUserPlus, heroShieldCheck, heroMagnifyingGlass } from '@ng-icons/heroicons/outline';

@Component({
  imports: [NgIcon],
  viewProviders: [provideIcons({ heroPlus, heroUserPlus, heroShieldCheck })],
  template: `<ng-icon name="heroPlus" class="text-lg" />`
})
```

よく使うアイコン: `heroUserPlus`(招待), `heroShieldCheck`(ロール), `heroEllipsisVertical`(アクション), `heroMagnifyingGlass`(検索), `heroCog6Tooth`(設定), `heroClipboardDocumentList`(監査ログ), `heroFunnelSolid`(フィルタ), `heroInformationCircle`(情報)

## 共通ルール
1. `ng-zorro-antd` の import を全て削除すること
2. DaisyUI クラスでスタイリング。Tailwind はレイアウト補助のみ
3. アイコンは `@ng-icons/heroicons/outline` から import
4. 既存ロジック (Signal, Service, Router) は変更禁止
5. data-testid 属性を主要要素に付与
6. 日本語 UI を維持
7. 完了後: `pnpm nx test web` で該当テストが PASS することを確認
