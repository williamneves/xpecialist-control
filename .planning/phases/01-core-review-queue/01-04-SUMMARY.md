---
phase: 01-core-review-queue
plan: 04
status: complete
completed: 2026-02-03

# Dependency Graph
requires: ["01-01"]
provides: ["status-tabs", "auto-advance", "draft-filtering"]
affects: ["01-05", "01-06"]

# Tech Tracking
tech-stack:
  added: ["@radix-ui/react-tooltip"]
  patterns: ["tab-based-filtering", "auto-advance-queue"]

# File Tracking
key-files:
  created:
    - src/components/ui/tooltip.tsx
  modified:
    - src/routes/index.tsx
    - src/components/DraftDetailSheet.tsx

# Decisions
decisions:
  - id: "status-tabs"
    choice: "5-tab layout with icons and responsive labels"
    reason: "Clear visual distinction for each status"
  - id: "auto-advance-timing"
    choice: "500ms delay for Convex real-time update propagation"
    reason: "Balance between responsiveness and data consistency"
  - id: "advance-behavior"
    choice: "Only auto-advance on pending tab"
    reason: "Other tabs don't have queue workflow semantics"

# Metrics
metrics:
  duration: "5m"
  tasks: 2
  commits: 2
---

# Phase 01 Plan 04: Status Tabs and Auto-Advance Summary

**One-liner:** Dashboard with 5 status tabs and auto-advance to next pending draft after approve/reject actions.

## What Was Built

### Task 1: Status Tabs Dashboard
- Added 5 status tabs: Pendentes, Aprovados, Rejeitados, Agendados, Publicados
- Each tab has icon and responsive label (icon-only on mobile)
- Tabs filter drafts using `api.drafts.listAll` with status parameter
- Added Info column showing:
  - Rejection reason (tooltip) for rejected drafts
  - Scheduled time for scheduled drafts
  - Published time for published drafts
- Tab-specific empty states

### Task 2: Auto-Advance Queue
- Added `onActionComplete` callback to DraftDetailSheet
- Track `selectedIndex` to know position in queue
- After approve/reject on pending tab:
  - 500ms delay for Convex real-time update
  - Auto-open draft at same index (next in queue)
  - If at end of list, open last remaining draft
  - If no more pending, close sheet + success toast
- Non-pending tabs: simple close behavior

## Commits

| Hash | Description |
|------|-------------|
| 0daedef | feat(01-04): add status tabs to dashboard |
| 993205f | feat(01-04): implement auto-advance after approve/reject |

## Key Implementation Details

**Tab Filtering:**
```tsx
const [activeTab, setActiveTab] = useState<DraftStatus>("pending");
const { data: drafts } = useQuery(
  convexQuery(api.drafts.listAll, { status: activeTab })
);
```

**Auto-Advance Logic:**
```tsx
const handleActionComplete = (_action: "approve" | "reject") => {
  if (activeTab !== "pending") {
    setSheetOpen(false);
    return;
  }
  setTimeout(() => {
    if (drafts && selectedIndex < drafts.length) {
      setSelectedDraft(drafts[selectedIndex]);
    } else if (drafts && drafts.length > 0) {
      setSelectedDraft(drafts[drafts.length - 1]);
      setSelectedIndex(drafts.length - 1);
    } else {
      setSheetOpen(false);
      toast.success("Todos os drafts pendentes foram revisados!");
    }
  }, 500);
};
```

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed unused Id import**
- **Found during:** Task 2
- **Issue:** TypeScript flagged unused `Id` import in DraftDetailSheet
- **Fix:** Removed the import
- **Files modified:** src/components/DraftDetailSheet.tsx
- **Commit:** 993205f

**2. [Rule 3 - Blocking] Missing tooltip component**
- **Found during:** Task 1
- **Issue:** Tooltip component required for rejection reason display didn't exist
- **Fix:** Added shadcn tooltip component
- **Files created:** src/components/ui/tooltip.tsx
- **Commit:** 0daedef

## Success Criteria Verification

- [x] STAT-01: Dashboard filters by status via tabs
- [x] STAT-02: Each tab shows relevant metadata (rejection reason, scheduled time)
- [x] STAT-03: Navigation between status views via tabs
- [x] QUEUE-05: Auto-advance to next pending draft after action

## Next Phase Readiness

No blockers. Ready for:
- 01-05: Keyboard navigation and shortcuts
- 01-06: Thread support and batch actions
