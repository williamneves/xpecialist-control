# Requirements: Xpecialist Control Dashboard

**Defined:** 2026-02-03
**Core Value:** Efficient high-volume draft review — see pending drafts, make quick decisions, move on

## v1 Requirements

### Review Queue

- [ ] **QUEUE-01**: User sees list of pending drafts sorted by creation time (newest first)
- [ ] **QUEUE-02**: User can view draft content with character count (280 limit indicator)
- [ ] **QUEUE-03**: User can approve draft with confirmation gesture (hold or swipe)
- [ ] **QUEUE-04**: User can reject draft with required reason
- [ ] **QUEUE-05**: After approve/reject, auto-advance to next pending draft
- [ ] **QUEUE-06**: User sees empty state when no pending drafts remain

### Thread Support

- [ ] **THRD-01**: Drafts in a thread are grouped together in the queue
- [ ] **THRD-02**: User reviews thread as a unit (all tweets visible)
- [ ] **THRD-03**: Approving/rejecting a thread applies to all tweets in it

### Editing

- [ ] **EDIT-01**: User can edit draft content before approval
- [ ] **EDIT-02**: Character count updates live during editing
- [ ] **EDIT-03**: User can cancel edit to revert changes

### Scheduling

- [ ] **SCHED-01**: User can schedule approved draft for future publish time
- [ ] **SCHED-02**: Date/time picker shows user's local timezone
- [ ] **SCHED-03**: Scheduled drafts appear in scheduled status view

### Revision Flow

- [ ] **REV-01**: Rejected drafts appear in rejected status view
- [ ] **REV-02**: User can edit rejected draft content
- [ ] **REV-03**: Saving edited rejected draft auto-resubmits to pending

### Status Views

- [ ] **STAT-01**: User can filter drafts by status (pending/approved/rejected/scheduled/published)
- [ ] **STAT-02**: Each status view shows relevant metadata (rejection reason, scheduled time, etc.)
- [ ] **STAT-03**: User can navigate between status views via tabs

### Keyboard Shortcuts

- [ ] **KEY-01**: Press 'a' to approve current draft
- [ ] **KEY-02**: Press 'r' to open reject dialog
- [ ] **KEY-03**: Press 'j' to move to next draft
- [ ] **KEY-04**: Press 'k' to move to previous draft
- [ ] **KEY-05**: Press 'e' to open edit mode
- [ ] **KEY-06**: Press 'Escape' to close dialogs/cancel actions

### Authentication

- [ ] **AUTH-01**: Dashboard requires Clerk authentication
- [ ] **AUTH-02**: User identity associated with approve/reject actions

## v2 Requirements

### Analytics

- **ANLY-01**: User sees metrics for published tweets (impressions, likes, replies, retweets)
- **ANLY-02**: Dashboard shows aggregate stats (total published, approval rate)

### Team Features

- **TEAM-01**: Multiple reviewers can access dashboard
- **TEAM-02**: Reviewer assignment to drafts
- **TEAM-03**: Activity log showing who approved/rejected what

### Advanced Features

- **ADV-01**: Command palette (Cmd+K) for quick actions
- **ADV-02**: Bulk selection and actions
- **ADV-03**: Draft templates for manual creation
- **ADV-04**: Optimal time scheduling suggestions

## Out of Scope

| Feature | Reason |
|---------|--------|
| Publishing mechanism | Handled by Xpecialist agent, not dashboard |
| Twitter API integration | Dashboard is approval layer only |
| Bulk actions | Sequential triage flow preferred for this volume |
| Mobile-first design | Desktop-first, responsive as bonus |
| Multi-level approval chains | Single reviewer workflow |
| AI auto-approve | Human approval is the core value |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 1 | Pending |
| AUTH-02 | Phase 1 | Pending |
| QUEUE-01 | Phase 1 | Pending |
| QUEUE-02 | Phase 1 | Pending |
| QUEUE-03 | Phase 1 | Pending |
| QUEUE-04 | Phase 1 | Pending |
| QUEUE-05 | Phase 1 | Pending |
| QUEUE-06 | Phase 1 | Pending |
| THRD-01 | Phase 1 | Pending |
| THRD-02 | Phase 1 | Pending |
| THRD-03 | Phase 1 | Pending |
| STAT-01 | Phase 1 | Pending |
| STAT-02 | Phase 1 | Pending |
| STAT-03 | Phase 1 | Pending |
| EDIT-01 | Phase 2 | Pending |
| EDIT-02 | Phase 2 | Pending |
| EDIT-03 | Phase 2 | Pending |
| REV-01 | Phase 2 | Pending |
| REV-02 | Phase 2 | Pending |
| REV-03 | Phase 2 | Pending |
| SCHED-01 | Phase 3 | Pending |
| SCHED-02 | Phase 3 | Pending |
| SCHED-03 | Phase 3 | Pending |
| KEY-01 | Phase 4 | Pending |
| KEY-02 | Phase 4 | Pending |
| KEY-03 | Phase 4 | Pending |
| KEY-04 | Phase 4 | Pending |
| KEY-05 | Phase 4 | Pending |
| KEY-06 | Phase 4 | Pending |

**Coverage:**
- v1 requirements: 28 total
- Mapped to phases: 28
- Unmapped: 0

---
*Requirements defined: 2026-02-03*
*Last updated: 2026-02-03 after roadmap creation*
