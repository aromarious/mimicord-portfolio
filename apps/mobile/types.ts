export interface Message {
  id: string
  author: string
  avatar: string
  content: string
  timestamp: string
  isBot: boolean
  isLoading?: boolean
}

export interface Post {
  id: string
  content: string
  createdAt: string
  updatedAt: string
  userId: string
}
