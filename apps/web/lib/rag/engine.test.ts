import { describe, expect, it, vi } from "vitest"
import { RagEngine } from "./engine"

// Mock OpenAI
const mockCreate = vi.fn()
vi.mock("openai", () => {
  return {
    default: class MockOpenAI {
      embeddings = {
        create: vi.fn().mockResolvedValue({ data: [{ embedding: [] }] }),
      }
      chat = {
        completions: {
          create: mockCreate,
        },
      }
    },
  }
})

// Mock Env
vi.mock("../../env", () => ({
  env: {
    OPENAI_API_KEY: "test-key",
    LLM_MODEL: "gpt-4o",
  },
}))

// Mock DB
vi.mock("@packages/db", () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue([]),
  },
}))

describe("RagEngine Anonymization", () => {
  const mockAliases = {
    アキラ: "太郎",
    ヒロシ: "花子",
  }

  it("should replace real names with aliases in the prompt context", async () => {
    const engine = new RagEngine(mockAliases)

    // "アキラ" -> "太郎"
    const realName = "アキラ"
    const expectedAlias = "太郎"
    const searchResultContent = `こんにちは、${realName}です。`

    // Mock search results
    const results = [
      {
        chunk_id: "1",
        content: searchResultContent,
        message_date: new Date(),
        similarity: 0.9,
      },
    ]

    mockCreate.mockResolvedValue({
      choices: [
        {
          message: {
            content: "Summary",
          },
        },
      ],
    })

    await engine.summarize("query", results)

    // Check what was sent to OpenAI
    const calls = mockCreate.mock.calls
    // Get the latest call
    const sentMessages = calls[calls.length - 1]![0].messages
    const systemPrompt = sentMessages[0]!.content

    // The system prompt should contain the CONTEXT, which should have been sanitized
    // So it should NOT contain the real name, but SHOULD contain the alias
    expect(systemPrompt).not.toContain(realName)
    expect(systemPrompt).toContain(expectedAlias)
  })

  it("should replace multiple occurrences in context", async () => {
    const engine = new RagEngine(mockAliases)

    const realName = "ヒロシ" // alias: "花子"
    const expectedAlias = "花子"
    const searchResultContent = `${realName}と${realName}が遊びました。`

    const results = [
      {
        chunk_id: "1",
        content: searchResultContent,
        message_date: new Date(),
        similarity: 0.9,
      },
    ]

    mockCreate.mockResolvedValue({
      choices: [
        {
          message: {
            content: "Summary",
          },
        },
      ],
    })

    await engine.summarize("query", results)

    const calls = mockCreate.mock.calls
    const sentMessages = calls[calls.length - 1]![0].messages
    const systemPrompt = sentMessages[0]!.content

    expect(systemPrompt).not.toContain(realName)
    expect(systemPrompt).toContain(
      `${expectedAlias}と${expectedAlias}が遊びました。`,
    )
  })

  it("should prioritize longer aliases to avoid overlapping replacement issues", async () => {
    // Setup aliases with strict overlap
    // Use Katakana aliases to avoid conflict with generic prompt instructions which use "佐藤さん", "鈴木さん"
    const testAliases = {
      ユウキ: "タロウ", // Short
      ユウキさん: "ハナコ", // Long (contains Short)
    }
    const engine = new RagEngine(testAliases)

    const longRealName = "ユウキさん"
    const expectedLongAlias = "ハナコ"

    // If "ユウキ" is replaced first, "ユウキさん" -> "タロウさん". Expected "ハナコ"
    const searchResultContent = `${longRealName}が来ました。`

    const results = [
      {
        chunk_id: "1",
        content: searchResultContent,
        message_date: new Date(),
        similarity: 0.9,
      },
    ]

    mockCreate.mockResolvedValue({
      choices: [
        {
          message: {
            content: "Summary",
          },
        },
      ],
    })

    await engine.summarize("query", results)

    const calls = mockCreate.mock.calls
    const sentMessages = calls[calls.length - 1]![0].messages
    const systemPrompt = sentMessages[0]!.content

    // Verify that the longer alias was used
    expect(systemPrompt).toContain(expectedLongAlias)
    // Verify that the incorrect partial replacement did not happen (e.g. "タロウ" which comes from "ユウキ" -> "タロウ")
    expect(systemPrompt).not.toContain("タロウ")
  })
})
