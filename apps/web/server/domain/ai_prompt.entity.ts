import type { OpenAI } from "openai"

/**
 * AIへの入力を表現するEntity
 * OpenAI SDKの型定義をラップまたはエイリアスとして利用します
 */
export namespace AIPrompt {
  /**
   * チャット完了のためのメッセージパラメータ
   * OpenAIの ChatCompletionMessageParam をそのまま利用
   */
  export type Message = OpenAI.Chat.ChatCompletionMessageParam

  /**
   * AIへのリクエスト設定
   * OpenAIの ChatCompletionCreateParams をベースに必要な設定を定義
   */
  export type Settings = Partial<
    Pick<OpenAI.Chat.ChatCompletionCreateParams, "temperature" | "max_tokens">
  > & {
    model?: string
  }

  /**
   * AIPromptの実体
   */
  export interface Type {
    messages: Message[]
    settings?: Settings
  }

  export const create = (messages: Message[], settings?: Settings): Type => {
    return {
      messages,
      settings,
    }
  }
}
