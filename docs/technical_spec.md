# 技術要件・アーキテクチャ設計書

本ドキュメントは、プロジェクト「Mimicord」の技術選定、開発環境、およびアーキテクチャに関する決定事項をまとめたものです。

## 1. プロジェクト概要

Discord のデータリクエストから取得したメッセージデータを用い、RAG (Retrieval-Augmented Generation) 技術を活用して過去の会話を検索・要約・閲覧するアプリケーションの構築を目的とします。

* **ゴール**: 堅牢な開発基盤の確立、チーム開発における環境差異の排除、高い型安全性の確保、および高精度な文脈検索による過去ログ活用体験の提供。

## 2. 技術スタック (Tech Stack)

### コア・フレームワーク
* **Frontend**: Next.js 15+ (App Router)
* **Backend**: Hono
  * Next.js API Routes 上で動作させる構成 (`app/api/[[...route]]/route.ts`)。
  * **RPC**: Hono RPC を使用し、Frontend/Backend 間で完全な型定義を共有 (End-to-End Type Safety)。
* **Auth**: Better Auth
  * **Provider**: GitHub OAuth
* **Database**: PostgreSQL (with **pgvector**)
* **ORM**: Drizzle ORM (`postgres-js` driver)
* **AI / LLM**: OpenAI API (`gpt-4o`) + RAG (Vector Search)

### 開発環境・ツール

* **Package Manager**: pnpm (v10+ 推奨, Workspaces 対応)
* **Monorepo Tool**: Turborepo (ビルド・タスク管理)
* **開発環境**: **ローカル環境での開発を推奨**
  * **Database**: Docker Compose で `pgvector/pgvector:pg17` を起動
    * **Locale**: `ja_JP.utf8` (日本語ロケール)
  * **Application**: ローカルの Node.js で実行 (pnpm dev)
* **環境変数管理**: **Infisical**
  * ローカル開発、CI、本番環境へのシークレット注入を一元管理。

#### ローカル開発環境のセットアップ

**推奨構成**: データベースのみDockerで起動し、アプリケーションはローカルで実行します。

**設定ファイルの場所**: `packages/config/docker-compose.yml`

```bash
# 1. データベースの起動 (pgvector)
pnpm db:up

# 2. 依存関係のインストール
pnpm install

# 3. アプリケーションの起動
pnpm dev
```

### 依存関係 (package.json / pnpm)

* **Core**: `hono`, `next`, `react`, `react-dom`, `better-auth`
* **DB**: `drizzle-orm`, `postgres`, `pgv` (vector extension support)
* **AI**: `openai` (Official SDK)
* **Dev Tools**:
  * **Biome**: `@biomejs/biome` (Lint/Format)
  * **Husky**: Git Hooks
  * **Turborepo**: Task Orchetration
  * **Vitest**: Unit/Integration Testing
  * **Playwright**: E2E Testing

## 3. テスト戦略

品質と開発速度のバランスを考慮し、以下のテストピラミッドを採用します。

### テストの種類とツール

| 種別                 | ツール         | 役割・ファイル名                                                           | 実行コマンド            |
| :------------------- | :------------- | :------------------------------------------------------------------------- | :---------------------- |
| **Unit Test**        | **Vitest**     | ドメインロジック等の単体テスト（DBモック）。<br>`*.test.ts`                | `pnpm test:unit`        |
| **Integration Test** | **Vitest**     | APIエンドポイント等の統合テスト（DB接続あり）。<br>`*.integration.test.ts` | `pnpm test:integration` |
| **End-to-End**       | **Playwright** | ブラウザを用いたE2Eテスト。<br>`test-e2e/**/*`                             | `pnpm test:e2e`         |

### テスト実行環境

* **Unit Test**: 環境非依存。DB接続なし。
* **Integration Test**: ローカルDocker DB (Port 5433) を使用。Infisical (`staging`) から設定を取得。
* **E2E Test**: ローカルDocker DB (Port 5433) を使用。Infisical (`staging`) から設定を取得。Port 3001 でサーバー起動。

## 4. アーキテクチャとディレクトリ構成

