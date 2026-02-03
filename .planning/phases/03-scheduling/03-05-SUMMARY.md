---
phase: 03-scheduling
plan: 05
subsystem: scheduling
tags: [scheduling, data-model, gap-closure, schema]

dependencies:
  requires: [03-04]
  provides: [correct-scheduling-model]
  affects: [04-optimization]

tech-stack:
  added: []
  patterns: [orthogonal-properties]

key-files:
  created: []
  modified:
    - convex/schema.ts
    - convex/drafts.ts
    - src/routes/index.tsx
    - src/components/DraftDetailSheet.tsx
    - src/components/ScheduleDialog.tsx
    - src/routes/drafts.history.tsx

decisions:
  - id: scheduling-as-property
    choice: "scheduledFor as orthogonal property, not status"
    rationale: "Drafts can be pending+scheduled or approved+scheduled"
  - id: unschedule-capability
    choice: "Pass undefined to schedule mutation to remove scheduling"
    rationale: "Consistent API pattern for setting/unsetting property"

metrics:
  duration: 7m
  completed: 2026-02-03
---

# Phase 3 Plan 5: Fix Scheduling Model (Gap Closure) Summary

**One-liner:** Removed 'scheduled' status; scheduledFor is now an orthogonal property that can be set on pending or approved drafts

## What Was Done

### Task 1: Remove 'scheduled' status from schema
- Removed `v.literal('scheduled')` from status union in `convex/schema.ts`
- Status now has 4 values: pending, approved, rejected, published
- `scheduledFor` field remains as optional number (orthogonal property)
- `by_scheduled` index preserved for queries

### Task 2: Update schedule mutation to not change status
- Changed `scheduledFor` arg from required to optional (enables unscheduling)
- Removed status change from mutation - only sets `scheduledFor`
- Allow scheduling for pending or approved (reject only rejected/published)
- Removed 'scheduled' from `listAll` query status union

### Task 3: Remove Agendados tab and update UI
- Changed TabsList from grid-cols-5 to grid-cols-4
- Removed "Agendados" tab trigger
- Updated DraftStatus type to remove 'scheduled'
- Removed 'scheduled' from statusConfig in index.tsx and DraftDetailSheet.tsx
- Show scheduledFor in Info column for approved drafts
- Updated canSchedule to allow pending or approved drafts

### Task 4: Update ScheduleDialog for new model
- Pre-populate DateTimePicker with existing `scheduledFor`
- Dynamic title based on edit vs new: "Alterar Agendamento" / "Agendar Draft"
- Added "Remover Agendamento" button for scheduled drafts
- Updated success messages based on action (schedule/unschedule)
- Also cleaned up drafts.history.tsx (removed unused Calendar import)

## Commits

| Commit | Description |
|--------|-------------|
| bf54735 | fix(03-05): remove 'scheduled' from status union |
| ce9f6a5 | fix(03-05): update schedule mutation to not change status |
| f7b2aed | fix(03-05): remove Agendados tab and update UI for new model |
| 8039bfc | feat(03-05): update ScheduleDialog for new scheduling model |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed drafts.history.tsx scheduled references**
- **Found during:** Task 4 (TypeScript check revealed errors)
- **Issue:** drafts.history.tsx still had 'scheduled' in statusConfig and statusOptions
- **Fix:** Removed 'scheduled' entries and unused Calendar import
- **Files modified:** src/routes/drafts.history.tsx
- **Commit:** 8039bfc (bundled with Task 4)

## Key Decisions Made

1. **Scheduling as orthogonal property**: `scheduledFor` is independent of approval status. A draft can be:
   - pending + no scheduledFor (needs approval)
   - pending + scheduledFor (needs approval, knows when to publish)
   - approved + no scheduledFor (ready to publish anytime)
   - approved + scheduledFor (will publish at scheduled time)

2. **Unschedule via undefined**: Pass `scheduledFor: undefined` to remove scheduling, using same mutation endpoint

3. **4-tab layout**: Pendentes, Aprovados, Rejeitados, Publicados (no separate Agendados tab)

## Verification Results

- Schema compiles with 4-value status union
- Build completes without errors
- Dashboard shows 4 tabs
- Can schedule pending or approved drafts
- Scheduling only sets scheduledFor (status unchanged)
- ScheduleDialog pre-populates existing scheduled time
- Can remove scheduling via dialog

## Next Phase Readiness

Phase 3 (Scheduling) is now complete with correct data model. The system is ready for:
- Phase 4 (Optimization) - Performance improvements
- Future publishing automation that reads `scheduledFor` on approved drafts
