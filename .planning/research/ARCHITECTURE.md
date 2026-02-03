# Architecture Research

**Domain:** Content Approval Dashboard (Tweet Draft Review)
**Researched:** 2026-02-03
**Confidence:** HIGH

## Existing Architecture Context

The project already has established patterns:

- **Router:** TanStack Router with file-based routing
- **State:** Convex real-time subscriptions via `useQuery`
- **Mutations:** TanStack Query + `useConvexMutation` wrapper
- **UI:** shadcn/ui components
- **Providers:** Nested pattern (Convex > Clerk > App)

This research focuses on **component structure for the approval dashboard**, not infrastructure changes.

---

## Recommended Component Architecture

### System Overview

```
+-----------------------------------------------------------------------+
|                         ROUTE LAYER                                    |
|  routes/                                                               |
|  +-- dashboard.tsx (layout route - tabs, stats bar)                   |
|  +-- dashboard/                                                        |
|      +-- index.tsx (redirect to pending)                              |
|      +-- pending.tsx (DraftQueue with status='pending')               |
|      +-- approved.tsx (DraftQueue with status='approved')             |
|      +-- scheduled.tsx (DraftQueue with status='scheduled')           |
|      +-- rejected.tsx (DraftQueue with status='rejected')             |
+-----------------------------------------------------------------------+
                                   |
                                   v
+-----------------------------------------------------------------------+
|                       PAGE COMPONENTS                                  |
|  +-----------------------+    +----------------------------------+    |
|  |    DraftQueue         |    |        DraftDetailSheet          |    |
|  |    (list + bulk)      |--->|        (exists already)          |    |
|  +-----------------------+    +----------------------------------+    |
|           |                              ^                            |
|           v                              |                            |
|  +-----------------------+               |                            |
|  |    DraftCard          |---------------+                            |
|  |    (item display)     |                                            |
|  +-----------------------+                                            |
|           ^                                                           |
|           |                                                           |
|  +-----------------------+                                            |
|  |  BulkActionBar        |                                            |
|  |  (floating toolbar)   |                                            |
|  +-----------------------+                                            |
+-----------------------------------------------------------------------+
                                   |
                                   v
+-----------------------------------------------------------------------+
|                         CONVEX LAYER                                   |
|  +-------------------+  +-------------------+  +-------------------+   |
|  | drafts.listAll    |  | drafts.approve    |  | drafts.bulkApprove|   |
|  | (with status)     |  | drafts.reject     |  | drafts.bulkReject |   |
|  +-------------------+  +-------------------+  +-------------------+   |
+-----------------------------------------------------------------------+
```

### Component Responsibilities

| Component | Responsibility | Communicates With |
|-----------|----------------|-------------------|
| `dashboard.tsx` (layout) | Status tabs, stats bar, keyboard shortcuts context | Child routes via Outlet |
| `DraftQueue` | List rendering, selection state, bulk action coordination | DraftCard, BulkActionBar, DraftDetailSheet |
| `DraftCard` | Individual item display, checkbox, quick actions | DraftQueue (selection callback) |
| `BulkActionBar` | Floating toolbar for selected items, confirm dialogs | DraftQueue (action callbacks) |
| `DraftDetailSheet` | Full draft details, approve/reject/edit (exists) | Parent page (open state) |
| `StatusTabs` | Tab navigation between status views | TanStack Router (Link) |
| `StatsBar` | Count badges per status | Convex queries |

---

## Recommended Project Structure

