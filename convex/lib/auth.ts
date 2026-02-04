import { v } from 'convex/values'
import { query, internalMutation } from '../_generated/server'
import { internal } from '../_generated/api'

/**
 * Internal mutation to update lastUsedAt timestamp
 */
export const updateLastUsed = internalMutation({
  args: { tokenId: v.id('apiTokens') },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.tokenId, {
      lastUsedAt: Date.now(),
    })
  },
})

/**
 * Validate an API token by its hash
 * Returns null if token is invalid, revoked, or expired
 * Returns token data (prefix, description, permissions) if valid
 */
export const validateToken = query({
  args: { tokenHash: v.string() },
  handler: async (ctx, args) => {
    // Query by hash index
    const token = await ctx.db
      .query('apiTokens')
      .withIndex('by_hash', (q) => q.eq('hash', args.tokenHash))
      .first()

    // Not found
    if (!token) {
      return null
    }

    // Revoked
    if (token.revokedAt !== undefined) {
      return null
    }

    // Expired
    if (token.expiresAt !== undefined && token.expiresAt < Date.now()) {
      return null
    }

    // Schedule lastUsedAt update (non-blocking)
    // Note: We can't call mutations from queries directly, but we can return
    // the token data and let the HTTP endpoint handler update lastUsedAt
    // For now, we return the token ID so the caller can update it
    return {
      _id: token._id,
      prefix: token.prefix,
      description: token.description,
      permissions: token.permissions,
    }
  },
})
