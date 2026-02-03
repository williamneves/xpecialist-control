---
phase: 01-core-review-queue
plan: 02
subsystem: backend
tags: [convex, queries, threads, grouping]

dependency-graph:
  requires: []
  provides: [listPendingGrouped-query, thread-mutations, by_thread-index]
  affects: [01-03, 01-04]

tech-stack:
  added: []
  patterns: [thread-grouping, bulk-mutations]

key-files:
  created: []
  modified:
    - convex/schema.ts
    - convex/drafts.ts

decisions: []

metrics:
  duration: 3m
  completed: 2026-02-03
---

# Phase 01 Plan 02: Thread Grouping Query Summary

Convex query returning pending drafts grouped by threadId with bulk thread mutations for approve/reject.

## What Was Built

### Schema Enhancement

Added `by_thread` index on `metadata.threadId` field for efficient thread-based queries.

```ts
.index('by_thread', ['metadata.threadId'])
```

### listPendingGrouped Query

New query that returns pending drafts organized into thread groups:

```ts
export const listPendingGrouped = query({
  args: {},
  handler: async (ctx) => {
    // Returns Array<{type, threadId, drafts, newestAt}>
  }
})
```

**Key behaviors:**
- Drafts with same `threadId` are returned grouped together
- Single drafts (no threadId) are returned as solo groups
- Groups are sorted by newest draft creation time (descending)
- Drafts within threads are sorted by `threadIndex` (ascending for reading order)

### Bulk Thread Mutations

Two new mutations for thread-level operations:

- `approveThread(threadId)` - Approves all pending drafts in a thread
- `rejectThread(threadId, reason)` - Rejects all pending drafts with reason

## Files Modified

| File | Changes |
|------|---------|
| `convex/schema.ts` | Added `by_thread` index |
| `convex/drafts.ts` | Added `listPendingGrouped` query, `approveThread` and `rejectThread` mutations |

## Implementation Notes

- Thread grouping is done in-memory after fetching all pending drafts
- This approach is efficient for typical queue sizes (under 1000 pending)
- For very large queues, could optimize with cursor-based pagination

## Deviations from Plan

None - plan executed exactly as written.

## Commits

| Hash | Description |
|------|-------------|
| 004854e | Add by_thread index to drafts schema |
| 98a596d | Add listPendingGrouped query and thread mutations |

## Next Phase Readiness

Ready for:
- Plan 01-03: Review queue UI can now use `listPendingGrouped` to display grouped threads
- Plan 01-04: Thread actions can use bulk mutations

No blockers or concerns.
