# Admin Setup Guide

開発メンバーをチームに迎え入れる前に、管理者が実施しておくべき事前準備のチェックリストです。
これを完了させることで、メンバーは `docs/quickstart.md` の手順通りにスムーズに開発を開始できます。

## 1. テンプレートから新規リポジトリを作成

このリポジトリはテンプレートとして設計されています。新しいプロジェクトを開始する際は、以下の手順で新規リポジトリを作成してください。

### 1-1. GitHubでテンプレートを使用

1. **このリポジトリのGitHubページにアクセス**
   - テンプレートリポジトリ: `aromarious/next-hono-betterauth-base` (または現在のリポジトリ名)

2. **"Use this template" ボタンをクリック**
   - ページ右上の緑色の "Use this template" ボタンをクリック
   - "Create a new repository" を選択

3. **新しいリポジトリの設定**
   - **Owner**: 組織またはユーザーアカウントを選択
   - **Repository name**: 新しいプロジェクト名を入力（例: `my-awesome-project`）
   - **Description**: プロジェクトの説明を入力（任意）
   - **Visibility**: `Private` または `Public` を選択（通常は `Private` を推奨）
   - "Include all branches" のチェックは外したまま（mainブランチのみコピー）
   - `develop`ブランチを作成しておく

4. **"Create repository" をクリック**
   - 新しいリポジトリが作成されます

### 1-2. 作成したリポジトリのURLを記録

新しく作成されたリポジトリのURLをメモしてください。このURLは開発者に共有します。

```text
https://github.com/<owner>/<新しいリポジトリ名>
```

> [!IMPORTANT]
> このURLは後ほど開発者に伝える必要があります。`docs/quickstart.md` の手順で使用します。

## 2. Infisical (シークレット管理) のセットアップ

開発者が `infisical login` 後に正しい環境変数を取得できるように設定します。
本プロジェクトでは機密情報（APIキー、シークレット等）をすべて Infisical で管理します。

### 2-1. プロジェクト作成とログイン

- Infisical Cloud (または自社ホスト版) にて、新しいプロジェクトを作成します。
- Infisical CLIをインストールします。

  ```bash
  brew install infisical/get-cli/infisical
  ```

- `infisical login` を実行します。
- `infisical init` を実行して、ローカル環境とプロジェクトを紐付けます。
- `.infisical.json` が作成されます。

### 2-2. 環境変数の定義 (Development environment)

`Development` 環境に、以下の変数を登録してください。
これらは Dev Container やローカル開発環境 (`pnpm dev`) で使用されます。

| Key                            | Value / Description                                    | 備考 (Dev Environment)              |
| :----------------------------- | :----------------------------------------------------- | :---------------------------------- |
| `BETTER_AUTH_SECRET`           | `openssl rand -base64 32` で生成                       | Better Authの署名用シークレット     |
| `BETTER_AUTH_URL`              | `http://localhost:3000`                                | 認証ベースURL (Localhost)           |
| `DATABASE_URL`                 | `postgresql://postgres:postgres@localhost:5432/webapp` | Docker Compose (pgvector) への接続  |
| `GITHUB_CLIENT_ID`             | `<GitHub App Client ID>`                               | ローカル開発用アプリのClient ID     |
| `GITHUB_CLIENT_SECRET`         | `<GitHub App Client Secret>`                           | ローカル開発用アプリのClient Secret |
| `GITHUB_CLIENT_ID_PREVIEW`     | `(Optional)`                                           | プレビュー環境用 (Vercel Preview時) |
| `GITHUB_CLIENT_SECRET_PREVIEW` | `(Optional)`                                           | プレビュー環境用 (Vercel Preview時) |
| `OPENAI_API_KEY`               | `sk-...`                                               | LLM要約・RAG生成用 (OpenAI)         |
| `LLM_MODEL`                    | `gpt-4o`                                               | 使用するLLMモデル名                 |
| `ANONYMIZATION_ALIASES`        | `{"real name": "alias"}` (JSON)                        | RAG要約時の匿名化マッピング (JSON)  |
| `RATE_LIMIT_MAX_REQUESTS`      | `100`                                                  | レートリミット最大リクエスト数      |
| `RATE_LIMIT_WINDOW`            | `1 m`                                                  | レートリミット期間                  |
| `UPSTASH_REDIS_REST_URL`       | `<Upstash URL>`                                        | Upstash Redis (Rate Limiting)       |
| `UPSTASH_REDIS_REST_TOKEN`     | `<Upstash Token>`                                      | Upstash Redis Token                 |

