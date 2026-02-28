# V5-T2: AppShell — DaisyUI v5 クラス修正

共通ルール: `.agent/prompts/v5-common-rules.md` を必ず参照
llms.txt 参照: `.agent/llms-txt/daisyui-llms.txt`

## 対象ファイル
- `apps/web/src/app/shared/components/app-shell.component.ts`

## 変更点
- `avatar placeholder` → `avatar avatar-placeholder`
- menu 内の `active` クラスがあれば → `menu-active`
- `menu` に `w-full` を追加 (v5 ではデフォルトで w-full でなくなった)
