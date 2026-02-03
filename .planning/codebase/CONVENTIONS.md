# Coding Conventions

**Analysis Date:** 2026-02-03

## Naming Patterns

**Files:**
- Routes use kebab-case with dot-separators for nested concepts: `start.server-funcs.tsx`, `form.address.tsx`, `start.ssr.spa-mode.tsx`
- Components use PascalCase: `Header.tsx`, `FormComponents.tsx` (or kebab-case for utility files like `demo.FormComponents.tsx`)
- Utility/hook files use kebab-case: `demo.form-context.ts`, `demo.form.ts`
- UI components use lowercase: `button.tsx`, `input.tsx`, `select.tsx`
- API route files use dot notation: `api.names.ts`, `api.tq-todos.ts`
- Data/fixture files use kebab-case: `demo-table-data.ts`, `demo.punk-songs.ts`

**Functions:**
- React components use PascalCase: `function TextField()`, `function ErrorMessages()`, `export function Button()`
- Regular functions use camelCase: `newPerson()`, `makeData()`, `getContext()`, `submitTodo()`
- Event handlers use camelCase: `submitTodo()`, `handleSubmit()`
- Getter/factory functions use descriptive names: `getContext()`, `newPerson()`

**Variables:**
- camelCase for all variables: `queryClient`, `formContext`, `fieldContext`, `todos`, `convexQueryClient`
- Boolean variables describe state: `isOpen`, `isSubmitting`, `isTouched`, `isValid`
- Type-safe state with TypeScript: `const [groupedExpanded, setGroupedExpanded] = useState<Record<string, boolean>>({})`
- Constants in UPPER_SNAKE_CASE: `TODOS_FILE`, `PUBLISHABLE_KEY`, `CONVEX_URL`, `SERVER_URL`, `VITE_APP_TITLE`

**Types:**
- PascalCase for type names: `Person`, `MyRouterContext`, `Todo`
- Inline types in function signatures: `{ label: string }`, `Array<{ label: string; value: string }>`
- Exported types use `export type`: `export type Person = { ... }`
- Props types defined inline or as separate interfaces

## Code Style

**Formatting:**
- Biome v2.2.4 is configured as the formatter
- Tab indentation (indentStyle: "tab")
- Double quotes for strings (quoteStyle: "double")
- Run formatting: `npm run format`

**Linting:**
- Biome lint with recommended rules enabled
- ESLint rules defined through Biome
- Run linting: `npm run lint`
- Run full check: `npm run check`

**Import Organization:**
- Third-party imports first (React, libraries): `import { useCallback, useState } from 'react'`
- Framework imports: `import { createFileRoute } from '@tanstack/react-router'`
- Local imports with @/ alias: `import { Button } from '@/components/ui/button'`
- Type imports inline: `import type { Person } from './types'`
- Organize imports alphabetically within groups
- Use import aliases for clarity: `import * as ShadcnSelect from '@/components/ui/select'` (for namespaced imports)

**Path Aliases:**
- `@/*` maps to `./src/*` (defined in tsconfig.json)
- Use `@/` prefix for all local imports
- Examples: `@/components/ui/button`, `@/hooks/demo.form-context`, `@/lib/utils`

## Error Handling

**Patterns:**
- Throw errors for configuration issues: `throw new Error('Add your Clerk Publishable Key to the .env.local file')`
- Use console.error for warnings: `console.error('missing envar CONVEX_URL')`
- Error messages logged alongside throwing: `if (!PUBLISHABLE_KEY) { throw new Error(...) }`
- Server functions use inputValidator for validation: `.inputValidator((d: string) => d).handler(...)`
- Field-level errors rendered in components: `{field.state.meta.isTouched && <ErrorMessages errors={errors} />}`

**Field Validation:**
- Display errors only after field is touched: `{field.state.meta.isTouched && ...}`
- Error arrays support both string and object format: `typeof error === 'string' ? error : error.message`
- Centralized ErrorMessages component for consistent display

## Logging

**Framework:** console (native browser/Node.js)