```text
.
├── apps/
│   └── web/              # Next.js (Port 3000) - Main App & API
│       ├── app/          # Next.js App Router (Frontend)
│       ├── server/       # Hono App (Backend Logic) - Clean Architecture
│       │   ├── domain/       # Entities / Rules
│       │   ├── usecase/      # Application Business Rules
│       │   ├── adapter/      # Interface Adapters (Controllers)
│       │   ├── infrastructure/ # Frameworks & Drivers (DB, RAG, OpenAI)
│       │   └── index.ts      # DI & Routing
│       ├── lib/          # Shared Utilities (Auth, RAG Engine)
│       └── package.json
├── packages/
│   ├── config/           # 共通設定
│   ├── logger/           # 共通ロガー
│   ├── ui/               # 共通 UI (shadcn/ui)
│   └── db/               # Database Connection & Schema (Drizzle)
├── package.json          # Root Package
└── turbo.json            # Turborepo 設定
```

### バックエンドアーキテクチャ (Clean Architecture)

`apps/web/server` 配下は、**Clean Architecture** に基づいて責務を分割しています。特に RAG 機能や外部 API 連携は `infrastructure` 層に実装し、`usecase` 層からはインターフェースを通じて利用することで、テスト容易性を高めています。

## 5. AI / RAG アーキテクチャ

Mimicord の核となる RAG (Retrieval-Augmented Generation) システムの構成です。

1. **Ingestion (データ取り込み)**
    * Discord データダンプや MotherDuck からデータを取得。
    * `scripts/ingest-to-neon.ts` 等のスクリプトを用いて、テキストのチャンク化と Embedding 生成 (OpenAI `text-embedding-3-small` 等) を実行。
    * 結果を PostgreSQL (`messages` テーブルの `embedding` カラム) に保存。

2. **Retrieval (検索)**
    * `pgvector` を使用したベクトル類似度検索 (Cosine Similarity)。
    * ユーザーのクエリに関連する過去のメッセージを高速に取得。

3. **Generation (生成/要約)**
    * 検索されたメッセージをコンテキストとして OpenAI API (`gpt-4o`) に送信。
    * 特定のペルソナ（リクルーター等）に基づいた要約や回答を生成。

## 6. 認証・認可

* **Better Auth** を採用。
* **GitHub OAuth** プロバイダーのみをサポート（開発者向けツールのため）。
* セッション管理はデータベースベースで行い、Hono Middleware および Next.js Middleware で保護されたルートへのアクセス制御を実施。

## 7. 環境変数・シークレット管理

**Infisical** を Single Source of Truth として使用。

### 運用戦略

| 環境                    | 注入方法               | use case                                                                                                        |
| :---------------------- | :--------------------- | :-------------------------------------------------------------------------------------------------------------- |
| **Development** (Local) | **Infisical CLI**      | `infisical run -- pnpm dev`。開発者のローカル環境用。                                                           |
| **CI / Testing**        | **Infisical CLI**      | `infisical run -- pnpm test:ci`。GitHub Actionsでマシンアイデンティティを使用して取得。                         |
| **Production**          | **Integration (Sync)** | InfisicalからVercelへ自動同期。アプリケーションは `process.env` を参照。Infisicalのダウンタイム影響を受けない。 |

### 主な環境変数

| 変数名                     | 概要                             |
| :------------------------- | :------------------------------- |
| `DATABASE_URL`             | PostgreSQL (pgvector) 接続文字列 |
| `OPENAI_API_KEY`           | OpenAI APIキー (RAG/Embedding用) |
| `BETTER_AUTH_SECRET`       | Better Auth 署名用シークレット   |
| `GITHUB_CLIENT_ID`         | GitHub OAuth Client ID           |
| `GITHUB_CLIENT_SECRET`     | GitHub OAuth Client Secret       |
| `UPSTASH_REDIS_REST_URL`   | Rate Limiting用 Redis URL        |
| `UPSTASH_REDIS_REST_TOKEN` | Rate Limiting用 Redis Token      |

## 8. レートリミット (Rate Limiting)

* **実装**: Next.js Middleware + Upstash Redis (`@upstash/ratelimit`)。
* **目的**: APIの保護とコスト管理（OpenAI API呼び出しの制限等）。
* **ルール**: IPアドレスベースのスライディングウィンドウ制限。
