import type { ElementType } from "react"

export interface Message {
  id: string
  author: string
  avatar: string
  content: string
  timestamp: string
  isBot: boolean
  isLoading?: boolean
}

export interface ActionCommand {
  label: string
  description: string
  icon: ElementType
}
