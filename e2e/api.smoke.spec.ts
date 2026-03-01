/// <reference types="node" />
import { test, expect, APIRequestContext } from '@playwright/test';

const API_BASE = 'http://localhost:3000/api';

// ─── Helper ───

async function login(request: APIRequestContext, email = 'admin@demo.com'): Promise<string> {
    const res = await request.post(`${API_BASE}/auth/login`, {
        data: { email, password: 'Password123' },
    });
    expect(res.ok()).toBe(true);
    const body = await res.json();
    return body.data.accessToken;
}

// ─── Health Check ───

test('GET /api/health が正常応答を返すこと', async ({ request }) => {
    const res = await request.get(`${API_BASE}/health`);
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.status).toBe('ok');
    expect(body.data.info.database.status).toBe('up');
});

// ─── Auth Flow ───

test('POST /api/auth/login で JWT が取得できること', async ({ request }) => {
    const res = await request.post(`${API_BASE}/auth/login`, {
        data: { email: 'admin@demo.com', password: 'Password123' },
    });
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.accessToken).toBeTruthy();
    expect(body.data.refreshToken).toBeTruthy();
});

test('認証なしで /api/workflows にアクセスすると 401 になること', async ({ request }) => {
    const res = await request.get(`${API_BASE}/workflows`);
    expect(res.status()).toBe(401);
});

test('JWT 付きで /api/workflows にアクセスできること', async ({ request }) => {
    const token = await login(request);
    const res = await request.get(`${API_BASE}/workflows`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(body.success).toBe(true);
});

// ─── Module Endpoints Smoke Test ───
// Note: admin routes have controller prefix 'api/admin' + global prefix 'api' = '/api/api/admin'
// Note: invoices require pm/accounting/tenant_admin role

const endpoints = [
    { name: 'workflows', path: '/workflows' },
    { name: 'projects', path: '/projects' },
    { name: 'timesheets', path: '/timesheets/weekly?weekStart=2026-02-23' },
    { name: 'expenses', path: '/expenses' },
    { name: 'notifications', path: '/notifications' },
    { name: 'invoices', path: '/invoices', user: 'accounting@demo.com' },
    { name: 'dashboard', path: '/dashboard' },
    { name: 'search', path: '/search?q=test' },
    { name: 'admin/users', path: '/admin/users' },
    { name: 'admin/audit-logs', path: '/admin/audit-logs' },
];

for (const ep of endpoints) {
    test(`GET ${ep.name} が 200 を返すこと`, async ({ request }) => {
        const token = await login(request, ep.user);
        const res = await request.get(`${API_BASE}${ep.path}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        expect(res.ok()).toBe(true);
        const body = await res.json();
        expect(body.success).toBe(true);
    });
}

// ─── CRUD Smoke: Workflow ───

test('ワークフロー CRUD が一通り動作すること', async ({ request }) => {
    const token = await login(request);
    const headers = { Authorization: `Bearer ${token}` };

    // 承認者の ID を取得
    const usersRes = await request.get(`${API_BASE}/admin/users`, { headers });
    expect(usersRes.ok()).toBe(true);
    const usersBody = await usersRes.json();
    // Response shape may be {data: [...]} or {data: {data: [...], meta: {...}}}
    const userList = Array.isArray(usersBody.data) ? usersBody.data
        : Array.isArray(usersBody.data?.data) ? usersBody.data.data : [];
    const approverUser = userList.find((u: any) => u.email === 'approver@demo.com');
    expect(approverUser).toBeTruthy();

    // 新規作成
    const createRes = await request.post(`${API_BASE}/workflows`, {
        headers,
        data: {
            type: 'expense',
            title: 'E2E テスト経費申請',
            description: 'Playwright E2E テストによる自動作成',
            amount: 5000,
            approverId: approverUser?.id || approverUser?.userId,
            action: 'draft',
        },
    });
    expect(createRes.ok()).toBe(true);
    const createBody = await createRes.json();
    expect(createBody.data.title).toBe('E2E テスト経費申請');
    expect(createBody.data.status).toBe('draft');
    const workflowId = createBody.data.id;

    // 詳細取得
    const detailRes = await request.get(`${API_BASE}/workflows/${workflowId}`, { headers });
    expect(detailRes.ok()).toBe(true);
    const detailBody = await detailRes.json();
    expect(detailBody.data.id).toBe(workflowId);
});

// ═══════════════════════════════════════════════════════════════
// Tier A: セキュリティ & セッション
// ═══════════════════════════════════════════════════════════════

// ─── A-1: トークンリフレッシュ ───

test('リフレッシュトークンで新しいアクセストークンが取得できること', async ({ request }) => {
    // login → refreshToken 取得
    const loginRes = await request.post(`${API_BASE}/auth/login`, {
        data: { email: 'admin@demo.com', password: 'Password123' },
    });
    const loginBody = await loginRes.json();
    const refreshToken = loginBody.data.refreshToken;
    expect(refreshToken).toBeTruthy();

    // refresh → 新しい accessToken
    const refreshRes = await request.post(`${API_BASE}/auth/refresh`, {
        data: { refreshToken },
    });
    expect(refreshRes.ok()).toBe(true);
    const refreshBody = await refreshRes.json();
    expect(refreshBody.success).toBe(true);
    expect(refreshBody.data.accessToken).toBeTruthy();

    // NOTE: 同一秒内に発行された JWT は同一になり得るため、
    //       トークンが異なることのアサーションは行わない

    // 新しいトークンで API アクセス
    const meRes = await request.get(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${refreshBody.data.accessToken}` },
    });
    expect(meRes.ok()).toBe(true);
});

