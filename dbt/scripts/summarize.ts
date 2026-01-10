import { env } from "@/env"
import { RagEngine, type SearchResult } from "@/lib/rag/engine"

async function main() {
  const query = process.argv[2] || "最近の話題は何？"

  // Check Config
  if (!env.OPENAI_API_KEY || !env.DATABASE_URL) {
    console.error(
      "Error: OPENAI_API_KEY and DATABASE_URL must be set (use infisical run).",
    )
    process.exit(1)
  }

  const engine = new RagEngine()

  console.log(`Query: ${query}`)

  // 1. Search
  console.log("\nSearching...")
  const results = await engine.search(query, 50)
  console.log(`Found ${results.length} results.`)

  results.forEach((r: SearchResult, i: number) => {
    const date = r.message_date
      ? r.message_date.toISOString().split("T")[0]
      : "No Date"
    console.log(
      `[${i + 1}] ${date} (Sim: ${r.similarity.toFixed(4)}) ${r.content.substring(0, 50)}...`,
    )
  })

  // 2. Summarize
  console.log("\nSummarizing...")
  if (results.length === 0) {
    console.log("No context found, skipping summarization.")
    return
  }

  const summary = await engine.summarize(query, results)
  console.log("\n--- Summary ---")
  console.log(summary)
  console.log("---------------")
  process.exit(0)
}

main().catch(console.error)
