import { createMiddleware } from "hono/factory"
import { auth } from "@/lib/auth"
import { logger } from "@/lib/logger"

const isE2EEnabled = process.env.NEXT_E2E === "true"
const vercelEnv = process.env.VERCEL_ENV

if (isE2EEnabled && vercelEnv && vercelEnv !== "development") {
  throw new Error(
    "[Auth] NEXT_E2E is enabled outside of development Vercel environments.",
  )
}

if (isE2EEnabled && process.env.NODE_ENV === "production") {
  throw new Error("[Auth] NEXT_E2E cannot be enabled in production builds.")
}

type AuthVariables = {
  user: typeof auth.$Infer.Session.user
  session: typeof auth.$Infer.Session.session
}

declare module "hono" {
  interface ContextVariableMap extends AuthVariables {}
}

export const authMiddleware = createMiddleware(async (c, next) => {
  const requestId = c.get("requestId")

  let session: Awaited<ReturnType<typeof auth.api.getSession>> | undefined
  try {
    session = await auth.api.getSession({ headers: c.req.raw.headers })
  } catch (error) {
    logger.error(
      {
        requestId,
        error,
        context: { component: "auth", operation: "getSession" },
      },
      "Session validation failed",
    )
  }

  if (!session) {
    logger.debug(
      {
        requestId,
        context: { component: "auth" },
      },
      "No valid session, checking E2E fallback",
    )

    // Fallback: Manual DB Lookup for E2E/Debug
    // STRICTLY RESTRICTED TO E2E ENVIRONMENT
    // Additional safety check: Only allow in development or test environments
    const isTestEnvironment =
      isE2EEnabled &&
      process.env.NODE_ENV !== "production" &&
      process.env.VERCEL_ENV !== "production" &&
      process.env.VERCEL_ENV !== "preview"

    if (isTestEnvironment) {
      const cookieHeader = c.req.raw.headers.get("cookie")
      if (cookieHeader) {
        const { getE2ESessionFromCookie } = await import("./auth.e2e")
        const e2eSession = await getE2ESessionFromCookie(cookieHeader)
        if (e2eSession) {
          c.set("user", e2eSession.user)
          c.set("session", e2eSession.session)
          return next()
        }
      }
    }

    return c.json(
      {
        error: "Unauthorized",
      },
      401,
    )
  }

  c.set("user", session.user)
  c.set("session", session.session)

  return next()
})
