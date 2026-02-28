# T2: AppShell + 共有コンポーネント — DaisyUI + CDK 移行

## プロジェクト情報
- Nx monorepo, Angular 21, Tailwind v3 + DaisyUI 4
- テーマ: `opshub` (tailwind.config.js で定義済み)
- アイコン: `@ng-icons/heroicons` (Heroicons)

## 対象ファイル
- `apps/web/src/app/shared/components/app-shell.component.ts`
- `apps/web/src/app/shared/notification-bell/notification-bell.component.ts`
- `apps/web/src/app/shared/notification-bell/notification-bell.component.spec.ts`
- `apps/web/src/app/shared/components/header-search-bar/header-search-bar.component.ts`
- `apps/web/src/app/shared/components/confirm-dialog.component.ts`

## やること

### app-shell.component.ts
nz-layout/sider/menu → DaisyUI drawer + navbar:
- サイドバー: `drawer drawer-open lg:drawer-open` + `menu bg-base-200 min-h-full w-64 p-4`
- ヘッダー: `navbar bg-base-100 shadow-sm`
- メニュー項目: `menu` + `<li><a routerLink="..."><ng-icon name="heroHome" /> ダッシュボード</a></li>`
- 折りたたみ: `drawer-toggle` チェックボックスで制御

### notification-bell.component.ts
nz-badge/dropdown → DaisyUI:
- ベルボタン: `btn btn-ghost btn-circle` + `indicator`
- 未読バッジ: `badge badge-primary badge-xs indicator-item`
- ドロップダウン: `dropdown dropdown-end` + `dropdown-content menu bg-base-100 rounded-box shadow-lg w-80`
- スピナー: `loading loading-spinner`
- 空状態: `text-center py-8 text-base-content/50`

### header-search-bar.component.ts
nz-input-group → DaisyUI:
- `input input-bordered input-sm w-64` + `<ng-icon name="heroMagnifyingGlass" />`

### confirm-dialog.component.ts
NzModalRef → shared ModalRef に切り替え:
- `import { ModalRef } from '../../shared/ui/modal/modal-ref';`
- テンプレート: `modal-box` + `modal-action` + `btn btn-ghost` + `btn btn-primary`

## アイコンの使い方
```typescript
import { NgIcon, provideIcons } from '@ng-icons/core';
import { heroHome, heroBell, heroMagnifyingGlass } from '@ng-icons/heroicons/outline';

@Component({
  imports: [NgIcon],
  viewProviders: [provideIcons({ heroHome, heroBell, heroMagnifyingGlass })],
  template: `<ng-icon name="heroHome" class="text-lg" />`
})
```

サイドバーで使うアイコン:
- ダッシュボード: `heroHome`
- 申請管理: `heroDocumentText`
- プロジェクト: `heroBriefcase`
- 工数管理: `heroClock`
- 経費管理: `heroBanknotes`
- 請求書: `heroDocumentDuplicate`
- 検索: `heroMagnifyingGlass`
- 管理: `heroCog6Tooth`
- ログアウト: `heroArrowRightOnRectangle`
- 通知ベル: `heroBell`
- ユーザーアバター: `heroUserCircle`
- メニュー開閉: `heroBars3`

## 共通ルール
1. `ng-zorro-antd` の import を全て削除すること
2. DaisyUI クラスでスタイリング。Tailwind はレイアウト補助のみ
3. アイコンは `@ng-icons/heroicons/outline` から import
4. 既存ロジック (Signal, Service, Router) は変更禁止
5. data-testid 属性を主要要素に付与
6. 日本語 UI を維持
7. spec から provideNzIcons / provideTestNzIcons を削除
8. 完了後: `pnpm nx test web` で該当テストが PASS することを確認
