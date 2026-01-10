import OpenAI from "openai"
import { env } from "@/env"
import { logger } from "@/lib/logger"
import type { AIPrompt } from "@/server/domain/ai_prompt.entity"
import { AIResponse } from "@/server/domain/ai_response.entity"
import type { AIService } from "@/server/domain/ports/ai.service"

export class OpenAIAIServiceImpl implements AIService {
  private openai: OpenAI | null

  constructor() {
    logger.info("Initializing OpenAIAIService...")
    this.openai = env.OPENAI_API_KEY
      ? new OpenAI({
          apiKey: env.OPENAI_API_KEY,
          defaultHeaders: {
            "User-Agent":
              "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          },
        })
      : null
  }

  async generateResponse(prompt: AIPrompt.Type): Promise<AIResponse.Type> {
    if (!this.openai) {
      throw new Error(
        "AI service is not configured. Please set OPENAI_API_KEY in your environment variables.",
      )
    }

    try {
      const response = await this.openai.chat.completions.create({
        model: prompt.settings?.model || env.LLM_MODEL || "gpt-4o",
        messages: prompt.messages,
        temperature: prompt.settings?.temperature ?? 1.0,
        max_tokens: prompt.settings?.max_tokens,
        stream: false,
      })

      return AIResponse.create(
        response.choices[0]?.message?.content || null,
        response.usage,
        response,
      )
    } catch (error) {
      const { code, type } = getOpenAIErrorMeta(error)
      logger.error(
        {
          error,
          code,
          type,
        },
        "OpenAI API error",
      )
      throw new Error(
        `Failed to generate AI response via OpenAI: ${error instanceof Error ? error.message : String(error)}`,
      )
    }
  }
}

function getOpenAIErrorMeta(error: unknown): {
  code?: string | number
  type?: string
} {
  if (typeof error !== "object" || error === null) return {}

  const maybe = error as { code?: unknown; type?: unknown }
  const code =
    typeof maybe.code === "string" || typeof maybe.code === "number"
      ? maybe.code
      : undefined
  const type = typeof maybe.type === "string" ? maybe.type : undefined

  return { code, type }
}
