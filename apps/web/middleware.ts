import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { getSessionCookieNames } from "@/lib/auth-utils"
import { checkRateLimit } from "@/lib/rate-limit"

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  // 1. Page Authentication Check (Default Protected)
  // Note: API認証は Hono middleware で auth.api.getSession() を使って完全に検証
  if (!path.startsWith("/api")) {
    // Public paths: root and anything under /auth/
    const isPublic = path === "/" || path.startsWith("/auth/")

    if (!isPublic) {
      // クッキーの存在チェックのみ (optimistic check)
      const cookieNames = getSessionCookieNames()
      const sessionCookie =
        request.cookies.get(cookieNames.https) ||
        request.cookies.get(cookieNames.http)
      if (!sessionCookie) {
        const url = request.nextUrl.clone()
        url.pathname = "/auth/sign-in"
        url.searchParams.set("callbackUrl", path)
        return NextResponse.redirect(url)
      }
    }
  }

  // 2. Rate Limiting

  const ip = getClientIp(request)
  const rateLimitKey = ip ?? buildAnonymousRateLimitKey(request)
  const result = await checkRateLimit(rateLimitKey, {
    mode: ip ? "ip" : "anonymous",
  })

  if (!result.success) {
    return NextResponse.json(
      {
        error: "Too Many Requests",
        message: "Rate limit exceeded. Please try again later.",
      },
      { status: 429 },
    )
  }

  const response = NextResponse.next()
  response.headers.set("X-RateLimit-Limit", result.limit.toString())
  response.headers.set("X-RateLimit-Remaining", result.remaining.toString())
  response.headers.set("X-RateLimit-Reset", result.reset.toString())

  return response
}

function getClientIp(request: NextRequest): string | null {
  const requestIp = (request as NextRequest & { ip?: string }).ip
  if (requestIp) {
    return requestIp
  }

  const vercelForwardedFor = request.headers.get("x-vercel-forwarded-for")
  if (vercelForwardedFor) {
    return vercelForwardedFor.split(",")[0]?.trim() ?? null
  }

  const isTrustedProxy =
    Boolean(request.headers.get("x-forwarded-proto")) ||
    Boolean(process.env.VERCEL_ENV)

  if (isTrustedProxy) {
    const forwardedFor = request.headers.get("x-forwarded-for")
    if (forwardedFor) {
      return forwardedFor.split(",")[0]?.trim() ?? null
    }

    const realIp = request.headers.get("x-real-ip")
    if (realIp) {
      return realIp
    }
  }

  return null
}

function buildAnonymousRateLimitKey(request: NextRequest): string {
  const parts = [
    request.headers.get("user-agent"),
    request.headers.get("accept-language"),
    request.headers.get("sec-ch-ua"),
  ].filter(Boolean)

  const seed = parts.join("|")
  if (!seed) {
    return "anon:unknown"
  }

  return `anon:${hashString(seed)}`
}

function hashString(value: string): string {
  let hash = 5381
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 33) ^ value.charCodeAt(i)
  }
  return Math.abs(hash).toString(36)
}
