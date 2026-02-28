# V5-T4: Projects — DaisyUI v5 クラス修正

共通ルール: `.agent/prompts/v5-common-rules.md` を必ず参照
llms.txt 参照: `.agent/llms-txt/daisyui-llms.txt`

## 対象ファイル
- `apps/web/src/app/features/projects/project-list.component.ts`
- `apps/web/src/app/features/projects/project-detail.component.ts`
- `apps/web/src/app/features/projects/project-form.component.ts`
- `apps/web/src/app/features/projects/kanban-board.component.ts`
- `apps/web/src/app/features/projects/documents/document-list.component.ts`

## 変更点
- `input-bordered` → 削除
- `textarea-bordered` → 削除
- `select-bordered` → 削除
- `label-text` → `label` 要素にテキスト直接配置
- `tabs-bordered` → `tabs-border`
- `<tr class="hover">` → `<tr class="hover:bg-base-200/40">`
- `avatar placeholder` → `avatar avatar-placeholder`
