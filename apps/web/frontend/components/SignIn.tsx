import { Loader2, X } from "lucide-react"
import { useEffect, useState } from "react"
import { authClient } from "@/lib/auth-client"
import Markdown from "./ui/Markdown"

const TERMS_TEXT = `
## Terms of Service

**1. Introduction**
Welcome to Mimicord. By accessing or using our Service, you agree to be bound by these Terms.

**2. Use of Service**
You agree to use Mimicord only for lawful purposes and in accordance with these Terms.

**3. User Data**
We use your GitHub profile information (name, email, and avatar) to create and manage your account. By using this service, you grant us permission to process this data for authentication purposes.

**4. Disclaimer**
The Service is provided "as is" without warranties of any kind. We are not responsible for the accuracy of AI-generated summaries.

**5. Contact**
If you have any questions about these Terms, please contact us.
`

const PRIVACY_TEXT = `
## Privacy Policy

**1. Information Collection**
We collect basic profile information from your GitHub account, including your name, email address, and profile picture.

**2. How We Use Information**
We use the information we collect to provide secure authentication and access control to our services.

**3. Data Sharing**
We do not share your personal information with third parties except as described in this policy or with your consent.

**4. Data Security**
We take reasonable measures to help protect information about you from loss, theft, misuse and unauthorized access.

**5. Contact**
If you have questions about this Privacy Policy, please contact us.
`

const TermsModal: React.FC<{
  isOpen: boolean
  onClose: () => void
  title: string
  content: string
}> = ({ isOpen, onClose, title, content }) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown)
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#36393f] w-full max-w-lg rounded-lg shadow-2xl border border-[#202225] animate-in zoom-in-95 duration-200 flex flex-col max-h-[90dvh]">
        <div className="flex items-center justify-between p-4 border-b border-[#202225] bg-[#2f3136] shrink-0">
          <h3 className="text-white font-bold text-lg">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-[#b9bbbe] hover:text-white transition-colors p-1 rounded hover:bg-[#40444b]"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto bg-[#36393f] relative flex-1 min-h-0">
          <Markdown content={content.trim()} />
        </div>
        <div className="p-4 bg-[#2f3136] border-t border-[#202225] flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="bg-[#5865f2] hover:bg-[#4752c4] text-white px-6 py-2 rounded font-medium transition-colors text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

const SignIn: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [modalState, setModalState] = useState<{
    isOpen: boolean
    title: string
    content: string
  }>({
    isOpen: false,
    title: "",
    content: "",
  })

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

  const openModal = (title: string, content: string) => {
    setModalState({ isOpen: true, title, content })
  }

  const closeModal = () => {
    setModalState((prev) => ({ ...prev, isOpen: false }))
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#36393f] p-4 font-sans">
      <TermsModal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        title={modalState.title}
        content={modalState.content}
      />

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
                  <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.286-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
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
                onClick={() => openModal("Terms of Service", TERMS_TEXT)}
                className="text-[#00aff4] hover:underline mx-1 cursor-pointer"
              >
                Terms of Service
              </button>
              and
              <button
                type="button"
                onClick={() => openModal("Privacy Policy", PRIVACY_TEXT)}
                className="text-[#00aff4] hover:underline mx-1 cursor-pointer"
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