> **GitHub OAuth App 設定について**:
> ローカル開発用に、以下の設定で GitHub App を作成してください：
> - Homepage URL: `http://localhost:3000`
> - Authorization callback URL: `http://localhost:3000/api/auth/callback/github`

> **RAG / Database**:
> `DATABASE_URL` は `packages/config/docker-compose.yml` 内の `pgvector/pgvector` イメージ設定と一致させる必要があります（デフォルト設定でOK）。

### 2-3. CI用サービス・トークンの発行 (GitHub Actions用)

GitHub Actions 等の CI/CD 環境から Infisical にアクセスするために、サービス・トークンを発行し、GitHub に登録します。
`test:e2e` や `test:int` の実行に必要です。

1. **Infisical プロジェクトの "Access Control" に移動**
   - サイドバーの "Access Control" を選択
   - "Machine Identities" (または Service Tokens) タブをクリック

2. **新しいトークンの作成**
   - "Create identity" をクリック
   - **Name**: `GitHub Actions` など
   - **Role**: `Staging` や `Production` 環境への Read 権限を持つロールを割り当て

3. **GitHub Actions にトークンを登録**
   - GitHub リポジトリの Settings > Secrets and variables > Actions を選択
   - New repository secret を選択
   - Name: `INFISICAL_TOKEN`
   - Value: 発行された Client Secret (または Token) を入力

### 2-4. InfisicalからVercelへの同期

Production/Preview 環境へのデプロイのため、Vercel へのシークレット同期を設定します。

1. **Infisical プロジェクトの "Integrations" タブを選択**
2. **"Netlify" / "Vercel" 等のホスティングサービスを選択**
   - "Vercel" を検索して選択
3. **同期設定を入力**
   - **Environment**: `Production` (Production用), `Preview` (Preview用)
   - **Secret Path**: `/`
4. **必要な環境変数のマッピング**
   - `BETTER_AUTH_URL` は Vercel System Env (`VERCEL_URL`) 等で自動設定される場合もありますが、カスタムドメインを使用する場合は明示的に設定してください
   - `GITHUB_CLIENT_ID/SECRET` (Production用) を Infisical の Production 環境に設定

### 2-5. プロジェクトID、プロジェクト名の更新

リポジトリ内の設定ファイルに記述されている Infisical のプロジェクトID、およびプロジェクト名のテンプレートを、新しいプロジェクトのものに一括置換します。

1. **置換スクリプトを実行**
   - `.infisical.json` に記録されている新しい Project ID を使用して、プロジェクト内の古い ID を一括置換します。
   - 以下のコマンドを実行してください:

   ```bash
   python3 scripts/replace_infisical_id.py
   ```

2. **プロジェクト名の置換**
   - プロジェクト名のテンプレート (`mimicord-app` や `next-hono-betterauth-base`) を、実際のプロジェクト名に一括置換してください。
   - IDEの検索置換機能を使用してください。

### 2-6. メンバーの招待

Infisical プロジェクトの "Access Control" > "Identities" (Users) から、開発者のメールアドレスを招待し、`Development` 環境への **Read** 権限を付与してください。
これにより、開発者は `infisical login` だけで必要なキーを取得できます。

## 3. リポジトリ権限の設定

### 3-1. GitHub (またはGitLab) への招待

開発者にリポジトリへのアクセス権（Write権限以上推奨）を付与してください。

### 3-2. Branch Protection Rule (推奨)

品質を担保するため、`main` ブランチへの直接プッシュを禁止し、Pull Request を必須に設定することを推奨します。

- **Require pull request reviews before merging**: On
- **Require status checks to pass before merging**: On (CI: `test`, `typecheck`, `lint` 等)

## 4. 完了確認

ここまで準備ができたら、開発者に以下の情報を共有してください：

1. **リポジトリURL**: 手順1で作成した新しいリポジトリのURL
2. **Infisicalプロジェクト名/ID**: 手順2で作成したプロジェクト情報
3. **セットアップ手順**: `docs/quickstart.md` を参照するよう伝える
