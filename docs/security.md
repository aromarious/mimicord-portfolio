# Security Measures

## Security Measures

このプロジェクトでは以下のセキュリティ対策を実施しています：

### 認証・認可
- **BetterAuth**: 堅牢な認証システムとセッション管理
- **OAuth 2.0**: GitHub OAuth による安全な認証
- **セッション検証**: すべての保護されたエンドポイントで認証チェック

### ネットワークセキュリティ
- **レート制限**: Upstash Redis による API レート制限
- **CORS**: 信頼されたオリジンのみ許可
- **セキュリティヘッダー**:
  - Content-Security-Policy
  - X-Frame-Options
  - X-Content-Type-Options
  - Referrer-Policy
  - Permissions-Policy

### データセキュリティ
- **環境変数管理**: Infisical による安全な secrets 管理
- **型安全性**: TypeScript + Zod による厳格な型チェック
- **ORM**: Drizzle ORM による SQL インジェクション対策

### CI/CD セキュリティ
- **最小権限の原則**: GitHub Actions のパーミッション制限
- **依存関係の更新**: Dependabot による自動セキュリティアップデート
- **自動テスト**: PR ごとにセキュリティチェックを実行

## Development Security Guidelines

開発者向けのセキュリティガイドライン：

### 環境変数
- `.env` ファイルは絶対にコミットしない
- すべての秘密情報は Infisical で管理
- 本番環境では環境変数の検証を必須にする

### 認証
- すべての保護されたルートで認証チェックを実装
- セッショントークンを適切に管理
- E2E テスト用の fallback は本番環境で無効化

### API セキュリティ
- すべての入力を Zod でバリデーション
- レート制限を適用
- 適切なエラーメッセージ（情報漏洩を防ぐ）

### フロントエンド
- XSS 対策: React の自動エスケープを利用
- `dangerouslySetInnerHTML` は使用しない
- 外部スクリプトの読み込みを最小限に

## Supported Versions

現在サポートされているバージョン：

| Version | Supported          |
| ------- | ------------------ |
| main    | :white_check_mark: |
| develop | :white_check_mark: |
| others  | :x:                |

## References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security Best Practices](https://nextjs.org/docs/app/building-your-application/configuring/security)
- [BetterAuth Documentation](https://www.better-auth.com/)
