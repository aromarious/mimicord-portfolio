import { db } from "@packages/db"
import * as schema from "@packages/db/schema"
import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { env } from "@/env"

// baseURL: Better Authが使用するベースURL
// 環境変数 BETTER_AUTH_URL を必須とする
const baseURL =
  process.env.VERCEL_ENV === "preview"
    ? "https://preview-mimicord.aromarious.com"
    : env.BETTER_AUTH_URL

import { expo } from "@better-auth/expo"
import { openAPI } from "better-auth/plugins"

// trustedOrigins: CORS対策のため、すべての有効なオリジンを含める
const trustedOrigins = [
  "http://localhost:3000", // ローカル開発
  "http://localhost:3001", // ローカル統合、CIテスト
  "https://mimicord-app-web.vercel.app", // Production
  "https://preview-mimicord.aromarious.com", // Custom Preview Domain
  "https://mimicord.aromarious.com", // Production Custom Domain
]

// Vercel環境のURLを動的に追加（Preview, Production含む）
if (process.env.VERCEL_URL) {
  trustedOrigins.push(`https://${process.env.VERCEL_URL}`)
}
if (process.env.VERCEL_BRANCH_URL) {
  trustedOrigins.push(`https://${process.env.VERCEL_BRANCH_URL}`)
}

if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
  trustedOrigins.push(`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`)
}

const githubClientId =
  process.env.VERCEL_ENV === "preview" && env.GITHUB_CLIENT_ID_PREVIEW
    ? env.GITHUB_CLIENT_ID_PREVIEW
    : env.GITHUB_CLIENT_ID

const githubClientSecret =
  process.env.VERCEL_ENV === "preview" && env.GITHUB_CLIENT_SECRET_PREVIEW
    ? env.GITHUB_CLIENT_SECRET_PREVIEW
    : env.GITHUB_CLIENT_SECRET

export const auth = betterAuth({
  baseURL,
  trustedOrigins,
  secret: env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, {
    provider: "pg", // or "postgres", "mysql", "sqlite"
    schema: {
      user: schema.UserTable,
      session: schema.SessionTable,
      account: schema.AccountTable,
      verification: schema.VerificationTable,
    },
  }),
  emailAndPassword: {
    enabled: false,
  },
  socialProviders: {
    github: {
      clientId: githubClientId,
      clientSecret: githubClientSecret,
    },
  },
  plugins: [openAPI(), expo()],
})
