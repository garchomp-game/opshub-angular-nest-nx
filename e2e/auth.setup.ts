import { test as setup } from '@playwright/test';

/**
 * 認証セットアップ — 一度だけ UI ログインして storageState を保存する。
 * 他の全テストはこの storageState を再利用する。
 */
setup('authenticate', async ({ page }) => {
    // /login へ遷移
    await page.goto('/login', { waitUntil: 'networkidle' });

    // ログイン
    await page.getByLabel('メールアドレス').fill('admin@demo.com');
    await page.getByLabel('パスワード').fill('Password123');
    await page.getByRole('button', { name: /ログイン/i }).click();

    // ダッシュボードへの遷移を待つ
    await page.waitForURL('**/dashboard**', { timeout: 30_000 });

    // sessionStorage を storageState に保存する
    // Playwright の storageState は localStorage/cookies のみ保存する。
    // sessionStorage は含まれないので、origins に手動でセット。
    const sessionStorageData = await page.evaluate(() => {
        const data: Record<string, string> = {};
        for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i)!;
            data[key] = sessionStorage.getItem(key)!;
        }
        return data;
    });

    // storageState を保存 — sessionStorage はオリジンの localStorage に入れて保存
    const storage = await page.context().storageState();

    // sessionStorage のデータは origins の localStorage に混ぜて保存
    // テスト側で復元する
    const origin = 'http://localhost:4200';
    const existingOrigin = storage.origins.find(o => o.origin === origin);
    const ssEntries = Object.entries(sessionStorageData).map(([name, value]) => ({
        name: `__ss__${name}`,
        value,
    }));

    if (existingOrigin) {
        existingOrigin.localStorage.push(...ssEntries);
    } else {
        storage.origins.push({
            origin,
            localStorage: ssEntries,
        });
    }

    const fs = await import('fs');
    fs.writeFileSync('e2e/.auth/user.json', JSON.stringify(storage, null, 2));
});
