# T1: Login — DaisyUI + CDK 移行

## プロジェクト情報
- Nx monorepo, Angular 21, Tailwind v3 + DaisyUI 4
- テーマ: `opshub` (tailwind.config.js で定義済み)
- アイコン: `@ng-icons/heroicons` (Heroicons)

## 対象ファイル
- `apps/web/src/app/core/auth/login/login.component.ts`
- `apps/web/src/app/core/auth/login/login.component.spec.ts`

## やること
1. `login.component.ts` から `ng-zorro-antd` の import を全て削除
2. テンプレートを DaisyUI クラスで書き換え:
   - ログインカード: `card bg-base-100 shadow-xl max-w-md mx-auto mt-20`
   - タイトル: `card-title text-2xl font-bold`
   - フォーム: `form-control` + `label label-text` + `input input-bordered`
   - ボタン: `btn btn-primary w-full`
   - エラー表示: `alert alert-error text-sm`
   - ローディング: `loading loading-spinner loading-sm`
3. `login.component.spec.ts` から NG-ZORRO 関連の import/provider を削除

## 既存ロジック (変更禁止)
- AuthService.login() 呼び出し
- Signal (errorMessage, isLoading)
- Router.navigate

## アイコンの使い方
```typescript
import { NgIcon, provideIcons } from '@ng-icons/core';
import { heroLockClosed, heroEnvelope } from '@ng-icons/heroicons/outline';

@Component({
  imports: [NgIcon],
  viewProviders: [provideIcons({ heroLockClosed, heroEnvelope })],
  template: `<ng-icon name="heroLockClosed" class="text-lg" />`
})
```

よく使うアイコン名:
- メール: `heroEnvelope`
- パスワード: `heroLockClosed`
- ログイン: `heroArrowRightOnRectangle`
- 目/表示: `heroEye`, `heroEyeSlash`

## 共通ルール
1. `ng-zorro-antd` の import を全て削除すること
2. DaisyUI クラスでスタイリング。Tailwind はレイアウト補助のみ
3. アイコンは `@ng-icons/heroicons/outline` から import
4. 既存ロジック (Signal, Service, Router) は変更禁止
5. data-testid 属性を主要要素に付与
6. 日本語 UI を維持
7. spec から provideNzIcons / provideTestNzIcons / NoopAnimationsModule を削除
8. 完了後: `pnpm nx test web` で該当テストが PASS することを確認
