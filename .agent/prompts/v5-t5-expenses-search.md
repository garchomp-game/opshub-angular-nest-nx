# V5-T5: Expenses + Search — DaisyUI v5 クラス修正

共通ルール: `.agent/prompts/v5-common-rules.md` を必ず参照
llms.txt 参照: `.agent/llms-txt/daisyui-llms.txt`

## 対象ファイル
- `apps/web/src/app/features/expenses/expense-list.component.ts`
- `apps/web/src/app/features/search/search-results/search-results.component.ts`

## expense-list の変更点
- `select-bordered` → 削除

## search-results の変更点
- `input-bordered` → 削除
- `tabs-bordered` → `tabs-border`
