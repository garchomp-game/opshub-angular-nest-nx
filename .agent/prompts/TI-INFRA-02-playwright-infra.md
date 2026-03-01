# TI-INFRA-02: Playwright テスト基盤の改善

## 共通ルール
// turbo-all
- `pnpm`, `npx`, `nx` 等のコマンドは自由に実行してよい
- `sudo` が必要な操作やシステム設定変更のみユーザーに確認

## 概要
`retries: 1` + `workers: 1` の現状は flaky テストへの対症療法。
テスト基盤を改善し、テスト実行時間の短縮と信頼性を向上させる。

## 依存
- TI-E2E-02（restoreSession 修正）の完了を推奨

## 現在の設定

### `playwright.config.ts`
```typescript
export default defineConfig({
    testDir: './e2e',
    fullyParallel: false,
    retries: 1,           // ← 対症療法
    workers: 1,           // ← sessionStorage 競合で並列化できない
    reporter: 'list',
    timeout: 30_000,
    // ...
    projects: [
        { name: 'setup', testMatch: /auth\.setup\.ts/ },
        {
            name: 'ui-smoke',
            testMatch: /ui\.smoke\.spec\.ts$/,
            dependencies: ['setup'],
            use: { storageState: 'e2e/.auth/user.json' },
        },
    ],
});
```

### テスト実行時間
- 現在: ~3.2 分（`retries: 1`, `workers: 1`）
- 目標: **1.5 分以内**（`retries: 0`, `workers: 2+`）

## 作業内容

### 1. テスト並列化の調査

- [ ] `workers: 2` 以上にした場合の影響を調査
  - Playwright の `storageState` は browser context 単位 → 各テストが独立した context で動く
  - `sessionStorage` は tab (page) 単位 → context が別ならば干渉しない
  - 問題: `storageState` で `sessionStorage` を復元する `__ss__` の仕組みが context 間で共有される localStorage に依存
- [ ] `fullyParallel: true` にした場合の動作確認
- [ ] テスト間で共有状態（DB のデータ等）が競合しないか確認

### 2. `storageState` と sessionStorage の改善

- [ ] Playwright の `storageState` は公式に `cookies` + `localStorage` のみサポート
- [ ] 代替案 A: カスタム fixture で `sessionStorage` を独自保存/復元
  ```typescript
  // e2e/fixtures.ts
  import { test as base } from '@playwright/test';
  export const test = base.extend({
      page: async ({ page }, use) => {
          await page.goto('/login');
          await page.evaluate(() => {
              // ... sessionStorage 復元
          });
          await use(page);
      },
  });
  ```
- [ ] 代替案 B: API ベースログインを各テストの fixture に組み込む

### 3. CI 環境での Docker Compose 自動起動

- [ ] `.github/workflows/ci.yml` に `services` セクションを追加:
  ```yaml
  services:
      postgres:
          image: postgres:16-alpine
          env:
              POSTGRES_USER: postgres
              POSTGRES_PASSWORD: postgres
              POSTGRES_DB: opshub
          ports:
              - 5432:5432
          options: >-
              --health-cmd pg_isready
              --health-interval 10s
              --health-timeout 5s
              --health-retries 5
      redis:
          image: redis:7-alpine
          ports:
              - 6379:6379
          options: >-
              --health-cmd "redis-cli ping"
              --health-interval 10s
              --health-timeout 5s
              --health-retries 5
  ```
- [ ] MailHog は CI で必要か検討（メール系テストを CI でスキップする選択肢）

### 4. `.gitignore` 確認

- [ ] `e2e/.auth/` が `.gitignore` に含まれているか確認
- [ ] `test-results/` が `.gitignore` に含まれているか確認

### 5. テスト実行時間の最適化

- [ ] テストごとの実行時間を分析:
  ```bash
  pnpm playwright test --project=ui-smoke --reporter=json | jq '.suites[].specs[].tests[].results[].duration'
  ```
- [ ] `restoreSession` 呼び出し回数の削減（同じ describe ブロック内で共有）
- [ ] `waitForLoadState('networkidle')` のタイムアウトを最適化
- [ ] 不要な `waitForTimeout()` の削除

## 対象ファイル

| パス | 変更内容 |
|------|---------|
| `playwright.config.ts` | MODIFY: workers, fullyParallel, retries の最適化 |
| `e2e/ui.smoke.spec.ts` | MODIFY: fixture 導入時のテストリファクタリング |
| `.github/workflows/ci.yml` | MODIFY: services セクション追加 |
| `.gitignore` | MODIFY: e2e/.auth/ と test-results/ の追加確認 |

## 完了条件
- [ ] `workers: 2` 以上で全テスト PASS が確認されている
- [ ] テスト実行時間が 1.5 分以内
- [ ] CI で Playwright テストが自動実行される環境が構築されている
- [ ] `.gitignore` に必要なパターンが含まれている
