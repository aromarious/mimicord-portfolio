import type { AIPrompt } from "../ai_prompt.entity"
import type { AIResponse } from "../ai_response.entity"

export interface AIService {
  generateResponse(prompt: AIPrompt.Type): Promise<AIResponse.Type>
}
