import { beforeEach, describe, expect, it, vi } from "vitest"
import type { RagEngine } from "@/lib/rag/engine"
import type { PostRepository } from "@/server/domain/ports/post.repository"
import { Post } from "@/server/domain/post.entity"
import { PostUseCase } from "./post.usecase"

// Mock environment variables
vi.mock("@/env", () => ({
  env: {
    OPENAI_API_KEY: "test-api-key",
    DATABASE_URL: "test-db-url",
  },
}))

describe("PostUseCase", () => {
  let postUseCase: PostUseCase
  let mockPostRepository: PostRepository
  let mockRagEngine: RagEngine
  const testUserId = "user-123"

  beforeEach(() => {
    mockPostRepository = {
      findAll: vi.fn(),
      findByUserId: vi.fn(),
      findById: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
    }
    mockRagEngine = {
      search: vi.fn(),
      summarize: vi.fn(),
    } as unknown as RagEngine

    postUseCase = new PostUseCase(mockPostRepository, mockRagEngine)
  })

  describe("generateAndCreatePost", () => {
    it("RAGを使用して投稿を生成し保存できること", async () => {
      const topic = "テストトピック"
      const mockSearchResults = [
        {
          chunk_id: "chunk-1",
          content: "テスト内容",
          message_date: new Date(),
          similarity: 0.9,
        },
      ]
      const mockSummary = "AI生成された要約"

      vi.mocked(mockRagEngine.search).mockResolvedValue(mockSearchResults)
      vi.mocked(mockRagEngine.summarize).mockResolvedValue(mockSummary)
      vi.mocked(mockPostRepository.save).mockImplementation(async (p) => p)

      const result = await postUseCase.generateAndCreatePost(testUserId, topic)

      // Verify RAG Engine interaction
      expect(mockRagEngine.search).toHaveBeenCalledWith(topic, 50)
      expect(mockRagEngine.summarize).toHaveBeenCalledWith(
        topic,
        mockSearchResults,
      )

      // Verify Post Repository interaction
      expect(mockPostRepository.save).toHaveBeenCalledTimes(1)
      const savedPost = vi.mocked(mockPostRepository.save).mock.calls[0]![0]
      expect(savedPost.props.userId).toBe(testUserId)
      // Check content contains both topic and summary
      expect(savedPost.props.content).toContain(topic)
      expect(savedPost.props.content).toContain(mockSummary)
      expect(result).toBe(savedPost)
    })

    it("検索結果が空の場合はフォールバックメッセージを保存すること", async () => {
      const topic = "存在しないトピック"
      const emptyResults: never[] = []

      vi.mocked(mockRagEngine.search).mockResolvedValue(emptyResults)
      vi.mocked(mockPostRepository.save).mockImplementation(async (p) => p)

      await postUseCase.generateAndCreatePost(testUserId, topic)

      expect(mockRagEngine.search).toHaveBeenCalledWith(topic, 50)
      expect(mockRagEngine.summarize).not.toHaveBeenCalled()
      expect(mockPostRepository.save).toHaveBeenCalledTimes(1)

      const savedPost = vi.mocked(mockPostRepository.save).mock.calls[0]![0]
      expect(savedPost.props.content).toContain("情報が見つからなかった")
    })
  })

  describe("createPost", () => {
    it("新しい投稿を作成して保存できること", async () => {
      const content = "Test Content"

      // Mock save to return the passed post (imitating a successful DB save)
      vi.mocked(mockPostRepository.save).mockImplementation(
        async (post) => post,
      )

      const result = await postUseCase.createPost(testUserId, content)

      expect(mockPostRepository.save).toHaveBeenCalledTimes(1)
      const savedPost = vi.mocked(mockPostRepository.save).mock.calls[0]![0]

      expect(savedPost.props.userId).toBe(testUserId)
      expect(savedPost.props.content).toBe(content)
      expect(result).toBe(savedPost)
    })

    it("投稿の作成に失敗した場合（重複など）エラーを投げること", async () => {
      const content = "Content"
      const error = new Error("Duplicated entry")

      vi.mocked(mockPostRepository.save).mockRejectedValue(error)

      await expect(postUseCase.createPost(testUserId, content)).rejects.toThrow(
        error,
      )
    })

    it("2000文字を超える投稿の場合エラーを投げること", async () => {
      const content = "a".repeat(2001)

      await expect(
        postUseCase.createPost(testUserId, content),
      ).rejects.toThrow()
    })
  })

  describe("deletePost", () => {
    it("既存の投稿を削除できること", async () => {
      const existingPost = Post.reconstruct({
        id: "post-to-delete",
        userId: testUserId,
        content: "...",
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      vi.mocked(mockPostRepository.delete).mockResolvedValue(existingPost)

      // existingPost.id is guaranteed to be defined because we used reconstruct
      const result = await postUseCase.deletePost(existingPost.id!)

      expect(mockPostRepository.delete).toHaveBeenCalledWith(existingPost.id)
      expect(result).toBe(existingPost)
    })

    it("削除対象の投稿が存在しない場合 null を返すこと", async () => {
      vi.mocked(mockPostRepository.delete).mockResolvedValue(null)

      const result = await postUseCase.deletePost("non-existent-id")

      expect(mockPostRepository.delete).toHaveBeenCalledWith("non-existent-id")
      expect(result).toBeNull()
    })
  })
})