**Patterns:**
- Debug logs in development: `console.log(value)` for form data
- Error logs for critical issues: `console.error('missing envar CONVEX_URL')`
- Commented logging example shown in server functions (optional middleware pattern)
- No centralized logging library; direct console usage
- Logs typically for debugging during development, not production monitoring

## Comments

**When to Comment:**
- Commented code shown for optional features: middleware example in `start.server-funcs.tsx` (lines 6-16)
- Explicit demo section markers: `{/* Demo Links Start */}` and `{/* Demo Links End */}`
- Notes on non-standard configurations: comment about "this is the plugin that enables path aliases"
- Multi-line JSDoc for environment variable explanation in `env.ts`

**JSDoc/TSDoc:**
- Used for complex configuration objects in `env.ts`:
  ```typescript
  /**
   * The prefix that client-side variables must have...
   */
  clientPrefix: 'VITE_',
  ```
- Not required for simple functions; TypeScript types provide documentation
- Used when behavior is non-obvious or for API documentation

## Function Design

**Size:**
- Functions are typically 5-50 lines for components
- Larger components (150-300 lines) are split into logical sections
- Smaller helper functions extracted: `newPerson()` (13 lines), `range()` (7 lines)

**Parameters:**
- Destructured object parameters for components: `({ label }: { label: string })`
- Props defined inline in function signature
- Rest parameters for variadic data: `function makeData(...lens: number[])`
- Optional parameters with defaults: `rows = 3`
- Type annotations required: `(num: number): Person =>`

**Return Values:**
- Explicit return types in arrow functions: `(depth = 0): Person[] =>`
- React components return JSX.Element implicitly
- Server functions chain handlers: `.handler(async () => ...)`
- No implicit undefined returns; Promise types explicit: `async () => await readTodos()`

## Module Design

**Exports:**
- Named exports preferred: `export function makeData()`, `export default function AppClerkProvider()`
- Mixed exports acceptable: `export { Button, buttonVariants }` (re-export from CVA)
- Default exports for components: `export default function Header()`
- Type exports with `export type`: `export type Person = {...}`

**Barrel Files:**
- Not heavily used; imports directly reference files
- UI components imported from specific files: `@/components/ui/button` not `@/components/ui`
- Can use barrel pattern for organizational clarity

**File Structure:**
- One component/hook per file (except FormComponents which groups related exports)
- Co-locate related logic: `demo.form.ts` and `demo.form-context.ts` together
- Provider components in `integrations/` folder
- Route handlers in route files themselves

## Component Patterns

**React Patterns:**
- Functional components exclusively: `function Home() { ... }`
- Hooks used directly: `useState()`, `useCallback()`, `useQuery()`, `useMutation()`
- Props passed as destructured objects: `{ label, placeholder }? : { label: string; placeholder?: string }`
- Conditional rendering with ternary: `{isOpen ? 'translate-x-0' : '-translate-x-full'}`
- Conditional components: `{groupedExpanded.StartSSRDemo && <div>...</div>}`

**Form Patterns:**
- Form context from TanStack React Form: `useFormContext()`, `useFieldContext<string>()`
- Subscribe pattern for reactive updates: `form.Subscribe(selector => ...)`
- Field state access: `field.state.value`, `field.state.meta.errors`
- Error handling in components: `useStore(field.store, state => state.meta.errors)`

**Server Integration:**
- Server functions with createServerFn: `createServerFn({ method: 'POST' }).handler(...)`
- Input validation: `.inputValidator((d: string) => d)`
- Async data loading: `loader: async () => await getTodos()`
- API routes with handlers: `{ server: { handlers: { GET: () => json(...) } } }`

## Tailwind CSS

**Patterns:**
- Utility-first approach: `className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800"`
- Arbitrary values for colors: `bg-slate-800/50`, `text-cyan-400`
- CSS merge for combining utilities: `cn(buttonVariants({ variant, size, className }))`
- CVA (class-variance-authority) for component variants
- Conditional classes via ternary: `className={isOpen ? 'translate-x-0' : '-translate-x-full'}`
- Responsive prefixes: `md:w-32`, `lg:grid-cols-3`

---

*Convention analysis: 2026-02-03*
