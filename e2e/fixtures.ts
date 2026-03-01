import { test as base, Page } from '@playwright/test';

/**
 * sessionStorage を storageState から復元する初期化スクリプト。
 * page.addInitScript で登録し、すべてのナビゲーション・リロードで自動実行される。
 */
const RESTORE_SESSION_SCRIPT = `
    (() => {
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('__ss__')) {
                sessionStorage.setItem(key.slice(6), localStorage.getItem(key));
            }
        }
    })();
`;

/**
 * カスタム fixture: 認証済みページを提供する。
 * addInitScript で sessionStorage 復元を全ナビゲーションに適用し、
 * /dashboard に遷移した状態で使える。
 */
export const test = base.extend<{ authenticatedPage: Page }>({
    authenticatedPage: async ({ page }, use) => {
        // すべてのページロード時に自動で sessionStorage を復元
        await page.addInitScript(RESTORE_SESSION_SCRIPT);
        await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
        await page.waitForSelector('[data-testid="app-sidebar"]', { timeout: 15_000 });
        await use(page);
    },
});

export { expect } from '@playwright/test';
