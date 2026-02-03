# Codebase Concerns

**Analysis Date:** 2026-02-03

## Tech Debt

**Type Assertions in Table Component:**
- Issue: Multiple `any` type assertions used for type safety bypass
- Files: `src/routes/demo/table.tsx` (lines 41, 55, 78, 315)
- Impact: Loss of compile-time type checking for filter and sort functions; harder to refactor or modify table column logic
- Fix approach: Replace with proper generic types or explicit typing. Use `FilterFn<Person>` instead of `FilterFn<any>` and `SortingFn<Person>` instead of `SortingFn<any>`

**Unsafe Type Cast in Convex Provider:**
- Issue: Direct cast of `import.meta` to `any` type
- Files: `src/integrations/convex/provider.tsx` (line 4)
- Impact: Loss of type safety around environment variable access; could hide missing configuration
- Fix approach: Create a properly typed environment configuration interface, use type guard instead of `(import.meta as any).env`

**Inconsistent Error Handling:**
- Issue: Different error handling strategies across integrations - Clerk throws Error, Convex only logs to console
- Files: `src/integrations/clerk/provider.tsx` (line 5), `src/integrations/convex/provider.tsx` (line 6)
- Impact: Clerk missing config fails immediately (crashes app), Convex missing config silently fails with console.error only - inconsistent user experience
- Fix approach: Adopt uniform error handling: either throw consistently or use centralized error boundary with user-friendly fallback UI

## Known Issues

**Form Submission Uses Alert():**
- Symptoms: Form submissions show browser alert() which breaks user experience and cannot be styled
- Files: `src/routes/demo/form.simple.tsx` (line 27), `src/routes/demo/form.address.tsx` (line 39)
- Trigger: Submit any form in demo routes
- Workaround: None - requires replacing alert() with toast/modal component
- Fix approach: Replace `alert()` with proper toast notification component (e.g., from shadcn/ui)

**Missing Input Validation in API Mutation:**
- Symptoms: POST endpoint at `src/routes/demo/api.tq-todos.ts` accepts any JSON without validation
- Files: `src/routes/demo/api.tq-todos.ts` (line 25)
- Trigger: Send non-string JSON to POST endpoint
- Current behavior: Creates todo with invalid data type if JSON is not a string, no type checking
- Fix approach: Add Zod schema validation, validate `name` is string before pushing to todos array

**No Error Handling in React Query Queries:**
- Symptoms: Network failures or malformed responses not handled
- Files: `src/routes/demo/start.api-request.tsx` (line 6), `src/routes/demo/tanstack-query.tsx` (lines 15-19)
- Trigger: Disconnect network or server returns error
- Current behavior: Silent failure, empty array fallback
- Fix approach: Add error state handling in useQuery, display error UI or retry logic

## Security Considerations

**File System Access Without Validation:**
- Risk: Server function reads/writes files with hardcoded path, no input sanitization
- Files: `src/routes/demo/start.server-funcs.tsx` (lines 22, 44)
- Current mitigation: Demo-only file with hardcoded path, no user input in filename
- Recommendations:
  - Document this is demo-only code
  - Add file path validation if this pattern is used in production
  - Use secure temp directory instead of project root for file operations
  - Consider using database instead of file system

**Missing CSRF Protection:**
- Risk: POST endpoints in routes lack CSRF token validation
- Files: `src/routes/demo/api.tq-todos.ts` (line 24), `src/routes/demo/start.server-funcs.tsx` (line 39)
- Current mitigation: SameSite cookies may provide some protection via browser, but no explicit token validation
- Recommendations:
  - Add CSRF token validation for POST/PUT/DELETE operations
  - Use @tanstack/react-start built-in CSRF protection if available
  - Document CSRF handling in API design

**Environment Variable Exposure:**
- Risk: Environment variables checked at runtime in providers, potential to crash app if missing
- Files: `src/integrations/clerk/provider.tsx`, `src/integrations/convex/provider.tsx`
- Current mitigation: Clerk throws error (good), Convex logs to console (insufficient)
- Recommendations:
  - Validate all required env vars at app startup in root layout
  - Use .env validation library (e.g., @t3-oss/env-core already imported but not used for these keys)
  - Add clear documentation for required environment variables

## Performance Bottlenecks

**Large Table Stress Test:**
- Problem: Table demo generates 5,000 rows by default, 50,000 on "Refresh Data" - not paginated on load
- Files: `src/routes/demo/table.tsx` (lines 109-110)
- Cause: All rows rendered/filtered client-side, fuzzy search on 50k rows blocking UI
- Impact: Browser may freeze on initial load or refresh with large dataset
- Improvement path:
  - Implement server-side filtering/pagination for production tables
  - Lazy-load row data as user scrolls
  - Increase pagination default from 10 rows to reasonable size, disable stress test in production

