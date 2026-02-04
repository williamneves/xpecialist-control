# Xpecialist Control Dashboard

## What This Is

A review dashboard for approving AI-generated tweet drafts before publication. Xpecialist (an AI agent) creates 20+ drafts per day; William reviews them here — approving, rejecting with revision feedback, editing, or scheduling for future posting. The dashboard is the human control layer between AI-generated content and public posting. Now includes a programmatic API for AI agents to create and manage drafts directly.

## Core Value

Efficient high-volume draft review — see pending drafts, make quick decisions, move on. Everything else serves this.

## Current State (v1.0 shipped)

**Tech Stack:** TanStack Start (React 19) + Convex + Clerk + Tailwind CSS v4
**Codebase:** 82 TypeScript files, ~11,000 LOC
**Shipped:** 2026-02-04

**Features delivered:**
- Authenticated dashboard with Clerk protection
- Draft queue with status tabs (pending/approved/rejected/published)
- Thread grouping with bulk approve/reject
- Hold-to-confirm gesture for approval
- Draft editing with live character count
- Rejection with required reason and resubmission flow
- Scheduling with date/time picker
- Keyboard shortcuts (Alt+A/R, j/k, Alt+E, Escape, ?)
- Review wizard for sequential bulk processing
- HTTP API for AI agents with Bearer token auth
- Token management UI with permissions
- OpenAPI spec at /api/openapi.json

## Requirements

### Validated

- ✓ Dashboard showing pending drafts with quick actions — v1.0
- ✓ Thread grouping — review threads as units — v1.0
- ✓ Bulk actions for high-volume review — v1.0
- ✓ Draft editing with character counter — v1.0
- ✓ Scheduling interface — v1.0
- ✓ Rejected draft revision flow — v1.0
- ✓ History view with status tabs — v1.0
- ✓ Keyboard shortcuts for power users — v1.0
- ✓ HTTP API for AI agents — v1.0
- ✓ Token-based authentication — v1.0

### Active

(None — v1.0 complete, awaiting v1.1 planning)

### Out of Scope

- Analytics dashboard — v2, focus on approval flow first
- Publishing mechanism — handled by Xpecialist agent
- Complex permissions/roles — future team prep
- Twitter-exact preview styling — basic preview sufficient
- Mobile-first design — desktop-first
- Thread composition UI — requires backend changes

## Context

**Workflow:**
1. Xpecialist creates drafts via API (status: "pending")
2. William opens dashboard, sees pending drafts
3. William reviews: approve / reject / edit / schedule
4. Rejected drafts can be edited and resubmitted
5. Approved/scheduled drafts picked up by Xpecialist for publishing

**API Access:**
- AI agents use Bearer tokens from /settings/api-tokens
- Full CRUD at /api/v1/drafts with permission control
- OpenAPI spec available for client generation

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Desktop-first, responsive bonus | William primarily reviews on desktop | ✓ Good |
| Hold-to-confirm for approve | Prevents accidental approvals | ✓ Good |
| Alt+key shortcuts | Single keys interfere with typing | ✓ Good |
| scheduledFor as property not status | Orthogonal to approval workflow | ✓ Good |
| Token prefix + hash storage | Security + identification | ✓ Good |
| Hono for HTTP router | Better middleware than native Convex | ✓ Good |
| Dialog over Sheet | Centered modal better for focus | ✓ Good |

## Constraints

- **Tech stack**: TanStack Start + Convex + Clerk + Tailwind
- **Backend**: Convex functions in `convex/`
- **Auth**: Clerk for user authentication, custom tokens for API
- **UI**: shadcn/ui components via Radix UI primitives
- **Deployment**: Convex Cloud for backend

---
*Last updated: 2026-02-04 after v1.0 milestone*
