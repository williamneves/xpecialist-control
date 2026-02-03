# Stack Research: Approval Dashboard UI Patterns

**Domain:** Content moderation/approval dashboard for high-volume tweet review
**Researched:** 2026-02-03
**Confidence:** HIGH

## Context

This research focuses specifically on UI patterns and libraries for the approval dashboard milestone. The existing stack (TanStack Start, Convex, Clerk, Tailwind CSS v4, shadcn/ui) is already established and not re-researched here.

**Use case:** Reviewing 20+ AI-generated tweet drafts per day with bulk review, thread grouping, and edit/schedule capabilities.

---

## Recommended Stack Additions

### Core UI Libraries (Already Present)

| Technology | Version | Purpose | Notes |
|------------|---------|---------|-------|
| @tanstack/react-table | ^8.21.2 | Data table with selection, sorting, filtering | Already installed. Use for draft queue |
| shadcn/ui Command | (via radix-ui) | Command palette for keyboard shortcuts | Already have radix-ui; add Command component |

### Recommended Additions

| Library | Version | Purpose | Why Recommended |
|---------|---------|---------|-----------------|
| react-hotkeys-hook | ^4.x | Global keyboard shortcuts | Declarative hook-based API; scoped hotkeys; works with shadcn components. Better DX than raw event listeners |
| @tanstack/react-virtual | ^3.x | Virtualized lists for large draft queues | Same TanStack ecosystem; integrates with @tanstack/react-table; renders only visible rows for 60FPS scrolling |

### Supporting Patterns (No New Dependencies)

| Pattern | Implementation | Purpose |
|---------|---------------|---------|
| Convex Optimistic Updates | `.withOptimisticUpdate()` on mutations | Instant UI feedback for approve/reject actions |
| TanStack Table Row Selection | `getToggleAllRowsSelectedHandler()` | Bulk selection with shift-click support |
| shadcn Command Dialog | `<CommandDialog>` | Cmd+K command palette for quick actions |

---

## UI Pattern Recommendations

### 1. Bulk Review Operations

**Use TanStack Table's built-in row selection** because it already supports:
- Single row toggle via `getToggleRowSelectedHandler()`
- Select all via `getToggleAllRowsSelectedHandler()`
- Shift-click range selection (requires custom implementation on top of core API)

**Implementation pattern:**
```typescript
const table = useReactTable({
  data: drafts,
  columns,
  state: { rowSelection },
  onRowSelectionChange: setRowSelection,
  enableRowSelection: true,
  getCoreRowModel: getCoreRowModel(),
})

// Bulk action on selected rows
const selectedDrafts = table.getSelectedRowModel().rows.map(r => r.original)
```

**Why this approach:** You already have @tanstack/react-table installed. No new dependency needed. The existing demo table shows the patterns.

### 2. Keyboard Shortcuts

**Use react-hotkeys-hook** because:
- Declarative API integrates cleanly with React components
- Supports scoping (shortcuts only active when component focused)
- Handles modifier keys and sequential shortcuts
- 44KB minified, no heavy dependencies

**Recommended shortcuts for approval dashboard:**

| Shortcut | Action | Scope |
|----------|--------|-------|
| `Cmd/Ctrl+K` | Open command palette | Global |
| `a` | Approve selected/focused draft | Table focused |
| `r` | Reject selected/focused draft | Table focused |
| `e` | Edit selected draft | Table focused |
| `j` / `ArrowDown` | Move to next draft | Table focused |
| `k` / `ArrowUp` | Move to previous draft | Table focused |
| `Space` | Toggle selection | Table focused |
| `Shift+Click` | Range select | Table focused |
| `Escape` | Deselect all / close panel | Global |

**Implementation pattern:**
```typescript
import { useHotkeys } from 'react-hotkeys-hook'

// Global command palette
useHotkeys('mod+k', () => setCommandOpen(true), { preventDefault: true })

// Table-scoped shortcuts (use ref)
const tableRef = useRef<HTMLDivElement>(null)
useHotkeys('a', () => approveSelected(), { enableOnFormTags: false }, [selectedDrafts])
```

### 3. Command Palette

**Use shadcn Command component** because:
- Already compatible with your stack (uses cmdk library under the hood)
- Provides fuzzy search, keyboard navigation, grouping
- Integrates with your existing shadcn/ui styling
- Accessible out of the box

**Recommended command groups:**
```
Actions
  - Approve selected (a)
  - Reject selected (r)
  - Edit draft (e)
  - Schedule draft

Navigation
  - Go to pending drafts
  - Go to approved drafts
  - Go to rejected drafts

Filters
  - Filter by thread
  - Filter by date
  - Clear filters
```

### 4. Optimistic Updates with Convex

**Use `.withOptimisticUpdate()`** because:
- Convex already supports this natively
- Makes approve/reject feel instant despite network latency
- Automatic rollback on failure
- You're already using `@convex-dev/react-query` which supports this pattern

**Implementation pattern:**
```typescript
const approveDraft = useMutation({
  mutationFn: useConvexMutation(api.drafts.approve).withOptimisticUpdate(
    (localStore, { id }) => {
      const drafts = localStore.getQuery(api.drafts.listPending, {})
      if (drafts !== undefined) {
        // Create new array - never mutate!
        localStore.setQuery(
          api.drafts.listPending,
          {},
          drafts.filter(d => d._id !== id)
        )
      }
    }
  ),
})
```

**Critical best practice:** Always create new objects/arrays in optimistic updates. Mutating corrupts Convex's internal state.

