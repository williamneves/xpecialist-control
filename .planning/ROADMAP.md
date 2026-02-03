# Roadmap: Xpecialist Control Dashboard

## Overview

This roadmap delivers a high-volume review dashboard for AI-generated tweet drafts. Phase 1 establishes the authenticated core review queue with thread grouping and status filtering. Phase 2 adds editing capabilities and the revision flow for rejected drafts. Phase 3 delivers scheduling for approved content. Phase 4 completes the experience with keyboard shortcuts for power users.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3, 4): Planned milestone work
- Decimal phases (e.g., 2.1): Urgent insertions (marked with INSERTED)

- [ ] **Phase 1: Core Review Queue** - Authenticated draft queue with thread grouping and status views
- [ ] **Phase 2: Editing and Revision** - Edit drafts before approval, revise rejected drafts
- [ ] **Phase 3: Scheduling** - Schedule approved drafts for future publication
- [ ] **Phase 4: Keyboard Shortcuts** - Power user efficiency layer

## Phase Details

### Phase 1: Core Review Queue
**Goal**: User can authenticate, see pending drafts grouped by thread, approve/reject with feedback, and filter by status
**Depends on**: Nothing (first phase)
**Requirements**: AUTH-01, AUTH-02, QUEUE-01, QUEUE-02, QUEUE-03, QUEUE-04, QUEUE-05, QUEUE-06, THRD-01, THRD-02, THRD-03, STAT-01, STAT-02, STAT-03
**Success Criteria** (what must be TRUE):
  1. User must authenticate via Clerk before accessing dashboard
  2. User sees pending drafts listed newest-first with character counts
  3. User can approve a draft with confirmation gesture
  4. User can reject a draft with required reason
  5. After approve/reject action, user auto-advances to next pending draft
  6. Threads display as grouped units and approve/reject actions apply to entire thread
  7. User can filter drafts by status (pending/approved/rejected/scheduled/published) via tabs
**Plans**: TBD

Plans:
- [ ] 01-01: TBD
- [ ] 01-02: TBD

### Phase 2: Editing and Revision
**Goal**: User can edit draft content before approval and revise rejected drafts for resubmission
**Depends on**: Phase 1
**Requirements**: EDIT-01, EDIT-02, EDIT-03, REV-01, REV-02, REV-03
**Success Criteria** (what must be TRUE):
  1. User can edit draft content before approving
  2. Character count updates live as user edits
  3. User can cancel edit to revert changes
  4. Rejected drafts appear in rejected status view with rejection reason visible
  5. User can edit rejected draft content and save to resubmit (status returns to pending)
**Plans**: TBD

Plans:
- [ ] 02-01: TBD
- [ ] 02-02: TBD

### Phase 3: Scheduling
**Goal**: User can schedule approved drafts for future publication times
**Depends on**: Phase 1
**Requirements**: SCHED-01, SCHED-02, SCHED-03
**Success Criteria** (what must be TRUE):
  1. User can schedule an approved draft for a specific future date/time
  2. Date/time picker displays times in user's local timezone
  3. Scheduled drafts appear in scheduled status view with scheduled time visible
**Plans**: TBD

Plans:
- [ ] 03-01: TBD

### Phase 4: Keyboard Shortcuts
**Goal**: Power users can review drafts rapidly using keyboard-only navigation
**Depends on**: Phase 1, Phase 2
**Requirements**: KEY-01, KEY-02, KEY-03, KEY-04, KEY-05, KEY-06
**Success Criteria** (what must be TRUE):
  1. User can press 'a' to approve current draft
  2. User can press 'r' to open reject dialog
  3. User can press 'j'/'k' to navigate between drafts
  4. User can press 'e' to enter edit mode
  5. User can press Escape to close dialogs and cancel actions
  6. Keyboard shortcuts are disabled when user is typing in an input field
**Plans**: TBD

Plans:
- [ ] 04-01: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Core Review Queue | 0/TBD | Not started | - |
| 2. Editing and Revision | 0/TBD | Not started | - |
| 3. Scheduling | 0/TBD | Not started | - |
| 4. Keyboard Shortcuts | 0/TBD | Not started | - |
