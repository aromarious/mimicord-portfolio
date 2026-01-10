import type { OpenAI } from "openai"

/**
 * AIからの応答を表現するEntity
 * OpenAI SDKの型定義をラップまたはエイリアスとして利用します
 */
export namespace AIResponse {
  /**
   * チャット完了レスポンス
   * OpenAIの ChatCompletion をそのまま利用することも可能ですが、
   * ここではアプリケーションが必要とする情報を抽出した形を定義します
   */
  export interface Type {
    content: string | null
    usage?: OpenAI.CompletionUsage
    raw?: OpenAI.Chat.ChatCompletion // 必要に応じて生のレスポンスも保持
  }

  export const create = (
    content: string | null,
    usage?: OpenAI.CompletionUsage,
    raw?: OpenAI.Chat.ChatCompletion,
  ): Type => {
    return {
      content,
      usage,
      raw,
    }
  }
}
