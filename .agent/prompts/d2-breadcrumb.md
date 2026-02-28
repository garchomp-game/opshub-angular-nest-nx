# D-2: Breadcrumb 実装

## ゴール
各ページにパンくずリスト (Breadcrumb) を表示する。

## 対象ファイル
- **新規**: `/home/garchomp-game/workspace/starlight-test/opshub/apps/web/src/app/shared/components/breadcrumb.component.ts`
- **変更**: `/home/garchomp-game/workspace/starlight-test/opshub/apps/web/src/app/shared/components/app-shell.component.ts` — `<main>` 内の `<router-outlet>` の上にパンくずを配置

## 要件
1. Angular Router の `ActivatedRoute` + `NavigationEnd` イベントから現在のルートを取得
2. 各ルートの `data.title` プロパティ（`app.routes.ts` に定義済み）をパンくず文字列として使用
3. ホーム (ダッシュボード) → 現在のページ の階層表示
4. 最後のアイテムはリンクなし (現在地)、それ以外は `routerLink` でリンク

## デザイン
- DaisyUI v5 `breadcrumbs` コンポーネントを使用
- `.agent/llms-txt/daisyui-llms.txt` を参照して DaisyUI v5 の正しいクラスを使うこと
- `<main>` の上部、コンテンツの前に小さく表示
- テキストは `text-sm text-base-content/60`

## ルート構成参考
`app.routes.ts` の各ルートに `data: { title: '...' }` が設定済み:
- dashboard → ダッシュボード
- workflows → 申請
- projects → プロジェクト
- timesheets → 工数
- expenses → 経費
- invoices → 請求書
- search → 検索
- admin → 管理
