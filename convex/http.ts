import { Hono } from 'hono'
import type { Context, Next } from 'hono'
import { cors } from 'hono/cors'
import {
  type HonoWithConvex,
  HttpRouterWithHono,
} from 'convex-helpers/server/hono'
import type { ActionCtx } from './_generated/server'
import { api } from './_generated/api'
import { hashToken } from './lib/apiToken'
import { registerTokenRoutes } from './api/tokens'
import { registerDraftRoutes } from './api/drafts'
import type { TokenData } from './lib/types'

// Re-export TokenData for backward compatibility
export type { TokenData } from './lib/types'

// Create app with Convex bindings
const app: HonoWithConvex<ActionCtx> = new Hono()

// CORS middleware for all /api/* routes
app.use(
  '/api/*',
  cors({
    origin: '*',
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
  })
)

// Auth middleware for all /api/v1/* routes (excludes health check)
app.use('/api/v1/*', async (c: Context, next: Next) => {
  const authHeader = c.req.header('Authorization')

  // Check for Authorization header with Bearer prefix
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  // Extract token
  const token = authHeader.slice(7) // Remove "Bearer " prefix

  // Hash the token using Web Crypto API
  const tokenHash = await hashToken(token)

  // Validate token via query
  const tokenData = await c.env.runQuery(api.lib.auth.validateToken, {
    tokenHash,
  })

  if (!tokenData) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  // Store token data in context
  c.set('apiToken', tokenData as TokenData)

  await next()
})

// Health check endpoint (no auth required)
app.get('/api/health', (c: Context) => {
  return c.json({ status: 'ok' })
})

// Register routes
registerTokenRoutes(app)
registerDraftRoutes(app)

export default new HttpRouterWithHono(app)
