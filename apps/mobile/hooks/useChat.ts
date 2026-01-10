import { useCallback, useEffect, useState } from "react"
import { BOT_AVATAR } from "../constants"
import { authClient } from "../lib/auth"
import type { Message, Post } from "../types"

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchHistory = useCallback(async () => {
    try {
      // Use better-auth fetch for token handling
      const response = await authClient.$fetch("/api/v0/protected/posts", {
        method: "GET",
      })

      // Handle BetterAuth fetch response which might be Data | Error
      const history =
        (response as unknown as { data?: Post[] }).data ||
        (response as unknown as Post[])

      if (Array.isArray(history) && history.length > 0) {
        // Reverse to show older at top, newer at bottom
        const historyMessages: Message[] = history
          .slice() // copy to avoid mutating
          .reverse()
          .map((post: Post) => ({
            id: post.id,
            author: "Aromarious-mimic",
            avatar: BOT_AVATAR,
            content: post.content,
            timestamp: new Date(post.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
            isBot: true,
          }))
        setMessages(historyMessages)
      } else {
        setMessages([
          {
            id: "init-1",
            author: "Aromarious-mimic",
            avatar: BOT_AVATAR,
            content:
              "ようこそ！このチャンネルは読み取り専用です。「Generate Post」をタップして開始してください。",
            timestamp: new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
            isBot: true,
          },
        ])
      }
    } catch (err) {
      console.error("Fetch History Error:", err)
      setError("Failed to load message history.")
    }
  }, [])

  useEffect(() => {
    fetchHistory()
  }, [fetchHistory])

  const handleNext = useCallback(async () => {
    if (isProcessing) return

    setIsProcessing(true)
    setError(null)

    const now = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })
    const loadingId = `bot-loading-${Date.now()}`

    // Add placeholder for AI response
    setMessages((prev) => [
      ...prev,
      {
        id: loadingId,
        author: "Aromarious-mimic",
        avatar: BOT_AVATAR,
        content: "",
        timestamp: now,
        isBot: true,
        isLoading: true,
      },
    ])

    try {
      const response = await authClient.$fetch("/api/v0/protected/posts", {
        method: "POST",
        body: {},
      })

      const data =
        (response as unknown as { data?: Post }).data ||
        (response as unknown as Post)

      const responseText =
        data.content || "Oops, I blanked out. Tap again to retry!"

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === loadingId
            ? { ...msg, content: responseText, isLoading: false }
            : msg,
        ),
      )
    } catch (err) {
      console.error("Chat API Error:", err)
      setError("Connection lost. Please try again.")
      // Remove loading state on error
      setMessages((prev) => prev.filter((msg) => msg.id !== loadingId))
    } finally {
      setIsProcessing(false)
    }
  }, [isProcessing])

  return {
    messages,
    isProcessing,
    error,
    handleNext,
    refreshChat: fetchHistory,
  }
}
