import { env } from "@/env"
import type { RagEngine } from "@/lib/rag/engine"
import type { PostRepository } from "@/server/domain/ports/post.repository"
import { Post } from "@/server/domain/post.entity"

export class PostUseCase {
  constructor(
    private readonly postRepository: PostRepository,
    private readonly ragEngine: RagEngine,
  ) {}

  /**
   * AIを使用して投稿を生成し、保存する
   */
  async generateAndCreatePost(
    userId: string,
    topic: string,
    searchLimit: number = 50,
  ): Promise<Post> {
    if (!env.OPENAI_API_KEY || !env.DATABASE_URL) {
      throw new Error(
        "OPENAI_API_KEY and DATABASE_URL must be set for RAG generation.",
      )
    }

    const results = await this.ragEngine.search(topic, searchLimit)
    if (results.length === 0) {
      const fallback = `「${topic}」に関する情報が見つからなかったため、要約を作成できませんでした。`
      return await this.createPost(userId, fallback)
    }

    const summary = await this.ragEngine.summarize(topic, results)
    const summaryText =
      summary || "要約結果が空でした。別のトピックを試してください。"

    const content = `# ${topic}\n\n${summaryText}`

    return await this.createPost(userId, content)
  }

  /**
   * 投稿を保存する（通常はAI生成結果を保存するために内部で使用）
   */
  async createPost(userId: string, content: string): Promise<Post> {
    const newPost = Post.create(userId, { content })
    return await this.postRepository.save(newPost)
  }

  async deletePost(id: string): Promise<Post | null> {
    return await this.postRepository.delete(id)
  }
}
