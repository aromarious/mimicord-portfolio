import { OpenAPIHono } from "@hono/zod-openapi"
import { Scalar } from "@scalar/hono-api-reference"
import { cors } from "hono/cors"
import { env } from "@/env"
import { logger } from "@/lib/logger"
import { API_VERSIONS } from "../lib/api-versions"
import { authMiddleware } from "./middleware/auth"
import { requestIdMiddleware } from "./middleware/request-id"
import { protectedPostsRoutes } from "./routes/protected/posts"
import { healthRoute, systemRoutes } from "./routes/system"

// Honoアプリケーションの新しいインスタンスを作成し、厳格なルーティングを無効化し、APIのベースパス /api を設定
const app = new OpenAPIHono({ strict: false }).basePath("/api")

// Request ID middleware (must be first)
app.use("*", requestIdMiddleware)

// Request logger middleware
app.use("*", async (c, next) => {
  const requestId = c.get("requestId")
  const start = Date.now()

  await next()

  const duration = Date.now() - start
  logger.info(
    {
      requestId,
      method: c.req.method,
      path: c.req.path,
      status: c.res.status,
      duration,
    },
    "Request completed",
  )
})

app
  // CORS middleware
  .use(
    "/*",
    cors({
      origin: (origin) => {
        if (env.NODE_ENV === "development") {
          return origin // Allow all in dev (for Expo/Mobile)
        }
        if (!origin) return undefined
        if (
          origin === "https://mimicord-app-web.vercel.app" ||
          origin === "https://mimicord.aromarious.com" ||
          origin === "https://preview-mimicord.aromarious.com" ||
          origin.endsWith(".vercel.app")
        ) {
          return origin
        }
        return undefined
      },
      credentials: true,
    }),
  )

// v0 API Definition - Chaining is important for type inference!
const v0 = new OpenAPIHono()
  .route("/public", systemRoutes) // v0/public/health etc
  .use("/protected/*", authMiddleware)
  .route("/protected/posts", protectedPostsRoutes)

const routes = app.route("/", healthRoute).route(`/${API_VERSIONS.v0}`, v0) // mount v0 API

app
  // OpenAPI document
  .doc("/doc", {
    openapi: "3.0.0",
    info: {
      version: "0.1.0",
      title: "Mimicord API",
    },
    tags: [
      { name: "System", description: "General system endpoints" },
      { name: "v0/System", description: "v0 System endpoints" },
      {
        name: "v0/Posts (Protected)",
        description: "v0 Protected Post endpoints",
      },
    ],
  })
  // API Reference
  .get(
    "/reference",
    Scalar({
      url: "/api/doc",
    }),
  )

export type AppType = typeof routes
export type ApiType = typeof v0
export default app
