import { Sparkles } from "lucide-react-native"
import { BASE_URL } from "./lib/auth"

export const NEXT_COMMAND = {
  label: "Generate Post",
  description: "Aromarious-mimicから新しいメッセージを呼び出します。",
  icon: Sparkles,
}

// In production, this should be the web URL
export const BOT_AVATAR = `${BASE_URL}/aromarious.png`
export const USER_AVATAR = "https://picsum.photos/seed/user/100/100"
