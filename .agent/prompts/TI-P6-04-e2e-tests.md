# TI-P6-04: Phase 4-5 E2E テスト追加 (API + UI)

## 共通ルール
// turbo-all
- `pnpm`, `npx`, `nx` 等のコマンドは自由に実行してよい
- `sudo` が必要な操作やシステム設定変更のみユーザーに確認

## 概要
Phase 4 (通知, パスワードリセット, WF 添付) + Phase 5 (レート制限) の E2E テストを追加する。
既存テスト (`api.smoke.spec.ts`, `ui.smoke.spec.ts`) に追記する形式。

## テスト実行環境
- Playwright 設定: `playwright.config.ts` (ルート)
- テストディレクトリ: `e2e/`
- プロジェクト: `api-smoke` + `ui-smoke`
- webServer: API (`localhost:3000`) + Web (`localhost:4200`) が自動起動
- テストアカウント: `admin@demo.com` / `Password123` 等

## 作業内容

### 1. `e2e/api.smoke.spec.ts` に追記

#### C-1: 通知 API テスト
```typescript
// ─── C-1: 通知 CRUD ───
test('通知一覧が取得でき、既読化と削除が動作すること', async ({ request }) => {
    const token = await login(request);
    const headers = { Authorization: `Bearer ${token}` };

    // 通知一覧取得
    const listRes = await request.get(`${API_BASE}/notifications`, { headers });
    expect(listRes.ok()).toBe(true);
    const listBody = await listRes.json();
    expect(listBody.success).toBe(true);

    // 通知が存在する場合、既読化と削除をテスト
    const notifications = Array.isArray(listBody.data) ? listBody.data
        : Array.isArray(listBody.data?.data) ? listBody.data.data : [];
    if (notifications.length > 0) {
        const notiId = notifications[0].id;

        // 既読化
        const readRes = await request.patch(`${API_BASE}/notifications/${notiId}/read`, { headers });
        expect(readRes.ok()).toBe(true);

        // 削除
        const deleteRes = await request.delete(`${API_BASE}/notifications/${notiId}`, { headers });
        expect(deleteRes.status()).toBe(204);
    }
});
```

#### C-2: パスワードリセット API テスト
```typescript
// ─── C-2: パスワードリセット ───
test('forgot-password が存在しないメールでも 200 を返すこと', async ({ request }) => {
    const res = await request.post(`${API_BASE}/auth/forgot-password`, {
        data: { email: 'nonexistent@example.com' },
    });
    expect(res.ok()).toBe(true);  // セキュリティ: 存在有無を漏らさない
});

test('forgot-password がバリデーション違反で 400 を返すこと', async ({ request }) => {
    const res = await request.post(`${API_BASE}/auth/forgot-password`, {
        data: { email: '' },
    });
    expect(res.status()).toBe(400);
});

test('reset-password が無効なトークンで 400 を返すこと', async ({ request }) => {
    const res = await request.post(`${API_BASE}/auth/reset-password`, {
        data: { token: 'invalid-token', newPassword: 'NewPassword123' },
    });
    expect(res.status()).toBe(400);
});
```

#### C-3: WF 添付ファイル API テスト
```typescript
// ─── C-3: WF 添付ファイル ───
test('ワークフローに添付ファイルをアップロード・一覧・削除できること', async ({ request }) => {
    const token = await login(request);
    const headers = { Authorization: `Bearer ${token}` };

    // ワークフロー作成
    const usersRes = await request.get(`${API_BASE}/admin/users`, { headers });
    const usersBody = await usersRes.json();
    const userList = Array.isArray(usersBody.data) ? usersBody.data
        : Array.isArray(usersBody.data?.data) ? usersBody.data.data : [];
    const approver = userList.find((u: any) => u.email === 'approver@demo.com');

    const createRes = await request.post(`${API_BASE}/workflows`, {
        headers,
        data: {
            type: 'expense',
            title: 'E2E 添付ファイルテスト',
            approverId: approver?.id || approver?.userId,
            action: 'draft',
        },
    });
    const wfId = (await createRes.json()).data.id;

    // テキストファイルをアップロード
    const uploadRes = await request.post(`${API_BASE}/workflows/${wfId}/attachments`, {
        headers,
        multipart: {
            file: {
                name: 'test.txt',
                mimeType: 'text/plain',
                buffer: Buffer.from('E2E テスト添付ファイル'),
            },
        },
    });
    expect(uploadRes.ok()).toBe(true);
    const attachment = (await uploadRes.json()).data;
    expect(attachment.fileName).toBe('test.txt');

    // 一覧取得
    const listRes = await request.get(`${API_BASE}/workflows/${wfId}/attachments`, { headers });
    expect(listRes.ok()).toBe(true);
    const attachments = (await listRes.json()).data;
    expect(attachments.length).toBeGreaterThanOrEqual(1);

    // 削除
    const deleteRes = await request.delete(
        `${API_BASE}/workflows/${wfId}/attachments/${attachment.id}`, { headers }
    );
    expect(deleteRes.status()).toBe(204);
});

test('許可されていない MIME タイプのアップロードが拒否されること', async ({ request }) => {
    const token = await login(request);
    const headers = { Authorization: `Bearer ${token}` };

    // 既存のワークフローを取得 or 作成
    const listRes = await request.get(`${API_BASE}/workflows`, { headers });
    const workflows = (await listRes.json()).data;
    const wfList = Array.isArray(workflows) ? workflows
        : Array.isArray(workflows?.data) ? workflows.data : [];

    if (wfList.length > 0) {
        const wfId = wfList[0].id;
        const uploadRes = await request.post(`${API_BASE}/workflows/${wfId}/attachments`, {
            headers,
            multipart: {
                file: {
                    name: 'test.exe',
                    mimeType: 'application/x-msdownload',
                    buffer: Buffer.from('fake EXE'),
                },
            },
        });
        expect(uploadRes.status()).toBe(400);
    }
});
```

