import { z } from "zod"
import { postSchema } from "@/server/domain/post.entity"

// OpenAPI Response Schema (with dates as strings)
export const postResponseSchema = postSchema
  .omit({
    createdAt: true,
    updatedAt: true,
  })
  .extend({
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
  })

export const createPostSchema = z.object({
  topic: z.string().min(1).max(200),
  searchLimit: z.number().int().positive().max(200).optional().default(100),
})

export type CreatePostInput = z.infer<typeof createPostSchema>
