import { db } from "@packages/db"
import { DiscordMessageTable } from "@packages/db/schema"
import { sql } from "drizzle-orm"

async function main() {
  const [res] = await db
    .select({ count: sql<number>`count(*)` })
    .from(DiscordMessageTable)
  console.log(`Current row count: ${res?.count}`)
  process.exit(0)
}
main()
