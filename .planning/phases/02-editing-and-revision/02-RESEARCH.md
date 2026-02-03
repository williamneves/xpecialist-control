# Phase 2: Editing and Revision - Research

**Researched:** 2026-02-03
**Domain:** React form editing patterns, Convex mutations, draft revision flow
**Confidence:** HIGH

## Summary

This phase focuses on enabling users to edit draft content before approval and revise rejected drafts for resubmission. The core technical challenges are well-understood React patterns: controlled form state, live character counting, and edit/cancel/save flows.

The existing codebase already has the foundational patterns in place. The `DraftDetailSheet` component (from Phase 1) already implements basic editing with the `isEditing` state, `editedContent` state, and the `updateContent` mutation. The `drafts.history.tsx` route already has status filtering that can display rejected drafts. This phase extends these patterns rather than introducing new architectural concepts.

**Primary recommendation:** Extend the existing `DraftDetailSheet` editing UI to support cancel-to-revert, add a "resubmit" mutation for rejected drafts that resets status to pending, and ensure the history view's rejected filter surfaces rejection reasons.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React useState | 19 | Controlled form state | Already in use, native React |
| TanStack Query | 5 | Mutation handling | Already integrated via @convex-dev/react-query |
| Convex mutations | latest | Backend persistence | Already in use |
| shadcn/ui Textarea | latest | Text input | Already installed |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| sonner | latest | Toast notifications | Already in use for mutation feedback |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| useState for edit state | React Hook Form | Overkill for single-field edit; adds dependency |
| Manual character count | react-textarea-counter | Already have simple implementation; no need |

**Installation:**
No new dependencies required. All needed libraries are already installed.

## Architecture Patterns

### Recommended Project Structure
```
src/
  components/
    DraftDetailSheet.tsx  # Extend existing - add cancel revert, resubmit
  routes/
    drafts.history.tsx    # Existing - has rejected filter
    index.tsx             # Existing - pending queue
convex/
  drafts.ts               # Add resubmitDraft mutation
```

### Pattern 1: Controlled Edit with Cancel-to-Revert
**What:** Store original content when entering edit mode, revert on cancel
**When to use:** Any edit flow where user should be able to discard changes
**Example:**
```typescript
// Source: Existing pattern in DraftDetailSheet.tsx
const [isEditing, setIsEditing] = useState(false)
const [editedContent, setEditedContent] = useState('')

const handleStartEdit = () => {
  setEditedContent(draft.content) // Capture original
  setIsEditing(true)
}

const handleCancelEdit = () => {
  setIsEditing(false)
  // editedContent is discarded, draft.content unchanged
}

const handleSaveEdit = () => {
  if (editedContent.trim() && editedContent !== draft.content) {
    updateContent({ id: draft._id, content: editedContent })
  }
  setIsEditing(false)
}
```

### Pattern 2: Live Character Count
**What:** Display current character count that updates as user types
**When to use:** Twitter-style content with character limits
**Example:**
```typescript
// Source: Already implemented in DraftDetailSheet.tsx
<Textarea
  value={editedContent}
  onChange={(e) => setEditedContent(e.target.value)}
  maxLength={280}
/>
<span className="text-xs text-muted-foreground">
  {editedContent.length}/280
</span>
```

### Pattern 3: Resubmit Rejected Draft
**What:** Mutation that updates content and resets status to pending
**When to use:** Revision flow for rejected drafts
**Example:**
```typescript
// Source: Pattern from existing updateContent + approve mutations
export const resubmitDraft = mutation({
  args: {
    id: v.id('drafts'),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const draft = await ctx.db.get(args.id)
    if (!draft) throw new Error('Draft not found')
    if (draft.status !== 'rejected') throw new Error('Only rejected drafts can be resubmitted')

    await ctx.db.patch(args.id, {
      content: args.content,
      status: 'pending',
      updatedAt: Date.now(),
      rejectionReason: undefined, // Clear previous rejection
    })
    return args.id
  },
})
```

### Anti-Patterns to Avoid
- **Direct state mutation:** Never mutate `editedContent` directly; always use setter
- **Uncontrolled forms:** Don't use uncontrolled textarea with ref; controlled state needed for live count
- **Optimistic updates for status change:** Avoid optimistic updates for status transitions; real-time Convex sync is fast enough and avoids complexity
- **Separate edit and resubmit flows:** Don't create two different UIs; use same editing pattern with conditional save behavior based on status

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Character counting | Custom counting logic | `string.length` on state | Already works, no edge cases |
| Form reset | Custom reset logic | Store original in state, discard on cancel | React's natural state flow |
| Rejection visibility | Custom query | Existing `listAll` with status filter | Already implemented |

**Key insight:** The existing codebase already handles the complex patterns (mutations, real-time updates, status filtering). This phase extends existing components rather than building new abstractions.

## Common Pitfalls

### Pitfall 1: Forgetting to Clear Rejection Reason on Resubmit
**What goes wrong:** Draft is resubmitted but old rejection reason persists
**Why it happens:** Only updating status, forgetting the rejectionReason field
**How to avoid:** Explicitly set `rejectionReason: undefined` in resubmit mutation
**Warning signs:** Rejected reason still shows after resubmission

