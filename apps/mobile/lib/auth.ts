import { expoClient } from "@better-auth/expo/client"
import { createAuthClient } from "better-auth/react"
import Constants from "expo-constants"
import * as SecureStore from "expo-secure-store"

// Use environment variable from EAS/app.json, or fallback to localhost
export const BASE_URL =
  Constants.expoConfig?.extra?.apiUrl ?? "http://localhost:3000"

// Custom plugin to force prompt param if missing
const forcePromptPlugin = {
  id: "force-prompt",
  hooks: {
    async onSuccess(context: any) {
      if (!context.data?.url) return

      try {
        const urlStr = context.data.url
        const urlObj = new URL(urlStr)

        // Check if it's the Expo Authorization Proxy
        const authUrlParam = urlObj.searchParams.get("authorizationURL")

        if (authUrlParam) {
          // It's a proxy URL, parse the nested authorizationURL
          const nestedUrlObj = new URL(authUrlParam)
          if (nestedUrlObj.hostname.includes("google.com")) {
            nestedUrlObj.searchParams.set("prompt", "select_account")

            // Update the main URL's parameter
            urlObj.searchParams.set("authorizationURL", nestedUrlObj.toString())
            context.data.url = urlObj.toString()
          }
        } else if (urlStr.includes("accounts.google.com")) {
          // Direct Google URL
          urlObj.searchParams.set("prompt", "select_account")
          context.data.url = urlObj.toString()
        }
      } catch (e) {
        // failed to modify url
      }
    },
  },
}

export const authClient = createAuthClient({
  baseURL: BASE_URL,
  plugins: [
    forcePromptPlugin,
    expoClient({
      scheme: "mimicord",
      storage: SecureStore,
    }),
  ],
})

export const signInWithGoogle = async () => {
  return await authClient.signIn.social({
    provider: "google",
    callbackURL: "/auth/callback", // converted to mimicord://auth/callback
  })
}

export const signOut = async () => {
  try {
    await authClient.signOut()
    return true
  } catch (e) {
    return false
  }
}
