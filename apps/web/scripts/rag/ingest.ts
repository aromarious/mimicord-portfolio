import { db } from "@packages/db"
import { DiscordMessageTable } from "@packages/db/schema"
import { sql } from "drizzle-orm"
import duckdb from "duckdb"
import OpenAI from "openai"
import { env } from "@/env"

// Initialize clients
const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY })
// Use a persistent DuckDB connection
const duckDB = new duckdb.Database("md:")

async function getEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
    encoding_format: "float",
  })
  return response.data[0]!.embedding
}

type MotherDuckRow = {
  chunk_id: string
  content: string | null
  message_date: string | number | Date | null
}

// Promisified query for DuckDB
function queryMotherDuck(sql: string): Promise<MotherDuckRow[]> {
  return new Promise((resolve, reject) => {
    duckDB.all(sql, (err, res) => {
      if (err) {
        reject(err)
        return
      }
      resolve(res as MotherDuckRow[])
    })
  })
}

async function main() {
  console.log(`Checking Neon database connection...`)

  // Verify connection by getting count
  const [countRes] = await db
    .select({ count: sql<number>`count(*)` })
    .from(DiscordMessageTable)
  console.log(`Current chunk count: ${countRes?.count}`)

  try {
    // Fetch existing chunk_ids to skip them (Resume capability)
    console.log("Fetching existing chunk_ids from Neon...")
    const existingRows = await db
      .select({ chunkId: DiscordMessageTable.chunkId })
      .from(DiscordMessageTable)
    const existingIds = new Set(existingRows.map((r) => r.chunkId))
    console.log(`Found ${existingIds.size} existing chunks. Skipping them...`)

    console.log("Fetching data from MotherDuck...")

    let offset = 0
    const limit = 1000
    let totalProcessed = 0
    let totalSkipped = 0

    while (true) {
      console.log(`Fetching batch: LIMIT ${limit} OFFSET ${offset}`)
      const rows = await queryMotherDuck(
        `SELECT chunk_id, combined_content as content, start_at as message_date 
         FROM int_discord_messages_chunked 
         ORDER BY chunk_id
         LIMIT ${limit} OFFSET ${offset}`,
      )

      if (rows.length === 0) break

      console.log(`Processing ${rows.length} items...`)

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i]!
        if (!row.content) continue

        // SKIPPING LOGIC
        if (existingIds.has(row.chunk_id)) {
          totalSkipped++
          if (totalSkipped % 100 === 0) process.stdout.write("s")
          continue
        }

        try {
          const embedding = await getEmbedding(row.content)

          await db
            .insert(DiscordMessageTable)
            .values({
              chunkId: row.chunk_id,
              content: row.content,
              embedding: embedding,
              messageDate: row.message_date ? new Date(row.message_date) : null,
            })
            .onConflictDoUpdate({
              target: DiscordMessageTable.chunkId,
              set: {
                content: row.content,
                embedding: embedding,
                messageDate: row.message_date
                  ? new Date(row.message_date)
                  : null,
              },
            })

          totalProcessed++
          if (totalProcessed % 10 === 0) process.stdout.write(".")
        } catch (e) {
          console.error("Error processing chunk:", {
            chunkId: row.chunk_id,
            error: e,
          })
        }
      }
      console.log("\nBatch complete.")
      offset += limit
    }

    console.log(`\nIngestion complete. Total processed: ${totalProcessed}`)
  } catch (e) {
    console.error("Ingestion failed:", e)
  }
  // No need to explicitly close Drizzle connection if script exits, but typical valid exit is fine.
  process.exit(0)
}

main()
