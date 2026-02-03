import { v } from 'convex/values'
import { query, mutation } from './_generated/server'

// Queries

export const listPending = query({
  args: {},
  handler: async (ctx) => {
    const drafts = await ctx.db
      .query('drafts')
      .withIndex('by_status', (q) => q.eq('status', 'pending'))
      .order('desc')
      .take(50)
    return drafts
  },
})

export const listAll = query({
  args: {
    status: v.optional(v.union(
      v.literal('pending'),
      v.literal('approved'),
      v.literal('rejected'),
      v.literal('published'),
      v.literal('scheduled')
    )),
  },
  handler: async (ctx, args) => {
    const status = args.status
    if (status) {
      return await ctx.db
        .query('drafts')
        .withIndex('by_status', (q) => q.eq('status', status))
        .order('desc')
        .take(50)
    }
    return await ctx.db.query('drafts').order('desc').take(50)
  },
})

export const getById = query({
  args: { id: v.id('drafts') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id)
  },
})

export const listPublished = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query('published')
      .withIndex('by_published')
      .order('desc')
      .take(50)
  },
})

// Mutations

export const create = mutation({
  args: {
    content: v.string(),
    authorId: v.string(),
    authorName: v.optional(v.string()),
    metadata: v.optional(v.object({
      type: v.optional(v.union(v.literal('single'), v.literal('thread'))),
      threadIndex: v.optional(v.number()),
      threadId: v.optional(v.string()),
      tags: v.optional(v.array(v.string())),
      tone: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    const now = Date.now()
    const draftId = await ctx.db.insert('drafts', {
      content: args.content,
      status: 'pending',
      authorId: args.authorId,
      authorName: args.authorName,
      createdAt: now,
      updatedAt: now,
      metadata: args.metadata,
    })
    return draftId
  },
})

export const approve = mutation({
  args: { id: v.id('drafts') },
  handler: async (ctx, args) => {
    const draft = await ctx.db.get(args.id)
    if (!draft) throw new Error('Draft not found')
    if (draft.status !== 'pending') throw new Error('Draft is not pending')
    
    await ctx.db.patch(args.id, {
      status: 'approved',
      updatedAt: Date.now(),
    })
    return args.id
  },
})

export const reject = mutation({
  args: { 
    id: v.id('drafts'),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const draft = await ctx.db.get(args.id)
    if (!draft) throw new Error('Draft not found')
    if (draft.status !== 'pending') throw new Error('Draft is not pending')
    
    await ctx.db.patch(args.id, {
      status: 'rejected',
      updatedAt: Date.now(),
      rejectionReason: args.reason,
    })
    return args.id
  },
})

export const schedule = mutation({
  args: {
    id: v.id('drafts'),
    scheduledFor: v.number(),
  },
  handler: async (ctx, args) => {
    const draft = await ctx.db.get(args.id)
    if (!draft) throw new Error('Draft not found')
    if (draft.status !== 'approved') throw new Error('Draft must be approved first')
    
    await ctx.db.patch(args.id, {
      status: 'scheduled',
      scheduledFor: args.scheduledFor,
      updatedAt: Date.now(),
    })
    return args.id
  },
})

export const markPublished = mutation({
  args: {
    id: v.id('drafts'),
    tweetId: v.string(),
  },
  handler: async (ctx, args) => {
    const draft = await ctx.db.get(args.id)
    if (!draft) throw new Error('Draft not found')
    
    const now = Date.now()
    await ctx.db.patch(args.id, {
      status: 'published',
      tweetId: args.tweetId,
      publishedAt: now,
      updatedAt: now,
    })
    
    // Also add to published table for analytics
    await ctx.db.insert('published', {
      content: draft.content,
      tweetId: args.tweetId,
      draftId: args.id,
      authorId: draft.authorId,
      publishedAt: now,
    })
    
    return args.id
  },
})

export const updateContent = mutation({
  args: {
    id: v.id('drafts'),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const draft = await ctx.db.get(args.id)
    if (!draft) throw new Error('Draft not found')
    if (draft.status === 'published') throw new Error('Cannot edit published draft')
    
    await ctx.db.patch(args.id, {
      content: args.content,
      updatedAt: Date.now(),
    })
    return args.id
  },
})

export const remove = mutation({
  args: { id: v.id('drafts') },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id)
    return args.id
  },
})
