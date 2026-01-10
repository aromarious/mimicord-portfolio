/**
 * Better Auth のセッションクッキー名を取得するユーティリティ関数
 *
 * デフォルトのクッキー名は "better-auth.session_token" だが、
 * HTTPS環境では "__Secure-" プレフィックスが自動的に追加される
 */
export function getSessionCookieNames() {
  const baseName = "better-auth.session_token"
  const secureName = `__Secure-${baseName}`

  return {
    /** HTTP環境用のクッキー名 */
    http: baseName,
    /** HTTPS環境用のクッキー名 (__Secure- プレフィックス付き) */
    https: secureName,
    /** 両方を配列で返す（フォールバック用） */
    all: [secureName, baseName] as const,
  }
}
