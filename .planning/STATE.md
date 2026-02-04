# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-03)

**Core value:** Efficient high-volume draft review — see pending drafts, make quick decisions, move on
**Current focus:** Phase 6 (UI Polish) - In Progress

## Current Position

Phase: 6 of 6 (UI Polish)
Plan: 4 of 5 in current phase
Status: In progress
Last activity: 2026-02-04 - Completed 05-02-PLAN.md (HTTP Endpoints)

Progress: [████████████████████] 84% (21/25 plans)

## Performance Metrics

**Velocity:**
- Total plans completed: 21
- Average duration: 3m
- Total execution time: 69m

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01 | 5 | 23m | 5m |
| 02 | 2 | 4m | 2m |
| 03 | 5 | 20m | 4m |
| 04 | 3 | 6m | 2m |
| 05 | 2 | 7m | 4m |
| 06 | 4 | 9m | 2m |

**Recent Trend:**
- Last 5 plans: 05-01 (3m), 06-02 (3m), 06-03 (2m), 06-04 (2m), 05-02 (4m)
- Trend: Stable

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Use Clerk SignedIn/SignedOut components for client-side route protection
- Minimum 10 character requirement for rejection reasons
- Client-side validation with error state before mutation call
- 500ms hold duration for approve confirmation gesture
- HoldButton pattern for actions requiring confirmation
- 4-tab layout: Pendentes, Aprovados, Rejeitados, Publicados (no Agendados tab)
- 500ms delay for Convex real-time update propagation in auto-advance
- Auto-advance only on pending tab (queue workflow semantics)
- Threads rendered as inline collapsible cards with bulk actions
- Singles rendered as clickable cards in pending tab (card view vs table)
- Non-pending tabs keep table view for historical data
- Conditional query enabling based on activeTab for performance
- Resubmit only when content changed (matches updateContent pattern)
- Clear rejectionReason on resubmit (clean slate for re-review)
- Phase 2 core requirements confirmed working by human verification
- 15-minute intervals for DateTimePicker minute selection
- Default to 9:00 AM when date selected without existing time
- Date-only comparison for calendar disable logic (allows scheduling today)
- 5-minute minimum buffer for scheduling validation
- Validation on submit, not on selection (better UX)
- Medium date format for scheduled time display (more readable)
- Explicit timezone in formatScheduledTime
- scheduledFor as orthogonal property (not a status)
- Unschedule via passing undefined to schedule mutation
- Independent armed states for approve/reject shortcuts (can be true simultaneously)
- 5-second timeout for armed state auto-reset
- 1024px max-width (max-w-5xl) for better readability on wide screens
- Auth skeleton matches dashboard layout structure
- Dark mode contrast: muted-foreground 0.75, border 0.35, card 0.18
- Token format xpc_{nanoid(8)}_{nanoid(32)} for prefix visibility and secure secret
- SHA-256 hashing via Web Crypto API for Convex compatibility
- Soft delete via revokedAt timestamp for audit trail
- Replace Sheet with Dialog for centered focus during review
- Simplify button text from 'Segurar para Aprovar' to 'Aprovar'
- Wizard progress dots with ring indicator for current position
- Prevent backdrop close in wizard (onInteractOutside e.preventDefault())
- Auto-advance after approve/reject in wizard
- 50ms delay for focus to ensure textarea rendered
- Enter submits only when reason >= 10 chars (validation check)
- Hono router over native Convex HTTP for middleware support
- Auth on /api/v1/* keeps /api/health public
- Permission format: drafts:read, drafts:create, drafts:approve, etc.
- Draft authorId = api:{token_prefix} for API-created drafts

### Pending Todos

1 todo in `.planning/todos/pending/`:
- Thread composition - multiplas mensagens (ui)

Note: Layout centralizado com max-width addressed in 06-01
Note: Simplificar botao approve addressed in 06-02

### Blockers/Concerns

None.

### User Feedback (Logged)

From Phase 2 verification, logged for future consideration:
- Thread composition (multiple messages per thread) - future phase
- Verification drawer button wrapping - UI polish
- App layout centering with max-width - ADDRESSED in 06-01

### Roadmap Evolution

- Phase 5 added: Agent API (HTTP endpoints + token auth for AI agents)

## Session Continuity

Last session: 2026-02-04
Stopped at: Completed 05-02-PLAN.md (HTTP Endpoints)
Resume file: None

## Phase 5 Progress (In Progress)

**Plan 1 (05-01) Complete:**
- apiTokens table with prefix, hash, permissions, and lifecycle fields
- Token generation with xpc_{8}_{32} format and SHA-256 hashing
- validateToken query checking hash, revocation, and expiration
- CRUD mutations: createToken, revokeToken, listTokens
- nanoid installed for secure token generation

**Plan 2 (05-02) Complete:**
- Hono HTTP router with convex-helpers HttpRouterWithHono
- CORS middleware for /api/* with all origins
- Bearer token auth middleware for /api/v1/*
- Draft endpoints: list, create, get, approve, reject, schedule, publish
- Token management endpoints: list, create, revoke
- Permission-based access control per endpoint

**Next: Plan 3 (05-03)** - Agent Workflow Endpoints

## Phase 6 Progress (In Progress)

**Plan 1 (06-01) Complete:**
- Dashboard container centered with max-w-5xl mx-auto
- Auth loading skeleton shows while Clerk auth state loads
- Dark mode contrast improved: muted-foreground 0.75, border 0.35, card 0.18

**Plan 2 (06-02) Complete:**
- DraftDetailDialog created as centered modal (max-w-2xl, max-h-90vh)
- Replaced DraftDetailSheet in Dashboard
- Approve button text simplified to "Aprovar"
- Old Sheet component marked deprecated for post-verification cleanup

**Plan 3 (06-03) Complete:**
- ReviewWizardDialog for sequential bulk pending draft review
- Progress dots with ring indicator for current position
- Auto-advance on approve/reject actions
- "Revisar Todos" button visible only in pending tab with drafts

**Plan 4 (06-04) Complete:**
- Reject textarea auto-focuses when showRejectForm becomes true
- Enter key submits rejection if reason >= 10 chars
- Shift+Enter creates newline in textarea
- Full keyboard rejection flow enabled

**Next: Plan 5 (06-05)** - [Final UI Polish]
