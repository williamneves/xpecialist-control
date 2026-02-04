import type { Context } from 'hono'
import type { HonoWithConvex } from 'convex-helpers/server/hono'
import type { ActionCtx } from '../_generated/server'
import type { Id } from '../_generated/dataModel'
import { api } from '../_generated/api'
import { z } from 'zod'
import type { TokenData } from '../lib/types'

// Permission check helper
function hasPermission(tokenData: TokenData, permission: string): boolean {
  return tokenData.permissions.includes(permission)
}

// Request body validation schemas
const createDraftSchema = z.object({
  content: z.string().min(1).max(280),
  metadata: z
    .object({
      type: z.union([z.literal('single'), z.literal('thread')]).optional(),
      threadIndex: z.number().optional(),
      threadId: z.string().optional(),
      tags: z.array(z.string()).optional(),
      tone: z.string().optional(),
    })
    .optional(),
})

const rejectDraftSchema = z.object({
  reason: z.string().optional(),
})

const scheduleDraftSchema = z.object({
  scheduledFor: z.number().optional(),
})

const publishDraftSchema = z.object({
  tweetId: z.string(),
})

const statusQuerySchema = z.object({
  status: z
    .union([
      z.literal('pending'),
      z.literal('approved'),
      z.literal('rejected'),
      z.literal('published'),
    ])
    .optional(),
})

/**
 * Register draft management routes
 * Requires drafts:* permissions for draft operations
 */
