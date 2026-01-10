import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi"
import { db } from "@packages/db"
import { INITIAL_NOTICE_TEXT } from "@/lib/constants"
import { logger } from "@/lib/logger"
import { RagEngine } from "@/lib/rag/engine"
import { PostRepositoryImpl as PostRepository } from "@/server/infrastructure/repositories/post.repository.drizzle"
import { PostUseCase } from "@/server/usecase/post.usecase"
import { toPostResponse } from "../dto/post.mapper"
import { createPostSchema, postResponseSchema } from "../dto/post.schema"

// Lazy initialization - インスタンスは実行時（リクエスト処理時）に作成される
let postRepositoryInstance: PostRepository | null = null
let ragEngineInstance: RagEngine | null = null
let postUseCaseInstance: PostUseCase | null = null

function getPostRepository(): PostRepository {
  if (!postRepositoryInstance) {
    postRepositoryInstance = new PostRepository(db)
  }
  return postRepositoryInstance
}

function getPostUseCase(): PostUseCase {
  if (!postUseCaseInstance) {
    const postRepository = getPostRepository()
    ragEngineInstance = new RagEngine()
    postUseCaseInstance = new PostUseCase(postRepository, ragEngineInstance)
  }
  return postUseCaseInstance
}
const path = "/"
const tags = ["v0/Posts (Protected)"]

// routes for /api/v0/protected/posts
// Note: These routes are already protected by middleware at the router level
export const protectedPostsRoutes = new OpenAPIHono()
  // GET /api/v0/protected/posts - 自分が生成した投稿一覧を取得
  .openapi(
    createRoute({
      method: "get",
      path,
      tags,
      request: {
        query: z.object({
          limit: z.coerce
            .number()
            .int()
            .positive()
            .max(100)
            .optional()
            .default(20),
          offset: z.coerce.number().int().nonnegative().optional().default(0),
        }),
      },
      responses: {
        401: {
          description: "Unauthorized",
        },
        200: {
          content: {
            "application/json": {
              schema: z.array(postResponseSchema),
            },
          },
          description: "List user's own posts",
        },
      },
    }),
    async (c) => {
      const user = c.var.user
      if (!user) {
        return c.json({ error: "Unauthorized" }, 401)
      }
      const { limit, offset } = c.req.valid("query")
      const userPosts = await getPostRepository().findByUserId(user.id, {
        limit,
        offset,
      })
      return c.json(userPosts.map((p) => toPostResponse(p)))
    },
  )
  // POST /api/v0/protected/posts - 新規投稿作成 (AI生成)
  .openapi(
    createRoute({
      method: "post",
      path,
      tags,
      request: {
        body: {
          content: {
            "application/json": {
              schema: createPostSchema,
            },
          },
        },
      },
      responses: {
        400: {
          description: "Invalid request body",
        },
        401: {
          description: "Unauthorized",
        },
        500: {
          description: "Failed to generate post",
        },
        201: {
          content: {
            "application/json": {
              schema: postResponseSchema,
            },
          },
          description: "Create a new post",
        },
      },
    }),
    async (c) => {
      const user = c.var.user
      if (!user) {
        return c.json({ error: "Unauthorized" }, 401)
      }
      const body = await c.req.json()
      const parsed = createPostSchema.safeParse(body)
      if (!parsed.success) {
        return c.json({ error: "Invalid request body" }, 400)
      }

      const { topic, searchLimit } = parsed.data
      try {
        const savedPost = await getPostUseCase().generateAndCreatePost(
          user.id,
          topic,
          searchLimit,
        )
        return c.json(toPostResponse(savedPost), 201)
      } catch (error) {
        const requestId = c.get("requestId")
        logger.error(
          { error, requestId, userId: user.id },
          "Failed to generate post",
        )
        return c.json({ error: "Failed to generate post" }, 500)
      }
    },
  )
  // POST /api/v0/protected/posts/initial - 投稿がない場合に初期投稿を作成
  .openapi(
    createRoute({
      method: "post",
      path: "/initial",
      tags,
      responses: {
        401: {
          description: "Unauthorized",
        },
        200: {
          content: {
            "application/json": {
              schema: postResponseSchema,
            },
          },
          description: "Initialize or get existing initial post",
        },
      },
    }),
    async (c) => {
      const user = c.var.user
      if (!user) {
        return c.json({ error: "Unauthorized" }, 401)
      }

      const repository = getPostRepository()
      const posts = await repository.findByUserId(user.id, { limit: 1 })

      if (posts.length === 0) {
        const useCase = getPostUseCase()
        const savedPost = await useCase.createPost(user.id, INITIAL_NOTICE_TEXT)
        return c.json(toPostResponse(savedPost), 200)
      }

      const post = posts[0]! // posts.length > 0 ensures posts[0] exists
      return c.json(toPostResponse(post), 200)
    },
  )
  // GET /api/v0/protected/posts/:id - 特定の投稿を取得（所有者チェック付き）
  .openapi(
    createRoute({
      method: "get",
      path: "/:id",
      tags,
      responses: {
        400: {
          description: "Invalid ID",
        },
        401: {
          description: "Unauthorized",
        },
        404: {
          description: "Post not found",
        },
        200: {
          content: {
            "application/json": {
              schema: postResponseSchema,
            },
          },
          description: "Get a specific post",
        },
      },
    }),
    async (c) => {
      const user = c.var.user
      if (!user) {
        return c.json({ error: "Unauthorized" }, 401)
      }
      const id = c.req.param("id")
      if (!id) return c.json({ error: "Invalid ID" }, 400)

      const post = await getPostRepository().findById(id)
      if (!post || post.userId !== user.id) {
        return c.json({ error: "Post not found" }, 404)
      }

      return c.json(toPostResponse(post))
    },
  )
  // DELETE /api/v0/protected/posts/:id - 投稿削除（所有者チェック付き）
  .openapi(
    createRoute({
      method: "delete",
      path: "/:id",
      tags,
      responses: {
        400: {
          description: "Invalid ID",
        },
        401: {
          description: "Unauthorized",
        },
        403: {
          description: "Forbidden - not the owner",
        },
        404: {
          description: "Post not found",
        },
        204: {
          description: "Delete a post",
        },
      },
    }),
    async (c) => {
      const user = c.var.user
      if (!user) {
        return c.json({ error: "Unauthorized" }, 401)
      }
      const id = c.req.param("id")
      if (!id) return c.json({ error: "Invalid ID" }, 400)

      // 投稿を取得して所有者チェック
      const post = await getPostRepository().findById(id)
      if (!post) {
        return c.json({ error: "Post not found" }, 404)
      }

      if (post.userId !== user.id) {
        return c.json({ error: "Forbidden" }, 403)
      }

      await getPostUseCase().deletePost(id)
      return c.body(null, 204)
    },
  )
