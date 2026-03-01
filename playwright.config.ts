import { defineConfig } from '@playwright/test';

declare const process: { env: Record<string, string | undefined> };

export default defineConfig({
    testDir: './e2e',
    fullyParallel: true,
    retries: 0,
    workers: 2,
    reporter: 'list',
    timeout: 30_000,
    use: {
        baseURL: 'http://localhost:4200',
        screenshot: 'only-on-failure',
        trace: 'retain-on-failure',
    },
    webServer: [
        {
            command: 'pnpm nx serve api',
            url: 'http://localhost:3000/api/health',
            reuseExistingServer: !process.env['CI'],
            timeout: 30_000,
            env: {
                THROTTLE_SKIP: 'true',
            },
        },
        {
            command: 'pnpm nx serve web',
            url: 'http://localhost:4200',
            reuseExistingServer: !process.env['CI'],
            timeout: 60_000,
        },
    ],
    projects: [
        {
            name: 'api-smoke',
            testMatch: /api\.smoke\.spec\.ts/,
        },
        // 認証セットアップ — 一度だけ実行してストレージを保存
        {
            name: 'setup',
            testMatch: /auth\.setup\.ts/,
        },
        {
            name: 'ui-smoke',
            testMatch: /ui\.smoke\.spec\.ts/,
            dependencies: ['setup'],
            use: {
                browserName: 'chromium',
                headless: true,
                storageState: 'e2e/.auth/user.json',
            },
        },
    ],
});
