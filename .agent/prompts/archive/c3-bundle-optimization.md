# C3: バンドルサイズ最適化

## 共通ルール
- 既存機能を壊さない
- 完了後 `pnpm nx build web && pnpm nx test web` で確認

## 作業内容

### 1. バンドル上限引き戻し (`apps/web/project.json`)

```json
"budgets": [
  { "type": "initial", "maximumWarning": "1mb", "maximumError": "1.5mb" }
]
```

現在のバンドル: 1.02 MB。上限を 2MB → 1.5MB に引き戻し。

### 2. 未使用 import の確認

`apps/web/src/app/` 配下で、import しているが実際に template で使われていない PrimeNG モジュールを検出・削除:

```bash
# 例: grep で import されている PrimeNG モジュール一覧
grep -rh "from 'primeng/" apps/web/src/app/ | sort | uniq -c | sort -rn
```

### 3. 遅延ロードの確認

`apps/web/src/app/app.routes.ts` で全機能モジュールが `loadComponent` で遅延ロードされていることを確認。

### 4. ビルド出力レビュー

```bash
pnpm nx build web --verbose 2>&1 | grep 'chunk-' | sort -t'|' -k3 -rn | head -20
```

大きいチャンクがあれば分割検討。

### 5. 検証

- `pnpm nx build web` — ビルド成功 + バンドル 1.5MB 以下
- `pnpm nx test web` — 139 テスト通過
