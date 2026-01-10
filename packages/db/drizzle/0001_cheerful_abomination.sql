CREATE TABLE "discord_messages" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"chunk_id" text NOT NULL,
	"content" text NOT NULL,
	"embedding" vector(1536),
	"message_date" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "discord_messages_chunk_id_unique" UNIQUE("chunk_id")
);
--> statement-breakpoint
CREATE INDEX "discord_messages_embedding_idx" ON "discord_messages" USING hnsw ("embedding" vector_cosine_ops);