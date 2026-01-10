import { randomUUID } from "node:crypto"
import { createMiddleware } from "hono/factory"

declare module "hono" {
  interface ContextVariableMap {
    requestId: string
  }
}

/**
 * Request ID middleware
 * Generates a unique ID for each request and makes it available in context
 */
export const requestIdMiddleware = createMiddleware(async (c, next) => {
  const requestId = randomUUID()
  c.set("requestId", requestId)

  // Add to response headers for client-side tracking
  c.header("X-Request-ID", requestId)

  await next()
})
