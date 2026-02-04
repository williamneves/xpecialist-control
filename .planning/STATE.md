# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-03)

**Core value:** Efficient high-volume draft review — see pending drafts, make quick decisions, move on
**Current focus:** Phase 5 (Agent API) - In Progress

## Current Position

Phase: 5 of 6 (Agent API)
Plan: 1 of 4 in current phase
Status: In progress
Last activity: 2026-02-04 - Completed 05-01-PLAN.md (Token Infrastructure)

Progress: [█████████████████░] 68% (17/25 plans)

## Performance Metrics

**Velocity:**
- Total plans completed: 17
- Average duration: 4m
- Total execution time: 58m

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01 | 5 | 23m | 5m |
| 02 | 2 | 4m | 2m |
| 03 | 5 | 20m | 4m |
| 04 | 3 | 6m | 2m |
| 05 | 1 | 3m | 3m |
| 06 | 1 | 2m | 2m |

**Recent Trend:**
- Last 5 plans: 04-01 (2m), 04-02 (2m), 04-03 (2m), 06-01 (2m), 05-01 (3m)
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

### Pending Todos

2 todos in `.planning/todos/pending/`:
- Simplificar botao approve no drawer (ui)
- Thread composition - multiplas mensagens (ui)

Note: Layout centralizado com max-width addressed in 06-01

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
Stopped at: Completed 05-01-PLAN.md (Token Infrastructure)
Resume file: None

## Phase 5 Progress (In Progress)

**Plan 1 (05-01) Complete:**
- apiTokens table with prefix, hash, permissions, and lifecycle fields
- Token generation with xpc_{8}_{32} format and SHA-256 hashing
- validateToken query checking hash, revocation, and expiration
- CRUD mutations: createToken, revokeToken, listTokens
- nanoid installed for secure token generation

**Next: Plan 2 (05-02)** - HTTP Endpoints

## Phase 6 Progress (Started)

**Plan 1 (06-01) Complete:**
- Dashboard container centered with max-w-5xl mx-auto
- Auth loading skeleton shows while Clerk auth state loads
- Dark mode contrast improved: muted-foreground 0.75, border 0.35, card 0.18
