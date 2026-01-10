# dbt Data Pipeline

Discordのチャットログを処理するためのdbtモデル群とスクリプト群です。
生のJSONデータから、会話のセッション化（チャンキング）を行い、RAG用のデータを作成します。

## テクニカルスタック

- **dbt**: データ変換パイプラインの管理
- **MotherDuck**: クラウドネイティブな Serverless DuckDB
- **Neon**: PostgreSQL + pgvector
- **OpenAI**: text-embedding-3-small（1536次元）

## ディレクトリ構成

```text
dbt/
├── dbt_project.yml   # プロジェクト設定
├── profiles.yml      # DB接続設定
├── models/
│   ├── staging/      # ソース定義・初期ロード
│   └── intermediate/ # データ変換処理
└── scripts/          # pgvector投入スクリプト
```

## パイプライン処理フロー

```text
discord_package/メッセージ/*/messages.json  (生データ)
    ↓
stg_discord_messages (ステージング)
    ↓
int_discord_messages_cleaned (クリーニング)
    ↓
int_discord_messages_chunked (チャンキング)
    ↓
pgvector (RAG用ベクトルDB)
```

### Step 1: Staging

- **Source**: `discord` (messages.json)
- **Model**: `stg_discord_messages`
- Discordからエクスポートされた生のJSONデータをロード

### Step 2: Cleaning

**Model**: `int_discord_messages_cleaned`

メッセージ本文のクリーニングを行います：

- URLの `[URL]` へのラベル化
- ユーザー・ロール・チャンネルメンションの除去
- 連続する笑い文字（wwww）の正規化

### Step 3: Chunking

**Model**: `int_discord_messages_chunked`

連続するメッセージを「チャンク（会話セッション）」としてグループ化します：

- 前のメッセージから **600秒以上** 経過した場合、新しいチャンクとして分割
- 10文字未満の極端に短いチャンクはノイズとして除外
- このチャンクが RAG の検索単位となります

### Step 4: Embedding & Ingestion

**Script**: `scripts/ingest.ts`

MotherDuckのチャンクデータをベクトル化し、Neon（pgvector）に格納します：

```text
MotherDuck (int_discord_messages_chunked)
    ↓ chunk_id, content, message_date を取得
OpenAI Embeddings API
    ↓ 1536次元ベクトルを生成
Neon PostgreSQL (discord_messages + pgvector)
    ↓ HNSW インデックスで類似検索に最適化
RAG Engine (apps/web)
```

## スクリプト

すべてのスクリプトは環境変数（`OPENAI_API_KEY`, `DATABASE_URL`, `MOTHERDUCK_TOKEN`）が必要です。

```text
dbt/scripts/
├── ingest.ts         # MotherDuck → pgvector へのデータ投入
├── summarize.ts      # RAG検索・要約のテスト実行
├── check-count.ts    # pgvector内のレコード数確認
└── extract-names.ts  # 名詞抽出ユーティリティ
```

### 実行例

```bash
# データ投入
infisical run -- pnpm tsx dbt/scripts/ingest.ts

# レコード数確認
infisical run -- pnpm tsx dbt/scripts/check-count.ts

# RAG検索テスト
infisical run -- pnpm tsx dbt/scripts/test.ts "質問テキスト"

```
