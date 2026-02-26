import { defineConfig } from '@playwright/test';

declare const process: { env: Record<string, string | undefined> };

export default defineConfig({
    testDir: './e2e',
    fullyParallel: false,
    retries: 0,
    workers: 1,
    reporter: 'list',
    timeout: 30_000,
    use: {
        baseURL: 'http://localhost:4200',
        trace: 'on-first-retry',
    },
    webServer: [
        {
            command: 'pnpm nx serve api',
            url: 'http://localhost:3000/api/health',
            reuseExistingServer: !process.env['CI'],
            timeout: 30_000,
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
        {
            name: 'ui-smoke',
            testMatch: /ui\.smoke\.spec\.ts/,
            use: { browserName: 'chromium', headless: true },
        },
    ],
});
