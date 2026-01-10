# Mimicord (Portfolio Snapshot)

> [!CAUTION]
> **これはポートフォリオ用に作成されたスナップショットであり、このリポジトリ上での動作を意図していません。**
> 動作に必要なデータベース接続情報や環境変数、一部の構築済みファイルはセキュリティの観点から除外されています。
> オリジナルの開発環境とは異なりますのでご注意ください。

---

# Mimicord

Discord のデータリクエストから取得したメッセージデータを使用し、RAG (Retrieval-Augmented Generation) 技術を活用して過去の会話を要約・閲覧するためのアプリケーション。

## これは何？

このプロジェクトは、Discord のデータリクエスト機能で得られた会話履歴をデータベース (PostgreSQL + pgvector) に蓄積し、OpenAI などの LLM と連携させることで、特定トピックに関する過去のやり取りを検索・要約して表示します。

### 特徴

- **会話要約 (Summarization)**: RAG エンジンにより、過去の膨大なログから関連する発言を抽出し、トピックごとに要約を生成
- **メッセージ解析**: Discord データ(MotherDuck/DuckDB)から PostgreSQL への効率的なインポートとベクトル化
- **モダンなフルスタック構成**: Next.js 16 (App Router) + Hono API
- **認証システム**: BetterAuth + GitHub OAuth (Preview/Production 環境対応)
- **型安全性**: TypeScript + Drizzle ORM
- **モノレポ構成**: Turborepo で複数パッケージを効率的に管理
- **堅牢な開発基盤**: Biome、Vitest、Playwright、GitHub Actions CI/CD 集約済み

## クイックスタート

開発を開始する手順は以下を参照してください：

👉 **[Quickstart Guide](docs/quickstart.md)**

## 技術スタック

### フロントエンド

- **Next.js 16+** (App Router)
- **React 19**
- **Tailwind CSS v4**
- **React Markdown** (Markdown Rendering)

### バックエンド

- **Hono** (Next.js API Routes 上で動作)
- **BetterAuth** (認証・セッション管理)
- **Drizzle ORM**
- **PostgreSQL** (Neon / pgvector)
- **OpenAI API** (LLM / Embeddings)

### 開発ツール

- **pnpm** (パッケージマネージャー)
- **Turborepo** (モノレポ管理)
- **Biome** (Lint / Format)
- **Vitest** (単体・統合テスト)
- **Playwright** (E2Eテスト)
- **Infisical** (環境変数管理)

### インフラ

- **Docker Compose** (ローカルDB)
- **GitHub Actions** (CI/CD)

詳細な技術仕様は [技術要件・アーキテクチャ設計書](docs/technical_spec.md) を参照してください。

## プロジェクト構成

```text
.
├── apps/
│   └── web/                 # Next.js アプリケーション (Port 3000)
│       ├── app/             # App Router ページ・レイアウト
│       │   ├── api/         # API Routes (Hono統合)
│       │   └── auth/        # 認証関連ページ
│       ├── frontend/        # フロントエンド実装
│       │   ├── components/  # UIコンポーネント
│       │   ├── hooks/       # カスタムフック
│       │   └── api/         # クライアントAPI定義
│       ├── lib/             # ユーティリティ・クライアント
│       │   ├── auth.ts      # BetterAuth設定
│       │   └── rag/         # RAG エンジン実装
│       ├── server/          # Hono API実装
│       │   ├── routes/      # APIルート定義
│       │   ├── middleware/  # 認証ミドルウェア
│       │   ├── domain/      # ドメインエンティティ
│       │   └── usecase/     # ビジネスロジック
│       ├── test-e2e/        # E2Eテスト (Playwright)
│       └── env.ts           # 環境変数スキーマ (Zod)
│
├── packages/
│   ├── db/                  # データベース・ORM設定
│   │   ├── src/             # DB接続・スキーマ定義
│   │   └── drizzle.config.ts
│   ├── ui/                  # 共通UIコンポーネント (shadcn/ui)
│   └── config/              # 共通設定ファイル
│       ├── docker-compose.yml
│       ├── biome.json       # Lint/Format設定
│       └── commitlint.config.js
│
├── docs/                    # ドキュメント
├── .github/workflows/       # CI/CD定義
└── .husky/                  # Git Hooks (Commitlint, Lint-staged)
```

## 主な機能

### セキュリティ・品質

- **認証・認可**: BetterAuth による堅牢な認証システム（GitHub OAuth対応）
- **レート制限**: Upstash Redis を使用した API レート制限 (Vercel Edge Middleware)
- **型安全性**: TypeScript + Zod による厳格な型チェック
- **コード品質**: Biome による自動Lint・Format、Conventional Commits強制

### 開発体験

- **API仕様書**: Hono + Scalar による OpenAPI 仕様書自動生成
- **Hot Reload**: Next.js Turbopack による高速開発サーバー
- **テスト環境**: 単体・統合・E2E テストのフルサポート（認証テスト含む）
- **E2E認証**: Drizzle-based seeding による高速で安定したテスト環境

### CI/CD

- **自動テスト**: PR時に Lint、型チェック、ビルド、テスト実行
- **E2Eテスト**: main ブランチへのマージ時に Playwright 実行
- **依存関係更新**: Dependabot による自動PR作成

## ドキュメント

### セットアップ

- [Quickstart Guide](docs/quickstart.md) - 開発者向けセットアップ手順
- [Admin Setup Guide](docs/admin_setup.md) - 管理者向けプロジェクト作成手順
- [環境定義と実行ガイド](docs/environments.md) - 環境変数・実行環境の説明


### 設計・仕様

- [技術要件・アーキテクチャ設計書](docs/technical_spec.md) - 全体アーキテクチャ
- [API 設計ガイドライン](docs/api_design_guidelines.md) - API設計の原則
- [API バージョニングガイド](docs/api_versioning.md) - APIバージョン管理戦略
  - [データベーススキーマガイドライン](docs/api-versioning-database-guidelines.md) - DB変更時の互換性管理
  - [ディレクトリ構造ガイドライン](docs/api-versioning-directory-structure.md) - バージョン別ファイル配置
- [Hono API 実装標準](docs/server_standards.md) - サーバーサイド実装標準
- [クライアント使用ガイド](docs/client_usage.md) - Hono RPCクライアントの使い方
- [認証フロー](docs/auth-flow.md) - Better Auth認証の実装詳細

### テスト

- [E2E テスト](docs/e2e-testing.md) - Playwright E2Eテストの書き方

### 運用

- [CI/CD ガイドライン](docs/ci_guideline.md) - CI/CD の詳細と運用方法
- [ログの仕組み](docs/logging.md) - 構造化ログとエラートラッキング

### その他

- [Want TODO](docs/want-todo.md) - 今後の実装予定機能リスト

## 開発ガイドライン

### コミット規約

[Conventional Commits](https://www.conventionalcommits.org/) を採用しています。コミット時に自動チェックされます。

### コードフォーマット

Biome によるLintとFormatがコミット時に自動実行されます。手動実行：

```bash
pnpm biome check --apply
```

## ライセンス

MIT
