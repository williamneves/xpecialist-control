# Xpecialist Control Dashboard

## What This Is

A review dashboard for approving AI-generated tweet drafts before publication. Xpecialist (an AI agent) creates 20+ drafts per day; William reviews them here — approving, rejecting with revision feedback, editing, or scheduling for future posting. The dashboard is the human control layer between AI-generated content and public posting.

## Core Value

Efficient high-volume draft review — see pending drafts, make quick decisions, move on. Everything else serves this.

## Requirements

### Validated

- ✓ Convex backend with drafts/published schema — existing
- ✓ CRUD operations for drafts (create, approve, reject, schedule, markPublished, updateContent, remove) — existing
- ✓ Clerk authentication integration — existing
- ✓ TanStack Start routing with SSR — existing
- ✓ Real-time data updates via Convex subscriptions — existing

### Active

- [ ] Dashboard showing pending drafts with quick actions
- [ ] Thread grouping — review threads as units, not individual tweets
- [ ] Bulk actions for high-volume review (approve/reject multiple)
- [ ] Draft editing with character counter
- [ ] Scheduling interface (set future publish time)
- [ ] Rejected draft revision flow (edit and resubmit)
- [ ] History view with status tabs (pending/approved/rejected/published/scheduled)
- [ ] Basic tweet preview with character count

### Out of Scope

- Analytics dashboard — v2, focus on approval flow first
- Publishing mechanism — handled by Xpecialist agent, not this dashboard
- Complex permissions/roles — future team prep, but not v1
- Twitter-exact preview styling — basic preview sufficient
- Mobile-first design — desktop-first, responsive as bonus

## Context

**Existing Codebase:**
- TanStack Start (React 19) + Convex + Clerk + Tailwind CSS v4
- File-based routing in `src/routes/`
- Convex schema already has `drafts` and `published` tables with all needed fields
- Demo routes exist that can be deleted
- Provider hierarchy: ConvexProvider → ClerkProvider → [App]

**Workflow:**
1. Xpecialist creates drafts via Convex mutation (status: "pending")
2. William opens dashboard, sees pending drafts
3. William reviews: approve / reject (with reason) / edit / schedule
4. Rejected drafts can be edited and resubmitted
5. Approved/scheduled drafts picked up by Xpecialist for publishing

**Volume:** 20+ drafts per day — bulk operations and efficient UI critical

## Constraints

- **Tech stack**: TanStack Start + Convex + Clerk + Tailwind — already configured
- **Backend**: Use existing Convex functions in `convex/drafts.ts`
- **Auth**: Clerk for user authentication
- **UI**: shadcn/ui components via Radix UI primitives
- **Deployment**: Convex Cloud for backend

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Desktop-first, responsive bonus | William primarily reviews on desktop | — Pending |
| Basic preview over Twitter-exact | Character count matters more than visual fidelity | — Pending |
| Bulk actions for efficiency | 20+ drafts/day requires batch operations | — Pending |
| Reject = can revise | Rejected drafts aren't dead, can be edited and resubmitted | — Pending |

---
*Last updated: 2026-02-03 after initialization*
