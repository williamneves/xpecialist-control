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

// OpenAPI 3.0 specification for AI agent consumption
const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Xpecialist Control API',
    version: '1.0.0',
    description:
      'API for AI agents to manage tweet drafts. Enables programmatic creation, review, scheduling, and publishing of social media content.',
  },
  servers: [{ url: '/api/v1', description: 'API v1' }],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        description:
          'API token in format xpc_XXXXXXXX_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX. Obtain via the Settings > API Tokens UI.',
      },
    },
    schemas: {
      Draft: {
        type: 'object',
        properties: {
          _id: { type: 'string', description: 'Unique draft identifier' },
          _creationTime: {
            type: 'number',
            description: 'Unix timestamp of creation',
          },
          content: {
            type: 'string',
            description: 'Tweet content (1-280 characters)',
          },
          status: {
            type: 'string',
            enum: ['pending', 'approved', 'rejected', 'published'],
            description: 'Current draft status',
          },
          authorId: { type: 'string', description: 'Author identifier' },
          authorName: { type: 'string', description: 'Author display name' },
          scheduledFor: {
            type: 'number',
            description: 'Unix timestamp for scheduled publish time (optional)',
          },
          publishedAt: {
            type: 'number',
            description: 'Unix timestamp when published (optional)',
          },
          tweetId: {
            type: 'string',
            description: 'Twitter/X post ID after publishing (optional)',
          },
          rejectionReason: {
            type: 'string',
            description: 'Reason for rejection (optional)',
          },
          metadata: {
            type: 'object',
            description: 'Additional metadata (optional)',
            properties: {
              type: { type: 'string', enum: ['single', 'thread'] },
              threadIndex: { type: 'number' },
              threadId: { type: 'string' },
              tags: { type: 'array', items: { type: 'string' } },
              tone: { type: 'string' },
            },
          },
        },
        required: ['_id', '_creationTime', 'content', 'status'],
      },
      Token: {
        type: 'object',
        properties: {
          prefix: {
            type: 'string',
            description: 'Token prefix (visible identifier)',
          },
          description: { type: 'string', description: 'Token description' },
          permissions: {
            type: 'array',
            items: { type: 'string' },
            description: 'Granted permissions',
          },
          createdAt: {
            type: 'number',
            description: 'Unix timestamp of creation',
          },
          expiresAt: {
            type: 'number',
            description: 'Unix timestamp of expiration (optional)',
          },
          lastUsedAt: {
            type: 'number',
            description: 'Unix timestamp of last use (optional)',
          },
        },
        required: ['prefix', 'description', 'permissions', 'createdAt'],
      },
      Error: {
        type: 'object',
        properties: {
          error: { type: 'string', description: 'Error message' },
          details: {
            type: 'object',
            description: 'Validation error details (optional)',
          },
        },
        required: ['error'],
      },
      Success: {
        type: 'object',
        properties: {
          success: { type: 'boolean', description: 'Operation success status' },
        },
        required: ['success'],
      },
    },
  },
  security: [{ bearerAuth: [] }],
  paths: {
    '/drafts': {
      get: {
        summary: 'List drafts',
        description:
          'Retrieve all drafts, optionally filtered by status. Requires drafts:read permission.',
        operationId: 'listDrafts',
        parameters: [
          {
            name: 'status',
            in: 'query',
            required: false,
            schema: {
              type: 'string',
              enum: ['pending', 'approved', 'rejected', 'published'],
            },
            description: 'Filter by draft status',
          },
        ],
        responses: {
          '200': {
            description: 'List of drafts',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    drafts: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Draft' },
                    },
                  },
                },
              },
            },
          },
          '400': {
            description: 'Invalid status parameter',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          '401': {
            description: 'Unauthorized - missing or invalid token',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          '403': {
            description: 'Forbidden - insufficient permissions',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
      post: {
        summary: 'Create draft',
        description:
          'Create a new tweet draft. Requires drafts:create permission.',
        operationId: 'createDraft',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  content: {
                    type: 'string',
                    minLength: 1,
                    maxLength: 280,
                    description: 'Tweet content',
                  },
                  metadata: {
                    type: 'object',
                    description: 'Optional metadata',
                    properties: {
                      type: { type: 'string', enum: ['single', 'thread'] },
                      threadIndex: { type: 'number' },
                      threadId: { type: 'string' },
                      tags: { type: 'array', items: { type: 'string' } },
                      tone: { type: 'string' },
                    },
                  },
                },
                required: ['content'],
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Draft created',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    id: { type: 'string', description: 'Created draft ID' },
                  },
                },
              },
            },
          },
          '400': {
            description: 'Validation error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          '403': {
            description: 'Forbidden',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/drafts/{id}': {
      get: {
        summary: 'Get draft',
        description:
          'Retrieve a single draft by ID. Requires drafts:read permission.',
        operationId: 'getDraft',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Draft ID',
          },
        ],
        responses: {
          '200': {
            description: 'Draft details',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Draft' },
              },
            },
          },
          '400': {
            description: 'Invalid draft ID',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          '403': {
            description: 'Forbidden',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          '404': {
            description: 'Draft not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/drafts/{id}/approve': {
      post: {
        summary: 'Approve draft',
        description:
          'Approve a pending draft. Requires drafts:approve permission.',
        operationId: 'approveDraft',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Draft ID',
          },
        ],
        responses: {
          '200': {
            description: 'Draft approved',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Success' },
              },
            },
          },
          '400': {
            description: 'Draft is not pending',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          '403': {
            description: 'Forbidden',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          '404': {
            description: 'Draft not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/drafts/{id}/reject': {
      post: {
        summary: 'Reject draft',
        description:
          'Reject a pending draft with optional reason. Requires drafts:reject permission.',
        operationId: 'rejectDraft',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Draft ID',
          },
        ],
        requestBody: {
          required: false,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  reason: {
                    type: 'string',
                    description: 'Rejection reason (optional)',
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Draft rejected',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Success' },
              },
            },
          },
          '400': {
            description: 'Draft is not pending',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          '403': {
            description: 'Forbidden',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          '404': {
            description: 'Draft not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/drafts/{id}/schedule': {
      post: {
        summary: 'Schedule draft',
        description:
          'Schedule an approved draft for publishing. Pass empty body or omit scheduledFor to unschedule. Requires drafts:schedule permission.',
        operationId: 'scheduleDraft',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Draft ID',
          },
        ],
        requestBody: {
          required: false,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  scheduledFor: {
                    type: 'number',
                    description:
                      'Unix timestamp for scheduled publish time. Omit to unschedule.',
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Draft scheduled/unscheduled',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Success' },
              },
            },
          },
          '400': {
            description: 'Validation error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          '403': {
            description: 'Forbidden',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          '404': {
            description: 'Draft not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/drafts/{id}/publish': {
      post: {
        summary: 'Mark draft as published',
        description:
          'Mark an approved draft as published with the Twitter/X post ID. Requires drafts:publish permission.',
        operationId: 'publishDraft',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Draft ID',
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  tweetId: {
                    type: 'string',
                    description: 'Twitter/X post ID',
                  },
                },
                required: ['tweetId'],
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Draft marked as published',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Success' },
              },
            },
          },
          '400': {
            description: 'Validation error or draft not approved',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          '403': {
            description: 'Forbidden',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          '404': {
            description: 'Draft not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/tokens': {
      get: {
        summary: 'List tokens',
        description:
          'List API tokens created by the current token. Requires tokens:read permission.',
        operationId: 'listTokens',
        responses: {
          '200': {
            description: 'List of tokens',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    tokens: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Token' },
                    },
                  },
                },
              },
            },
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          '403': {
            description: 'Forbidden',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
      post: {
        summary: 'Create token',
        description:
          'Create a new API token. The full token is returned once and cannot be retrieved again. Requires tokens:create permission.',
        operationId: 'createToken',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  description: {
                    type: 'string',
                    minLength: 1,
                    maxLength: 100,
                    description: 'Token description',
                  },
                  permissions: {
                    type: 'array',
                    items: { type: 'string' },
                    description:
                      'Permissions to grant (e.g., drafts:read, drafts:create)',
                  },
                  expiresAt: {
                    type: 'number',
                    description: 'Unix timestamp for expiration (optional)',
                  },
                },
                required: ['description', 'permissions'],
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Token created',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    token: {
                      type: 'string',
                      description:
                        'Full token (shown once). Format: xpc_XXXXXXXX_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
                    },
                    prefix: {
                      type: 'string',
                      description: 'Token prefix for identification',
                    },
                  },
                },
              },
            },
          },
          '400': {
            description: 'Validation error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          '403': {
            description: 'Forbidden',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/tokens/{prefix}': {
      delete: {
        summary: 'Revoke token',
        description:
          'Revoke an API token by its prefix. Requires tokens:revoke permission.',
        operationId: 'revokeToken',
        parameters: [
          {
            name: 'prefix',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Token prefix',
          },
        ],
        responses: {
          '200': {
            description: 'Token revoked',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Success' },
              },
            },
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          '403': {
            description: 'Forbidden',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          '404': {
            description: 'Token not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
  },
}

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

// OpenAPI spec endpoint (no auth required - public documentation)
app.get('/api/openapi.json', (c: Context) => {
  return c.json(openApiSpec)
})

// Register routes
registerTokenRoutes(app)
registerDraftRoutes(app)

export default new HttpRouterWithHono(app)
