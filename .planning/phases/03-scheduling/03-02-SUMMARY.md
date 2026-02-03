---
phase: 03-scheduling
plan: 02
status: complete
subsystem: ui-components
tags: [schedule-dialog, datetime-picker, convex-mutation, toast, dialog]

dependency_graph:
  requires:
    - phase: 03-01
      provides: DateTimePicker component with date/time selection
  provides:
    - ScheduleDialog component for scheduling approved drafts
    - DraftDetailSheet integration with Schedule button for approved drafts
  affects: [03-03, 03-04]

tech-stack:
  added: []
  patterns:
    - Dialog with DateTimePicker for scheduling workflows
    - 5-minute minimum validation buffer for scheduling
    - UTC timestamp storage from local Date

key-files:
  created:
    - src/components/ScheduleDialog.tsx
  modified:
    - src/components/DraftDetailSheet.tsx

key-decisions:
  - "5-minute minimum buffer for scheduling validation (prevents immediate past times)"
  - "Validation on submit, not on selection (better UX per 03-RESEARCH Pitfall 3)"
  - "State reset on dialog close and draft change (prevent stale data)"

patterns-established:
  - "ScheduleDialog pattern: Dialog + DateTimePicker + validation + mutation + toast"
  - "Draft action dialog integration: state, button condition, render outside SheetContent"

metrics:
  duration: 2m
  completed: 2026-02-03
---

# Phase 3 Plan 2: ScheduleDialog Component and DraftDetailSheet Integration Summary

**ScheduleDialog component with DateTimePicker for scheduling approved drafts from DraftDetailSheet**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-03T13:05:24Z
- **Completed:** 2026-02-03T13:07:49Z
- **Tasks:** 2
- **Files created:** 1
- **Files modified:** 1

## Accomplishments

- ScheduleDialog component with DateTimePicker for date/time selection
- 5-minute minimum validation ensures future scheduling
- DraftDetailSheet shows "Agendar" button only for approved drafts
- Full mutation integration with toast feedback

## Task Commits

Each task was committed atomically:

1. **Task 1: Create ScheduleDialog component** - `4ddcc1a` (feat)
2. **Task 2: Add Schedule button to DraftDetailSheet** - `73c0b62` (feat)

## Files Created/Modified

- `src/components/ScheduleDialog.tsx` - Dialog with DateTimePicker, validation, and schedule mutation (126 lines)
- `src/components/DraftDetailSheet.tsx` - Added ScheduleDialog integration with state, button, and render

## Technical Details

### ScheduleDialog Component API

```typescript
interface ScheduleDialogProps {
  draft: Doc<"drafts">;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}
```

### Validation Function

```typescript
function validateScheduleTime(scheduledFor: Date): string | null {
  const minimumTime = addMinutes(new Date(), 5);
  if (isBefore(scheduledFor, minimumTime)) {
    return "Agende para pelo menos 5 minutos no futuro";
  }
  return null;
}
```

### DraftDetailSheet Integration

- `canSchedule = draft.status === 'approved'` condition
- Schedule button with Calendar icon in SheetFooter
- ScheduleDialog rendered outside SheetContent (allows dialog over sheet)
- State reset via useEffect on open/draft change

## Decisions Made

1. **5-minute minimum buffer** - Prevents edge cases where time passes between selection and submission
2. **Validation on submit** - Better UX than preventing time selection (per 03-RESEARCH.md Pitfall 3)
3. **State reset on close** - Clean slate for next dialog open, prevents stale scheduled date

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

**Ready for 03-03 (ScheduledList):**
- ScheduleDialog creates scheduled drafts via api.drafts.schedule mutation
- Draft status transitions to "scheduled" with scheduledFor timestamp
- DraftDetailSheet already displays scheduledFor in info section

**Dependencies satisfied:**
- ScheduleDialog exports default function
- DateTimePicker imported from ui/datetime-picker
- api.drafts.schedule mutation used
- DraftDetailSheet renders ScheduleDialog for approved drafts

---
*Phase: 03-scheduling*
*Completed: 2026-02-03*
