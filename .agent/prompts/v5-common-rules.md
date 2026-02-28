# DaisyUI v5 マイグレーション — 全チケット共通ルール

## 環境
- Tailwind CSS v4.2.1 + DaisyUI v5.5.19
- 設定は CSS-first (`styles.scss` で `@plugin "daisyui"`)
- llms.txt 参照: `.agent/llms-txt/daisyui-llms.txt`

## DaisyUI v4 → v5 クラス変更一覧 (必ず適用)

| v4 (現在のコード) | v5 (変更後) | 備考 |
|---|---|---|
| `input-bordered` | 削除 (`input` だけでOK) | border がデフォルトに |
| `select-bordered` | 削除 (`select` だけでOK) | 同上 |
| `textarea-bordered` | 削除 (`textarea` だけでOK) | 同上 |
| `file-input-bordered` | 削除 | 同上 |
| `form-control` | `fieldset` | v5 で廃止 |
| `label-text` | 削除 (label に直接テキスト) | v5 で廃止 |
| `label-text-alt` | 削除 (label + text-sm) | v5 で廃止 |
| `tabs-bordered` | `tabs-border` | リネーム |
| `tabs-lifted` | `tabs-lift` | リネーム |
| `tabs-boxed` | `tabs-box` | リネーム |
| `card-compact` | `card-sm` | リネーム |
| `card-bordered` | `card-border` | リネーム |
| `<tr class="hover">` | `<tr class="hover:bg-base-200/40">` | v5 で hover クラス廃止 |
| `avatar placeholder` | `avatar avatar-placeholder` | プレフィックス追加 |
| menu 内 `active` | `menu-active` | プレフィックス追加 |

## フォーム要素の v5 パターン

```html
<!-- v4 (旧) -->
<div class="form-control w-full">
  <label class="label"><span class="label-text">名前</span></label>
  <input class="input input-bordered w-full" />
</div>

<!-- v5 (新) -->
<fieldset class="fieldset w-full">
  <label class="label font-medium">名前</label>
  <input class="input w-full" />
</fieldset>
```

## 共通ルール
1. 上記の v4→v5 クラス変更を全て適用すること
2. アイコンは `@ng-icons/heroicons/outline` から import
3. 既存ロジック (Signal, Service, Router) は変更禁止
4. data-testid 属性を維持
5. 日本語 UI を維持
6. 完了後: `pnpm nx test web` で該当テストが PASS することを確認
