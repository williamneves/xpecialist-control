import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import { generateApiToken } from './lib/apiToken'

/**
 * Permission strings for API tokens:
 * - drafts:read - Read draft content and status
 * - drafts:create - Create new drafts
 * - drafts:approve - Approve pending drafts
 * - drafts:reject - Reject pending drafts
 * - drafts:schedule - Schedule drafts for publishing
 * - drafts:publish - Publish drafts immediately
 * - tokens:read - List tokens
 * - tokens:create - Create new tokens
 * - tokens:revoke - Revoke tokens
 */

/**
 * Create a new API token
 * Returns the full token (shown once) and prefix (for identification)
 */
export const createToken = mutation({
  args: {
    description: v.string(),
    permissions: v.array(v.string()),
    expiresAt: v.optional(v.number()),
    createdBy: v.string(),
  },
  handler: async (ctx, args) => {
    const { token, prefix, hash } = await generateApiToken()

    await ctx.db.insert('apiTokens', {
      prefix,
      hash,
      description: args.description,
      permissions: args.permissions,
      createdBy: args.createdBy,
      createdAt: Date.now(),
      expiresAt: args.expiresAt,
    })

    // Return full token (shown once) and prefix (for identification)
    return { token, prefix }
  },
})

/**
 * Revoke an API token by prefix
 * Sets revokedAt timestamp (soft delete)
 */
export const revokeToken = mutation({
  args: { prefix: v.string() },
  handler: async (ctx, args) => {
    const token = await ctx.db
      .query('apiTokens')
      .withIndex('by_prefix', (q) => q.eq('prefix', args.prefix))
      .first()

    if (!token) {
      return { success: false, error: 'Token not found' }
    }

    if (token.revokedAt !== undefined) {
      return { success: false, error: 'Token already revoked' }
    }

    await ctx.db.patch(token._id, {
      revokedAt: Date.now(),
    })

    return { success: true }
  },
})

/**
 * List API tokens
 * Returns token metadata (NOT the hash)
 * Filter by createdBy if provided, excludes revoked tokens by default
 */
export const listTokens = query({
  args: {
    createdBy: v.optional(v.string()),
    includeRevoked: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let tokensQuery

    if (args.createdBy) {
      tokensQuery = ctx.db
        .query('apiTokens')
        .withIndex('by_createdBy', (q) => q.eq('createdBy', args.createdBy))
    } else {
      tokensQuery = ctx.db.query('apiTokens')
    }

    const tokens = await tokensQuery.collect()

    // Filter out revoked tokens unless includeRevoked is true
    const filteredTokens = args.includeRevoked
      ? tokens
      : tokens.filter((t) => t.revokedAt === undefined)

    // Return token metadata without the hash
    return filteredTokens.map((t) => ({
      _id: t._id,
      prefix: t.prefix,
      description: t.description,
      permissions: t.permissions,
      createdBy: t.createdBy,
      createdAt: t.createdAt,
      lastUsedAt: t.lastUsedAt,
      expiresAt: t.expiresAt,
      revokedAt: t.revokedAt,
    }))
  },
})
