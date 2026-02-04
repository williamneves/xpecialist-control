import type { HonoWithConvex } from 'convex-helpers/server/hono'
import type { Context } from 'hono'
import type { ActionCtx } from '../_generated/server'
import { api } from '../_generated/api'
import { z } from 'zod'
import type { TokenData } from '../lib/types'

// Permission check helper
function hasPermission(tokenData: TokenData, permission: string): boolean {
  return tokenData.permissions.includes(permission)
}

// Request body validation schemas
const createTokenSchema = z.object({
  description: z.string().min(1).max(100),
  permissions: z.array(z.string()),
  expiresAt: z.number().optional(),
})

/**
 * Register token management routes
 * Requires tokens:* permissions for token management operations
 */
export function registerTokenRoutes(app: HonoWithConvex<ActionCtx>) {
  // GET /api/v1/tokens - List tokens
  app.get('/api/v1/tokens', async (c: Context) => {
    const tokenData = c.get('apiToken') as TokenData

    if (!hasPermission(tokenData, 'tokens:read')) {
      return c.json({ error: 'Forbidden: requires tokens:read permission' }, 403)
    }

    const tokens = await c.env.runQuery(api.tokens.listTokens, {
      createdBy: tokenData.prefix,
    })

    return c.json({ tokens })
  })

  // POST /api/v1/tokens - Create new token
  app.post('/api/v1/tokens', async (c: Context) => {
    const tokenData = c.get('apiToken') as TokenData

    if (!hasPermission(tokenData, 'tokens:create')) {
      return c.json(
        { error: 'Forbidden: requires tokens:create permission' },
        403
      )
    }

    // Parse and validate request body
    let body: unknown
    try {
      body = await c.req.json()
    } catch {
      return c.json({ error: 'Invalid JSON body' }, 400)
    }

    const parsed = createTokenSchema.safeParse(body)
    if (!parsed.success) {
      return c.json(
        { error: 'Validation error', details: parsed.error.flatten() },
        400
      )
    }

    const { description, permissions, expiresAt } = parsed.data

    // Create token via mutation
    const result = await c.env.runMutation(api.tokens.createToken, {
      description,
      permissions,
      expiresAt,
      createdBy: tokenData.prefix,
    })

    // Return the full token (shown once) and prefix
    return c.json({ token: result.token, prefix: result.prefix }, 201)
  })

  // DELETE /api/v1/tokens/:prefix - Revoke token
  app.delete('/api/v1/tokens/:prefix', async (c: Context) => {
    const tokenData = c.get('apiToken') as TokenData

    if (!hasPermission(tokenData, 'tokens:revoke')) {
      return c.json(
        { error: 'Forbidden: requires tokens:revoke permission' },
        403
      )
    }

    const prefix = c.req.param('prefix')

    if (!prefix) {
      return c.json({ error: 'Token prefix is required' }, 400)
    }

    const result = await c.env.runMutation(api.tokens.revokeToken, {
      prefix,
    })

    if (!result.success) {
      return c.json({ error: result.error }, 404)
    }

    return c.json({ success: true })
  })
}
