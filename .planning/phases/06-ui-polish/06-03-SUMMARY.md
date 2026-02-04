---
phase: 06-ui-polish
plan: 03
name: "Review Wizard Dialog"
completed: 2026-02-04

subsystem: ui
tags: [review-wizard, bulk-review, dialog, sequential-workflow]

dependency-graph:
  requires: ["06-02"]
  provides: ["bulk-review-wizard"]
  affects: []

tech-stack:
  added: []
  patterns: ["wizard-pattern", "sequential-state-machine"]

key-files:
  created:
    - src/components/ReviewWizardDialog.tsx
  modified:
    - src/routes/index.tsx

decisions:
  - id: "wizard-progress-dots"
    choice: "Progress dots with ring indicator for current"
    reason: "Visual feedback for position in sequence"
  - id: "prevent-backdrop-close"
    choice: "onInteractOutside e.preventDefault()"
    reason: "Prevent accidental close during bulk review workflow"
  - id: "auto-advance-pattern"
    choice: "Auto-advance after approve/reject with handleNext()"
    reason: "Streamlined sequential workflow for power users"

metrics:
  duration: "2m"
---

# Phase 06 Plan 03: Review Wizard Dialog Summary

ReviewWizardDialog for sequential bulk pending draft review with progress tracking.

## What Was Built

### ReviewWizardDialog Component (src/components/ReviewWizardDialog.tsx)

New wizard dialog component for rapid sequential review:
- **Progress indicator**: Dots showing completed/current/remaining drafts
- **Sequential navigation**: Prev/Next/Skip between drafts
- **Inline actions**: Approve, Reject (with form), Schedule
- **Auto-advance**: Moves to next draft on approve/reject
- **State reset**: Clears state when dialog reopens
- **Backdrop protection**: Prevents accidental close via onInteractOutside

### Dashboard Integration (src/routes/index.tsx)

- Added `wizardOpen` state for dialog control
- "Revisar Todos" button in CardHeader
- Button conditionally shown: only on pending tab when flatDraftList.length > 0
- ReviewWizardDialog receives flatDraftList (pending singles only)

## Key Implementation Details

### Progress Dots Pattern
```tsx
{drafts.map((_, i) => (
  <div
    key={drafts[i]._id}
    className={cn(
      "w-2 h-2 rounded-full transition-colors",
      i < currentIndex ? "bg-primary"
        : i === currentIndex ? "bg-primary ring-2 ring-offset-2 ring-primary"
        : "bg-muted"
    )}
  />
))}
```

### Auto-Advance on Action
```tsx
const handleNext = () => {
  if (isLast) {
    toast.success("Todos os drafts pendentes foram revisados!");
    onOpenChange(false);
  } else {
    setCurrentIndex((i) => i + 1);
    // Reset form state
  }
};
```

### Prevent Accidental Close
```tsx
<DialogContent onInteractOutside={(e) => e.preventDefault()}>
```

## Commits

| Commit | Type | Description |
|--------|------|-------------|
| 6a27f14 | feat | Create ReviewWizardDialog component |
| 6ce21c1 | feat | Add Revisar Todos button to Dashboard |

## Verification Results

- [x] `bun --bun run build` passes
- [x] ReviewWizardDialog.tsx created (235 lines)
- [x] Button visible only in pending tab with drafts
- [x] Progress tracking (N de M) implemented
- [x] Navigation (prev/skip) implemented
- [x] Inline reject form with validation
- [x] Auto-advance on approve/reject
- [x] Backdrop click prevention

## Deviations from Plan

None - plan executed exactly as written.

## Next Phase Readiness

Plan 06-03 complete. All UI Polish phase plans (06-01, 06-02, 06-03) are now complete.
