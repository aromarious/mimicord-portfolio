import { db } from "@packages/db"
import { DiscordMessageTable } from "@packages/db/schema"
import { sql } from "drizzle-orm"
import OpenAI from "openai"
import { env } from "@/env"
import { OpenAIAIServiceImpl } from "@/server/infrastructure/services/openai.service"
import { logger } from "../logger"

// Types
export interface SearchResult {
  chunk_id: string
  content: string
  message_date: Date | null
  similarity: number
}

export class RagEngine {
  private openai: OpenAI
  private aliases: Record<string, string>

  constructor(aliases?: Record<string, string>) {
    this.openai = new OpenAI({ apiKey: env.OPENAI_API_KEY })

    if (aliases) {
      this.aliases = aliases
    } else {
      try {
        this.aliases = env.ANONYMIZATION_ALIASES
          ? JSON.parse(env.ANONYMIZATION_ALIASES)
          : {}
      } catch (e) {
        logger.error({ error: e }, "Failed to parse ANONYMIZATION_ALIASES")
        this.aliases = {}
      }
    }
  }

  // Helper to get embedding
  private async getEmbedding(text: string): Promise<number[]> {
    const response = await this.openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
      encoding_format: "float",
    })
    return response.data[0]!.embedding
  }

  // Search function using Drizzle
  async search(query: string, limit: number = 5): Promise<SearchResult[]> {
    const embedding = await this.getEmbedding(query)
    const vector = embedding

    // Using cosine distance operator <=>
    // 1 - distance = similarity
    const similarity = sql<number>`1 - (${DiscordMessageTable.embedding} <=> ${JSON.stringify(vector)})`

    // Transaction is needed to ensure SET LOCAL affects the subsequent SELECT in the same connection
    return await db.transaction(async (tx) => {
      // Set HNSW search parameter to match our limit
      // Default is often 40, which limits results regardless of LIMIT clause
      // NOTE: SET commands do not support parameters in most drivers, so we use template literal with caution (limit is a number)
      await tx.execute(sql.raw(`SET LOCAL hnsw.ef_search = ${limit}`))

      const results = await tx
        .select({
          chunk_id: DiscordMessageTable.chunkId,
          content: DiscordMessageTable.content,
          message_date: DiscordMessageTable.messageDate,
          similarity: similarity,
        })
        .from(DiscordMessageTable)
        .orderBy(
          sql`${DiscordMessageTable.embedding} <=> ${JSON.stringify(vector)}`,
        )
        .limit(limit)

      return results as SearchResult[]
    })
  }

  // Summarize function with Alias Mapping (LLM-based)
  async summarize(query: string, results: SearchResult[]): Promise<string> {
    // Pre-processing: Sanitize context by replacing real names with aliases
    // This ensures real names never reach the LLM
    // Sort aliases by length descending to prevent partial replacements of shorter substrings first
    // (e.g. "Tanaka-san" should be processed before "Tanaka")
    const sortedAliases = Object.entries(this.aliases).sort(
      (a, b) => b[0].length - a[0].length,
    )

    const sanitizedResults = results.map((r) => {
      let content = r.content
      for (const [realName, alias] of sortedAliases) {
        if (alias && realName) {
          const escapedName = realName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
          const regex = new RegExp(escapedName, "g")
          content = content.replace(regex, alias)
        }
      }
      return { ...r, content }
    })

    // Format context with dates
    const formattedContexts = sanitizedResults
      .map((r) => {
        const dateStr = r.message_date
          ? new Date(r.message_date).toISOString().split("T")[0]
          : "Unknown Date"
        return `[${dateStr}]\n${r.content}`
      })
      .join("\n---\n")

    const systemPrompt = `You are an analytical assistant. The provided context consists of chat logs (message history) from a specific person. Your task is to answer a specific inquiry about this person based on their statements.
        
        IMPORTANT RULES:
        1. **Language**: The response MUST be written in **Japanese**.
           - Use polite business Japanese (Desu/Masu tone).
           - When referring to the person, use "**この方**" (This person). Do NOT use "ユーザー" (User) or "候補者" (Candidate).
        
        2. **Direct Answer to Topic**: You must primarily address the user's query/topic. If the query is "User Experience Improvement", look specifically for evidence related to UI/UX, user feedback, design discussions, or empathy for users. Do NOT just give a generic self-introduction unless the query asks for it.

        3. **Evidence-Based Analysis**: For every claim you make, you MUST provide specific evidence from the context. Use phrases like "XXXについての議論で見られるように" or "XXXと言及しており...".
           - **Anecdotes & Stories**: Include specific anecdotes or "real-life stories" from the logs to illustrate your points, and ALWAYS place the date of the message at the **END** of the sentence/paragraph in the format (YYYY-MM-DD). Example: "コードをリファクタリングしてパフォーマンスを改善しました(2022-03-27)。" Do NOT start sentences with the date.

        4. **Anonymization**: For any person names found in the context that are generic or unknown, you MUST replace them with common Japanese surnames (e.g., "佐藤さん", "鈴木さん", "高橋さん", "田中さん") consistently. Do NOT use robotic labels like "User A".
        
        5. **Perspective**: Answer from a third-person analytical perspective. Do NOT speak as "I" or "My opinion".

        6. **Target Audience**: Construct your analysis to appeal to a Web Engineer Recruiter. Focus on technical problem-solving, learning agility, and collaborative spirit, BUT keep it relevant to the topic.

        5. **Privacy & Sensitivity**:
           - Do NOT mention sensitive personal information such as developmental disorders (ASD, ADHD, etc.), mental health issues, chronic illnesses, or terms implying neurodivergence context (e.g. "**定型**", "neurotypical").
           - **CRITICAL**: If the user's logs contain these terms, **Do NOT quote them** and **Do NOT reference them**. Ignore that specific part of the context or rephrase it completely to focus ONLY on the resulting personality trait (e.g., "detail-oriented", "direct communication style").

        Format:
        - **Conclusion**: A direct answer to the query/topic (e.g. "[トピック]に関して、この方は...な姿勢を示しています").
        - **Key Points**: Specific points supporting the conclusion, with dates and context.
        - If the context does not contain enough information to answer the topic directly, state that honestly, but try to infer relevant traits (e.g. general problem solving) that might apply to the topic.

        Context:
        ${formattedContexts}
        `

    const aiService = new OpenAIAIServiceImpl()
    const response = await aiService.generateResponse({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: query },
      ],
    })

    return response.content || ""
  }
}
