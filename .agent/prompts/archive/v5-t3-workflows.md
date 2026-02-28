# V5-T3: Workflows — DaisyUI v5 クラス修正

共通ルール: `.agent/prompts/v5-common-rules.md` を必ず参照
llms.txt 参照: `.agent/llms-txt/daisyui-llms.txt`

## 対象ファイル
- `apps/web/src/app/features/workflows/workflow-list.component.ts`
- `apps/web/src/app/features/workflows/workflow-form.component.ts`
- `apps/web/src/app/features/workflows/workflow-detail.component.ts`

## 変更点
- `select-bordered` → 削除 (`select` だけ)
- `input-bordered` → 削除 (`input` だけ)
- `textarea-bordered` → 削除 (`textarea` だけ)
- `label-text` → `label` 要素にテキスト直接配置
- `form-control` → `fieldset` (使用箇所があれば)