```
src/
+-- routes/
|   +-- dashboard.tsx                    # Layout: tabs + stats + keyboard context
|   +-- dashboard/
|       +-- index.tsx                    # Redirect to /dashboard/pending
|       +-- pending.tsx                  # Queue page (status='pending')
|       +-- approved.tsx                 # Queue page (status='approved')
|       +-- scheduled.tsx                # Queue page (status='scheduled')
|       +-- rejected.tsx                 # Queue page (status='rejected')
|
+-- components/
|   +-- dashboard/
|   |   +-- DraftQueue.tsx               # List + selection + bulk coordination
|   |   +-- DraftCard.tsx                # Item display with checkbox
|   |   +-- BulkActionBar.tsx            # Floating actions when selected
|   |   +-- StatusTabs.tsx               # Tab navigation
|   |   +-- StatsBar.tsx                 # Status counts
|   |   +-- ConfirmDialog.tsx            # Bulk action confirmation
|   |   +-- EmptyState.tsx               # No items view
|   +-- DraftDetailSheet.tsx             # EXISTS - no changes needed
|
+-- hooks/
|   +-- useSelection.ts                  # Checkbox selection logic
|   +-- useKeyboardShortcuts.ts          # Dashboard hotkeys
|   +-- useDraftStats.ts                 # Status counts query
|
+-- convex/
    +-- drafts.ts                        # ADD: bulkApprove, bulkReject mutations
```

### Structure Rationale

- **`routes/dashboard.tsx` as layout:** TanStack Router convention for shared UI (tabs, stats). Child routes render via `<Outlet />`.
- **`dashboard/` subfolder:** Each status gets its own route for deep linking and clean URL structure (`/dashboard/pending`, `/dashboard/approved`, etc.).
- **`components/dashboard/`:** Colocated dashboard-specific components. Keeps concerns grouped.
- **Hooks for state logic:** `useSelection` is reusable across queues; `useKeyboardShortcuts` centralizes hotkey handling.

---

## Architectural Patterns

### Pattern 1: Status-Filtered Queue Pages

**What:** Each status (pending, approved, rejected, scheduled) is a separate route sharing a common layout.

**When to use:** When users need to focus on one status at a time, deep link to specific queues, and see counts per status.

**Trade-offs:**
- (+) Clean URLs for bookmarking/sharing
- (+) Status tab counts visible in layout
- (+) Easy keyboard navigation between tabs
- (-) Slight code duplication (each route renders DraftQueue with different prop)

**Example:**

```typescript
// routes/dashboard.tsx (layout)
import { createFileRoute, Outlet, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { convexQuery } from '@convex-dev/react-query'
import { api } from '../../convex/_generated/api'

export const Route = createFileRoute('/dashboard')({
  component: DashboardLayout,
})

function DashboardLayout() {
  // Stats for all statuses
  const { data: pendingCount } = useQuery(convexQuery(api.drafts.count, { status: 'pending' }))
  const { data: approvedCount } = useQuery(convexQuery(api.drafts.count, { status: 'approved' }))

  return (
    <div className="container py-6">
      <div className="flex items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="flex gap-2">
          <Link to="/dashboard/pending" className="[&.active]:bg-primary">
            Pending <Badge>{pendingCount}</Badge>
          </Link>
          <Link to="/dashboard/approved" className="[&.active]:bg-primary">
            Approved <Badge>{approvedCount}</Badge>
          </Link>
          {/* ... other tabs */}
        </div>
      </div>
      <Outlet />
    </div>
  )
}
```

```typescript
// routes/dashboard/pending.tsx
import { createFileRoute } from '@tanstack/react-router'
import DraftQueue from '@/components/dashboard/DraftQueue'

export const Route = createFileRoute('/dashboard/pending')({
  component: PendingPage,
})

function PendingPage() {
  return <DraftQueue status="pending" />
}
```

### Pattern 2: Selection State with Floating Bulk Actions

**What:** Manage multi-select state in `DraftQueue`, show floating `BulkActionBar` when items selected.

**When to use:** High-volume review where users often approve/reject multiple items.

**Trade-offs:**
- (+) Fast bulk operations
- (+) Clear visual feedback of selection
- (+) Standard UX pattern (email clients, admin panels)
- (-) More state to manage

**Example:**

```typescript
// hooks/useSelection.ts
import { useState, useCallback } from 'react'
import type { Id } from '../../convex/_generated/dataModel'

export function useSelection<T extends string>() {
  const [selected, setSelected] = useState<Set<Id<T>>>(new Set())

  const toggle = useCallback((id: Id<T>) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  const selectAll = useCallback((ids: Id<T>[]) => {
    setSelected(new Set(ids))
  }, [])

  const clear = useCallback(() => {
    setSelected(new Set())
  }, [])

  const isSelected = useCallback((id: Id<T>) => selected.has(id), [selected])

  return {
    selected,
    selectedCount: selected.size,
    toggle,
    selectAll,
    clear,
    isSelected,
  }
}
```