### 2. `e2e/ui.smoke.spec.ts` に追記

#### UI-C1: 通知ページ遷移
```typescript
test.describe('通知ページ', () => {
    test('/notifications に遷移できること', async ({ page }) => {
        await loginViaUI(page);
        await page.goto('/notifications');
        await page.waitForLoadState('networkidle');
        await expect(page).toHaveURL(/notifications/);
    });
});
```

#### UI-C2: パスワードリセット画面
```typescript
test.describe('パスワードリセット', () => {
    test('forgot-password ページが表示されること', async ({ page }) => {
        await page.goto('/forgot-password');
        await expect(page.getByTestId('forgot-password-card')).toBeVisible();
    });

    test('ログイン画面から forgot-password にリンクで遷移できること', async ({ page }) => {
        await page.goto('/login');
        await page.getByTestId('forgot-password-link').click();
        await expect(page).toHaveURL(/forgot-password/);
    });

    test('reset-password ページがトークンなしでエラー表示すること', async ({ page }) => {
        await page.goto('/reset-password');
        await expect(page.getByTestId('token-error')).toBeVisible();
    });

    test('forgot-password フォームを送信できること', async ({ page }) => {
        await page.goto('/forgot-password');
        await page.getByTestId('email-input').fill('admin@demo.com');
        await page.getByTestId('submit-button').click();
        // 成功メッセージが表示される
        await expect(page.getByTestId('success-message')).toBeVisible({ timeout: 10_000 });
    });
});
```

### 3. ナビゲーションテストに通知ページ追加
`ui.smoke.spec.ts` のナビゲーションテストの `pages` 配列に追加:
```typescript
{ name: '通知', url: /notifications/ },
```

### 4. Playwright config の更新（不要な場合はスキップ）
新しいテストファイルを分割する場合のみ `playwright.config.ts` を更新。
既存ファイルへの追記の場合は不要。

### 5. テスト実行
```bash
# API + Web サーバーが起動している状態で:
npx playwright test
```

**注意**: E2E テストの実行にはデータベースにシードデータが必要。
```bash
npx prisma db seed --schema=libs/prisma-db/prisma/schema.prisma
```

## 参照ファイル
- `e2e/api.smoke.spec.ts` — 既存 API テスト (追加対象)
- `e2e/ui.smoke.spec.ts` — 既存 UI テスト (追加対象)
- `playwright.config.ts` — Playwright 設定
- `apps/api/src/modules/auth/auth.controller.ts` — forgot-password / reset-password エンドポイント
- `apps/api/src/modules/notifications/notification.controller.ts` — 通知 DELETE エンドポイント
- `apps/api/src/modules/workflows/workflows.controller.ts` — 添付ファイルエンドポイント
- `apps/web/src/app/core/auth/forgot-password/forgot-password.component.ts` — data-testid 参照
- `apps/web/src/app/core/auth/reset-password/reset-password.component.ts` — data-testid 参照

## 完了条件
- [ ] 通知 API テスト (一覧/既読化/削除) が追加されている
- [ ] パスワードリセット API テスト (forgot-password/reset-password) が追加されている
- [ ] WF 添付ファイル API テスト (アップロード/一覧/削除/MIME 拒否) が追加されている
- [ ] 通知ページ UI テスト (遷移) が追加されている
- [ ] パスワードリセット UI テスト (画面表示/リンク遷移/フォーム送信/トークンエラー) が追加されている
- [ ] ナビゲーションテストに通知ページが含まれている
- [ ] `npx playwright test` で全テストがパスする
