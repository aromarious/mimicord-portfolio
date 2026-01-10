import { useCallback, useEffect, useRef, useState } from "react"
import type { Post } from "@/frontend/api/post-client"
import {
  createSummary,
  getPosts,
  initializeChat,
} from "@/frontend/api/post-client"

import { BOT_AVATAR, RAG_SEARCH_LIMIT } from "@/frontend/constants"

import type { Message } from "@/frontend/types"
import { INITIAL_NOTICE_TEXT } from "@/lib/constants"

const INITIAL_LIMIT = 5

export function useChat({ enabled = true }: { enabled?: boolean } = {}) {
  const [messages, setMessages] = useState<Message[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [offset, setOffset] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto scroll logic (only when new messages are added to the bottom)
  const shouldAutoScroll = useRef(true)
  useEffect(() => {
    if (scrollRef.current && messages.length > 0 && shouldAutoScroll.current) {
      // DOMレンダリング完了後にスクロールを実行
      requestAnimationFrame(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
      })
    }
  }, [messages])

  // Convert Post to Message
  const toMessage = useCallback((post: Post): Message => {
    return {
      id: post.id,
      author: "Aromarious-mimic",
      avatar: BOT_AVATAR,
      content: post.content,
      timestamp: new Date(post.createdAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      isBot: true,
    }
  }, [])

  // Initial greeting or fetch history
  useEffect(() => {
    if (!enabled) return

    let mounted = true

    const initChat = async () => {
      try {
        console.log("[useChat] Initializing chat, fetching history...")
        const history = await getPosts({ limit: INITIAL_LIMIT })
        console.log("[useChat] History fetched:", history.length, "posts")

        if (!mounted) return

        // 初期ロード時は確実に下端にスクロール
        shouldAutoScroll.current = true

        // 取得順は新しい順(desc)なので、古い順(asc)に反転して表示する
        // これにより、チャットのように新しい投稿が下に来るようになる
        if (history.length > 0) {
          const historyMessages: Message[] = history.reverse().map(toMessage)
          setMessages(historyMessages)
          setOffset(history.length)
          setHasMore(history.length === INITIAL_LIMIT)
        } else {
          // 投稿がない場合は初期投稿を作成して取得
          console.log("[useChat] No history found, calling initializeChat...")
          const initialPost = await initializeChat()
          console.log(
            "[useChat] initializeChat result:",
            initialPost ? "success" : "failed",
          )
          if (initialPost) {
            setMessages([toMessage(initialPost)])
            setOffset(1)
            setHasMore(false)
          } else {
            // 万が一APIに失敗した場合は、表示のみを行う（フォールバック）
            setMessages([
              {
                id: "init-fallback",
                author: "Aromarious-mimic",
                avatar: BOT_AVATAR,
                content: INITIAL_NOTICE_TEXT,
                timestamp: new Date().toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                }),
                isBot: true,
              },
            ])
            setHasMore(false)
          }
        }
      } finally {
        if (mounted) setIsInitialLoading(false)
      }
    }

    initChat()

    return () => {
      mounted = false
    }
  }, [enabled, toMessage])

  // Load more messages (for infinite scroll)
  const loadMore = useCallback(async () => {
    if (!hasMore || isLoadingMore || !scrollRef.current) return

    // 現在のスクロール位置と高さを保存
    const scrollElement = scrollRef.current
    const previousScrollHeight = scrollElement.scrollHeight
    const previousScrollTop = scrollElement.scrollTop

    setIsLoadingMore(true)
    const additionalPosts = await getPosts({ limit: 20, offset })

    if (additionalPosts.length === 0) {
      setHasMore(false)
    } else {
      // 古い投稿を先頭に追加
      const newMessages = additionalPosts.reverse().map(toMessage)
      shouldAutoScroll.current = false // 追加読み込み時は自動スクロールしない
      setMessages((prev) => [...newMessages, ...prev])
      setOffset((prev) => prev + additionalPosts.length)
      setHasMore(additionalPosts.length === 20)

      // スクロール位置を調整（新しく追加されたコンテンツの高さ分だけ下にずらす）
      requestAnimationFrame(() => {
        if (scrollRef.current) {
          const newScrollHeight = scrollRef.current.scrollHeight
          const addedHeight = newScrollHeight - previousScrollHeight
          scrollRef.current.scrollTop = previousScrollTop + addedHeight
        }
      })
    }

    setIsLoadingMore(false)
  }, [hasMore, isLoadingMore, offset, toMessage])

  // Handle scroll event
  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const target = e.currentTarget
      // 上端から50px以内にスクロールしたら追加読み込み
      if (target.scrollTop < 50 && hasMore && !isLoadingMore) {
        loadMore()
      }
      // 下端付近にいる場合は自動スクロールを有効化
      const isNearBottom =
        target.scrollHeight - target.scrollTop - target.clientHeight < 100
      shouldAutoScroll.current = isNearBottom
    },
    [hasMore, isLoadingMore, loadMore],
  )

  const handleNext = useCallback(
    async (topic: string) => {
      if (isProcessing || !topic.trim()) return

      setIsProcessing(true)
      shouldAutoScroll.current = true // 新しいメッセージ追加時は自動スクロール
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

      const responseText = await createSummary(topic, RAG_SEARCH_LIMIT)

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === loadingId
            ? { ...msg, content: responseText, isLoading: false }
            : msg,
        ),
      )

      // 新しい投稿が作成されたので、offsetを増やす
      // (降順ソートなので、次の loadMore で重複を防ぐため)
      setOffset((prev) => prev + 1)

      setIsProcessing(false)
    },
    [isProcessing],
  )

  return {
    messages,
    isProcessing,
    scrollRef,
    handleNext,
    handleScroll,
    isLoadingMore,
    hasMore,
    isInitialLoading,
  }
}