// ─── A-2: ワークフロー状態遷移フルサイクル ───

test('ワークフロー draft → submit → approve のフルサイクルが動作すること', async ({ request }) => {
    const memberToken = await login(request, 'member@demo.com');
    const memberHeaders = { Authorization: `Bearer ${memberToken}` };

    // 承認者 ID を取得
    const adminToken = await login(request);
    const usersRes = await request.get(`${API_BASE}/admin/users`, {
        headers: { Authorization: `Bearer ${adminToken}` },
    });
    const usersBody = await usersRes.json();
    const userList = Array.isArray(usersBody.data) ? usersBody.data
        : Array.isArray(usersBody.data?.data) ? usersBody.data.data : [];
    const approver = userList.find((u: any) => u.email === 'approver@demo.com');

    // 1. create (draft)
    const createRes = await request.post(`${API_BASE}/workflows`, {
        headers: memberHeaders,
        data: {
            type: 'leave',
            title: 'E2E 状態遷移テスト',
            description: '状態遷移フルサイクル検証',
            approverId: approver?.id || approver?.userId,
            action: 'draft',
        },
    });
    expect(createRes.ok()).toBe(true);
    const wf = (await createRes.json()).data;
    expect(wf.status).toBe('draft');

    // 2. submit
    const submitRes = await request.post(`${API_BASE}/workflows/${wf.id}/submit`, {
        headers: memberHeaders,
    });
    expect(submitRes.ok()).toBe(true);
    expect((await submitRes.json()).data.status).toBe('submitted');

    // 3. approve (承認者で実行)
    const approverToken = await login(request, 'approver@demo.com');
    const approveRes = await request.post(`${API_BASE}/workflows/${wf.id}/approve`, {
        headers: { Authorization: `Bearer ${approverToken}` },
    });
    expect(approveRes.ok()).toBe(true);
    expect((await approveRes.json()).data.status).toBe('approved');
});

// ─── A-3: 認可チェック (createdBy) ───

test('他人のワークフローを更新しようとすると 403 になること', async ({ request }) => {
    // member で作成
    const memberToken = await login(request, 'member@demo.com');
    const adminToken = await login(request);

    // 承認者 ID
    const usersRes = await request.get(`${API_BASE}/admin/users`, {
        headers: { Authorization: `Bearer ${adminToken}` },
    });
    const usersBody = await usersRes.json();
    const userList = Array.isArray(usersBody.data) ? usersBody.data
        : Array.isArray(usersBody.data?.data) ? usersBody.data.data : [];
    const approver = userList.find((u: any) => u.email === 'approver@demo.com');

    const createRes = await request.post(`${API_BASE}/workflows`, {
        headers: { Authorization: `Bearer ${memberToken}` },
        data: {
            type: 'expense',
            title: 'E2E 認可テスト',
            approverId: approver?.id || approver?.userId,
            action: 'draft',
        },
    });
    const wfId = (await createRes.json()).data.id;

    // PM で更新を試みる → 403
    const pmToken = await login(request, 'pm@demo.com');
    const updateRes = await request.patch(`${API_BASE}/workflows/${wfId}`, {
        headers: { Authorization: `Bearer ${pmToken}` },
        data: { title: '不正な更新' },
    });
    expect(updateRes.status()).toBe(403);
});

// ─── A-4: ロールベースアクセス制御 ───

test('member ロールで /invoices にアクセスすると 403 になること', async ({ request }) => {
    const token = await login(request, 'member@demo.com');
    const res = await request.get(`${API_BASE}/invoices`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status()).toBe(403);
});

