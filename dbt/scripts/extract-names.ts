/**
 * 固有名詞置換テーブル作成準備用スクリプト
 * MotherDuckからデータを取得し、OpenAI APIを使用してテキストコンテンツから
 * 人名や組織名などの固有名詞を抽出する
 */
import fs from "node:fs"
import path from "node:path"
import duckdb from "duckdb"
import { OpenAI } from "openai"
import { env } from "@/env"

// Initialize OpenAI
const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY })
// Initialize MotherDuck
const duckDB = new duckdb.Database("md:")

interface MotherDuckRow {
  combined_content: string
}

function queryMotherDuck(sql: string): Promise<MotherDuckRow[]> {
  return new Promise((resolve, reject) => {
    duckDB.all(sql, (err, res) => {
      if (err) reject(err)
      else resolve(res as MotherDuckRow[])
    })
  })
}

async function extractNames(textChunk: string): Promise<string[]> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "You are a Named Entity Recognition tool. Extract all PERSON names (including nicknames) from the text. Return them as a JSON array of strings under key 'names'. If none, return []. Do not include generic terms like 'he', 'she', 'guy'. Only specific names or nicknames.",
      },
      {
        role: "user",
        content: textChunk,
      },
    ],
    response_format: { type: "json_object" },
  })

  const content = response.choices[0]?.message.content
  if (!content) return []
  try {
    const parsed = JSON.parse(content)
    return (parsed.names as string[]) || []
  } catch {
    return []
  }
}

async function main() {
  console.log("Connecting to MotherDuck to sample data...")

  // Fetch random samples to find names
  let rows: MotherDuckRow[] = []
  try {
    rows = await queryMotherDuck(`
            SELECT combined_content 
            FROM int_discord_messages_chunked 
            ORDER BY random() 
            LIMIT 50
        `)
  } catch (e) {
    console.error("Failed to query MotherDuck. Ensure MOTHERDUCK_TOKEN is set.")
    console.error(e)
    return
  }

  console.log(`Analyzing ${rows.length} chunks for names...`)

  const allNames = new Set<string>()

  for (const row of rows) {
    if (!row.combined_content) continue
    const names = await extractNames(row.combined_content as string)
    for (const n of names) {
      allNames.add(n)
    }
    process.stdout.write(".")
  }

  console.log("\nExtracted Candidates:", Array.from(allNames))

  // Update aliases.json
  const aliasPath = path.resolve(process.cwd(), "apps/web/lib/rag/aliases.json")
  let currentAliases: Record<string, string> = {}

  if (fs.existsSync(aliasPath)) {
    try {
      currentAliases = JSON.parse(
        fs.readFileSync(aliasPath, "utf-8"),
      ) as Record<string, string>
    } catch {
      console.warn(
        "Could not parse existing aliases.json, starting fresh or overwriting if empty.",
      )
    }
  } else {
    console.warn(`aliases.json not found at ${aliasPath}, creating new one.`)
  }

  const newAliases = { ...currentAliases }
  let addedCount = 0
  for (const name of allNames) {
    // Only add if not already present
    if (newAliases[name] === undefined) {
      newAliases[name] = "" // Initialize with empty for user to fill
      addedCount++
    }
  }

  fs.writeFileSync(aliasPath, JSON.stringify(newAliases, null, 2))
  console.log(`\nUpdated ${aliasPath}.`)
  console.log(
    `Added ${addedCount} new candidates. Preserved ${Object.keys(currentAliases).length} checking existing entries.`,
  )
  process.exit(0)
}

main().catch(console.error)
