# Codebase Structure

**Analysis Date:** 2026-02-03

## Directory Layout

```
xpecialist-control/
├── convex/                 # Convex backend functions and schema
│   ├── schema.ts          # Database schema definitions (drafts, published tables)
│   ├── drafts.ts          # Database queries and mutations for draft management
│   └── _generated/        # Auto-generated Convex types and API
├── src/                   # Frontend application source
│   ├── routes/            # File-based routing with TanStack Router
│   │   ├── __root.tsx     # Root layout with providers
│   │   ├── index.tsx      # Home page
│   │   └── demo/          # Demo pages and API routes
│   ├── components/        # React components
│   │   ├── ui/            # UI primitives (Input, Button, Select, etc.)
│   │   ├── Header.tsx     # Main navigation header
│   │   └── demo.FormComponents.tsx  # Form field components
│   ├── integrations/      # Third-party service integrations
│   │   ├── clerk/         # Authentication provider
│   │   ├── convex/        # Database provider
│   │   └── tanstack-query/  # Query client provider
│   ├── hooks/             # React hooks
│   │   ├── demo.form.ts   # Form hook configuration
│   │   └── demo.form-context.ts  # Form context setup
│   ├── lib/               # Utilities and helpers
│   │   └── utils.ts       # CSS utility function (cn)
│   ├── data/              # Mock and static data
│   │   ├── demo.punk-songs.ts
│   │   └── demo-table-data.ts
│   ├── router.tsx         # Router instance creation
│   ├── env.ts             # Environment variable validation (T3 env)
│   ├── styles.css         # Global styles
│   └── logo.svg           # App logo
├── public/                # Static assets served directly
├── tsconfig.json          # TypeScript configuration
├── vite.config.ts         # Vite build configuration
├── package.json           # Dependencies and scripts
├── biome.json             # Code formatting/linting config
└── .planning/codebase/    # GSD analysis documents
```

## Directory Purposes

**convex/:**
- Purpose: Backend database functions and schema for Convex
- Contains: Database schema with table definitions, queries, and mutations
- Key files:
  - `schema.ts`: Defines `drafts` and `published` tables with indexes
  - `drafts.ts`: CRUD operations (create, approve, reject, schedule, markPublished, updateContent, remove)

**src/routes/:**
- Purpose: Application pages and API endpoints using file-based routing
- Contains: Page components, API route handlers, route configuration
- Key files:
  - `__root.tsx`: Root document shell with provider stack
  - `index.tsx`: Landing page with TanStack Start feature showcase
  - `demo/*.tsx`: Demonstration pages for various integrations

**src/components/:**
- Purpose: Reusable React components
- Contains: UI primitives, composite components, demo components
- Key files:
  - `ui/`: Radix-UI based components (Input, Button, Select, Textarea, Label, Slider, Switch)
  - `Header.tsx`: Navigation with collapsible menu and Clerk user header
  - `demo.FormComponents.tsx`: Custom form field components for TanStack Form

**src/integrations/:**
- Purpose: Configure and expose third-party service integrations
- Contains: Provider wrappers and initialization
- Subdirectories:
  - `clerk/`: Authentication provider and user header component
  - `convex/`: Convex database client provider
  - `tanstack-query/`: Query client provider and devtools setup

**src/hooks/:**
- Purpose: Custom React hooks
- Contains: Form hooks, context hooks, custom logic
- Key files:
  - `demo.form.ts`: Creates form hook with TanStack Form configuration
  - `demo.form-context.ts`: Field and form context providers

**src/lib/:**
- Purpose: Shared utility functions and helpers
- Contains: Pure utility functions
- Key files:
  - `utils.ts`: `cn()` function for merging Tailwind classes with clsx

**src/data/:**
- Purpose: Static and mock data
- Contains: Test/demo data for routes
- Key files:
  - `demo.punk-songs.ts`: Song data for demos
  - `demo-table-data.ts`: Table data for TanStack Table demo

