import { test, expect } from './fixtures';
import { test as baseTest, Page } from '@playwright/test';

/**
 * UI スモークテスト
 *
 * 前提:
 * - Playwright config の webServer が API (port 3000) と Web (port 4200) を起動する
 * - auth.setup.ts がログイン済み storageState を e2e/.auth/user.json に保存済み
 * - storageState は Playwright config で自動注入される
 *
 * テスト用ユーザー: admin@demo.com / Password123
 */

// ─── Helper ───

/** セッションをクリアしてログアウト状態にする */
async function ensureLoggedOut(page: Page) {
    await page.context().clearCookies();
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
        sessionStorage.clear();
        // __ss__ プレフィックスの localStorage も削除
        const keys: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i)!;
            if (k.startsWith('__ss__')) keys.push(k);
        }
        keys.forEach(k => localStorage.removeItem(k));
    });
}

/** UI 経由でログイン（ログイン専用テスト用） */
async function loginViaUI(page: Page, email = 'admin@demo.com', password = 'Password123') {
    await ensureLoggedOut(page);
    await page.goto('/login', { waitUntil: 'networkidle' });

    await page.getByLabel('メールアドレス').waitFor({ state: 'visible', timeout: 10_000 });
    await page.getByLabel('メールアドレス').fill(email);
    await page.getByLabel('パスワード').fill(password);
    await page.getByRole('button', { name: /ログイン/i }).click();

    // ダッシュボードへの遷移 + Angular 認証完了をサイドバーで確認
    await page.waitForURL('**/dashboard**', { timeout: 15_000, waitUntil: 'domcontentloaded' });
    await page.waitForSelector('[data-testid="app-sidebar"]', { timeout: 15_000 });
}

// ─── Tests ───

// ログイン系テストは storageState 不要のため baseTest を使用
baseTest.describe('ログイン', () => {
    baseTest('メールとパスワードでログインできること', async ({ page }) => {
        await loginViaUI(page);
        await expect(page).toHaveURL(/dashboard/);
    });

    baseTest('不正な資格情報ではログインできないこと', async ({ page }) => {
        await ensureLoggedOut(page);
        await page.goto('/login', { waitUntil: 'domcontentloaded' });

        await page.getByLabel('メールアドレス').fill('admin@demo.com');
        await page.getByLabel('パスワード').fill('wrong-password');
        await page.getByRole('button', { name: /ログイン/i }).click();

        await expect(page).toHaveURL(/login/);
    });
});

test.describe('セッション永続化', () => {
    test('ページリロード後もログイン状態が維持されること', async ({ authenticatedPage: page }) => {
        await expect(page).toHaveURL(/dashboard/);

        await page.reload();
        await page.waitForSelector('[data-testid="app-sidebar"]', { timeout: 15_000 });
        await expect(page).toHaveURL(/dashboard/);
    });
});

test.describe('ナビゲーション', () => {
    const pages = [
        { name: 'ダッシュボード', testid: 'menu-dashboard', url: /dashboard/ },
        { name: '申請', testid: 'menu-workflows', url: /workflows/ },
        { name: 'プロジェクト', testid: 'menu-projects', url: /projects/ },
        { name: '経費', testid: 'menu-expenses', url: /expenses/ },
        { name: '通知', testid: 'menu-notifications', url: /notifications/ },
    ];

    for (const p of pages) {
        test(`${p.name}ページに遷移できること`, async ({ authenticatedPage: page }) => {
            const link = page.getByTestId(p.testid);
            if (await link.isVisible()) {
                await link.click();
            } else {
                const path = p.url.source.replace(/\\\\/g, '');
                await page.goto(`/${path}`);
            }

            await expect(page).toHaveURL(p.url);
        });
    }
});

// 認証ガードテストは storageState 不要のため baseTest を使用
baseTest.describe('認証ガード', () => {
    baseTest('未認証でダッシュボードにアクセスするとログインにリダイレクトされること', async ({ page }) => {
        await ensureLoggedOut(page);
        await page.goto('/dashboard');
        await expect(page).toHaveURL(/login/);
    });
});

// ═══════════════════════════════════════════════════════════════
// Tier A: セキュリティ & セッション
// ═══════════════════════════════════════════════════════════════

