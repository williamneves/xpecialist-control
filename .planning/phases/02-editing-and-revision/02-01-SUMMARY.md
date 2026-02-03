# Phase 02 Plan 01: Rejected Draft Resubmit Summary

## One-liner

Rejected draft resubmit flow via resubmitDraft mutation with content editing and status reset to pending

---

## Changes

### Added

- `resubmitDraft` mutation in `convex/drafts.ts`
  - Validates draft exists and status is 'rejected'
  - Updates content, resets status to 'pending', clears rejectionReason
  - Sets updatedAt timestamp

- Resubmit UI in `src/components/DraftDetailSheet.tsx`
  - `resubmitDraft` mutation hook with TanStack Query integration
  - Modified `handleSaveEdit` to detect rejected draft and call resubmit
  - Content change check to avoid unnecessary mutations (matches existing pattern)
  - "Reenviar" button label with RefreshCw icon for rejected drafts
  - Hint text explaining resubmit flow for rejected drafts

### Modified

- `handleSaveEdit` logic in DraftDetailSheet
  - Checks draft status before deciding mutation
  - For rejected: calls resubmitDraft only if content changed
  - For others: preserves existing updateContent behavior

### Unchanged

- Existing pending draft edit flow (EDIT-01, EDIT-02, EDIT-03) preserved
- Rejection form and approval flow unchanged
- Delete functionality unchanged

---

## Decisions Made

| Decision | Rationale | Alternatives Considered |
|----------|-----------|------------------------|
| Resubmit only on content change | Matches existing updateContent pattern, avoids unnecessary mutations | Always resubmit on save |
| Clear rejectionReason on resubmit | Draft returns to pending with clean slate, no confusion | Keep reason as history |
| Single mutation for content+status | Atomic operation, simpler than separate mutations | Separate updateContent + changeStatus |

---

## Verification Results

| Check | Result | Notes |
|-------|--------|-------|
| Convex compiles | PASS | `npx convex dev --once` succeeds |
| Production build | PASS | `bun --bun run build` succeeds |
| resubmitDraft mutation exists | PASS | Exported from convex/drafts.ts |
| Mutation validates rejected status | PASS | Throws error for non-rejected drafts |
| UI shows Reenviar for rejected | PASS | Conditional button label |
| Content change check implemented | PASS | Avoids unnecessary mutations |

---

## Deviations from Plan

None - plan executed exactly as written.

---

## Test Commands

```bash
# Verify Convex backend
npx convex dev --once

# Verify build
bun --bun run build

# Manual testing flow:
# 1. Reject a pending draft with reason
# 2. Open rejected draft from History > Rejeitados
# 3. Click Edit, modify content
# 4. Click "Reenviar"
# 5. Verify toast shows success
# 6. Check draft appears in Pendentes (status changed)
# 7. Verify rejection reason no longer shows
```

---

## Commits

| Hash | Type | Description |
|------|------|-------------|
| d339e88 | feat | Add resubmitDraft mutation for rejected drafts |
| 11e56e3 | feat | Wire resubmit UI for rejected drafts |

---

## Next Phase Readiness

**Blockers:** None

**Dependencies resolved:**
- REV-03 (resubmit rejected draft) now complete
- Existing EDIT-01, EDIT-02, EDIT-03 preserved

**Ready for:**
- 02-02-PLAN.md (if exists)
- Phase 3 scheduling features

---

## Metadata

- **Duration:** 3m
- **Completed:** 2026-02-03
- **Phase:** 02-editing-and-revision
- **Plan:** 01
- **Tasks:** 2/2