```typescript
// components/dashboard/BulkActionBar.tsx
interface BulkActionBarProps {
  count: number
  onApprove: () => void
  onReject: () => void
  onClear: () => void
  isApproving: boolean
  isRejecting: boolean
}

export default function BulkActionBar({
  count,
  onApprove,
  onReject,
  onClear,
  isApproving,
  isRejecting,
}: BulkActionBarProps) {
  if (count === 0) return null

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <div className="flex items-center gap-3 bg-background border shadow-lg rounded-lg px-4 py-3">
        <span className="text-sm font-medium">{count} selected</span>
        <Separator orientation="vertical" className="h-6" />
        <Button variant="ghost" size="sm" onClick={onClear}>
          Clear
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onReject}
          disabled={isRejecting}
        >
          <XCircle className="h-4 w-4 mr-1" />
          Reject All
        </Button>
        <Button
          size="sm"
          onClick={onApprove}
          disabled={isApproving}
          className="bg-[#1DA1F2] hover:bg-[#1DA1F2]/90"
        >
          <CheckCircle className="h-4 w-4 mr-1" />
          Approve All
        </Button>
      </div>
    </div>
  )
}
```

### Pattern 3: Optimistic Updates for Instant Feedback

**What:** Update UI immediately on approve/reject, reconcile when server confirms.

**When to use:** Any mutation where latency is noticeable (approval dashboards, real-time apps).

**Trade-offs:**
- (+) Instant feedback, feels fast
- (+) Convex auto-rolls back on failure
- (-) More code to write
- (-) Must ensure immutability (never mutate existing objects)

**Example:**

```typescript
// Using Convex optimistic updates
import { useMutation } from '@tanstack/react-query'
import { useConvexMutation } from '@convex-dev/react-query'
import { api } from '../../convex/_generated/api'

const approveMutation = useMutation({
  mutationFn: useConvexMutation(api.drafts.approve).withOptimisticUpdate(
    (localStore, { id }) => {
      // Get current pending list
      const pendingDrafts = localStore.getQuery(api.drafts.listAll, { status: 'pending' })
      if (pendingDrafts === undefined) return

      // Filter out the approved draft
      const updated = pendingDrafts.filter(d => d._id !== id)
      localStore.setQuery(api.drafts.listAll, { status: 'pending' }, updated)

      // Optionally add to approved list
      const approvedDrafts = localStore.getQuery(api.drafts.listAll, { status: 'approved' })
      if (approvedDrafts !== undefined) {
        const draft = pendingDrafts.find(d => d._id === id)
        if (draft) {
          localStore.setQuery(api.drafts.listAll, { status: 'approved' }, [
            { ...draft, status: 'approved', updatedAt: Date.now() },
            ...approvedDrafts,
          ])
        }
      }
    }
  ),
  onSuccess: () => toast.success('Approved!'),
  onError: (error) => toast.error(`Error: ${error.message}`),
})
```

### Pattern 4: Keyboard Shortcuts for Power Users

**What:** Global hotkeys for common actions (A = approve, R = reject, J/K = navigate items).

**When to use:** High-volume review workflows where keyboard users are common.

**Trade-offs:**
- (+) Much faster for power users
- (+) Accessibility improvement
- (-) Need to handle conflicts with inputs
- (-) Discoverable only with hints/docs

**Example:**

