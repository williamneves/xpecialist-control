---
phase: 03-scheduling
plan: 01
status: complete
subsystem: ui-components
tags: [datetime-picker, calendar, date-fns, react-day-picker, scheduling]

dependency_graph:
  requires: []
  provides: [DateTimePicker, Calendar, Popover]
  affects: [03-02, 03-03, 03-04]

tech-stack:
  added:
    - date-fns@4.1.0
    - react-day-picker@9.13.0
  patterns:
    - UTC storage with local display
    - Timezone detection via Intl.DateTimeFormat

key-files:
  created:
    - src/components/ui/calendar.tsx
    - src/components/ui/popover.tsx
    - src/components/ui/datetime-picker.tsx
  modified:
    - package.json
    - bun.lock

decisions:
  - id: DT-001
    description: "15-minute intervals for minute selection (0, 15, 30, 45)"
    rationale: "Standard scheduling granularity, reduces cognitive load"
  - id: DT-002
    description: "Default to 9:00 AM when date selected without existing time"
    rationale: "Business hours default, user can adjust"
  - id: DT-003
    description: "Date-only comparison for calendar disable logic"
    rationale: "Allows scheduling for later today (Pitfall 4 from research)"

metrics:
  duration: 2m
  completed: 2026-02-03
---

# Phase 3 Plan 1: DateTimePicker Dependencies and Component Summary

DateTimePicker component with Calendar popover and time dropdowns using date-fns for manipulation and Intl.DateTimeFormat for timezone display.

## What Was Done

### Task 1: Add shadcn Calendar and Popover + date-fns
- Installed shadcn Calendar component (built on react-day-picker 9.x)
- Installed shadcn Popover component for dropdown containers
- Added date-fns 4.x for date manipulation and formatting
- **Commit:** `09e967d`

### Task 2: Create DateTimePicker component
- Combined date picker (Calendar in Popover) with time selection
- Hour dropdown: 0-23 (padded to 2 digits)
- Minute dropdown: 15-minute intervals (0, 15, 30, 45)
- Time controls disabled until date selected (research Pitfall 5)
- Date-only comparison for calendar disable (allows scheduling today - Pitfall 4)
- Timezone indicator displayed below picker
- Props: `value`, `onChange`, `minDate`, `disabled`
- **Commit:** `318bd19`

## Technical Details

### DateTimePicker Component API
```typescript
interface DateTimePickerProps {
  value: Date | undefined
  onChange: (date: Date | undefined) => void
  minDate?: Date
  disabled?: boolean
}
```

### Key Implementation Choices
1. **Time preservation:** When date changes, existing time is preserved; new dates default to 9:00 AM
2. **Timezone display:** Uses `Intl.DateTimeFormat().resolvedOptions().timeZone` for accurate timezone name and offset
3. **Calendar disable logic:** Compares dates only (not times) to allow scheduling for later today
4. **15-minute intervals:** Standard scheduling granularity balancing flexibility and simplicity

### Files Created (181 lines for datetime-picker)
- `src/components/ui/calendar.tsx` - shadcn Calendar (react-day-picker wrapper)
- `src/components/ui/popover.tsx` - shadcn Popover (Radix UI primitive wrapper)
- `src/components/ui/datetime-picker.tsx` - Combined date + time picker

## Verification Results

- [x] Calendar, Popover, and DateTimePicker components exist in src/components/ui/
- [x] date-fns and react-day-picker in package.json dependencies
- [x] No lint errors in new components
- [x] TypeScript compiles without errors
- [x] Build completes successfully

## Deviations from Plan

None - plan executed exactly as written.

## Next Phase Readiness

**Ready for 03-02 (ScheduleDialog):**
- DateTimePicker component ready for use
- Calendar + Popover available for any additional date UI
- date-fns available for time validation (addMinutes, isBefore, etc.)

**Dependencies satisfied:**
- DateTimePicker can be imported from `@/components/ui/datetime-picker`
- All must_have artifacts verified
- All key_links patterns confirmed
