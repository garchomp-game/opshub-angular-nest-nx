# NA-02: バンドルサイズ最適化

## 共通ルール
// turbo-all
- `pnpm`, `npx`, `nx` 等のコマンドは自由に実行してよい
- `sudo` が必要な操作やシステム設定変更のみユーザーに確認

## 概要
`pnpm nx build web` で `WARNING: bundle initial exceeded maximum budget by 27.51 kB` が発生。
バンドル分析を行い、不要な import の削除やビルド設定の最適化を実施する。

## 現象

```
Warning: bundle initial exceeded maximum budget. Budget 500.00 kB was not met by 27.51 kB with a total of 527.51 kB.
```

## 作業内容

### 1. バンドル分析

```bash
# stats.json を生成してバンドルサイズを可視化
pnpm nx build web -- --stats-json
# or
npx esbuild-visualizer --metadata dist/apps/web/stats.json --open
```

- [ ] 初期バンドルに含まれるモジュールのサイズを特定
- [ ] PrimeNG のどのコンポーネントが初期バンドルに入っているか確認

### 2. PrimeNG import の最適化

- [ ] `app.config.ts` で `providePrimeNG()` に渡しているモジュールを確認
- [ ] 各 feature コンポーネントが `import { ButtonModule } from 'primeng/button'` 形式（tree-shakable）を使用しているか確認
- [ ] `import { PrimeNG } from 'primeng/config'` などのグローバル import が不必要に初期バンドルに入っていないか確認

### 3. 遅延ロードの確認

- [ ] `app.routes.ts` の全 feature が `loadChildren` / `loadComponent` を使用しているか
- [ ] `AppShellComponent` に直接 import されている PrimeNG コンポーネントを最小化

### 4. 閾値調整

- [ ] 必要に応じて `angular.json` の `budgets` 設定を見直し:
  ```json
  {
      "type": "initial",
      "maximumWarning": "550kB",
      "maximumError": "700kB"
  }
  ```

## 対象ファイル

| パス | 確認/変更内容 |
|------|------------|
| `apps/web/src/app/app.config.ts` | PrimeNG 設定確認 |
| `apps/web/src/app/shared/components/app-shell.component.ts` | 初期ロードコンポーネント確認 |
| `apps/web/project.json` or `angular.json` | budgets 設定 |
| 各 feature component | PrimeNG import パターン確認 |

## 完了条件
- [ ] バンドル分析レポートが作成されている
- [ ] 不要な import が削除されている
- [ ] `pnpm nx build web` で WARNING が解消されている（or 根拠のある閾値調整）
