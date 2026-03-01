# SEC-02: ReDoS 対策 (正規表現安全化)

## 共通ルール
// turbo-all
- `pnpm`, `npx`, `nx` 等のコマンドは自由に実行してよい
- `sudo` が必要な操作やシステム設定変更のみユーザーに確認

## 概要
`eslint-plugin-security` の `detect-non-literal-regexp` で検出された 2 件の警告に対応する。
ユーザー入力由来の文字列を `new RegExp()` に渡しており、ReDoS (Regular Expression Denial of Service) のリスクがある。

### 参照ベストプラクティス
- **nodebestpractices 6.16**: "Prevent evil RegEx from overloading your single thread execution"
- **nodebestpractices 6.1**: "Embrace linter security rules"

## 現在の状況
両ファイルとも `escapeRegExp` 相当の処理を既にインラインで実施済み:
```typescript
const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const regex = new RegExp(`(${escaped})`, 'gi');
```
→ エスケープ済みのため実際の ReDoS リスクは低い。

## 作業内容

### 1. eslint-disable コメント追加
エスケープ済みであることを確認した上で、`eslint-disable-next-line` コメントを追加。

```diff
 const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
+// eslint-disable-next-line security/detect-non-literal-regexp -- input is escaped above
 const regex = new RegExp(`(${escaped})`, 'gi');
```

### 2. (任意) 共通ユーティリティ化
`escapeRegExp` を `@shared/util` に切り出し、DRY 化する。

```typescript
// libs/shared/src/lib/util/regex.ts
export function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
```

## 対象ファイル

| パス | 変更内容 |
|------|----------|
| `apps/web/src/app/shared/pipes/highlight.pipe.ts` | MODIFY: eslint-disable 追加 |
| `apps/web/src/app/features/search/search-results/search-results.component.ts` | MODIFY: eslint-disable 追加 |

## 完了条件
- [ ] `pnpm nx lint web` で `detect-non-literal-regexp` 警告が 0 件
- [ ] `pnpm nx build web` PASS