**No Query Result Caching Strategy:**
- Problem: Queries refetch on every component mount without cache invalidation strategy
- Files: `src/routes/demo/tanstack-query.tsx` (line 17), `src/routes/demo/start.api-request.tsx` (line 6)
- Cause: Default React Query settings may cause unnecessary refetches
- Fix approach: Configure staleTime and cacheTime appropriately, document cache invalidation strategy

## Fragile Areas

**Debounced Input Component:**
- Files: `src/routes/demo/table.tsx` (lines 330-361)
- Why fragile: useEffect dependency array doesn't include `debounce` parameter in one effect (line 141) - if debounce prop changes, stale effect runs; manual timeout cleanup is error-prone
- Safe modification: Extract timeout logic into custom hook, ensure all dependencies are listed in arrays
- Test coverage: No test files for debounce behavior, side effects not tested

**Form Validation Patterns:**
- Files: `src/routes/demo/form.address.tsx` (lines 24-34), `src/components/demo.FormComponents.tsx`
- Why fragile: Validation logic scattered across components; repeated inline regex validators; no centralized validation schema reuse
- Safe modification: Extract all validators into single Zod schema, reference from all forms
- Test coverage: No unit tests for validators, only manual testing possible

**Todo State Management (In-Memory Array):**
- Files: `src/routes/demo/api.tq-todos.ts` (lines 3, 30)
- Why fragile: Todos stored in module-level array, shared across all request handlers - multiple concurrent requests could have race conditions
- Safe modification: Replace with actual database, or add request-scoped state with proper locking
- Impact: In production, concurrent users would corrupt each other's todos

## Scaling Limits

**File-Based Todo Persistence:**
- Current capacity: Single JSON file on disk, not suitable for concurrent writes
- Limit: Breaks at multiple simultaneous requests modifying `todos.json`
- Files: `src/routes/demo/start.server-funcs.tsx` (line 44)
- Scaling path: Replace with Convex (already integrated but not used for this demo), or PostgreSQL

**In-Memory Todos Array:**
- Current capacity: Array limited to available heap memory, data lost on server restart
- Limit: No persistence, all data lost when server crashes or redeploys
- Files: `src/routes/demo/api.tq-todos.ts` (line 3)
- Scaling path: Move to Convex todos table (already exists in convex/todos.ts), or database

**No Database Integration for Non-Convex Routes:**
- Current capacity: Only Convex routes persist data
- Limit: Cannot scale beyond single server with file or memory storage
- Files: `src/routes/demo/start.server-funcs.tsx`, `src/routes/demo/api.tq-todos.ts`
- Scaling path: Consolidate on Convex for all data persistence, or add SQL database integration

## Dependencies at Risk

**Nitro Nightly Version:**
- Risk: Nitro uses `npm:nitro-nightly@latest` - unstable, breaking changes unpredictable
- Files: `package.json` (line 35)
- Impact: Random build failures, API changes in dependency
- Migration plan: Pin to stable Nitro version once framework stabilizes, or remove if not core to product

**React Compiler (Babel Plugin):**
- Risk: React Compiler babel plugin is early-stage, may not handle all code patterns
- Files: `package.json` (line 54), `vite.config.ts` (line 28)
- Impact: Automatic optimization failures, unexpected behavior changes
- Mitigation: Monitor React Compiler releases, consider disabling if issues emerge

**TanStack Router SSR with Nitro:**
- Risk: Complex integration of server rendering with Nitro backend, not well-tested combination
- Files: `vite.config.ts` (lines 19, 25), `src/routes/demo/start.ssr.*.tsx`
- Impact: SSR routes may silently fail or hydration mismatches
- Mitigation: Add integration tests for SSR behavior, validate hydration matches server/client

## Test Coverage Gaps

**No Unit Tests:**
- What's not tested: All source code in `src/` - utility functions, hooks, form validators
- Files: Entire `src/` directory (361 files + components)
- Risk: Form validators could silently accept invalid input, utility functions may have edge case bugs
- Priority: High - test validators and API handlers first

**No Integration Tests:**
- What's not tested: Form submission flow, API request-response cycle, Convex mutations
- Files: `src/routes/demo/start.server-funcs.tsx`, `src/routes/demo/api.tq-todos.ts`, `src/routes/demo/convex.tsx`
- Risk: Breaking changes in React Router or TanStack Query not caught, form submission failures silent
- Priority: High - test critical user flows (form submit, todo CRUD)

**No E2E Tests:**
- What's not tested: Complete user journeys through UI
- Files: All demo routes
- Risk: UI bugs, navigation failures, data corruption in user workflows
- Priority: Medium - add E2E tests once core functionality stabilized

**No Testing Configuration:**
- Vitest installed but no config: `vitest.config.*` files not found
- Risk: Test infrastructure not properly configured, tests will fail to run
- Priority: Blocker - must set up test config before writing tests

**No Error Boundary Tests:**
- What's not tested: App behavior when providers fail (Clerk, Convex missing config)
- Risk: Errors in providers could crash entire app without recovery
- Priority: Medium - add error boundary tests for critical integrations

---

*Concerns audit: 2026-02-03*
