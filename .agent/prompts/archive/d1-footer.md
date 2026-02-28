# D-1: Footer 実装

## ゴール
AppShell コンポーネントに Footer を追加する。

## 対象ファイル
`/home/garchomp-game/workspace/starlight-test/opshub/apps/web/src/app/shared/components/app-shell.component.ts`

## 要件（旧ドキュメント SCR-UI-LAYOUT 準拠）
- コピーライト表示: `© 2026 OpsHub Inc. All rights reserved.`
- 年は `new Date().getFullYear()` で動的に
- DaisyUI v5 `footer` クラスを使用
- 固定位置ではなくコンテンツの最下部に配置
- `.agent/llms-txt/daisyui-llms.txt` を参照して DaisyUI v5 の `footer` コンポーネントの正しいクラスを使うこと

## デザイン
- `footer footer-center bg-base-200 text-base-content p-4`
- 控えめなデザイン。本文コンテンツの邪魔にならないように

## 注意
- AppShell の `<main>` 部分の下に配置
- `min-h-screen` のレイアウトを壊さないように
