# GitHub OAuth認証の流れ (Next.js + Hono + Better Auth)

本プロジェクトでは、[Better Auth](https://better-auth.com/) を使用してGitHub OAuthによるソーシャルログインを実装しています。

## 認証フロー概要

### 1. サインイン要求 (Client → Hono)

- Next.jsのフロントエンドで、ユーザーが「GitHubでサインイン」ボタンを押します。
- Better Authのクライアントライブラリが、HonoのAPIエンドポイント（`/api/auth/sign-in/social`）へリクエストを送ります。

```typescript
// クライアント側コード例
await protectedClient.auth.signIn.social({
  provider: "github",
  callbackURL: "/dashboard"
})
```

### 2. GitHubへリダイレクト (Hono → GitHub)

- Hono（Better Auth）は、GitHubのログイン画面へのURLを構築し、ブラウザをそこへリダイレクトさせます。
- この時、セキュリティのための「state（状態）」とOAuth認証パラメータが自動的に生成されます。

### 3. 認証とコールバック (GitHub → Hono)

- ユーザーがGitHub側で「許可」すると、GitHubはユーザーをHonoサーバー（`/api/auth/callback/github`）に戻します。
- この時、GitHubから一時的な「認証コード」が渡されます。

### 4. 検証とセッション作成 (Hono ↔ GitHub & DB)

- Hono（Better Auth）は受け取ったコードを使って、GitHubサーバーに「このユーザーは本物？」と問い合わせ、プロフィール情報を取得します。
- 問題なければ、Drizzleを使ってデータベースの `user` テーブルにユーザーを登録（または検索）し、`session` テーブルにセッション情報を書き込みます。
- 最後に、ブラウザに「セッションCookie」をセットして完了です。

### 5. 保護されたリソースへのアクセス

- 以降のリクエストでは、クライアントが自動的にセッションCookieを送信します。
- サーバー側のミドルウェア（`apps/web/server/middleware/auth.ts`）がセッションを検証し、認証済みユーザーのみアクセスを許可します。

## 実装ファイル

### サーバーサイド

- **`apps/web/lib/auth.ts`**: Better Auth設定（GitHub OAuth、セッション管理）
- **`apps/web/server/middleware/auth.ts`**: 認証ミドルウェア（`requireAuth`）
- **`apps/web/app/api/auth/[...all]/route.ts`**: Better Authエンドポイント

### クライアントサイド

- **`apps/web/lib/auth-client.ts`**: Better Authクライアントインスタンス
- **`apps/web/lib/client.ts`**: Hono RPCクライアント + Better Auth統合

## セキュリティ考慮事項

### セッション管理

- セッションは暗号化されたCookieとして保存されます。
- `BETTER_AUTH_SECRET`環境変数を使用して署名・検証を行います。

### E2Eテスト環境

- E2Eテスト時のみ、テストユーザーのfallback認証が有効になります。
- **本番環境では完全に無効化されています**（`server/middleware/auth.ts`で制御）。

### CORS設定

- 本番環境では、許可されたオリジンのみがAPIにアクセスできます。
- 設定: `apps/web/server/index.ts`

## 環境変数

以下の環境変数が必要です（Infisicalで管理）：

- `BETTER_AUTH_SECRET`: Better Auth署名用シークレット
- `GITHUB_CLIENT_ID`: GitHub OAuth Client ID
- `GITHUB_CLIENT_SECRET`: GitHub OAuth Client Secret
- `BETTER_AUTH_URL`: 認証ベースURL（Preview/Production環境で設定）

## 参考資料

- [Better Auth Documentation](https://better-auth.com/)
- [クライアント使用ガイド](client_usage.md) - 認証機能の使い方
- [Hono API 実装標準](server_standards.md) - 認証ミドルウェアパターン
- [セキュリティポリシー](../SECURITY.md) - セキュリティのベストプラクティス