export function registerDraftRoutes(app: HonoWithConvex<ActionCtx>) {
  // GET /api/v1/drafts - List drafts
  app.get('/api/v1/drafts', async (c: Context) => {
    const tokenData = c.get('apiToken') as TokenData

    if (!hasPermission(tokenData, 'drafts:read')) {
      return c.json(
        { error: 'Forbidden: requires drafts:read permission' },
        403
      )
    }

    // Parse query params
    const statusParam = c.req.query('status')
    let status: 'pending' | 'approved' | 'rejected' | 'published' | undefined

    if (statusParam) {
      const parsed = statusQuerySchema.safeParse({ status: statusParam })
      if (!parsed.success) {
        return c.json({ error: 'Invalid status parameter' }, 400)
      }
      status = parsed.data.status
    }

    const drafts = await c.env.runQuery(api.drafts.listAll, { status })

    return c.json({ drafts })
  })

  // POST /api/v1/drafts - Create new draft
  app.post('/api/v1/drafts', async (c: Context) => {
    const tokenData = c.get('apiToken') as TokenData

    if (!hasPermission(tokenData, 'drafts:create')) {
      return c.json(
        { error: 'Forbidden: requires drafts:create permission' },
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

    const parsed = createDraftSchema.safeParse(body)
    if (!parsed.success) {
      return c.json(
        { error: 'Validation error', details: parsed.error.flatten() },
        400
      )
    }

    const { content, metadata } = parsed.data

    // Create draft via mutation
    const draftId = await c.env.runMutation(api.drafts.create, {
      content,
      authorId: `api:${tokenData.prefix}`,
      authorName: tokenData.description,
      metadata,
    })

    return c.json({ id: draftId }, 201)
  })

  // GET /api/v1/drafts/:id - Get single draft
  app.get('/api/v1/drafts/:id', async (c: Context) => {
    const tokenData = c.get('apiToken') as TokenData

    if (!hasPermission(tokenData, 'drafts:read')) {
      return c.json(
        { error: 'Forbidden: requires drafts:read permission' },
        403
      )
    }

    const id = c.req.param('id')
    if (!id) {
      return c.json({ error: 'Draft ID is required' }, 400)
    }

    try {
      const draft = await c.env.runQuery(api.drafts.getById, {
        id: id as Id<'drafts'>,
      })

      if (!draft) {
        return c.json({ error: 'Draft not found' }, 404)
      }

      return c.json(draft)
    } catch (error) {
      // Invalid ID format
      return c.json({ error: 'Invalid draft ID' }, 400)
    }
  })

  // POST /api/v1/drafts/:id/approve - Approve draft
  app.post('/api/v1/drafts/:id/approve', async (c: Context) => {
    const tokenData = c.get('apiToken') as TokenData

    if (!hasPermission(tokenData, 'drafts:approve')) {
      return c.json(
        { error: 'Forbidden: requires drafts:approve permission' },
        403
      )
    }

    const id = c.req.param('id')
    if (!id) {
      return c.json({ error: 'Draft ID is required' }, 400)
    }

    try {
      await c.env.runMutation(api.drafts.approve, {
        id: id as Id<'drafts'>,
      })
      return c.json({ success: true })
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Operation failed'
      if (message.includes('not found')) {
        return c.json({ error: 'Draft not found' }, 404)
      }
      if (message.includes('not pending')) {
        return c.json({ error: 'Draft is not pending' }, 400)
      }
      return c.json({ error: message }, 400)
    }
  })

  // POST /api/v1/drafts/:id/reject - Reject draft
  app.post('/api/v1/drafts/:id/reject', async (c: Context) => {
    const tokenData = c.get('apiToken') as TokenData

    if (!hasPermission(tokenData, 'drafts:reject')) {
      return c.json(
        { error: 'Forbidden: requires drafts:reject permission' },
        403
      )
    }

    const id = c.req.param('id')
    if (!id) {
      return c.json({ error: 'Draft ID is required' }, 400)
    }

    // Parse and validate request body (optional)
    let reason: string | undefined
    try {
      const body = await c.req.json()
      const parsed = rejectDraftSchema.safeParse(body)
      if (!parsed.success) {
        return c.json(
          { error: 'Validation error', details: parsed.error.flatten() },
          400
        )
      }
      reason = parsed.data.reason
    } catch {
      // No body is okay for reject
    }

    try {
      await c.env.runMutation(api.drafts.reject, {
        id: id as Id<'drafts'>,
        reason,
      })
      return c.json({ success: true })
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Operation failed'
      if (message.includes('not found')) {
        return c.json({ error: 'Draft not found' }, 404)
      }
      if (message.includes('not pending')) {
        return c.json({ error: 'Draft is not pending' }, 400)
      }
      return c.json({ error: message }, 400)
    }
  })

  // POST /api/v1/drafts/:id/schedule - Schedule draft
  app.post('/api/v1/drafts/:id/schedule', async (c: Context) => {
    const tokenData = c.get('apiToken') as TokenData

    if (!hasPermission(tokenData, 'drafts:schedule')) {
      return c.json(
        { error: 'Forbidden: requires drafts:schedule permission' },
        403
      )
    }

    const id = c.req.param('id')
    if (!id) {
      return c.json({ error: 'Draft ID is required' }, 400)
    }

    // Parse and validate request body
    let scheduledFor: number | undefined
    try {
      const body = await c.req.json()
      const parsed = scheduleDraftSchema.safeParse(body)
      if (!parsed.success) {
        return c.json(
          { error: 'Validation error', details: parsed.error.flatten() },
          400
        )
      }
      scheduledFor = parsed.data.scheduledFor
    } catch {
      // No body means unschedule
    }

    try {
      await c.env.runMutation(api.drafts.schedule, {
        id: id as Id<'drafts'>,
        scheduledFor,
      })
      return c.json({ success: true })
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Operation failed'
      if (message.includes('not found')) {
        return c.json({ error: 'Draft not found' }, 404)
      }
      return c.json({ error: message }, 400)
    }
  })

  // POST /api/v1/drafts/:id/publish - Mark draft as published
  app.post('/api/v1/drafts/:id/publish', async (c: Context) => {
    const tokenData = c.get('apiToken') as TokenData

    if (!hasPermission(tokenData, 'drafts:publish')) {
      return c.json(
        { error: 'Forbidden: requires drafts:publish permission' },
        403
      )
    }

    const id = c.req.param('id')
    if (!id) {
      return c.json({ error: 'Draft ID is required' }, 400)
    }

    // Parse and validate request body
    let body: unknown
    try {
      body = await c.req.json()
    } catch {
      return c.json({ error: 'Invalid JSON body' }, 400)
    }

    const parsed = publishDraftSchema.safeParse(body)
    if (!parsed.success) {
      return c.json(
        { error: 'Validation error', details: parsed.error.flatten() },
        400
      )
    }

    const { tweetId } = parsed.data

    try {
      await c.env.runMutation(api.drafts.markPublished, {
        id: id as Id<'drafts'>,
        tweetId,
      })
      return c.json({ success: true })
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Operation failed'
      if (message.includes('not found')) {
        return c.json({ error: 'Draft not found' }, 404)
      }
      return c.json({ error: message }, 400)
    }
  })
}
