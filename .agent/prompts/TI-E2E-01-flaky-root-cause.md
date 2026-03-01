# TI-E2E-01: Flaky テストの根本原因調査

## 共通ルール
// turbo-all
- `pnpm`, `npx`, `nx` 等のコマンドは自由に実行してよい
- `sudo` が必要な操作やシステム設定変更のみユーザーに確認

## 概要
`pnpm playwright test --project=ui-smoke` で 27 テスト中 **6 件が flaky**（初回失敗→retry #1 で成功）。
全て同一箇所 `e2e/ui.smoke.spec.ts:51` の `restoreSession()` 内 fallback loginViaUI で失敗する。
根本原因を特定し、修正案の判断材料を揃える。

## 現象の詳細

### エラー内容
```
TimeoutError: page.waitForURL: Timeout 15000ms exceeded.
waiting for navigation to "**/dashboard**" until "load"

at restoreSession (e2e/ui.smoke.spec.ts:51:20)
```

### 失敗パターン
- 失敗するテストは毎回ランダム（テスト実行順に依存）
- retry #1 では 100% 成功する
- 約 20% の確率で各テストが初回失敗する

### `restoreSession()` の処理フロー
```
1. page.goto('/login', { waitUntil: 'domcontentloaded' })
2. page.evaluate() — __ss__ プレフィックスの localStorage → sessionStorage に復元
3. page.reload({ waitUntil: 'networkidle' }) — Angular を再起動
4. page.url() が /dashboard でなければ page.goto('/dashboard')
5. page.url() が /login なら fallback loginViaUI ← ここでタイムアウト
```

## 推定根本原因

`AuthService` の初期化が非同期で遅延実行されていることが競合の原因:

```typescript
// apps/web/src/app/core/auth/auth.service.ts L61-65
constructor() {
    // 循環依存回避のため遅延実行
    Promise.resolve().then(() => this.loadFromStorage());
}
```

`loadFromStorage()` は sessionStorage からトークンを読み取り、`GET /api/auth/me` でプロフィールを取得し、完了時に `_readyPromise` を resolve する。

`authGuard` は `await auth.whenReady()` で待機するが:
- `page.reload({ waitUntil: 'networkidle' })` が Angular の `_readyPromise` 解決を保証しない場合がある
- `networkidle` は「500ms 間ネットワークリクエストがない」だが、Angular のブートストラップ完了とは別
- `fetchProfile()` の HTTP 応答が遅い場合、`networkidle` 判定後にまだ認証処理中

## 調査項目

- [ ] `page.reload()` 後に `page.evaluate()` で `_readyPromise` の状態をデバッグ出力する
  ```typescript
  // デバッグ用コード例
  await page.reload({ waitUntil: 'networkidle' });
  const authState = await page.evaluate(() => {
      return {
          hasToken: !!sessionStorage.getItem('opshub_access_token'),
          url: location.href,
      };
  });
  console.log('Auth state after reload:', authState);
  ```
- [ ] `waitUntil: 'networkidle'` vs `'load'` のタイミングで `sessionStorage` の状態を比較
- [ ] `authGuard` の `whenReady()` が実際にいつ resolve されるかを `console.time` で計測
- [ ] テスト環境の CPU 負荷（`mpstat` 等）がタイミングに影響するか確認
- [ ] `page.waitForFunction()` で Angular の認証完了を直接待つ方式のプロトタイプ:
  ```typescript
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForFunction(() => {
      // Angular の Router outlet がレンダリングされている = auth guard 通過済み
      return document.querySelector('router-outlet')?.nextSibling !== null;
  }, { timeout: 10_000 });
  ```

## 対象ファイル

| パス | 内容 |
|------|------|
| `e2e/ui.smoke.spec.ts` | `restoreSession()` (L20-53) — 調査対象 |
| `e2e/auth.setup.ts` | storageState 保存処理 |
| `apps/web/src/app/core/auth/auth.service.ts` | `loadFromStorage()` (L181), `_readyPromise` (L29), constructor (L61-65) |
| `apps/web/src/app/core/auth/auth.guard.ts` | `await whenReady()` (L10) |
| `playwright.config.ts` | `retries: 1` — 現在の対症療法 |

## 完了条件
- [ ] 根本原因が特定され、文書化されている
- [ ] `restoreSession` のどのステップで競合が起きるか、再現条件が明確
- [ ] TI-E2E-02 への改修判断材料（推奨アプローチ）が提示されている
