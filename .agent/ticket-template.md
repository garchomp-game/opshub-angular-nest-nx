# OpsHub 作業者向けプロンプトテンプレート

以下のテンプレートをコピーして `.agent/prompts/` に新しいチケットを作成します。

---

## テンプレート

```markdown
# T{番号}: {機能名} — {作業内容}

## プロジェクト情報
- Nx monorepo, Angular 21, Tailwind v4
- パス: apps/web/src/app/features/{機能}/

## 対象ファイル
- `{ファイルパス1}`
- `{ファイルパス2}`

## 使用技術
- Tailwind v4 + DaisyUI v5 (CSS クラスベース)
- Angular CDK (振る舞い: Overlay, DragDrop 等)
- Angular Signals (状態管理)
- ReactiveFormsModule (フォーム)

## DaisyUI クラス参照
- テーブル: `table`, `table-zebra`
- ボタン: `btn`, `btn-primary`, `btn-sm`
- カード: `card`, `card-body`, `card-title`
- バッジ: `badge`, `badge-info`, `badge-success`
- モーダル: `modal`, `modal-box`
- フォーム: `input`, `select`, `textarea`
- Navbar: `navbar`
- ページネーション: `join`, `join-item`

## デザイン要件
{画面ごとの詳細要件を記載}

## 共通ルール
1. 既存ロジック (Signal, Service, Router) は変更禁止
2. Tailwind + DaisyUI クラスでスタイリング
3. data-testid 属性を主要要素に付与
4. 日本語 UI を維持
5. テスト: provideTestNzIcons() は不要 (NG-ZORRO は DaisyUI v5 に移行済み)
6. 完了後: `pnpm check` で確認 (typecheck + test)
```

---

## 作業完了報告のフォーマット

作業者は完了時に以下を報告:

```
## 完了報告
- 変更ファイル: {リスト}
- テスト結果: {pass/fail}
- 画面スクリーンショット: {あれば}
- 注意事項: {あれば}
```
