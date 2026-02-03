import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

export default defineSchema({
  drafts: defineTable({
    content: v.string(),
    status: v.union(
      v.literal('pending'),
      v.literal('approved'),
      v.literal('rejected'),
      v.literal('published'),
      v.literal('scheduled')
    ),
    authorId: v.string(),
    authorName: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
    scheduledFor: v.optional(v.number()),
    publishedAt: v.optional(v.number()),
    tweetId: v.optional(v.string()),
    metadata: v.optional(v.object({
      type: v.optional(v.union(v.literal('single'), v.literal('thread'))),
      threadIndex: v.optional(v.number()),
      threadId: v.optional(v.string()),
      tags: v.optional(v.array(v.string())),
      tone: v.optional(v.string()),
    })),
    rejectionReason: v.optional(v.string()),
  })
    .index('by_status', ['status'])
    .index('by_author', ['authorId'])
    .index('by_created', ['createdAt'])
    .index('by_scheduled', ['scheduledFor']),

  published: defineTable({
    content: v.string(),
    tweetId: v.string(),
    draftId: v.optional(v.id('drafts')),
    authorId: v.string(),
    publishedAt: v.number(),
    metrics: v.optional(v.object({
      impressions: v.optional(v.number()),
      likes: v.optional(v.number()),
      replies: v.optional(v.number()),
      retweets: v.optional(v.number()),
    })),
  })
    .index('by_author', ['authorId'])
    .index('by_published', ['publishedAt']),
})
