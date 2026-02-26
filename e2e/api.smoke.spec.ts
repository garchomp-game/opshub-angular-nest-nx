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