### Pitfall 2: Cancel Button Not Reverting Changes
**What goes wrong:** User clicks cancel but changes persist
**Why it happens:** Calling updateContent before checking if user wants to save
**How to avoid:** Cancel handler only sets `isEditing(false)`, never calls mutation
**Warning signs:** UI shows "updated" toast on cancel

### Pitfall 3: Character Count Showing Wrong Number
**What goes wrong:** Count shows 0 or stale value
**Why it happens:** Counting `draft.content` instead of `editedContent` in edit mode
**How to avoid:** Always count the current controlled state (`editedContent.length`)
**Warning signs:** Count doesn't update as user types

### Pitfall 4: Resubmit Available on Non-Rejected Drafts
**What goes wrong:** User can click resubmit on pending/approved drafts
**Why it happens:** UI doesn't check draft status before showing resubmit action
**How to avoid:** Conditional render: `draft.status === 'rejected' && <ResubmitButton />`
**Warning signs:** Mutation error "Only rejected drafts can be resubmitted"

### Pitfall 5: State Persists Between Different Drafts
**What goes wrong:** Open draft A, start editing, close, open draft B - still see draft A's edit
**Why it happens:** Component state not reset when draft prop changes
**How to avoid:** Reset editing state when sheet opens with new draft, or use draft._id as key
**Warning signs:** Wrong content appears in edit mode

## Code Examples

Verified patterns from the existing codebase:

### Existing Edit Flow (DraftDetailSheet.tsx)
```typescript
// Source: src/components/DraftDetailSheet.tsx lines 60-123
const [isEditing, setIsEditing] = useState(false)
const [editedContent, setEditedContent] = useState('')

const handleStartEdit = () => {
  setEditedContent(draft.content)
  setIsEditing(true)
}

const handleSaveEdit = () => {
  if (editedContent.trim() && editedContent !== draft.content) {
    updateContent({ id: draft._id, content: editedContent })
  } else {
    setIsEditing(false)
  }
}
```

### Cancel Edit Handler (To Add)
```typescript
// Pattern: Cancel discards changes by not calling mutation
const handleCancelEdit = () => {
  setIsEditing(false)
  // editedContent discarded - draft.content unchanged
}
```

### Resubmit Mutation (To Add)
```typescript
// Pattern: Combine content update with status reset
export const resubmitDraft = mutation({
  args: {
    id: v.id('drafts'),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const draft = await ctx.db.get(args.id)
    if (!draft) throw new Error('Draft not found')
    if (draft.status !== 'rejected') {
      throw new Error('Only rejected drafts can be resubmitted')
    }

    await ctx.db.patch(args.id, {
      content: args.content,
      status: 'pending',
      updatedAt: Date.now(),
      rejectionReason: undefined,
    })
    return args.id
  },
})
```

### Rejected Draft UI Conditional
```typescript
// Pattern: Show different actions based on status
{draft.status === 'rejected' && (
  <Button onClick={handleResubmit} disabled={isResubmitting}>
    <RefreshCw className="h-4 w-4 mr-1" />
    Resubmeter
  </Button>
)}

{draft.status === 'pending' && (
  <>
    <Button onClick={() => setShowRejectForm(true)}>Rejeitar</Button>
    <HoldButton onComplete={handleApprove}>Aprovar</HoldButton>
  </>
)}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Uncontrolled forms | Controlled state with useState | React 16+ | Better UX, easier validation |
| Custom form libraries | Native React + simple state | React 19 | Fewer dependencies |
| Manual refetch after mutation | Convex real-time sync | Convex adoption | Automatic UI updates |

**Deprecated/outdated:**
- Form libraries for simple edits: Overkill when you have one textarea
- Optimistic updates for status changes: Convex real-time is fast enough

## Open Questions

Things that couldn't be fully resolved:

1. **Thread Revision Flow**
   - What we know: Single draft resubmit is clear
   - What's unclear: Should thread resubmit apply to all drafts in thread?
   - Recommendation: Start with single draft resubmit; thread-level resubmit deferred to bulk operations phase

2. **Edit History**
   - What we know: Current implementation overwrites content
   - What's unclear: Should previous versions be preserved?
   - Recommendation: Out of scope per PROJECT.md "focus on approval flow first"

## Sources

### Primary (HIGH confidence)
- Existing codebase: `src/components/DraftDetailSheet.tsx` - Editing pattern already implemented
- Existing codebase: `convex/drafts.ts` - updateContent mutation exists
- Existing codebase: `src/routes/drafts.history.tsx` - Status filtering implemented
- [Convex Optimistic Updates](https://docs.convex.dev/client/react/optimistic-updates) - Verified not needed for this use case

### Secondary (MEDIUM confidence)
- [shadcn/ui Textarea with Character Count](https://www.shadcn.io/patterns/field-text-areas-3) - Pattern verification
- [React Form Edit/Cancel patterns](https://www.simple-table.com/blog/editable-react-data-grids-in-cell-vs-form-editing) - UX best practices

### Tertiary (LOW confidence)
- None - all findings verified with existing codebase or official docs

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already in use in codebase
- Architecture: HIGH - Extending existing patterns, not introducing new ones
- Pitfalls: HIGH - Based on code review of existing implementation

**Research date:** 2026-02-03
**Valid until:** 60 days (stable patterns, no framework changes expected)