```typescript
// hooks/useKeyboardShortcuts.ts
import { useHotkeys } from 'react-hotkeys-hook'

interface ShortcutConfig {
  onApprove?: () => void
  onReject?: () => void
  onNext?: () => void
  onPrevious?: () => void
  enabled?: boolean
}

export function useKeyboardShortcuts({
  onApprove,
  onReject,
  onNext,
  onPrevious,
  enabled = true,
}: ShortcutConfig) {
  // Approve with 'a' key
  useHotkeys('a', () => onApprove?.(), { enabled: enabled && !!onApprove })

  // Reject with 'r' key
  useHotkeys('r', () => onReject?.(), { enabled: enabled && !!onReject })

  // Navigate with j/k (vim-style)
  useHotkeys('j', () => onNext?.(), { enabled: enabled && !!onNext })
  useHotkeys('k', () => onPrevious?.(), { enabled: enabled && !!onPrevious })

  // Open detail with Enter
  useHotkeys('enter', () => onApprove?.(), { enabled: enabled && !!onApprove })
}
```

---

## Data Flow

### Request Flow (Single Approve)

```
[User clicks Approve]
       |
       v
[DraftCard] ---> [DraftQueue.handleApprove(id)]
       |
       v
[useMutation.mutate({ id })]
       |
       +---> [Optimistic Update] ---> UI updates immediately
       |
       v
[Convex mutation: drafts.approve]
       |
       v
[Convex subscription] ---> [useQuery invalidates] ---> [UI reconciles]
```

### Bulk Action Flow

```
[User selects 5 drafts]
       |
       v
[useSelection.selected = Set(5 ids)]
       |
       v
[BulkActionBar appears]
       |
       v
[User clicks "Approve All"]
       |
       v
[ConfirmDialog: "Approve 5 drafts?"]
       |
       v
[useMutation.mutate({ ids: [...selected] })]
       |
       +---> [Optimistic: remove all 5 from pending list]
       |
       v
[Convex mutation: drafts.bulkApprove]
       |
       v
[useSelection.clear()] ---> [BulkActionBar hides]
```

### Real-Time Sync Flow (Another User Approves)

```
[Another user approves draft]
       |
       v
[Convex database updates]
       |
       v
[Convex subscription pushes to all clients]
       |
       v
[useQuery(api.drafts.listAll) receives new data]
       |
       v
[DraftQueue re-renders] ---> [Draft disappears from list]
       |
       v
[Stats bar updates count]
```

---

## Build Order (Phase Dependencies)

The following sequence respects component dependencies:

### Phase 1: Foundation (No Dependencies)

| Component | Why First |
|-----------|-----------|
| `useSelection` hook | Core state logic, no UI dependencies |
| `EmptyState` | Simple presentational component |
| `StatusTabs` | Uses existing shadcn Tabs |
| `StatsBar` | Simple query + display |

### Phase 2: Core Components (Depends on Phase 1)

| Component | Dependencies |
|-----------|--------------|
| `DraftCard` | Needs `useSelection.isSelected` |
| `BulkActionBar` | Needs selection count, action callbacks |
| `ConfirmDialog` | Standalone, but used by BulkActionBar |

### Phase 3: Page Assembly (Depends on Phase 2)

| Component | Dependencies |
|-----------|--------------|
| `DraftQueue` | Composes DraftCard, BulkActionBar |
| Convex `bulkApprove`/`bulkReject` | Needed by DraftQueue bulk actions |

### Phase 4: Routing (Depends on Phase 3)

| Component | Dependencies |
|-----------|--------------|
| `dashboard.tsx` (layout) | StatusTabs, StatsBar |
| `dashboard/pending.tsx` | DraftQueue |
| `dashboard/approved.tsx` | DraftQueue |
| `dashboard/scheduled.tsx` | DraftQueue |
| `dashboard/rejected.tsx` | DraftQueue |

### Phase 5: Polish (Depends on Phase 4)

| Component | Dependencies |
|-----------|--------------|
| `useKeyboardShortcuts` | Needs DraftQueue context |
| Optimistic updates | Can be added after core flow works |

---

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 20 drafts/day (current) | Simple list, no pagination needed |
| 100 drafts/day | Add pagination or infinite scroll to `listAll` query |
| 1000+ drafts/day | Virtual scrolling (react-virtual), cursor pagination, date range filters |

### Scaling Priorities

1. **First bottleneck:** Query size. Convex `.take(50)` limit is already in place. Add pagination UI when counts approach 50.
2. **Second bottleneck:** Real-time subscription bandwidth. Consider status-specific subscriptions (already done with `by_status` index).

