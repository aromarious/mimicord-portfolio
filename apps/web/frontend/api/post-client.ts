import type { InferResponseType } from "hono/client"
import { createClient } from "@/lib/client"

const { protectedClient } = createClient()

// サーバー側のスキーマから型を自動推論（200ステータスのレスポンスボディ）
type PostListResponse = InferResponseType<
  typeof protectedClient.posts.$get,
  200
>
export type Post = PostListResponse[number] // 配列から単一要素の型を抽出

export async function createSummary(
  topic: string,
  searchLimit?: number,
): Promise<string> {
  try {
    const response = await protectedClient.posts.$post({
      json: { topic, searchLimit },
    })

    if (!response.ok) {
      if (response.status === 401) {
        return "❌ You need to be signed in to do that."
      }
      throw new Error(`API error: ${response.status}`)
    }

    const data = await response.json()
    return data.content || "Oops, I blanked out. Click 'Next' to try again!"
  } catch (error) {
    console.error("Chat API Error:", error)
    return "❌ Connection lost. My neural circuits are a bit fuzzy. Please try again."
  }
}

export async function initializeChat(): Promise<Post | null> {
  try {
    const response = await protectedClient.posts.initial.$post()

    if (!response.ok) {
      const res = response as unknown as Response
      if (res.status === 401) {
        return null
      }
      throw new Error(`API error: ${res.status}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error("Initialize Chat Error:", error)
    return null
  }
}

export async function getPosts(options?: {
  limit?: number
  offset?: number
}): Promise<Post[]> {
  try {
    const query: Record<string, string | undefined> = {}
    if (options?.limit !== undefined) {
      query.limit = options.limit.toString()
    }
    if (options?.offset !== undefined) {
      query.offset = options.offset.toString()
    }

    const response = await protectedClient.posts.$get({
      query,
    })

    // 401の場合は空配列を返す
    if (response.status === 401) {
      return []
    }

    // それ以外のエラーは例外として処理
    if (!response.ok) {
      throw new Error(`Failed to fetch posts`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error("Fetch Posts Error:", error)
    return []
  }
}
