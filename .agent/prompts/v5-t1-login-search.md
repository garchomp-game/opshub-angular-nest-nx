# V5-T1: Login + HeaderSearch — DaisyUI v5 クラス修正

共通ルール: `.agent/prompts/v5-common-rules.md` を必ず参照
llms.txt 参照: `.agent/llms-txt/daisyui-llms.txt`

## 対象ファイル
- `apps/web/src/app/core/auth/login/login.component.ts`
- `apps/web/src/app/shared/components/header-search-bar/header-search-bar.component.ts`

## login.component.ts の変更点
- `form-control` → `fieldset fieldset`
- `label-text` → `label` 要素にテキスト直接配置
- `label-text-alt` → `label` + `text-sm` で代替
- `input input-bordered` → `input` (bordered 削除)

## header-search-bar.component.ts の変更点
- `input input-bordered input-sm` → `input input-sm` (bordered 削除)