---

## Anti-Patterns

### Anti-Pattern 1: Mutating Optimistic State

**What people do:** Directly modify the array from `localStore.getQuery()`.

**Why it's wrong:** Convex caches these objects. Mutation corrupts internal state, causing stale/incorrect data.

**Do this instead:**
```typescript
// WRONG
const drafts = localStore.getQuery(api.drafts.listAll, {})
drafts.splice(index, 1) // Mutates!

// CORRECT
const drafts = localStore.getQuery(api.drafts.listAll, {})
const updated = drafts.filter(d => d._id !== id) // New array
localStore.setQuery(api.drafts.listAll, {}, updated)
```

### Anti-Pattern 2: Selection State in URL

**What people do:** Encode selected IDs in URL params for "persistence."

**Why it's wrong:** Selection is ephemeral UI state. URLs become unwieldy. Sharing a URL with selections causes confusion.

**Do this instead:** Keep selection in React state (`useState`). Clear on navigation or page unload.

### Anti-Pattern 3: One Giant Component

**What people do:** Put list, selection, bulk actions, detail view all in one file.

**Why it's wrong:** Becomes unmaintainable. Hard to test. Hard to reuse parts.

**Do this instead:** Split by responsibility:
- `DraftQueue` = list orchestration
- `DraftCard` = item display
- `BulkActionBar` = action toolbar
- `DraftDetailSheet` = detail view (already exists)

### Anti-Pattern 4: Polling Instead of Subscriptions

**What people do:** Use `refetchInterval` to check for updates.

**Why it's wrong:** Convex has real-time subscriptions built in. Polling wastes resources and adds latency.

**Do this instead:** Use `useQuery` from Convex. Updates push automatically.

---

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Clerk (auth) | Already integrated via provider | User ID available in mutations |
| Twitter/X API | Not in dashboard scope | Publishing handled by separate service |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| DraftQueue <-> DraftDetailSheet | Prop drilling (selectedDraft, onOpenChange) | Keep sheet state in queue component |
| Route <-> DraftQueue | Props (status) | Route determines which status to show |
| BulkActionBar <-> DraftQueue | Callbacks (onApprove, onReject, onClear) | Queue owns selection state |

---

## Sources

**Content Moderation Dashboard Patterns:**
- [GetStream: Build Moderation Dashboard](https://getstream.io/moderation/docs/quick-start/build-moderation-dashboard/)
- [Hive AI: Moderation Dashboard](https://thehive.ai/blog/introducing-moderation-dashboard-a-streamlined-interface-for-content-moderation)

**Bulk Actions UX:**
- [PatternFly: Bulk Selection](https://www.patternfly.org/patterns/bulk-selection/)
- [Shopify Polaris: Index Table](https://polaris-react.shopify.com/components/tables/index-table?example=index-table-with-multiple-promoted-bulk-actions)
- [shadcn/ui: Tables Bulk Actions Block](https://www.shadcn.io/blocks/tables-bulk-actions)
- [Eleken: Bulk Action UX Guidelines](https://www.eleken.co/blog-posts/bulk-actions-ux)

**Optimistic Updates:**
- [Convex: Optimistic Updates](https://docs.convex.dev/client/react/optimistic-updates) (HIGH confidence)

**Master-Detail Pattern:**
- [Sean Connolly: React Master/Detail Pattern](https://seanconnolly.dev/react-master-detail-pattern)
- [MUI X: Data Grid Master-Detail](https://mui.com/x/react-data-grid/master-detail/)

**Keyboard Shortcuts:**
- [react-hotkeys-hook](https://github.com/JohannesKlauss/react-hotkeys-hook)

**TanStack Router:**
- [TanStack Router: File-Based Routing](https://tanstack.com/router/latest/docs/framework/react/routing/file-based-routing)
- [TanStack Router: Routing Concepts](https://tanstack.com/router/v1/docs/framework/react/routing/routing-concepts)

---

*Architecture research for: Xpecialist Control Dashboard*
*Researched: 2026-02-03*
