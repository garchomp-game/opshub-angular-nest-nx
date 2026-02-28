import { test, expect, Page } from '@playwright/test';

/**
 * UI スモークテスト
 *
 * 前提: Playwright config の webServer が API (port 3000) と Web (port 4200) を起動する。
 * テスト用ユーザー: admin@demo.com / Password123
 */

// ─── Helper ───

async function loginViaUI(page: Page, email = 'admin@demo.com', password = 'Password123') {
    await page.goto('/login');

    // ログインフォームに入力
    await page.getByLabel('メールアドレス').fill(email);
    await page.getByLabel('パスワード').fill(password);
    await page.getByRole('button', { name: /ログイン/i }).click();

    // ダッシュボードへの遷移を待つ
    await page.waitForURL('**/dashboard**', { timeout: 10_000 });
}

// ─── Tests ───

test.describe('ログイン', () => {
    test('メールとパスワードでログインできること', async ({ page }) => {
        await loginViaUI(page);

        // ダッシュボードが表示されている
        await expect(page).toHaveURL(/dashboard/);
    });

    test('不正な資格情報ではログインできないこと', async ({ page }) => {
        await page.goto('/login');

        await page.getByLabel('メールアドレス').fill('admin@demo.com');
        await page.getByLabel('パスワード').fill('wrong-password');
        await page.getByRole('button', { name: /ログイン/i }).click();

        // エラーが表示され、ログインページに留まる
        await expect(page).toHaveURL(/login/);
    });
});

test.describe('セッション永続化', () => {
    test('ページリロード後もログイン状態が維持されること', async ({ page }) => {
        await loginViaUI(page);
        await expect(page).toHaveURL(/dashboard/);

        // F5 リロード
        await page.reload();

        // ダッシュボードに留まっている（/login にリダイレクトされない）
        await page.waitForLoadState('networkidle');
        await expect(page).toHaveURL(/dashboard/);
    });
});

test.describe('ナビゲーション', () => {
    test.beforeEach(async ({ page }) => {
        await loginViaUI(page);
    });

    const pages = [
        { name: 'ダッシュボード', url: /dashboard/ },
        { name: 'プロジェクト', url: /projects/ },
        { name: 'ワークフロー', url: /workflows/ },
        { name: '経費', url: /expenses/ },
        { name: '工数', url: /timesheets/ },
    ];

    for (const p of pages) {
        test(`${p.name}ページに遷移できること`, async ({ page }) => {
            // サイドバーのリンクをクリック
            const link = page.getByRole('link', { name: new RegExp(p.name, 'i') });

            // リンクが存在しない場合はURLで直接遷移
            if (await link.count() > 0) {
                await link.first().click();
            } else {
                const path = p.url.source.replace(/\\/g, '');
                await page.goto(`/${path}`);
            }

            await expect(page).toHaveURL(p.url);
        });
    }
});

test.describe('認証ガード', () => {
    test('未認証でダッシュボードにアクセスするとログインにリダイレクトされること', async ({ page }) => {
        await page.goto('/dashboard');

        // ログインページにリダイレクトされる
        await expect(page).toHaveURL(/login/);
    });
});

// ═══════════════════════════════════════════════════════════════
// Tier A: セキュリティ & セッション
// ═══════════════════════════════════════════════════════════════

// ─── A-6: ダッシュボード以外のページでの F5 リロード ───

test.describe('各ページでのセッション永続化', () => {
    test('/workflows ページでリロードしてもログイン状態が維持されること', async ({ page }) => {
        await loginViaUI(page);

        // /workflows に遷移
        await page.goto('/workflows');
        await page.waitForLoadState('networkidle');
        await expect(page).toHaveURL(/workflows/);

        // F5 リロード
        await page.reload();
        await page.waitForLoadState('networkidle');

        // /login にリダイレクトされない
        await expect(page).toHaveURL(/workflows/);
    });

    test('/expenses ページでリロードしてもログイン状態が維持されること', async ({ page }) => {
        await loginViaUI(page);

        await page.goto('/expenses');
        await page.waitForLoadState('networkidle');

        await page.reload();
        await page.waitForLoadState('networkidle');

        await expect(page).toHaveURL(/expenses/);
    });
});

// ─── A-7: ログアウト → 再ログイン ───

test.describe('ログアウト → 再ログイン', () => {
    test('ログアウト後に /login にリダイレクトされ、再ログインできること', async ({ page }) => {
        await loginViaUI(page);
        await expect(page).toHaveURL(/dashboard/);

        // DaisyUI ドロップダウンを開く → ログアウトボタンをクリック
        // sidebar のログアウトボタン (lg:drawer-open で常に表示)
        const sidebarLogout = page.locator('[data-testid="sidebar-logout-btn"]');
        const headerLogout = page.locator('[data-testid="logout-btn"]');

        if (await sidebarLogout.isVisible()) {
            await sidebarLogout.click();
        } else {
            // ヘッダーのドロップダウンを開く
            const userDropdown = page.locator('[data-testid="user-dropdown"] [role="button"]');
            await userDropdown.click();
            await page.waitForTimeout(300);
            await headerLogout.click();
        }

        // ログインページに遷移
        await page.waitForURL('**/login**', { timeout: 10_000 });
        await expect(page).toHaveURL(/login/);

        // 再ログイン
        await loginViaUI(page);
        await expect(page).toHaveURL(/dashboard/);
    });
});

// ═══════════════════════════════════════════════════════════════
// Tier B: ルーティング
// ═══════════════════════════════════════════════════════════════

// ─── B-4: 404 ページ ───

test.describe('404 ページ', () => {
    test('存在しない URL にアクセスすると 404 ページが表示されること', async ({ page }) => {
        await loginViaUI(page);

        await page.goto('/nonexistent-page-xyz');
        await page.waitForLoadState('networkidle');

        // 404 コンポーネントが表示される（ログインにリダイレクトされない）
        const bodyText = await page.textContent('body');
        expect(bodyText).toMatch(/見つかりません|404|not found/i);
    });
});
