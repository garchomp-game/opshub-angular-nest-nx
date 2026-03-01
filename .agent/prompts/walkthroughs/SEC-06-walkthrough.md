# SEC-06: CI Lint ステップ追加 & Warning 上限設定 — ウォークスルー

## 変更ファイル

### `.github/workflows/ci.yml`

Build Web ステップの直後、Test API ステップの前に 2 つの lint ステップを追加した。

```diff
       - name: Build Web
         run: pnpm nx build web

+      - name: Lint Web
+        run: pnpm nx lint web --max-warnings=243
+
+      - name: Lint API
+        run: pnpm nx lint api || true
+
       - name: Test API
         run: pnpm nx test api
```

| ステップ | コマンド | 備考 |
|----------|----------|------|
| Lint Web | `pnpm nx lint web --max-warnings=243` | warning が 244 以上になると CI が失敗する |
| Lint API | `pnpm nx lint api \|\| true` | API 側は未解消エラーがあるため soft fail |

## `--max-warnings=243` の根拠

要件では `245` と見積もられていたが、ローカルで実際に lint を実行した結果、現在の warning 数は **243** だった。
ラチェット効果を正しく機能させるため、実測値の `243` を採用した。

## ローカル検証結果

```
$ pnpm nx lint web --max-warnings=243

✖ 243 problems (0 errors, 243 warnings)

 NX   Successfully ran target lint for project web
```

- 0 errors, 243 warnings — `--max-warnings=243` でちょうど通過することを確認。

## ラチェット運用ルール

1. 新コードで warning を増やさない（CI が自動で検知する）
2. SEC-03 / SEC-04 で warning を修正したら `--max-warnings` の値を下げる
3. 最終目標: `--max-warnings=0`
