# ログの仕組み

Mimicord アプリケーションの構造化ログシステム。

## 概要

- **構造化ログ**: Pino によるJSON形式のログ
- **Request ID**: 各リクエストに一意のIDを付与し、トレーサビリティを実現
- **環境別設定**: development では見やすく整形、本番環境では JSON出力

## アーキテクチャ

```text
Application Code
  ↓
logger.info/error/warn (Pino)
  ↓
stdout (JSON形式)
  ↓
Vercel Logs (自動収集)
```

## 主要コンポーネント

### 1. 共通ロガー（`@packages/logger`）

Pino ベースの構造化ロガー。

**主な機能**:
- 環境に応じた自動設定
  - development: `pino-pretty` で見やすく整形
  - production: JSON 形式で出力
  - test: ログを無効化
- ログレベルの制御（`LOG_LEVEL` 環境変数）

**使用例**:

```typescript
import { logger } from "@/lib/logger"

logger.info({ userId, action: "login" }, "User logged in")
logger.error({ error, requestId }, "Operation failed")
```

> [!NOTE]
> `@packages/logger` パッケージは `createLogger` 関数を提供します。アプリケーションでは `apps/web/lib/logger.ts` でインスタンス化された `logger` を使用してください。


### 2. Request ID ミドルウェア

各リクエストに一意のIDを付与します。

**ファイル**: `server/middleware/request-id.ts`

**機能**:
- UUID v4 でリクエストIDを生成
- Hono コンテキストに格納（`c.get("requestId")`で取得可能）
- レスポンスヘッダー `X-Request-ID` として返却

**使用例**:

```typescript
const requestId = c.get("requestId")
logger.error({ error, requestId }, "Failed to process request")
```

**レスポンスヘッダー**:
すべてのレスポンスに `X-Request-ID` ヘッダーが含まれます。

## 環境変数

### サーバー側

```bash
LOG_LEVEL=info  # debug | info | warn | error
```

## ログ構成

### 現在の構成

**フェーズ1**（現在）:
- **生成**: Pino（構造化JSON）
- **出力**: stdout/stderr（標準出力）
- **収集**: Vercel が自動的に stdout を収集
- **閲覧**: Vercel ダッシュボード → Logs

**フェーズ2**（将来）:
- **転送**: Vercel Log Drains
- **保存・分析**: Logtail / Datadog / Grafana Cloud

### ログ形式

```json
{
  "level": 50,
  "time": 1704700000000,
  "service": "web",
  "environment": "production",
  "name": "web",
  "msg": "Error occurred",
  "error": {
    "type": "Error",
    "message": "Something went wrong"
  },
  "requestId": "req_abc123",
  "userId": "user_xyz",
  "context": {
    "component": "auth"
  }
}
```

**主なフィールド**:
- `level`: ログレベル（10=trace, 20=debug, 30=info, 40=warn, 50=error, 60=fatal）
- `time`: タイムスタンプ （Unix epoch ミリ秒）
- `service`: サービス名（"web"）
- `environment`: 環境（"development" | "production" | "preview"）
- `msg`: ログメッセージ
- `requestId`: リクエストID（ミドルウェアで付与）
- `error`: エラーオブジェクト（エラーログの場合）
- `context`: 追加のコンテキスト情報

## ユースケース別操作

### 1. エラー調査

エラーが発生した場合の調査手順：

1. **Vercel Logs でエラーを検索**

   ```
   # Vercel ダッシュボード → Logs
   level:50  # エラーレベルのログのみ
   ```

2. **Request ID で関連ログを確認**

   ```
   requestId:"req_abc123"
   ```

3. **コンテキストを確認**
   - userId: どのユーザーで発生したか
   - component: どのコンポーネントで発生したか
   - error: エラーの詳細

### 2. パフォーマンス調査

特定のリクエストの処理時間を確認：

1. **Request ID を取得**
   - レスポンスヘッダー `X-Request-ID` を確認

2. **Vercel Logs で検索**

   ```
   requestId:"req_abc123"
   ```

3. **時系列でログを確認**
   - リクエスト開始から完了までの処理を追跡

### 3. ユーザー行動の追跡

特定ユーザーの操作履歴を確認：

```
# Vercel Logs
userId:"user_xyz"
```

### 4. デバッグログの確認

開発時の詳細なログを確認：

1. **ローカル環境で `LOG_LEVEL=debug` を設定**

   ```bash
   export LOG_LEVEL=debug
   pnpm dev
   ```

2. **ターミナルで詳細ログを確認**
   - `pino-pretty` により見やすく整形される

### 5. 本番環境のリアルタイム監視

```
# Vercel ダッシュボード → Logs
# 「Live」モードでリアルタイムにログを監視
```

### 6. 統計情報の取得

特定期間のエラー数を確認：

```
# Vercel Logs
level:50 time:>2024-01-01 time:<2024-01-31
```

## ログの書き方ベストプラクティス

### ログレベルの使い分け

```typescript
// debug: 開発時のデバッグ情報
logger.debug({ query }, "Executing database query")

// info: 通常の動作
logger.info({ userId }, "User logged in")

// warn: 警告（エラーではないが要注意）
logger.warn({ retryCount }, "Retrying request")

// error: エラー
logger.error({ error, requestId }, "Failed to process request")
```

### コンテキスト情報の付与

```typescript
// Good: 構造化されたコンテキスト情報
logger.error(
  {
    error,
    requestId: c.get("requestId"),
    userId: user.id,
    context: { component: "auth" }
  },
  "Session validation failed"
)

// Bad: 文字列に埋め込む
logger.error(`Session validation failed for user ${user.id}`)
```

### エラーオブジェクトの記録

```typescript
try {
  await someOperation()
} catch (error) {
  // Good: error オブジェクトをそのまま渡す
  logger.error({ error, requestId }, "Operation failed")
  
  // Bad: エラーメッセージだけ
  logger.error(error.message)
}
```

## トラブルシューティング

### ログが出力されない

- `LOG_LEVEL` 環境変数を確認
- 本番環境では `info` レベル以上のみが出力される
- 開発環境では `pnpm dev` を確認

### ログが文字化けする

- 開発環境: `pino-pretty` が正しくインストールされているか確認
- 本番環境: JSON形式なので文字化けしない

### Request ID が含まれていない

- Request ID ミドルウェアが適用されているか確認
- `server/index.ts` で `requestIdMiddleware` が最初に適用されているか確認

## リンク

### Vercel

**Logs**:

```
Vercel ダッシュボード → プロジェクト → Logs
```

**Log Drains**（将来）:

```
Vercel ダッシュボード → Settings → Log Drains
```

### ドキュメント

- [Pino 公式ドキュメント](https://getpino.io/)
- [Vercel Logs](https://vercel.com/docs/observability/runtime-logs)
- [Vercel Log Drains](https://vercel.com/docs/observability/log-drains-overview)
