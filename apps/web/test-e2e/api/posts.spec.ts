import { expect, test } from "@playwright/test"
import { eq } from "drizzle-orm"
import { db } from "../../../../packages/db/src/client"
import { PostTable, UserTable } from "../../../../packages/db/src/schema"

test.describe("Posts API E2E", () => {
  test.beforeEach(async () => {
    // 各テストの前に、テストユーザーの投稿を削除して独立性を確保する
    const testUser = await db
      .select({ id: UserTable.id })
      .from(UserTable)
      .where(eq(UserTable.email, "test-user@example.com"))
      .limit(1)

    if (testUser[0]) {
      await db.delete(PostTable).where(eq(PostTable.userId, testUser[0].id))
    }
  })

  test("POST /api/v0/protected/posts/initial creates or returns initial post", async ({
    request,
  }) => {
    // beforeEach で投稿が削除されているため、必ず「初期投稿の作成」が行われる
    const response = await request.post("/api/v0/protected/posts/initial")

    expect(response.status()).toBe(200)

    const data = await response.json()
    expect(data).toHaveProperty("id")

    // 初期投稿の内容を厳格に検証（独立性が保証されたため）
    expect(data.content).toContain("ようこそ！")
    expect(data.content).toContain("8年分")
    expect(data.content).toContain("友人との8年分の雑談")
  })

  test("GET /api/v0/protected/posts returns posts list", async ({
    request,
  }) => {
    const response = await request.get("/api/v0/protected/posts")

    expect(response.status()).toBe(200)
    expect(response.headers()["content-type"]).toContain("application/json")

    const data = await response.json()
    expect(Array.isArray(data)).toBe(true)
  })

  test("POST /api/v0/protected/posts creates a new post via AI", async ({
    request,
  }) => {
    const response = await request.post("/api/v0/protected/posts", {
      data: { topic: "最近の話題" },
    })

    expect(response.status()).toBe(201)

    const data = await response.json()
    expect(data).toHaveProperty("id")
    expect(data).toHaveProperty("content")
    expect(typeof data.content).toBe("string")
    expect(data.content.length).toBeGreaterThan(0)
    expect(data).toHaveProperty("createdAt")
    expect(data).toHaveProperty("updatedAt")
  })

  test("GET /api/v0/protected/posts/:id returns a specific post", async ({
    request,
  }) => {
    // まずAIで投稿を作成
    const createResponse = await request.post("/api/v0/protected/posts", {
      data: { topic: "技術" },
    })
    const createdPost = await createResponse.json()

    // 作成した投稿を取得
    const response = await request.get(
      `/api/v0/protected/posts/${createdPost.id}`,
    )

    expect(response.status()).toBe(200)

    const data = await response.json()
    expect(data).toHaveProperty("id", createdPost.id)
    expect(data).toHaveProperty("content", createdPost.content)
  })

  test("GET /api/v0/protected/posts/:id returns 404 for non-existent post", async ({
    request,
  }) => {
    const response = await request.get(
      "/api/v0/protected/posts/non-existent-id",
    )

    expect(response.status()).toBe(404)
  })
})
