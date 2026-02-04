# Phase 5: Agent API - Research

**Researched:** 2026-02-04
**Domain:** Convex HTTP Actions, API Token Authentication, OpenAPI Generation
**Confidence:** HIGH

## Summary

This phase requires building HTTP endpoints for AI agents to interact with the draft review system programmatically. The solution involves Convex HTTP actions with custom API token authentication (separate from Clerk user auth), a token management system with configurable permissions, and auto-generated OpenAPI documentation.

Convex HTTP actions provide the foundation for building REST APIs that can call existing queries and mutations. The key insight is that API token authentication must be custom-built (Convex's built-in auth assumes JWT/OIDC providers), storing hashed tokens in a new database table with permission scopes. The `convex-helpers` package provides Hono integration for advanced routing and has a built-in OpenAPI spec generator.

**Primary recommendation:** Use Convex HTTP actions with Hono for routing, implement custom API token authentication via SHA-256 hashed tokens stored in Convex, and use `convex-helpers` CLI to auto-generate OpenAPI specs from existing function validators.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Convex HTTP Actions | (built-in) | HTTP API endpoints | Native Convex capability for REST APIs |
| hono | ^4.x | Advanced HTTP routing | Recommended by Convex for middleware, validation, CORS |
| convex-helpers | latest | Hono integration + OpenAPI | Official Convex helper library with HttpRouterWithHono |
| @hono/zod-validator | latest | Request validation | Type-safe request body/param validation with Zod |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| nanoid | ^5.x | Token generation | Secure, URL-friendly unique ID generation |
| zod | (already installed) | Schema validation | Request/response validation schemas |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Hono | Native Convex HttpRouter | Native is simpler but lacks middleware, path params, validation |
| nanoid | crypto.randomUUID | UUID is longer (36 chars vs 21), nanoid more compact |
| SHA-256 hashing | bcrypt | bcrypt slower (intended for passwords); SHA-256 sufficient for random tokens |

**Installation:**
```bash
npm install hono @hono/zod-validator nanoid convex-helpers
```

## Architecture Patterns

### Recommended Project Structure
```
convex/
  http.ts                    # Main HTTP router (Hono + Convex)
  api/
    drafts.ts               # Draft operation HTTP handlers
    tokens.ts               # Token management HTTP handlers
  schema.ts                 # Add apiTokens table
  lib/
    auth.ts                 # Token validation helpers
    apiToken.ts             # Token generation/hashing utilities
src/
  routes/
    settings/
      api-tokens.tsx        # Token management UI
```

### Pattern 1: HTTP Action with Custom Token Auth
**What:** Validate API tokens in HTTP actions before calling mutations
**When to use:** Every API endpoint that requires authentication
**Example:**
```typescript
// Source: Convex HTTP Actions docs + custom token pattern
import { Hono } from "hono";
import { HonoWithConvex, HttpRouterWithHono } from "convex-helpers/server/hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import type { ActionCtx } from "./_generated/server";
import { api } from "./_generated/api";

const app: HonoWithConvex<ActionCtx> = new Hono();

// Auth middleware - validate Bearer token
app.use("/api/*", async (c, next) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return c.json({ error: "Missing or invalid Authorization header" }, 401);
  }

  const token = authHeader.slice(7);
  const tokenData = await c.env.runQuery(api.lib.auth.validateToken, { token });

  if (!tokenData) {
    return c.json({ error: "Invalid API token" }, 401);
  }

  // Store token data in context for route handlers
  c.set("apiToken", tokenData);
  await next();
});

// Draft creation endpoint
app.post(
  "/api/v1/drafts",
  zValidator("json", z.object({
    content: z.string().min(1).max(280),
    metadata: z.object({
      type: z.enum(["single", "thread"]).optional(),
      threadId: z.string().optional(),
      threadIndex: z.number().optional(),
    }).optional(),
  })),
  async (c) => {
    const tokenData = c.get("apiToken");

    // Check permission
    if (!tokenData.permissions.includes("drafts:create")) {
      return c.json({ error: "Insufficient permissions" }, 403);
    }

    const body = c.req.valid("json");
    const draftId = await c.env.runMutation(api.drafts.create, {
      content: body.content,
      authorId: tokenData.description, // Use token description as author
      authorName: tokenData.description,
      metadata: body.metadata,
    });

    return c.json({ id: draftId }, 201);
  }
);

export default new HttpRouterWithHono(app);
```

### Pattern 2: Token Storage with Prefix + Hash
**What:** Store only hashed tokens; use prefix for identification
**When to use:** API token table design
**Example:**
```typescript
// Source: Industry best practices (Stripe, GitHub patterns)
import { nanoid } from "nanoid";

// Token format: xpc_{8-char-id}_{32-char-secret}
// Example: xpc_Ab3Cd9Ef_V1StGXR8Z5jdHi6BZ5jdHi6BZ5jdHi6B

export function generateApiToken(): { token: string; prefix: string; hash: string } {
  const prefix = "xpc"; // xpecialist-control
  const id = nanoid(8);
  const secret = nanoid(32);
  const token = `${prefix}_${id}_${secret}`;

  // Only store the hash - never store the full token
  const hash = await hashToken(token);

  return {
    token,           // Return to user ONCE, never stored
    prefix: `${prefix}_${id}`, // Stored for identification
    hash,            // Stored for validation
  };
}

// SHA-256 hashing (Web Crypto API available in Convex actions)
async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}
```

### Pattern 3: Permission Scopes
**What:** Define granular permissions for API tokens
**When to use:** Token creation and authorization checks
**Example:**
```typescript
// Source: Best practices from GitHub, Stripe API key designs
export const API_PERMISSIONS = {
  "drafts:read": "Read draft content and status",
  "drafts:create": "Create new drafts",
  "drafts:approve": "Approve pending drafts",
  "drafts:reject": "Reject pending drafts",
  "drafts:schedule": "Schedule approved drafts",
  "drafts:publish": "Mark drafts as published",
  "tokens:read": "View token list (not secrets)",
  "tokens:create": "Create new API tokens",
  "tokens:revoke": "Revoke existing tokens",
} as const;

export type ApiPermission = keyof typeof API_PERMISSIONS;

// Schema validator
export const permissionValidator = v.union(
  ...Object.keys(API_PERMISSIONS).map(p => v.literal(p as ApiPermission))
);
```

### Anti-Patterns to Avoid
- **Storing plain-text tokens:** Always hash tokens; only return the plain token once at creation
- **Using Convex's built-in auth for API tokens:** `ctx.auth.getUserIdentity()` expects JWT/OIDC; custom tokens need custom validation
- **Checking permissions in every handler:** Use middleware to validate auth; check specific permissions per route
- **Returning sensitive data in errors:** Never reveal why a token failed (expired vs invalid vs revoked)

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| HTTP routing with params | Custom path parsing | Hono via convex-helpers | Path params, middleware, validation built-in |
| Request body validation | Manual JSON parsing | @hono/zod-validator | Type-safe, auto error responses |
| OpenAPI generation | Manual YAML/JSON | `npx convex-helpers open-api-spec` | Reads validators, generates spec automatically |
| Token ID generation | Custom random strings | nanoid | Cryptographically secure, URL-safe, compact |
| CORS headers | Manual header setting | Hono cors middleware | Handles preflight, configurable origins |

**Key insight:** The `convex-helpers` package provides battle-tested solutions for Hono integration, OpenAPI generation, and CORS. Building custom solutions wastes time and introduces bugs.

## Common Pitfalls

### Pitfall 1: Storing Full API Tokens
**What goes wrong:** Database breach exposes all tokens, allowing impersonation
**Why it happens:** Simpler to store and compare full tokens
**How to avoid:** Store only SHA-256 hash; hash incoming token for comparison
**Warning signs:** Token column contains readable token strings

### Pitfall 2: Missing Token Prefix for Identification
**What goes wrong:** No way to identify which token without validating against all hashes
**Why it happens:** Only storing the hash
**How to avoid:** Store a non-secret prefix (e.g., `xpc_Ab3Cd9Ef`) for lookup, then verify hash
**Warning signs:** Token validation queries scan all tokens

### Pitfall 3: Permissions Not Checked Per-Endpoint
**What goes wrong:** Token with `drafts:read` can call `drafts:approve`
**Why it happens:** Auth middleware only validates token exists
**How to avoid:** Check specific permission in each route handler
**Warning signs:** All authenticated requests succeed regardless of operation

### Pitfall 4: Returning Token After Creation
**What goes wrong:** User loses token, needs to regenerate
**Why it happens:** Token only shown once for security
**How to avoid:** Make UI clear this is the only time token is shown; provide copy button
**Warning signs:** Support requests for "lost" tokens

### Pitfall 5: No Token Expiration Strategy
**What goes wrong:** Old compromised tokens remain valid forever
**Why it happens:** Tokens created without expiration
**How to avoid:** Add optional `expiresAt` field; validate in middleware
**Warning signs:** Tokens table grows indefinitely with no cleanup

### Pitfall 6: HTTP Actions Without CORS
**What goes wrong:** Browser-based API explorers blocked by CORS
**Why it happens:** Forgetting HTTP actions need explicit CORS headers
**How to avoid:** Add Hono CORS middleware for browser compatibility
**Warning signs:** Requests work in Postman but fail in browser

## Code Examples

Verified patterns from official sources:

### Schema: API Tokens Table
```typescript
// Source: Convex schema patterns + token best practices
// convex/schema.ts - add to existing schema

apiTokens: defineTable({
  prefix: v.string(),           // e.g., "xpc_Ab3Cd9Ef" - for identification
  hash: v.string(),             // SHA-256 hash of full token
  description: v.string(),      // e.g., "Claude Agent" or "Production Bot"
  permissions: v.array(v.string()), // e.g., ["drafts:create", "drafts:read"]
  createdBy: v.optional(v.string()), // Clerk userId or parent token prefix
  createdAt: v.number(),
  lastUsedAt: v.optional(v.number()),
  expiresAt: v.optional(v.number()),
  revokedAt: v.optional(v.number()),
})
  .index("by_prefix", ["prefix"])
  .index("by_hash", ["hash"])
  .index("by_createdBy", ["createdBy"]),
```

### Token Validation Query
```typescript
// Source: Convex query patterns
// convex/lib/auth.ts

import { query } from "../_generated/server";
import { v } from "convex/values";

export const validateToken = query({
  args: { tokenHash: v.string() },
  handler: async (ctx, args) => {
    const token = await ctx.db
      .query("apiTokens")
      .withIndex("by_hash", (q) => q.eq("hash", args.tokenHash))
      .unique();

    if (!token) return null;
    if (token.revokedAt) return null;
    if (token.expiresAt && token.expiresAt < Date.now()) return null;

    return {
      prefix: token.prefix,
      description: token.description,
      permissions: token.permissions,
    };
  },
});
```

### Token Creation Mutation
```typescript
// Source: Convex mutation patterns + nanoid
// convex/tokens.ts

import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { nanoid } from "nanoid";

export const createToken = mutation({
  args: {
    description: v.string(),
    permissions: v.array(v.string()),
    expiresAt: v.optional(v.number()),
    createdBy: v.string(), // Clerk userId or token prefix
  },
  handler: async (ctx, args) => {
    const prefix = `xpc_${nanoid(8)}`;
    const secret = nanoid(32);
    const fullToken = `${prefix}_${secret}`;

    // Hash the token for storage
    const encoder = new TextEncoder();
    const data = encoder.encode(fullToken);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hash = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

    await ctx.db.insert("apiTokens", {
      prefix,
      hash,
      description: args.description,
      permissions: args.permissions,
      createdBy: args.createdBy,
      createdAt: Date.now(),
      expiresAt: args.expiresAt,
    });

    // Return the full token ONCE - it cannot be retrieved later
    return { token: fullToken, prefix };
  },
});
```

### Complete HTTP Router Setup
```typescript
// Source: convex-helpers Hono docs + Convex HTTP Actions
// convex/http.ts

import { Hono } from "hono";
import { cors } from "hono/cors";
import { HonoWithConvex, HttpRouterWithHono } from "convex-helpers/server/hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import type { ActionCtx } from "./_generated/server";
import { api } from "./_generated/api";

const app: HonoWithConvex<ActionCtx> = new Hono();

// CORS for browser-based API explorers
app.use("/api/*", cors({
  origin: "*", // Restrict in production
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization"],
}));

// Auth middleware for all /api/* routes
app.use("/api/*", async (c, next) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const token = authHeader.slice(7);

  // Hash the incoming token
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const tokenHash = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

  const tokenData = await c.env.runQuery(api.lib.auth.validateToken, { tokenHash });

  if (!tokenData) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  c.set("apiToken", tokenData);
  await next();
});

// List pending drafts
app.get("/api/v1/drafts", async (c) => {
  const tokenData = c.get("apiToken");
  if (!tokenData.permissions.includes("drafts:read")) {
    return c.json({ error: "Forbidden" }, 403);
  }

  const drafts = await c.env.runQuery(api.drafts.listPending);
  return c.json({ drafts });
});

// Create draft
app.post(
  "/api/v1/drafts",
  zValidator("json", z.object({
    content: z.string().min(1).max(280),
    metadata: z.object({
      type: z.enum(["single", "thread"]).optional(),
      threadId: z.string().optional(),
      threadIndex: z.number().optional(),
    }).optional(),
  })),
  async (c) => {
    const tokenData = c.get("apiToken");
    if (!tokenData.permissions.includes("drafts:create")) {
      return c.json({ error: "Forbidden" }, 403);
    }

    const body = c.req.valid("json");
    const draftId = await c.env.runMutation(api.drafts.create, {
      content: body.content,
      authorId: `api:${tokenData.prefix}`,
      authorName: tokenData.description,
      metadata: body.metadata,
    });

    return c.json({ id: draftId }, 201);
  }
);

// Approve draft
app.post("/api/v1/drafts/:id/approve", async (c) => {
  const tokenData = c.get("apiToken");
  if (!tokenData.permissions.includes("drafts:approve")) {
    return c.json({ error: "Forbidden" }, 403);
  }

  const id = c.req.param("id");
  try {
    await c.env.runMutation(api.drafts.approve, { id });
    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: "Draft not found or not pending" }, 400);
  }
});

// Reject draft
app.post(
  "/api/v1/drafts/:id/reject",
  zValidator("json", z.object({
    reason: z.string().optional(),
  })),
  async (c) => {
    const tokenData = c.get("apiToken");
    if (!tokenData.permissions.includes("drafts:reject")) {
      return c.json({ error: "Forbidden" }, 403);
    }

    const id = c.req.param("id");
    const body = c.req.valid("json");
    try {
      await c.env.runMutation(api.drafts.reject, { id, reason: body.reason });
      return c.json({ success: true });
    } catch (error) {
      return c.json({ error: "Draft not found or not pending" }, 400);
    }
  }
);

export default new HttpRouterWithHono(app);
```

### OpenAPI Spec Generation
```bash
# Source: convex-helpers CLI docs
# Run from project root after deploying functions
npx convex-helpers open-api-spec

# For production deployment
npx convex-helpers open-api-spec --prod

# Output: convex-spec-{timestamp}.yaml
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Raw HttpRouter | Hono + convex-helpers | 2024 | Middleware, validation, path params |
| Manual OpenAPI | `convex-helpers open-api-spec` | 2024 | Auto-generates from validators |
| bcrypt for tokens | SHA-256 | N/A | bcrypt is for passwords; SHA-256 sufficient for random tokens |

**Deprecated/outdated:**
- Writing CORS headers manually: Use Hono cors middleware instead
- Manual JSON body parsing: Use @hono/zod-validator for type safety

## Open Questions

Things that couldn't be fully resolved:

1. **Token rate limiting**
   - What we know: convex-helpers has rate limiting component
   - What's unclear: Best practice for per-token rate limits vs global
   - Recommendation: Implement basic rate limiting; can enhance later

2. **Hierarchical token permissions ("can create tokens")**
   - What we know: Requirement states tokens should be able to create other tokens
   - What's unclear: Should child tokens be limited to subset of parent permissions?
   - Recommendation: Track `createdBy` (parent token prefix); allow any permissions but audit trail exists

3. **OpenAPI spec serving from Convex**
   - What we know: CLI generates YAML file; spec needs to be accessible
   - What's unclear: Best way to serve spec from Convex (static file vs HTTP action)
   - Recommendation: Generate spec, commit to repo, serve via HTTP action that reads static content or returns inline JSON

## Sources

### Primary (HIGH confidence)
- [Convex HTTP Actions](https://docs.convex.dev/functions/http-actions) - HTTP action setup, routing, auth patterns
- [Convex Auth in Functions](https://docs.convex.dev/auth/functions-auth) - UserIdentity object, auth validation
- [convex-helpers GitHub](https://github.com/get-convex/convex-helpers) - Hono integration, OpenAPI generator
- [Hono with Convex (Stack)](https://stack.convex.dev/hono-with-convex) - Middleware, validation, routing patterns
- [Convex Authorization Best Practices](https://stack.convex.dev/authorization) - Middleware patterns, permission checking

### Secondary (MEDIUM confidence)
- [zod-to-openapi GitHub](https://github.com/asteasolutions/zod-to-openapi) - Alternative if manual OpenAPI generation needed
- [API Key Best Practices (prefix.dev)](https://prefix.dev/blog/how_we_implented_api_keys) - Token format with prefix pattern
- [MDN SubtleCrypto.digest](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/digest) - SHA-256 hashing in Web Crypto API

### Tertiary (LOW confidence)
- Various Medium/Dev.to articles on API token best practices - patterns verified against official sources

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Hono + convex-helpers is officially recommended by Convex
- Architecture: HIGH - Patterns directly from Convex docs and convex-helpers examples
- Pitfalls: MEDIUM - Compiled from multiple sources and best practices

**Research date:** 2026-02-04
**Valid until:** 2026-03-04 (30 days - stable domain, Convex HTTP actions are mature)
