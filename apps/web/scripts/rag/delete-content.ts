import { db } from "@packages/db"
import { DiscordMessageTable } from "@packages/db/schema"
import { like } from "drizzle-orm"

async function main() {
  const args = process.argv.slice(2)
  const dryRun = args.includes("--dry-run")
  const keyword = args.find((arg) => arg !== "--dry-run")

  if (!keyword) {
    console.error("Please provide a keyword to delete.")
    console.error(
      "Usage: tsx scripts/rag/delete-content.ts <keyword> [--dry-run]",
    )
    process.exit(1)
  }

  console.log(`Searching for messages containing: "${keyword}"...`)
  if (dryRun) console.log("== DRY RUN MODE: No changes will be made ==")

  // 1. Check matching rows
  const matchingRows = await db
    .select({
      chunkId: DiscordMessageTable.chunkId,
      content: DiscordMessageTable.content,
    })
    .from(DiscordMessageTable)
    .where(like(DiscordMessageTable.content, `%${keyword}%`))

  if (matchingRows.length === 0) {
    console.log("No matching messages found.")
    process.exit(0)
  }

  console.log(`Found ${matchingRows.length} messages:`)
  matchingRows.forEach((r: { chunkId: string; content: string }) => {
    console.log(
      `[${r.chunkId}] ${r.content.substring(0, 50).replace(/\n/g, " ")}...`,
    )
  })

  // 2. Delete or Dry Run
  if (dryRun) {
    console.log(`\n[DRY RUN] Would delete ${matchingRows.length} messages.`)
    console.log("To actually delete, run without --dry-run")
  } else {
    console.log(`\nDeleting ${matchingRows.length} messages...`)
    await db
      .delete(DiscordMessageTable)
      .where(like(DiscordMessageTable.content, `%${keyword}%`))

    // Drizzle delete result object usage varies by driver, usually `rowCount`.
    // Postgres driver returns result which has rowCount (or count).
    // `delRes` type is usually `RunResult` or similar.
    // We'll log simplified message since `rowCount` is typical.
    console.log(`Deleted matching rows.`)
  }
  process.exit(0)
}

main().catch(console.error)