test('member ロールで /admin/users にアクセスすると 403 になること', async ({ request }) => {
    const token = await login(request, 'member@demo.com');
    const res = await request.get(`${API_BASE}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status()).toBe(403);
});

// ─── A-5: バリデーションエラー ───

test('必須フィールド未入力で POST /workflows すると 400 になること', async ({ request }) => {
    const token = await login(request);
    const res = await request.post(`${API_BASE}/workflows`, {
        headers: { Authorization: `Bearer ${token}` },
        data: {},  // 必須フィールドなし
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('ERR-VAL-000');
});

// ═══════════════════════════════════════════════════════════════
// Tier B: CRUD & ビジネスロジック
// ═══════════════════════════════════════════════════════════════

// ─── B-1: 経費作成 → 一覧に表示 ───

test('経費を作成し一覧で取得できること', async ({ request }) => {
    const token = await login(request);
    const headers = { Authorization: `Bearer ${token}` };

    // プロジェクト一覧から ID を取得
    const projRes = await request.get(`${API_BASE}/projects`, { headers });
    const projBody = await projRes.json();
    const projects = Array.isArray(projBody.data) ? projBody.data
        : Array.isArray(projBody.data?.data) ? projBody.data.data : [];

    // 承認者 ID
    const usersRes = await request.get(`${API_BASE}/admin/users`, { headers });
    const usersBody = await usersRes.json();
    const userList = Array.isArray(usersBody.data) ? usersBody.data
        : Array.isArray(usersBody.data?.data) ? usersBody.data.data : [];
    const approver = userList.find((u: any) => u.email === 'approver@demo.com');

    if (projects.length > 0 && approver) {
        const createRes = await request.post(`${API_BASE}/expenses`, {
            headers,
            data: {
                category: '交通費',
                amount: 1500,
                expenseDate: '2026-02-28',
                description: 'E2E テスト交通費',
                projectId: projects[0].id,
                approverId: approver.id || approver.userId,
            },
        });
        expect(createRes.status()).toBe(201);
        const expenseId = (await createRes.json()).data.id;

        // 一覧に含まれている
        const listRes = await request.get(`${API_BASE}/expenses`, { headers });
        const listBody = await listRes.json();
        const items = Array.isArray(listBody.data) ? listBody.data
            : Array.isArray(listBody.data?.data) ? listBody.data.data : [];
        expect(items.some((e: any) => e.id === expenseId)).toBe(true);
    }
});

// ─── B-3: ワークフロー reject → ステータス確認 ───

test('ワークフロー submit → reject が動作すること', async ({ request }) => {
    const memberToken = await login(request, 'member@demo.com');
    const memberHeaders = { Authorization: `Bearer ${memberToken}` };
    const adminToken = await login(request);

    // 承認者 ID
    const usersRes = await request.get(`${API_BASE}/admin/users`, {
        headers: { Authorization: `Bearer ${adminToken}` },
    });
    const usersBody = await usersRes.json();
    const userList = Array.isArray(usersBody.data) ? usersBody.data
        : Array.isArray(usersBody.data?.data) ? usersBody.data.data : [];
    const approver = userList.find((u: any) => u.email === 'approver@demo.com');

    // create → submit
    const createRes = await request.post(`${API_BASE}/workflows`, {
        headers: memberHeaders,
        data: {
            type: 'other',
            title: 'E2E reject テスト',
            approverId: approver?.id || approver?.userId,
            action: 'draft',
        },
    });
    const wfId = (await createRes.json()).data.id;

    await request.post(`${API_BASE}/workflows/${wfId}/submit`, {
        headers: memberHeaders,
    });

    // reject
    const approverToken = await login(request, 'approver@demo.com');
    const rejectRes = await request.post(`${API_BASE}/workflows/${wfId}/reject`, {
        headers: { Authorization: `Bearer ${approverToken}` },
        data: { reason: 'E2E テスト: 内容不十分' },
    });
    expect(rejectRes.ok()).toBe(true);
    expect((await rejectRes.json()).data.status).toBe('rejected');
});

// ─── B-4: 404 エンドポイント ───

test('存在しない API エンドポイントが 404 を返すこと', async ({ request }) => {
    const token = await login(request);
    const res = await request.get(`${API_BASE}/nonexistent-endpoint`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status()).toBe(404);
});

// ═══════════════════════════════════════════════════════════════
// Tier C: Phase 4-5 テスト
// ═══════════════════════════════════════════════════════════════

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

        // 既読化 (204 No Content)
        const readRes = await request.patch(`${API_BASE}/notifications/${notiId}/read`, { headers });
        expect(readRes.status()).toBe(204);

        // 削除 (204 No Content)
        const deleteRes = await request.delete(`${API_BASE}/notifications/${notiId}`, { headers });
        expect(deleteRes.status()).toBe(204);
    }
});

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
    const attListRes = await request.get(`${API_BASE}/workflows/${wfId}/attachments`, { headers });
    expect(attListRes.ok()).toBe(true);
    const attachments = (await attListRes.json()).data;
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