### 5. Thread Grouping

**Use TanStack Table's grouping feature** combined with expand/collapse UI:

| Pattern | Implementation |
|---------|---------------|
| Group by thread ID | `getGroupedRowModel()` with column grouping |
| Collapsible groups | `getExpandedRowModel()` with custom expand UI |
| Thread count badge | Aggregate in group header |

**Alternative simpler approach:** Filter view that shows only threads, then drill into thread detail panel. Less complex than in-table grouping.

### 6. Virtualization (If Needed)

**Only add @tanstack/react-virtual if** you frequently have 100+ visible drafts. For 20+ drafts/day, standard rendering is fine.

If needed, it integrates cleanly with TanStack Table:
```typescript
import { useVirtualizer } from '@tanstack/react-virtual'

const rowVirtualizer = useVirtualizer({
  count: rows.length,
  getScrollElement: () => tableContainerRef.current,
  estimateSize: () => 50,
  overscan: 5,
})
```

---

## Installation

```bash
# Required addition for keyboard shortcuts
bun add react-hotkeys-hook

# Add shadcn Command component (if not already present)
bunx shadcn@latest add command

# Optional: Only if you need virtualization for 100+ items
bun add @tanstack/react-virtual
```

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| react-hotkeys-hook | Raw `useEffect` + event listeners | Never; hook provides better DX and edge case handling |
| react-hotkeys-hook | @mantine/hooks `useHotkeys` | If already using full Mantine; otherwise adds unused dependencies |
| TanStack Table | AG Grid | Enterprise features, 10k+ rows, pivot tables. Overkill for 20 drafts/day |
| TanStack Table | Simple map + manual selection | Less than 10 items, no sorting/filtering needed |
| shadcn Command | kbar | If you need a full-featured command bar with animations. shadcn is simpler |
| Convex optimistic updates | React Query optimistic mutations | Only if NOT using Convex. Convex handles this natively |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Redux for selection state | Overkill; TanStack Table handles row selection internally | TanStack Table's `rowSelection` state |
| Custom keyboard event handling | Edge cases around focus, modifiers, browser shortcuts | react-hotkeys-hook |
| Manual WebSocket for real-time | Convex already provides real-time subscriptions | Convex `useQuery` auto-subscribes |
| Building custom command palette | Significant accessibility work | shadcn Command (uses battle-tested cmdk) |
| react-table v7 patterns | v8 has completely different API | TanStack Table v8 patterns |

---

## State Management Patterns

### Selection State

Keep in TanStack Table:
```typescript
const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
// Table manages this internally, you just read it
```

### Optimistic UI State

Let Convex handle via `withOptimisticUpdate()`. Don't duplicate in React state.

### Command Palette State

Simple `useState`:
```typescript
const [commandOpen, setCommandOpen] = useState(false)
```

### Focused Row State (for keyboard navigation)

```typescript
const [focusedRowIndex, setFocusedRowIndex] = useState<number | null>(null)
// Sync with keyboard navigation
useHotkeys('j', () => setFocusedRowIndex(prev => Math.min((prev ?? -1) + 1, rows.length - 1)))
useHotkeys('k', () => setFocusedRowIndex(prev => Math.max((prev ?? 0) - 1, 0)))
```

---

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| react-hotkeys-hook@4.x | React 18/19 | Uses React 18 hooks |
| @tanstack/react-table@8.x | React 18/19 | Already verified in your setup |
| @tanstack/react-virtual@3.x | @tanstack/react-table@8.x | Same ecosystem, designed to work together |
| shadcn/ui Command | cmdk@1.x | shadcn wraps cmdk; requires React 18+ |

---

## Sources

### HIGH Confidence (Official Documentation)
- [Convex Optimistic Updates](https://docs.convex.dev/client/react/optimistic-updates) - Official Convex docs
- [TanStack Table Row Selection](https://tanstack.com/table/v8/docs/guide/row-selection) - Official TanStack docs
- [shadcn/ui Command](https://ui.shadcn.com/docs/components/command) - Official shadcn docs
- [react-hotkeys-hook](https://react-hotkeys-hook.vercel.app/) - Official library docs

### MEDIUM Confidence (Verified with Multiple Sources)
- [TanStack Virtual](https://tanstack.com/virtual/latest) - Official docs, community patterns verified
- [Building Virtualized Tables with TanStack](https://dev.to/ainayeem/building-an-efficient-virtualized-table-with-tanstack-virtual-and-react-query-with-shadcn-2hhl) - Community tutorial
- [cmdk GitHub](https://github.com/dip/cmdk) - Official library, powers shadcn Command

### LOW Confidence (Single Source / Community)
- Shift-click range selection pattern - GitHub discussion, needs implementation validation
- Thread grouping via TanStack Table grouping - Conceptual; test during implementation

---

## Roadmap Implications

### Phase 1: Core Review Queue
- TanStack Table with row selection
- Basic keyboard shortcuts (a/r for approve/reject)
- Optimistic updates for instant feedback

### Phase 2: Bulk Operations
- Shift-click range selection
- Bulk approve/reject actions
- Command palette (Cmd+K)

### Phase 3: Thread Grouping
- Group by thread ID
- Collapse/expand threads
- Thread-level bulk actions

### Phase 4: Polish
- Full keyboard navigation (j/k/Space)
- Virtualization if performance issues arise
- Custom shortcuts configuration

---

*Stack research for: Xpecialist Control Dashboard - Approval UI*
*Researched: 2026-02-03*
