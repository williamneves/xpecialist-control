# External Integrations

**Analysis Date:** 2026-02-03

## APIs & External Services

**Authentication:**
- Clerk - User authentication and identity management
  - SDK: `@clerk/clerk-react` 5.49.0
  - Provider: `src/integrations/clerk/provider.tsx`
  - Auth: `VITE_CLERK_PUBLISHABLE_KEY` (client), `CLERK_SECRET_KEY` (server)

## Data Storage

**Primary Database:**
- Convex - Serverless backend with real-time database
  - Client: `convex` 1.27.3
  - Connection: `VITE_CONVEX_URL=https://impressive-sparrow-365.convex.cloud`
  - Deployment: `dev:impressive-sparrow-365` (development)
  - Provider: `src/integrations/convex/provider.tsx`
  - Query/Mutation client: `@convex-dev/react-query` 0.1.0

**Database Schema:**
- Location: `convex/schema.ts`
- Tables:
  - `drafts` - Tweet draft content with status, author, metadata, scheduling
  - `published` - Published tweets with metrics and references to drafts
- Indexes: By status, author, created date, scheduled date

**Functions:**
- Location: `convex/drafts.ts`
- Queries: `listPending`, `listAll`, `getById`, `listPublished`
- Mutations: `create`, `approve`, `reject`, `schedule`, `markPublished`, `updateContent`, `remove`

**File Storage:**
- Not applicable - File storage not configured

**Caching:**
- TanStack React Query - Client-side request/state caching
  - Provider: `src/integrations/tanstack-query/root-provider.tsx`
  - Dev tools: `src/integrations/tanstack-query/devtools.tsx`

## Authentication & Identity

**Auth Provider:**
- Clerk - Customer identity platform
  - Implementation: React provider at `src/integrations/clerk/provider.tsx`
  - Usage hook: `useUser()` from `@clerk/clerk-react`
  - Component: `src/integrations/clerk/header-user.tsx` for user display
  - Configuration: Publishable key required in `VITE_CLERK_PUBLISHABLE_KEY`

**Environment Variables Required:**
- `VITE_CLERK_PUBLISHABLE_KEY` - Public key for client-side auth
- `CLERK_SECRET_KEY` - Secret key for server-side operations

## Monitoring & Observability

**Error Tracking:**
- Not configured

**Logs:**
- Console logging via standard JavaScript `console` object
- No centralized logging service configured

**Web Vitals:**
- `web-vitals` 5.1.0 - Core Web Vitals monitoring available (installed but usage not found)

## CI/CD & Deployment

**Hosting:**
- Convex Cloud - Serverless backend and database hosting
  - Dashboard: https://dashboard.convex.dev
  - Site URL: https://impressive-sparrow-365.convex.site

**Frontend Deployment:**
- Framework: TanStack React Start supports SSR and static export
- Not explicitly configured to a specific host

**CLI Tools:**
- Convex CLI for deployment and management (`npx convex` commands)
- Vite for local development and builds

## Environment Configuration

**Required env vars:**
- `VITE_CONVEX_URL` - Convex deployment URL
- `VITE_CLERK_PUBLISHABLE_KEY` - Clerk public key
- `CLERK_SECRET_KEY` - Clerk secret key
- `SERVER_URL` (optional) - Server URL for backend operations
- `VITE_APP_TITLE` (optional) - Application title

**Secrets location:**
- `.env.local` - Local development (contains actual keys, not committed)
- Environment variables: Passed via hosting platform for production

**Configuration validation:**
- `src/env.ts` - Uses `@t3-oss/env-core` for type-safe env loading
- Zod schema validation
- Client vars must be prefixed with `VITE_`
- Server vars have no prefix requirement

## API Routes & Backend

**Server-side Routes:**
- Framework: TanStack React Router with server handlers
- Location: `src/routes/demo/api.*.ts`

**Implemented Endpoints:**
- `GET /demo/api/names` - Returns list of names (handler: `src/routes/demo/api.names.ts`)
- `GET /demo/api/tq-todos` - Returns todo list (handler: `src/routes/demo/api.tq-todos.ts`)
- `POST /demo/api/tq-todos` - Creates new todo (handler: `src/routes/demo/api.tq-todos.ts`)

**Response Format:**
- JSON via `json()` utility or `Response.json()`

## Webhooks & Callbacks

**Incoming:**
- Clerk webhooks - Available for sync but not currently implemented

**Outgoing:**
- Not configured

## Client-Server Communication

**Query Pattern:**
- TanStack React Query for HTTP requests
- Fetch API for client-side requests
- Example: `fetch('/demo/api/names').then(res => res.json())`

**Convex Integration:**
- Direct function calls via `useQuery()` and `useMutation()` from `convex/react`
- Real-time updates via Convex subscription

---

*Integration audit: 2026-02-03*
