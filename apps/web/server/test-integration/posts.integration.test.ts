import { db, PostTable, sql, UserTable } from "@packages/db"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { createClient } from "@/lib/client"
import app from "@/server/index"

const testUserId = "test-user"
const otherUserId = "other-user"

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: vi.fn().mockResolvedValue({
        user: { id: "test-user" },
        session: { id: "test-session" },
      }),
    },
    $Infer: {
      Session: {
        user: {},
        session: {},
      },
    },
  },
}))

// Mock RAG Engine
vi.mock("@/lib/rag/engine", () => {
  return {
    RagEngine: class {
      async search() {
        return [
          {
            chunk_id: "chunk-1",
            content: "Mocked context",
            message_date: new Date(),
            similarity: 0.9,
          },
        ]
      }

      async summarize() {
        return "AI Generated Content"
      }
    },
  }
})

describe("Posts API Integration Test", () => {
  beforeEach(async () => {
    // データがあれば全削除してクリーンな状態にする
    await db.execute(sql`TRUNCATE TABLE ${PostTable} CASCADE`)
    await db.execute(sql`TRUNCATE TABLE ${UserTable} CASCADE`)

    // テストユーザーを作成
    await db.insert(UserTable).values([
      {
        id: testUserId,
        name: "Test User",
        email: "test@example.com",
        emailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: otherUserId,
        name: "Other User",
        email: "other@example.com",
        emailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ])
  })

  const customFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    return app.request(input.toString(), init)
  }

  const { protectedClient } = createClient({
    fetch: customFetch,
  })

  type CreatePostRequest = Parameters<typeof protectedClient.posts.$post>[0]
  type CreatePostInput = CreatePostRequest extends { json: infer T } ? T : never
  type PostResponse = { id: string; userId: string; content: string }

  describe("Post API", () => {
    it("投稿を作成し、取得、削除できるべき", async () => {
      // 1. Create a post
      const createPayload = { topic: "テストトピック" } as CreatePostInput
      const createRes = await protectedClient.posts.$post({
        json: createPayload, // Schema changed, client might need codegen update or cast
      })
      expect(createRes.status).toBe(201)
      const created = (await createRes.json()) as PostResponse
      // Content should be what AI returned (Mocked)
      expect(created.content).toBe("# テストトピック\n\nAI Generated Content")
      expect(created.userId).toBe(testUserId)
      expect(created.id).toBeDefined()

      // 2. Retrieve all posts (should return user's own posts only)
      const listRes = await protectedClient.posts.$get({ query: {} })
      expect(listRes.status).toBe(200)
      const list = (await listRes.json()) as PostResponse[]
      expect(list).toHaveLength(1)
      expect(list[0]!.id).toBe(created.id)

      // 3. Delete a post
      const deleteRes = await protectedClient.posts[":id"].$delete({
        param: { id: created.id },
      })
      expect(deleteRes.status).toBe(204)

      // Verify list is empty
      const listAfterDeleteRes = await protectedClient.posts.$get({
        query: {},
      })
      expect(listAfterDeleteRes.status).toBe(200)
      const listAfterDelete =
        (await listAfterDeleteRes.json()) as PostResponse[]
      expect(listAfterDelete).toHaveLength(0)
    })

    it("他のユーザーの投稿は表示されないべき", async () => {
      // 他のユーザーの投稿を直接DBに追加
      await db.insert(PostTable).values({
        userId: otherUserId,
        content: "Other user's post",
      })

      // 自分の投稿一覧を取得
      const listRes = await protectedClient.posts.$get({ query: {} })
      expect(listRes.status).toBe(200)
      const list = (await listRes.json()) as PostResponse[]
      expect(list).toHaveLength(0) // 他のユーザーの投稿は見えない
    })

    it("他のユーザーの投稿を削除しようとすると403エラーを返すべき", async () => {
      // 他のユーザーの投稿を直接DBに追加
      const [otherPost] = await db
        .insert(PostTable)
        .values({
          userId: otherUserId,
          content: "Other user's post",
        })
        .returning()

      // 削除を試みる
      const deleteRes = await protectedClient.posts[":id"].$delete({
        param: { id: otherPost!.id },
      })
      expect(deleteRes.status).toBe(403)

      // 投稿がまだ存在することを確認
      const inDb = await db.select().from(PostTable)
      expect(inDb).toHaveLength(1)
    })

    it("存在しない投稿を削除しようとすると404を返すべき", async () => {
      const res = await protectedClient.posts[":id"].$delete({
        param: { id: "non-existent-id" },
      })
      expect(res.status).toBe(404)
    })

    it("投稿が0件のときに /initial を呼ぶと初期投稿が作成されるべき", async () => {
      // 1. /initial を呼ぶ
      const res = await protectedClient.posts.initial.$post()
      expect(res.status).toBe(200)

      const data = (await res.json()) as PostResponse
      expect(data.content).toBe(
        "ようこそ！ Aromariousの友人との8年分の雑談から、指定のトピックについて要約します。トピックを選択し、「Summarize messages」をクリックして開始してください。\n\n※ 友人との断片的な会話からの要約のため、まとまりのある回答が得られるとは限りません。",
      )
      expect(data.userId).toBe(testUserId)

      // 2. DBに保存されていることを確認
      const listRes = await protectedClient.posts.$get({ query: {} })
      const list = (await listRes.json()) as PostResponse[]
      expect(list).toHaveLength(1)
      expect(list[0]!.id).toBe(data.id)
    })

    it("既に投稿があるときに /initial を呼ぶと既存の最新の投稿を返すべき", async () => {
      // 1. 既存の投稿を作成
      await db.insert(PostTable).values({
        userId: testUserId,
        content: "Existing post",
      })

      // 2. /initial を呼ぶ
      const res = await protectedClient.posts.initial.$post()
      expect(res.status).toBe(200)

      const data = (await res.json()) as PostResponse
      expect(data.content).toBe("Existing post")

      // 3. 投稿が増えていないことを確認
      const listRes = await protectedClient.posts.$get({ query: {} })
      const list = (await listRes.json()) as PostResponse[]
      expect(list).toHaveLength(1)
    })
  })
})
