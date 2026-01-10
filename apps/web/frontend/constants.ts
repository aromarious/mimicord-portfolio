import { Sparkles } from "lucide-react"
import type { ActionCommand } from "./types"

export const SUMMARIZE_COMMAND: ActionCommand = {
  label: "Summarize messages",
  description: "Aromarious-mimicから新しいメッセージを呼び出します。",
  icon: Sparkles,
}

export const TOPIC_QUESTIONS = [
  "自分で開発したプロジェクトやアプリケーション",
  "使っている技術・言語・フレームワーク",
  "解決した技術的な問題や課題",
  "チームでの開発やコラボレーション",
  "学習中の技術や興味のある分野",
  "コードレビューや設計での議論",
  "パフォーマンスや品質向上の取り組み",
  "ユーザー体験の改善やフィードバック対応",
  "失敗や困難から学んだ経験と改善プロセス",
  "新しい技術の学習方法と業務への適用",
  "非エンジニアとのコミュニケーションや合意形成",
  "チームの課題解決やプロセス改善の経験",
  "ユーザー視点でのプロダクト改善提案",
  "性格的な特徴",
  "知識共有やドキュメント作成への取り組み",
  "フィードバックの伝え方と受け止め方",
  "忙しい時やトラブル発生時の振る舞い",
  "会議や議論での立ち振る舞い・役割",
]

export const BOT_AVATAR = "/aromarious.png"
export const USER_AVATAR = "https://picsum.photos/seed/user/100/100"

export const RAG_SEARCH_LIMIT = 50
