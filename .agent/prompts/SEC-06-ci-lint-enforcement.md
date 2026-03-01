# SEC-06: CI Lint ステップ追加 & Warning 上限設定

## 共通ルール
// turbo-all
- `pnpm`, `npx`, `nx` 等のコマンドは自由に実行してよい
- `sudo` が必要な操作やシステム設定変更のみユーザーに確認

## 概要
SEC-01 で全 ERROR が解消されたため、CI パイプラインに lint ステップを追加する。
同時に `--max-warnings` で warning 上限を設け、新たな warning の増加を防止する「ラチェット効果」を実現する。

### 参照ベストプラクティス
- **nodebestpractices 4.9**: "Refactor regularly using static analysis tools"
- **nodebestpractices 6.1**: "Embrace linter security rules"

## 作業内容

### 1. CI ワークフローに lint ステップ追加

```yaml
# .github/workflows/ci.yml の Build Web の後に追加

- name: Lint Web
  run: pnpm nx lint web --max-warnings=245

- name: Lint API
  run: pnpm nx lint api || true
```

> [!IMPORTANT]
> `--max-warnings=245` は現在の warning 数と一致させること。
> SEC-03, SEC-04 の修正に伴い warning が減少したら、この値も下げる。

### 2. package.json に check スクリプト追加 (任意)

```json
{
  "scripts": {
    "lint:strict": "nx lint web --max-warnings=245 && nx lint api"
  }
}
```

### 3. ラチェット運用ルール
1. 新コードで warning を増やさないこと
2. SEC-03/04 完了後に `--max-warnings` の値を更新すること
3. 最終目標: `--max-warnings=0`

## 対象ファイル

| パス | 変更内容 |
|------|----------|
| `.github/workflows/ci.yml` | MODIFY: lint ステップ追加 |

## 検証手順
1. `pnpm nx lint web --max-warnings=245` がローカルで成功
2. GitHub Actions で CI が PASS

## ウォークスルー出力
作業完了後、以下のパスにウォークスルーを出力すること:
`opshub/.agent/prompts/walkthroughs/SEC-06-walkthrough.md`

## 完了条件
- [ ] CI に `Lint Web` ステップが存在する
- [ ] `--max-warnings` が現在の warning 数と一致している
- [ ] CI が PASS (GitHub Actions で確認)
