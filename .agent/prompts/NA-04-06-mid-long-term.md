# NA-04〜06: 中長期改善チケット

## 共通ルール
// turbo-all
- `pnpm`, `npx`, `nx` 等のコマンドは自由に実行してよい
- `sudo` が必要な操作やシステム設定変更のみユーザーに確認

---

## NA-04: admin 子ルートの個別 roleGuard 分離

### 優先度: 低 | 背景: TI-DOC-01

`/admin` は `roleGuard` で `['tenant_admin', 'it_admin']` 保護だが、
API 側 `admin/users` は `tenant_admin` のみ。

#### 対応

```typescript
// apps/web/src/app/features/admin/admin.routes.ts
export const ADMIN_ROUTES: Routes = [
    { path: '', redirectTo: 'tenant', pathMatch: 'full' },
    {
        path: 'tenant',
        data: { roles: ['tenant_admin'], title: 'テナント管理' },
        canActivate: [roleGuard],
        loadComponent: () => import('./tenant.component'),
    },
    {
        path: 'users',
        data: { roles: ['tenant_admin'], title: 'ユーザー管理' },
        canActivate: [roleGuard],
        loadComponent: () => import('./users.component'),
    },
    {
        path: 'audit-logs',
        data: { roles: ['tenant_admin', 'it_admin'], title: '監査ログ' },
        canActivate: [roleGuard],
        loadComponent: () => import('./audit-logs.component'),
    },
];
```

#### 完了条件
- [ ] admin 子ルートに個別 roleGuard 設定
- [ ] `it_admin` でログイン → `/admin/users` がアクセス拒否されること
- [ ] `it_admin` でログイン → `/admin/audit-logs` がアクセスできること

---

## NA-05: visibilitychange トークンチェック

### 優先度: 低 | 背景: TI-E2E-03

#### 対応

```typescript
// apps/web/src/app/core/auth/auth.service.ts — constructor に追加
if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && this.isAuthenticated()) {
            this.refreshToken().subscribe({
                error: () => this.logout(),
            });
        }
    });
}
```

#### 完了条件
- [ ] タブ非表示→復帰時にトークン更新が実行される
- [ ] トークン失効済みの場合、自動ログアウトされる

---

## NA-06: BroadcastChannel 複数タブ logout 同期

### 優先度: 低 | 背景: TI-E2E-03

#### 対応

```typescript
// auth.service.ts
private _logoutChannel = new BroadcastChannel('opshub_auth');

constructor() {
    this._logoutChannel.onmessage = (event) => {
        if (event.data === 'logout') {
            this.clearState();
            this.router.navigate(['/login']);
        }
    };
}

logout(): void {
    // ...existing logout logic...
    this._logoutChannel.postMessage('logout');
}
```

#### 完了条件
- [ ] タブ A でログアウト → タブ B も `/login` にリダイレクト
- [ ] `BroadcastChannel` 非対応ブラウザでエラーが出ないこと（try/catch）