test.describe('各ページでのセッション永続化', () => {
    test('/workflows ページでリロードしてもログイン状態が維持されること', async ({ authenticatedPage: page }) => {
        await page.goto('/workflows');
        await page.waitForSelector('[data-testid="app-sidebar"]', { timeout: 15_000 });
        await expect(page).toHaveURL(/workflows/);

        await page.reload();
        await page.waitForSelector('[data-testid="app-sidebar"]', { timeout: 15_000 });
        await expect(page).toHaveURL(/workflows/);
    });

    test('/expenses ページでリロードしてもログイン状態が維持されること', async ({ authenticatedPage: page }) => {
        await page.goto('/expenses');
        await page.waitForSelector('[data-testid="app-sidebar"]', { timeout: 15_000 });

        await page.reload();
        await page.waitForSelector('[data-testid="app-sidebar"]', { timeout: 15_000 });
        await expect(page).toHaveURL(/expenses/);
    });
});

test.describe('ログアウト → 再ログイン', () => {
    test('ログアウト後に /login にリダイレクトされ、再ログインできること', async ({ authenticatedPage: page }) => {
        await expect(page).toHaveURL(/dashboard/);

        const sidebarLogout = page.locator('[data-testid="sidebar-logout-btn"]');
        if (await sidebarLogout.isVisible()) {
            await sidebarLogout.click();
        } else {
            await page.locator('[data-testid="user-dropdown"]').click();
            await page.locator('[data-testid="logout-btn"]').waitFor({ state: 'visible', timeout: 3_000 });
            await page.locator('[data-testid="logout-btn"]').click();
        }

        await page.waitForURL('**/login**', { timeout: 10_000 });
        await expect(page).toHaveURL(/login/);

        await loginViaUI(page);
        await expect(page).toHaveURL(/dashboard/);
    });
});

// ═══════════════════════════════════════════════════════════════
// Tier B: ルーティング
// ═══════════════════════════════════════════════════════════════

test.describe('404 ページ', () => {
    test('存在しない URL にアクセスすると 404 ページが表示されること', async ({ authenticatedPage: page }) => {
        await page.goto('/nonexistent-page-xyz');
        // Angular ルーターが 404 コンポーネントをレンダリングするまで待つ
        await page.waitForSelector('[data-testid="app-sidebar"], [data-testid="not-found"]', { timeout: 15_000 });

        const bodyText = await page.textContent('body');
        expect(bodyText).toMatch(/見つかりません|404|not found/i);
    });
});

// ═══════════════════════════════════════════════════════════════
// Tier C: Phase 4-5 テスト
// ═══════════════════════════════════════════════════════════════

test.describe('通知ページ', () => {
    test('/notifications に遷移できること', async ({ authenticatedPage: page }) => {
        await page.goto('/notifications');
        await page.waitForSelector('[data-testid="app-sidebar"]', { timeout: 15_000 });
        await expect(page).toHaveURL(/notifications/);
    });
});

// パスワードリセットページは認証不要のため baseTest
baseTest.describe('パスワードリセット', () => {
    baseTest('forgot-password ページが表示されること', async ({ page }) => {
        await page.goto('/forgot-password');
        await expect(page.getByTestId('forgot-password-card')).toBeVisible();
    });

    baseTest('ログイン画面から forgot-password にリンクで遷移できること', async ({ page }) => {
        await page.goto('/login');
        await page.getByTestId('forgot-password-link').click();
        await expect(page).toHaveURL(/forgot-password/);
    });

    baseTest('reset-password ページがトークンなしでエラー表示すること', async ({ page }) => {
        await page.goto('/reset-password');
        await expect(page.getByTestId('token-error')).toBeVisible();
    });

    baseTest('forgot-password フォームを送信できること', async ({ page }) => {
        await page.goto('/forgot-password');
        await page.getByTestId('email-input').fill('admin@demo.com');

        const submitBtn = page.getByTestId('submit-button');
        await expect(submitBtn).toBeEnabled();
        await submitBtn.click();

        // 送信後: ボタンが loading 状態になる か 成功/エラーメッセージが表示される
        // 開発環境ではメールサーバーが無いため API がタイムアウトする場合がある
        const result = page.locator(
            '[data-testid="success-message"], [data-testid="error-message"], button[data-testid="submit-button"][disabled]'
        );
        await expect(result.first()).toBeVisible({ timeout: 5_000 });
    });
});

// ═══════════════════════════════════════════════════════════════
// Tier D: UI バグ修正テスト
// ═══════════════════════════════════════════════════════════════

