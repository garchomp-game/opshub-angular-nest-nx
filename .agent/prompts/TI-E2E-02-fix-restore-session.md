# TI-E2E-02: `restoreSession` を non-flaky にする改修

## 共通ルール
// turbo-all
- `pnpm`, `npx`, `nx` 等のコマンドは自由に実行してよい
- `sudo` が必要な操作やシステム設定変更のみユーザーに確認

## 概要
TI-E2E-01 の調査結果を踏まえ、`restoreSession()` を **`retries: 0` でも 100% 成功** させる改修を実施する。

## 依存
- TI-E2E-01（根本原因調査）の完了を推奨するが、候補アプローチの実装は並行可能

## 現在の問題
`e2e/ui.smoke.spec.ts` の `restoreSession()` が約 20% で失敗。原因は Angular の `AuthService` 初期化（`loadFromStorage` → `fetchProfile`）完了前に auth guard がルーティングを拒否するタイミング競合。

## 現在の `restoreSession` 実装
```typescript
// e2e/ui.smoke.spec.ts L20-53
async function restoreSession(page: Page) {
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i)!;
            if (key.startsWith('__ss__')) {
                sessionStorage.setItem(key.slice(6), localStorage.getItem(key)!);
            }
        }
    });
    await page.reload({ waitUntil: 'networkidle' });
    if (!page.url().includes('/dashboard')) {
        await page.goto('/dashboard', { waitUntil: 'networkidle' });
    }
    // fallback: loginViaUI ← ここがタイムアウトする
    await page.waitForTimeout(500);
    if (page.url().includes('/login')) { /* loginViaUI... */ }
}
```

## 候補アプローチ

### A: `reload` 後に Angular の認証完了を waitForFunction で待つ
```typescript
async function restoreSession(page: Page) {
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => { /* __ss__ → sessionStorage 復元 */ });
    await page.reload({ waitUntil: 'networkidle' });
    // Angular のサイドバーがレンダリングされるまで待つ = auth guard 通過済み
    await page.waitForFunction(
        () => !!document.querySelector('[data-testid="app-sidebar"]'),
        { timeout: 10_000 }
    ).catch(() => {});
    if (!page.url().includes('/dashboard')) {
        await page.goto('/dashboard', { waitUntil: 'networkidle' });
    }
}
```
- **メリット**: アプリ変更不要、テスト側で完結
- **デメリット**: セレクタ依存

### B: `APP_INITIALIZER` に `AuthService.whenReady()` を組み込む
```typescript
// apps/web/src/app/app.config.ts
{
    provide: APP_INITIALIZER,
    useFactory: (auth: AuthService) => () => auth.whenReady(),
    deps: [AuthService],
    multi: true,
}
```
- **メリット**: アプリレベルで Angular 起動 = 認証完了を保証。テスト側変更最小
- **デメリット**: 初回ロード時にプロフィール取得完了まで画面表示がブロックされる

### C: `addInitScript` で sessionStorage をページロード前に注入
```typescript
await page.context().addInitScript(() => {
    const keys = Object.keys(localStorage);
    keys.filter(k => k.startsWith('__ss__')).forEach(k => {
        sessionStorage.setItem(k.slice(6), localStorage.getItem(k)!);
    });
});
await page.goto('/dashboard', { waitUntil: 'networkidle' });
```
- **メリット**: ページロード前にトークンが存在 → `loadFromStorage` が確実に読める
- **デメリット**: `addInitScript` は全ページに適用され、ログアウトテスト等で副作用

### D: API ベースログイン（UI 不使用）
```typescript
const res = await page.request.post('/api/auth/login', {
    data: { email: 'admin@demo.com', password: 'Password123' },
});
const { accessToken, refreshToken } = (await res.json()).data;
await page.evaluate(({ at, rt }) => {
    sessionStorage.setItem('opshub_access_token', at);
    sessionStorage.setItem('opshub_refresh_token', rt);
}, { at: accessToken, rt: refreshToken });
await page.goto('/dashboard', { waitUntil: 'networkidle' });
```
- **メリット**: UI に依存しない、高速
- **デメリット**: `fetchProfile` がまだ完了していない可能性あり

## 作業内容

- [ ] 1 つの候補を選定し、`restoreSession()` を書き換え
- [ ] `playwright.config.ts` の `retries: 0` に変更
- [ ] `pnpm playwright test --project=ui-smoke` を **3 回連続実行** して全 PASS を確認
- [ ] テスト実行時間が 3 分以内を維持していることを確認

## 対象ファイル

| パス | 変更内容 |
|------|---------|
| `e2e/ui.smoke.spec.ts` | MODIFY: `restoreSession()` 書き換え |
| `playwright.config.ts` | MODIFY: `retries: 0` に変更 |
| `apps/web/src/app/app.config.ts` | MODIFY（候補 B の場合のみ）: `APP_INITIALIZER` 追加 |

## 完了条件
- [ ] `retries: 0` で 3 回連続 PASS（0 flaky）
- [ ] テスト実行時間 3 分以内
- [ ] fallback loginViaUI が不要になっている
