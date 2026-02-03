---
phase: 01-core-review-queue
plan: 05
subsystem: ui
tags: [react, tanstack-query, convex, radix-ui, collapsible, thread-display]

# Dependency graph
requires:
  - phase: 01-02
    provides: listPendingGrouped query, approveThread/rejectThread mutations
  - phase: 01-04
    provides: Dashboard with status tabs and auto-advance pattern
provides:
  - ThreadGroup component for expandable thread display
  - Grouped pending view with threads and singles
  - Bulk thread approve/reject with inline UI
affects: [01-06]

# Tech tracking
tech-stack:
  added: [radix-ui/collapsible]
  patterns: [grouped-query-rendering, inline-bulk-actions, collapsible-ui]

key-files:
  created:
    - src/components/ThreadGroup.tsx
    - src/components/ui/collapsible.tsx
  modified:
    - src/routes/index.tsx

key-decisions:
  - "Threads rendered as inline collapsible cards with bulk actions"
  - "Singles rendered as clickable cards in pending tab (card view vs table)"
  - "Non-pending tabs keep table view for historical data"

patterns-established:
  - "ThreadGroup: Collapsible component with inline approve/reject forms"
  - "Conditional query: enabled based on activeTab for performance"
  - "Grouped rendering: map with type check for thread vs single"

# Metrics
duration: 5min
completed: 2026-02-03
---

# Phase 01 Plan 05: Thread Group Display Summary

**Collapsible ThreadGroup component with bulk approve/reject and grouped pending view**

## Performance

- **Duration:** 5 min
- **Started:** 2026-02-03T08:50:39Z
- **Completed:** 2026-02-03T08:55:58Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments
- ThreadGroup component displaying all tweets in expandable collapsible format
- Bulk approve with hold-to-confirm (500ms) and reject with required reason (10+ chars)
- Dashboard pending tab uses grouped query showing threads and singles differently
- Non-pending tabs retain table view for historical/approved/rejected drafts

## Task Commits

Each task was committed atomically:

1. **Task 2: Add Collapsible component** - `a57944a` (chore)
2. **Task 1: Create ThreadGroup component** - `f2dce3d` (feat)
3. **Task 3: Update dashboard to use grouped query** - `926c0d4` (feat)

## Files Created/Modified
- `src/components/ui/collapsible.tsx` - Radix UI Collapsible wrapper from shadcn
- `src/components/ThreadGroup.tsx` - Expandable thread display with bulk actions
- `src/routes/index.tsx` - Dashboard with grouped pending view and ThreadGroup integration

## Decisions Made
- **Threads as inline cards:** ThreadGroup renders directly in the list with expand/collapse, not opening a sheet
- **Singles as cards in pending:** Single drafts shown as clickable cards (not table rows) for visual consistency with ThreadGroup
- **Table view for non-pending:** Approved/rejected/scheduled/published tabs keep table view since they show historical data without actions
- **Conditional query enabling:** listPendingGrouped only enabled when pending tab active, listAll only enabled for other tabs

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Pre-existing biome lint warnings (vite.config, shadcn components) not related to this plan
- Skeleton loader array index key warning is acceptable for static placeholder UI

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Thread display complete with bulk actions
- Ready for Plan 06: End-to-end testing and polish
- All THRD-01, THRD-02, THRD-03 requirements satisfied

---
*Phase: 01-core-review-queue*
*Completed: 2026-02-03*
