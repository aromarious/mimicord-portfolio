"use client"

import { Loader2 } from "lucide-react"
import React from "react"
import Layout from "@/frontend/components/Layout"
import MessageItem from "@/frontend/components/MessageItem"
import SignIn from "@/frontend/components/SignIn"
import { Skeleton } from "@/frontend/components/Skeleton"
import { SUMMARIZE_COMMAND, TOPIC_QUESTIONS } from "@/frontend/constants"
import { useChat } from "@/frontend/hooks/useChat"
import { authClient } from "@/lib/auth-client"

const RootChatPage: React.FC = () => {
  const { data: session, isPending } = authClient.useSession()
  const {
    messages,
    isProcessing,
    scrollRef,
    handleNext,
    handleScroll,
    isLoadingMore,
    hasMore,
    isInitialLoading,
  } = useChat({
    enabled: !!session,
  })
  const [mounted, setMounted] = React.useState(false)
  const [topic, setTopic] = React.useState("")

  const shuffledTopics = React.useMemo(() => {
    const array = [...TOPIC_QUESTIONS]
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      const temp = array[i]!
      array[i] = array[j]!
      array[j] = temp
    }
    return array
  }, [])

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || isPending) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#36393f]">
        <Loader2 className="animate-spin text-[#72767d]" size={48} />
      </div>
    )
  }

  if (!session) {
    return <SignIn />
  }

  return (
    <Layout>
      {/* Messages List Area */}
      <div
        className="flex-1 overflow-y-auto py-4 bg-[#36393f] scroll-smooth"
        ref={scrollRef}
        onScroll={handleScroll}
      >
        <div className="max-w-4xl mx-auto">
          {isLoadingMore && hasMore && (
            <div className="flex justify-center py-2">
              <Loader2 className="animate-spin text-[#72767d]" size={20} />
            </div>
          )}
          {isInitialLoading ? (
            <div className="flex flex-col">
              {[...Array(5)].map((_, i) => (
                <div
                  key={`skeleton-${i}`}
                  className="flex px-4 py-2 hover:bg-[#32353b]"
                >
                  <Skeleton className="w-10 h-10 rounded-full mt-1 mr-4 shrink-0" />
                  <div className="flex flex-col w-full">
                    <div className="flex items-baseline gap-2 mb-1">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-[90%]" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            messages.map((msg) => <MessageItem key={msg.id} message={msg} />)
          )}
        </div>
      </div>

      {/* Interaction Area */}
      <div className="px-4 pb-4 md:pb-10 shrink-0 bg-[#36393f]">
        <div className="max-w-2xl mx-auto">
          <div className="mb-3">
            <label
              htmlFor="topic"
              className="block text-xs font-bold uppercase tracking-[0.2em] text-[#8e9297] mb-2"
            >
              Topic
            </label>
            <div className="relative">
              <select
                id="topic"
                value={topic}
                onChange={(event) => setTopic(event.target.value)}
                className="w-full appearance-none rounded-xl bg-[#2b2d31] border border-[#202225] text-[#dcddde] px-4 py-3 pr-10 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#5865f2]"
              >
                <option value="" disabled>
                  質問を選択してください
                </option>
                {shuffledTopics.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[#8e9297]">
                ▼
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={async () => {
              await handleNext(topic)
              setTopic("")
            }}
            disabled={isProcessing || !topic.trim()}
            className={`
              w-full flex items-center justify-center gap-3 py-3 md:py-4 rounded-xl font-black text-base md:text-lg shadow-2xl transition-all
              active:scale-[0.97] transform-gpu
              ${
                isProcessing || !topic.trim()
                  ? "bg-[#4f545c] text-[#72767d] cursor-not-allowed opacity-80"
                  : "bg-[#5865f2] text-white hover:bg-[#4752c4] hover:shadow-indigo-500/30"
              }
            `}
          >
            {isProcessing ? (
              <Loader2 className="animate-spin" size={24} />
            ) : (
              <SUMMARIZE_COMMAND.icon
                className="animate-pulse-slow"
                size={24}
              />
            )}
            <span className="font-bold">
              {isProcessing ? "Channelling..." : SUMMARIZE_COMMAND.label}
            </span>
          </button>

          <div className="mt-2 md:mt-4 flex items-center justify-center gap-4">
            <div className="h-px flex-1 bg-linear-to-r from-transparent via-[#40444b] to-transparent"></div>
            <span className="text-[9px] md:text-[10px] text-[#72767d] font-bold uppercase tracking-[0.2em] whitespace-nowrap">
              Action Restricted
            </span>
            <div className="h-px flex-1 bg-linear-to-l from-transparent via-[#40444b] to-transparent"></div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse-slow {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.8; }
        }
        .animate-pulse-slow {
          animation: pulse-slow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </Layout>
  )
}

export default RootChatPage
