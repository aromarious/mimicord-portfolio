import { Loader2 } from "lucide-react"
import { useState } from "react"
import { authClient } from "@/lib/auth-client"

const SignIn: React.FC = () => {
  const [loading, setLoading] = useState(false)

  const handleGitHubLogin = async () => {
    await authClient.signIn.social(
      {
        provider: "github",
        callbackURL: "/",
      },
      {
        onRequest: () => setLoading(true),
        onError: () => setLoading(false),
      },
    )
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#36393f] p-4 font-sans">
      <div className="bg-[#2f3136] p-10 rounded-lg shadow-2xl w-full max-w-[480px] animate-in fade-in zoom-in duration-300">
        {/* Login Section */}
        <div className="flex flex-col justify-center">
          <div className="text-center mb-8">
            <h2 className="text-white text-2xl font-bold mb-2">
              Welcome back!
            </h2>
            <p className="text-[#b9bbbe]">
              Log in with your GitHub account to start channelling.
            </p>
          </div>

          <div className="space-y-6">
            <button
              type="button"
              onClick={handleGitHubLogin}
              disabled={loading}
              className={`w-full flex items-center justify-center gap-3 bg-[#24292e] text-white font-medium py-3 px-4 rounded shadow-sm border border-transparent transition-all duration-200 hover:bg-[#2b3137] hover:shadow-md active:bg-[#1b1f23] group ${loading ? "opacity-70 cursor-not-allowed" : ""}`}
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <svg
                  className="w-5 h-5"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  fill="currentColor"
                >
                  <title>GitHub Logo</title>
                  <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                </svg>
              )}
              <span className="text-base">Sign in with GitHub</span>
            </button>

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#4f545c]/30"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-[#2f3136] px-2 text-[#72767d] font-bold">
                  Secure Authentication
                </span>
              </div>
            </div>

            <p className="text-[#8e9297] text-xs text-center leading-relaxed">
              By logging in, you agree to Mimicord's
              <button
                type="button"
                className="text-[#00aff4] hover:underline mx-1"
              >
                Terms of Service
              </button>
              and
              <button
                type="button"
                className="text-[#00aff4] hover:underline mx-1"
              >
                Privacy Policy
              </button>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SignIn
