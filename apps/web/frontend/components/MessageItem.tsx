import Image from "next/image"
import type React from "react"
import Markdown from "@/frontend/components/ui/Markdown"
import type { Message } from "@/frontend/types"

interface MessageItemProps {
  message: Message
}

const MessageItem: React.FC<MessageItemProps> = ({ message }) => {
  return (
    <div className="flex group px-4 py-2 hover:bg-[#32353b] transition-colors duration-75">
      <Image
        src={message.avatar}
        alt={message.author}
        width={40}
        height={40}
        className="w-10 h-10 rounded-full mt-1 mr-4 shrink-0 cursor-pointer hover:shadow-lg"
      />
      <div className="flex flex-col">
        <div className="flex items-baseline gap-2">
          <span
            className={`font-medium cursor-pointer hover:underline ${message.isBot ? "text-[#00aff4]" : "text-white"}`}
          >
            {message.author}
          </span>
          {message.isBot && (
            <span className="bg-[#5865f2] text-white text-[10px] px-1.5 py-0.5 rounded-sm font-bold uppercase tracking-tighter">
              Bot
            </span>
          )}
          <span className="text-[#a3a6aa] text-xs">{message.timestamp}</span>
        </div>
        <div className="text-[#dcddde] leading-relaxed w-full">
          {message.isLoading ? (
            <div className="flex gap-1 mt-1">
              <div className="w-2 h-2 bg-[#dcddde] rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-[#dcddde] rounded-full animate-bounce [animation-delay:-.3s]"></div>
              <div className="w-2 h-2 bg-[#dcddde] rounded-full animate-bounce [animation-delay:-.5s]"></div>
            </div>
          ) : (
            <Markdown content={message.content} />
          )}
        </div>
      </div>
    </div>
  )
}

export default MessageItem
