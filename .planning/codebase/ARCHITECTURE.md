# Architecture

**Analysis Date:** 2026-02-03

## Pattern Overview

**Overall:** Full-stack React application using TanStack Start with server-side rendering, integrated backend services, and provider-based composition pattern.

**Key Characteristics:**
- File-based routing with TanStack Router
- Server-side rendering with progressive enhancement
- Provider composition pattern for third-party integrations
- Type-safe API routes using TanStack Start
- Real-time database integration with Convex
- Client-side state management with TanStack Query

## Layers

**Routing Layer:**
- Purpose: Handle application navigation and page rendering
- Location: `src/routes/`
- Contains: File-based route definitions, page components, API routes
- Depends on: TanStack Router, React components
- Used by: Application entry point, client navigation

**Provider Layer:**
- Purpose: Set up context and external service integrations
- Location: `src/integrations/`
- Contains: Clerk authentication provider, Convex database provider, TanStack Query provider
- Depends on: Third-party SDK clients (Clerk, Convex)
- Used by: Root shell component in `src/routes/__root.tsx`

**Component Layer:**
- Purpose: Reusable UI components and demo components
- Location: `src/components/` and `src/components/ui/`
- Contains: UI primitives (Input, Button, Select, etc.), form components, Header navigation
- Depends on: React, Tailwind CSS, Lucide icons
- Used by: Route components, other components

**Data Layer:**
- Purpose: Application data models, queries, and mutations
- Location: `convex/` (backend), `src/data/` (client mock data), `src/routes/demo/api.*.ts` (API routes)
- Contains: Convex schema definitions, server functions, API endpoints
- Depends on: Convex SDK, TanStack Start
- Used by: Route components via hooks and API calls

**Utilities & Hooks:**
- Purpose: Shared logic, helpers, and form hooks
- Location: `src/lib/`, `src/hooks/`
- Contains: CSS utility (cn), form context hooks, demo form configuration
- Depends on: React, clsx, tailwind-merge, TanStack Form
- Used by: Components and pages throughout the application

**Integrations:**
- Purpose: Configure and expose third-party services
- Location: `src/integrations/`
- Contains: Provider wrappers for Clerk, Convex, TanStack Query with devtools
- Depends on: External SDKs and their React integrations
- Used by: Root layout component

## Data Flow

**Server-Side Rendering Flow:**

1. Request arrives at TanStack Start server
2. Router matches file-based route in `src/routes/`
3. Server handler processes (if defined via `server.handlers.GET`)
4. Data is streamed to client as part of HTML
5. Hydration completes with TanStack Query context
6. Client takes over for interactive features

**Client-Side Data Fetching Flow:**

1. Component mounts with `useQuery` hook
2. Request sent via fetch to `/demo/api/*` endpoints
3. TanStack Query caches and manages state
4. Component re-renders with data
5. Mutations update data and trigger refetch

**Convex Real-Time Flow:**

1. Component uses `useQuery(api.*.list)` hook
2. Convex client establishes WebSocket connection
3. Real-time updates pushed to client
4. Component reactively updates via hook
5. Mutations via `useMutation(api.*.add)` update server and trigger subscriptions

**State Management:**
- TanStack Query: Server state and cache management
- React hooks (useState): Local UI state
- Convex subscriptions: Real-time data synchronization
- Context via providers: Global service access (auth, database)

## Key Abstractions

**Route Definition:**
- Purpose: Define page routes and API endpoints with co-located server logic
- Examples: `src/routes/index.tsx`, `src/routes/demo/api.names.ts`, `src/routes/demo/clerk.tsx`
- Pattern: `createFileRoute('/path')({ component/handler definitions })`
- Features: Type-safe context inheritance, SSR/SPA mode switching, server handlers

**Provider Pattern:**
- Purpose: Inject external services into React tree
- Examples: `src/integrations/clerk/provider.tsx`, `src/integrations/convex/provider.tsx`
- Pattern: Wrap children with context provider, initialize service on first call
- Composition: Nested providers in `src/routes/__root.tsx` RootDocument component

**Query Pattern:**
- Purpose: Fetch and cache server/external data on client
- Examples: Used in `src/routes/demo/tanstack-query.tsx`, `src/routes/demo/start.api-request.tsx`
- Pattern: `useQuery({ queryKey, queryFn })` with TanStack Query
- Features: Automatic caching, refetching, stale-while-revalidate

**Form Hook Pattern:**
- Purpose: Create type-safe form hooks with custom components
- Examples: `src/hooks/demo.form.ts`
- Pattern: `createFormHook()` from TanStack Form with pre-configured field components
- Use: Used in form demo routes like `src/routes/demo/form.simple.tsx`

## Entry Points

**Application Entry:**
- Location: `src/routes/__root.tsx`
- Triggers: Application startup
- Responsibilities: Render root document shell, stack provider hierarchy (Convex > Clerk > TanQuery), include header, render children routes, mount devtools

**Client Router:**
- Location: `src/router.tsx`
- Triggers: Application initialization
- Responsibilities: Create router instance with route tree, set up TanStack Query integration, configure SSR settings

**Route Handlers:**
- Location: `src/routes/demo/api.*.ts` files
- Triggers: HTTP requests to `/demo/api/*` paths
- Responsibilities: Server-side request handling, JSON responses, type-safe argument validation

**Convex Backend:**
- Location: `convex/drafts.ts`, `convex/schema.ts`
- Triggers: Client mutations and queries
- Responsibilities: Data persistence, validation, state transitions (pending/approved/published)

## Error Handling

**Strategy:** Inline error throwing and try/catch at component level

**Patterns:**
- Convex mutations throw errors on validation failure (e.g., "Draft not found", "Draft must be approved first")
- Components catch errors from failed queries/mutations but don't have explicit error boundary
- API routes can throw errors that return HTTP error responses
- Missing environment variables checked at provider initialization (Clerk, Convex)

## Cross-Cutting Concerns

**Logging:** Console logging for errors and initialization (e.g., missing VITE_CONVEX_URL in `src/integrations/convex/provider.tsx`)

**Validation:**
- Convex uses `v` (values) schema for mutation arguments and table fields
- TanStack Form hooks handle client-side form validation through component integration

**Authentication:**
- Clerk provides authentication via context provider (`src/integrations/clerk/provider.tsx`)
- Protected by VITE_CLERK_PUBLISHABLE_KEY environment variable
- User context available in Clerk-wrapped components via `useUser()` hook

**Real-Time:** Convex handles WebSocket subscriptions automatically through hook-based API (`useQuery`, `useMutation`)

---

*Architecture analysis: 2026-02-03*