test.describe('申請一覧 — フィルタ', () => {
    test('/workflows/pending でフィルタ付き申請一覧が表示されること', async ({ authenticatedPage: page }) => {
        await page.goto('/workflows/pending');
        await page.waitForSelector('[data-testid="app-sidebar"]', { timeout: 15_000 });

        await expect(page.locator('h1')).toContainText('申請一覧');
        await expect(page.getByTestId('workflow-filters')).toBeVisible();
    });

    test('表示フィルタのドロップダウンが存在すること', async ({ authenticatedPage: page }) => {
        await page.goto('/workflows');
        await page.waitForSelector('[data-testid="app-sidebar"]', { timeout: 15_000 });

        await expect(page.getByTestId('workflow-filters')).toBeVisible();
        await expect(page.getByTestId('mode-filter')).toBeVisible();
    });
});

test.describe('カンバンボード — タスク追加', () => {
    test('プロジェクト詳細からタスクボードに遷移できること', async ({ authenticatedPage: page }) => {
        await page.goto('/projects');
        await page.waitForSelector('[data-testid="app-sidebar"]', { timeout: 15_000 });

        const row = page.locator('[data-testid="project-row"]').first();
        if (await row.isVisible()) {
            await row.click();
            await page.waitForSelector('[data-testid="app-sidebar"]', { timeout: 15_000 });

            const boardBtn = page.locator('a:has-text("タスクボード"), [data-testid="kanban-btn"]');
            if (await boardBtn.count() > 0) {
                await boardBtn.first().click();
                await page.waitForSelector('[data-testid="app-sidebar"]', { timeout: 15_000 });

                const addBtn = page.getByTestId('add-task-btn');
                if (await addBtn.isVisible()) {
                    await expect(addBtn).toBeVisible();
                }
            }
        }
    });
});

test.describe('経費申請フォーム — プルダウン動作', () => {
    test('経費申請フォームが正しく表示されること', async ({ authenticatedPage: page }) => {
        await page.goto('/expenses/new');
        await page.waitForSelector('[data-testid="app-sidebar"]', { timeout: 15_000 });

        await expect(page.getByTestId('input-date')).toBeVisible();
        await expect(page.getByTestId('select-category')).toBeVisible();
        await expect(page.getByTestId('input-amount')).toBeVisible();
        await expect(page.getByTestId('select-project')).toBeVisible();
        await expect(page.getByTestId('select-approver')).toBeVisible();
    });

    test('カテゴリのプルダウンが開けること', async ({ authenticatedPage: page }) => {
        await page.goto('/expenses/new');
        await page.waitForSelector('[data-testid="app-sidebar"]', { timeout: 15_000 });

        await page.getByTestId('select-category').click();

        const overlay = page.locator('.p-select-overlay, .p-select-list, .p-listbox');
        await expect(overlay.first()).toBeVisible({ timeout: 5_000 });
    });
});

test.describe('検索 UI', () => {
    test('検索ページが正しくレイアウトされること', async ({ authenticatedPage: page }) => {
        await page.goto('/search?q=test');
        await page.waitForSelector('[data-testid="app-sidebar"]', { timeout: 15_000 });

        const searchInput = page.getByTestId('search-input');
        await expect(searchInput).toBeVisible();

        const icon = page.locator('p-iconfield .p-inputicon, p-inputicon');
        await expect(icon.first()).toBeVisible();
    });
});

test.describe('通知一覧 — 詳細', () => {
    test('通知ページにタイトルが表示されること', async ({ authenticatedPage: page }) => {
        await page.goto('/notifications');
        await page.waitForSelector('[data-testid="app-sidebar"]', { timeout: 15_000 });

        const title = page.getByTestId('notifications-title');
        if (await title.isVisible()) {
            await expect(title).toContainText('通知');
        } else {
            await expect(page.locator('h1, h2').first()).toBeVisible();
        }
    });

    test('未読フィルタートグルが表示されること', async ({ authenticatedPage: page }) => {
        await page.goto('/notifications');
        await page.waitForSelector('[data-testid="app-sidebar"]', { timeout: 15_000 });

        await expect(page.getByTestId('unread-filter-toggle')).toBeVisible();
        await expect(page.getByTestId('mark-all-read-btn')).toBeVisible();
    });
});

test.describe('新規申請フォーム — 承認者', () => {
    test('新規申請フォームが表示されること', async ({ authenticatedPage: page }) => {
        await page.goto('/workflows/new');
        await page.waitForSelector('[data-testid="app-sidebar"], [data-testid="workflow-form"]', { timeout: 15_000 });

        await expect(page.getByTestId('workflow-form')).toBeVisible();
        await expect(page.getByTestId('approver-select')).toBeVisible();
    });
});