## Key File Locations

**Entry Points:**
- `src/routes/__root.tsx`: Root layout component wrapping entire app
- `src/router.tsx`: Creates and configures the TanStack Router instance
- `vite.config.ts`: Vite/build configuration with TanStack Start plugin

**Configuration:**
- `tsconfig.json`: TypeScript compiler options with path aliases (`@/*` → `src/*`)
- `vite.config.ts`: Build configuration, path aliases, Vite plugins
- `src/env.ts`: Environment variable validation using T3 env

**Core Logic:**
- `convex/schema.ts`: Database schema and table definitions
- `convex/drafts.ts`: Backend queries and mutations for data operations
- `src/integrations/*/provider.tsx`: Service initialization and context setup

**Testing:**
- Not found in current structure

## Naming Conventions

**Files:**
- Route files: `.tsx` extension for components, `.ts` for API/data
- Demo files: Prefixed with `demo.` (e.g., `demo.punk-songs.ts`, `demo.form.ts`)
- API routes: Named `api.*.ts` (e.g., `api.names.ts`, `api.tq-todos.ts`)
- Providers: Named `provider.tsx` in integration directories
- UI components: Lowercase with `.tsx` (e.g., `input.tsx`, `button.tsx`)
- Hooks: `demo.*.ts` naming pattern

**Directories:**
- Integration directories: Lowercase service names (clerk, convex, tanstack-query)
- Component directories: `ui/` for primitives, root level for feature components
- Routes follow file-system structure matching URL paths

## Where to Add New Code

**New Feature (Page/Route):**
- Page component: `src/routes/demo/[feature-name].tsx`
- API endpoint: `src/routes/demo/api.[endpoint-name].ts`
- Data/hooks: `src/hooks/demo.[feature].ts` or `src/data/demo.[feature].ts`
- Tests: Not established; recommend `src/routes/demo/[feature-name].test.tsx`

**New Component/Module:**
- Reusable UI: `src/components/ui/[component].tsx` for primitives
- Feature component: `src/components/[FeatureName].tsx` for composite components
- Demo component: `src/components/demo.[FeatureName].tsx` for demo-only components

**Utilities:**
- Shared helpers: `src/lib/[helper-name].ts`
- Hooks: `src/hooks/[hook-name].ts` (or `demo.[hook-name].ts` for demos)
- Form setup: `src/hooks/demo.form.ts` (already established pattern)

**Data/Constants:**
- Mock data: `src/data/demo.[data-name].ts`
- Environment setup: Add to `src/env.ts` with T3 env validation

## Special Directories

**convex/_generated/:**
- Purpose: Auto-generated Convex types and client API
- Generated: Yes
- Committed: No (generated on build)
- Contains: TypeScript type definitions for database schema, server functions, and client API

**.planning/codebase/:**
- Purpose: GSD analysis and planning documents
- Generated: No (manually created)
- Committed: Yes
- Contains: ARCHITECTURE.md, STRUCTURE.md, and other analysis files

**public/:**
- Purpose: Static assets served directly by Vite
- Generated: No
- Committed: Yes
- Contains: Images, logos, favicon, static resources

## Route Structure Patterns

**TanStack Router File-Based Routing:**
- `src/routes/index.tsx` → `/` (home page)
- `src/routes/demo/clerk.tsx` → `/demo/clerk`
- `src/routes/demo/api.names.ts` → `/demo/api/names` (GET handler returns JSON)
- `src/routes/demo/form.simple.tsx` → `/demo/form/simple`
- `src/routes/demo/start/ssr/spa-mode.tsx` → `/demo/start/ssr/spa-mode`

**Server Route Handler Pattern:**
```typescript
// src/routes/demo/api.names.ts
export const Route = createFileRoute('/demo/api/names')({
  server: {
    handlers: {
      GET: () => json(['Alice', 'Bob', 'Charlie']),
    },
  },
})
```

---

*Structure analysis: 2026-02-03*
