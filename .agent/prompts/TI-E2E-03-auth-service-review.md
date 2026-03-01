# TI-E2E-03: AuthService 初期化フローの堅牢性レビュー

## 共通ルール
// turbo-all
- `pnpm`, `npx`, `nx` 等のコマンドは自由に実行してよい
- `sudo` が必要な操作やシステム設定変更のみユーザーに確認

## 概要
`AuthService` の初期化が `Promise.resolve().then()` で遅延実行され、`_readyPromise` パターンで認証完了を管理している設計を精査する。本番環境を含めてレースコンディションが発生しないか確認する。

## 対象コード

### `auth.service.ts` — 初期化フロー
```typescript
// L29-31: _readyPromise の定義
private _readyResolve!: () => void;
private _readyPromise = new Promise<void>((resolve) => {
    this._readyResolve = resolve;
});

// L61-65: constructor
constructor() {
    // 循環依存回避のため遅延実行
    Promise.resolve().then(() => this.loadFromStorage());
}

// L181-210: loadFromStorage
private loadFromStorage(): void {
    const token = sessionStorage.getItem(TOKEN_KEY);
    if (token) {
        this._accessToken.set(token);
        this._initializing.set(true);
        this.fetchProfile().subscribe({
            next: (user) => { if (!user) this.clearState(); },
            complete: () => {
                this._initializing.set(false);
                this._readyResolve(); // ← ここで resolve
            },
            error: (err) => {
                this._initializing.set(false);
                this.clearState();
                this._readyResolve(); // ← エラー時にも resolve
            },
        });
    } else {
        this._readyResolve(); // ← トークンなし → 即 resolve
    }
}
```

### `auth.guard.ts` — ガード
```typescript
export const authGuard: CanActivateFn = async () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    await auth.whenReady(); // _readyPromise を待つ
    if (auth.isAuthenticated()) return true;
    router.navigate(['/login']);
    return false;
};
```

## 調査項目

### 1. 循環依存の確認
- [ ] `AuthService` → `HttpClient` → `authInterceptor` → `AuthService` の循環が実際に存在するか
- [ ] Angular 19 の `inject()` ベースで循環依存が解消済みかを確認
- [ ] 解消済みなら `Promise.resolve().then()` を除去して直接 `this.loadFromStorage()` にできるか検証
- [ ] `authInterceptor` が `AuthService` をどう参照しているか確認

### 2. `_readyPromise` の整合性
- [ ] 全パスで `_readyResolve()` が呼ばれることを確認:
  - トークンあり → `fetchProfile` 成功 → `complete` → ✅ resolve
  - トークンあり → `fetchProfile` 失敗 → `error` → ✅ resolve
  - トークンなし → 即時 → ✅ resolve
  - トークンあり → `fetchProfile` が Observable を emit しないまま未完了 → ❓ 未 resolve のリスク
- [ ] `_readyPromise` が二重 resolve されるケースがないか

### 3. `_initializing` フラグの整合
- [ ] `logout()` は `_initializing()` 中はスキップされる (L95-98) — 意図通りか
- [ ] `refreshToken()` 失敗 → `clearState()` のパスで `_initializing` 状態と整合するか
- [ ] `_initializing` が true のまま stuck するシナリオがないか

### 4. `APP_INITIALIZER` との関係
- [ ] 現在 `APP_INITIALIZER` で `whenReady()` を待っていない場合:
  - ルーティング開始前に認証状態が未確定 → auth guard で毎回 `/login` にリダイレクト → 再チェック のフリッカーが起きる可能性
- [ ] `APP_INITIALIZER` に `whenReady()` を入れた場合のブート時間への影響を計測

### 5. エッジケース
- [ ] ブラウザ「戻る」ボタン: sessionStorage にトークンがあるが `_currentUser` が null の一瞬
- [ ] タブ復帰 (visibilitychange): トークン有効期限切れ時の挙動
- [ ] 複数タブ: sessionStorage はタブごとだが、一方でログアウトした場合の他タブへの伝播

## 対象ファイル

| パス | 確認内容 |
|------|---------|
| `apps/web/src/app/core/auth/auth.service.ts` | 全体 (220 行) |
| `apps/web/src/app/core/auth/auth.guard.ts` | 全体 (17 行) |
| `apps/web/src/app/core/auth/role.guard.ts` | ロールガードの whenReady() 使用有無 |
| `apps/web/src/app/core/interceptors/auth.interceptor.ts` | 循環依存の確認 |
| `apps/web/src/app/app.config.ts` | APP_INITIALIZER の確認 |

## 完了条件
- [ ] 循環依存が存在するか否かが文書化されている
- [ ] `_readyPromise` の全パスで resolve が保証されることが確認されている
- [ ] `APP_INITIALIZER` への統合が推奨されるかの判断が示されている
- [ ] 発見された問題がある場合、修正 PR or 追加チケットが作成されている
