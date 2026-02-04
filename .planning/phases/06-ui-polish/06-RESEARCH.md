# Phase 6: UI Polish - Research

**Researched:** 2026-02-04
**Domain:** UI improvements, layout, modals, dark mode contrast, wizard patterns
**Confidence:** HIGH

## Summary

This phase delivers visual polish to the existing dashboard: centered layout with max-width, replacing the side Sheet with a centered Dialog, improving dark mode contrast, adding a wizard "Review All" mode, enhancing keyboard shortcut UX (Alt+Y focus, Enter submit), fixing auth loading states, and simplifying button text.

The changes are predominantly straightforward CSS/component refactoring using existing shadcn/ui components (Dialog, Skeleton) and Tailwind CSS v4 theme variables. The project already uses radix-ui Dialog and Sheet primitives from shadcn/ui. The wizard review mode requires new state management for sequential draft iteration within a modal.

Key insight: Most success criteria involve modifying existing components rather than adding new dependencies. The main new pattern is the wizard/stepper logic for "Revisar Todos" which is best implemented as local state within a dedicated component rather than adding a wizard library.

**Primary recommendation:** Leverage existing shadcn/ui Dialog component for all modal needs. Implement wizard as local React state tracking current index within drafts array. Adjust Tailwind theme variables for better dark mode contrast.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| radix-ui | 1.4.3 | Dialog primitives | Already in codebase, accessible, handles focus trap |
| tailwindcss | 4.0.6 | Styling and dark mode | Already in codebase, OKLCH color system |
| react-hotkeys-hook | 5.2.4 | Keyboard shortcuts | Already installed from Phase 4 |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @clerk/clerk-react | 5.49.0 | Auth loading states | Already installed, useAuth().isLoaded |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom wizard state | react-step-wizard | Overkill for single-purpose review flow |
| Dialog for draft details | Sheet (current) | Dialog is centered, better for focused tasks |
| Manual contrast fixes | Theme redesign | Targeted fixes are faster, less risky |

**Installation:**
```bash
# No new packages needed - all dependencies already installed
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── components/
│   ├── DraftDetailDialog.tsx    # NEW: Replaces DraftDetailSheet
│   ├── ReviewWizardDialog.tsx   # NEW: "Revisar Todos" wizard modal
│   └── AuthLoadingSkeleton.tsx  # NEW: Auth loading state component
├── routes/
│   └── index.tsx                # UPDATE: Layout fixes, loading state
└── styles.css                   # UPDATE: Dark mode contrast fixes
```

### Pattern 1: Sheet to Dialog Migration
**What:** Replace side-sliding Sheet with centered Dialog for draft details
**When to use:** When the user needs focused attention on content (review/edit task)
**Example:**
```typescript
// Source: https://ui.shadcn.com/docs/components/dialog
// Before: DraftDetailSheet using Sheet component
// After: DraftDetailDialog using Dialog component

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

function DraftDetailDialog({ draft, open, onOpenChange }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Detalhes do Draft</DialogTitle>
        </DialogHeader>
        {/* Content migrated from Sheet */}
        <DialogFooter>
          {/* Action buttons */}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

### Pattern 2: Wizard Review Mode (Sequential Modal)
**What:** Modal that iterates through pending drafts one by one with navigation
**When to use:** Bulk review workflow ("Revisar Todos" button)
**Example:**
```typescript
// Custom wizard state - no library needed
function ReviewWizardDialog({ drafts, open, onOpenChange }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const currentDraft = drafts[currentIndex]
  const isLast = currentIndex === drafts.length - 1

  const handleNext = () => {
    if (isLast) {
      onOpenChange(false)
    } else {
      setCurrentIndex(i => i + 1)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <div className="text-sm text-muted-foreground mb-4">
          Draft {currentIndex + 1} de {drafts.length}
        </div>
        {/* Draft content + actions */}
        <DialogFooter>
          <Button onClick={handleNext}>
            {isLast ? "Concluir" : "Proximo"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

### Pattern 3: Auto-Focus on Dialog Open
**What:** Focus reject reason input when Alt+Y triggers reject-with-reason
**When to use:** When keyboard shortcut should immediately enable typing
**Example:**
```typescript
// Source: https://www.radix-ui.com/primitives/docs/components/dialog
// Use onOpenAutoFocus to focus specific element
const textareaRef = useRef<HTMLTextAreaElement>(null)

<DialogContent
  onOpenAutoFocus={(e) => {
    e.preventDefault()
    textareaRef.current?.focus()
  }}
>
  <Textarea ref={textareaRef} />
</DialogContent>
```

### Pattern 4: Enter Key Submit in Form
**What:** Allow Enter key to submit reject reason form
**When to use:** Single-field forms where Enter should submit
**Example:**
```typescript
// Use onKeyDown handler on textarea
<Textarea
  onKeyDown={(e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }}
/>
```

### Pattern 5: Auth Loading State with Skeleton
**What:** Show skeleton UI while Clerk auth is loading
**When to use:** On protected routes before isLoaded is true
**Example:**
```typescript
// Source: https://clerk.com/docs/react/reference/hooks/use-auth
import { useAuth } from '@clerk/clerk-react'
import { Skeleton } from '@/components/ui/skeleton'

function Dashboard() {
  const { isLoaded, isSignedIn } = useAuth()

  if (!isLoaded) {
    return (
      <div className="container max-w-5xl mx-auto py-8 px-4">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  // Rest of component...
}
```

### Anti-Patterns to Avoid
- **Using Sheet for focused tasks:** Sheet is for complementary content; use Dialog for tasks requiring full attention
- **Installing wizard libraries for simple flows:** Custom state is cleaner for single-use wizard
- **Hardcoding dark mode colors:** Use CSS variables from theme for consistency
- **Pure black backgrounds:** Use gray-900/slate-900 shades for better contrast and eye comfort

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Modal focus trap | Manual focus management | Radix Dialog | Accessibility, Escape handling built-in |
| Skeleton loading | Custom animated divs | shadcn/ui Skeleton | Already styled, consistent with theme |
| Dark mode toggle | Custom context | next-themes (already installed) | Already integrated with theme |
| Form submission | Custom key listeners | onKeyDown + onSubmit | Standard HTML form semantics |

**Key insight:** The codebase already has all necessary primitives. This phase is about configuration and composition, not new infrastructure.

## Common Pitfalls

### Pitfall 1: Dialog closing on backdrop click during wizard
**What goes wrong:** User accidentally closes wizard mid-review by clicking outside
**Why it happens:** Default Dialog behavior closes on backdrop click
**How to avoid:** Use `onInteractOutside={(e) => e.preventDefault()}` for wizard modal
**Warning signs:** Lost progress during bulk review

### Pitfall 2: Focus not reaching textarea in Dialog
**What goes wrong:** Alt+Y shows reject form but textarea isn't focused
**Why it happens:** Radix Dialog focuses first focusable element by default
**How to avoid:** Use `onOpenAutoFocus` with `e.preventDefault()` and explicit `.focus()` call
**Warning signs:** User has to click/tab to textarea after keyboard shortcut

### Pitfall 3: Enter key creating newlines instead of submitting
**What goes wrong:** Enter adds newline to textarea instead of submitting form
**Why it happens:** Default textarea behavior
**How to avoid:** Check for Enter without Shift in onKeyDown, call preventDefault
**Warning signs:** Form not submitting on Enter

### Pitfall 4: Dark mode contrast still low after fixes
**What goes wrong:** Text is hard to read in dark mode
**Why it happens:** OKLCH colors not tuned for contrast
**How to avoid:** Test with WCAG contrast checker, aim for 4.5:1 ratio for text
**Warning signs:** Squinting to read content, feedback about readability

### Pitfall 5: Layout breaks on narrow screens
**What goes wrong:** max-w-5xl is too wide for mobile
**Why it happens:** Container assumes desktop
**How to avoid:** Use responsive padding, keep container fluid below breakpoint
**Warning signs:** Horizontal scrolling on mobile

### Pitfall 6: Sheet state lingering after switching to Dialog
**What goes wrong:** Old Sheet component state conflicts with new Dialog
**Why it happens:** Incomplete migration of state management
**How to avoid:** Rename component and update all import sites atomically
**Warning signs:** Modal not opening, stale state from previous component

## Code Examples

Verified patterns from official sources:

### Centered Layout Container
```typescript
// Source: Tailwind docs - Container customization
// max-w-5xl = 64rem = 1024px, good for readable content width
<div className="container max-w-5xl mx-auto py-8 px-4">
  {/* Page content */}
</div>
```

### Dark Mode Contrast Variables (Tailwind v4)
```css
/* Source: Project styles.css, adjusted for better contrast */
.dark {
  --foreground: oklch(0.985 0 0);           /* Keep white text */
  --muted-foreground: oklch(0.75 0.015 286.067); /* Brighter muted text */
  --border: oklch(0.35 0.006 286.033);      /* More visible borders */
  --card: oklch(0.18 0.005 285.823);        /* Slightly lighter card bg */
}
```

### Simplified Button Text
```typescript
// Before: "Segurar para Aprovar" (causes wrapping)
// After: "Aprovar" (concise, fits button)
<HoldButton
  size="sm"
  onComplete={() => approveDraft({ id: draft._id })}
  className="bg-[#1DA1F2] hover:bg-[#1DA1F2]/90"
>
  <CheckCircle className="h-4 w-4 mr-1" />
  {isApproving ? "Aprovando..." : "Aprovar"}
</HoldButton>
```

### Wizard Progress Indicator
```typescript
// Simple progress display for wizard review mode
<div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
  <span>Draft {currentIndex + 1} de {totalDrafts}</span>
  <div className="flex gap-1">
    {Array.from({ length: totalDrafts }, (_, i) => (
      <div
        key={i}
        className={cn(
          "w-2 h-2 rounded-full",
          i <= currentIndex ? "bg-primary" : "bg-muted"
        )}
      />
    ))}
  </div>
</div>
```

### Auth Loading Skeleton
```typescript
// Skeleton matching Dashboard layout
function DashboardSkeleton() {
  return (
    <div className="container max-w-5xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <Skeleton className="h-9 w-48 mb-2" />
          <Skeleton className="h-5 w-72" />
        </div>
        <Skeleton className="h-9 w-24" />
      </div>
      <Skeleton className="h-96 w-full rounded-lg" />
    </div>
  )
}
```

### Enter to Submit Pattern
```typescript
// Handle Enter key in textarea without Shift
const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    if (rejectionReason.trim().length >= 10) {
      handleReject()
    }
  }
}

<Textarea
  value={rejectionReason}
  onChange={(e) => setRejectionReason(e.target.value)}
  onKeyDown={handleKeyDown}
  placeholder="Motivo da rejeicao (minimo 10 caracteres)"
/>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Sheet for all modals | Dialog for focused tasks, Sheet for auxiliary | 2024+ | Better UX alignment with task type |
| Pure black dark mode | Gray-900 backgrounds | OLED era | Less eye strain, better WCAG |
| Wizard libraries | Local state + Dialog | React hooks maturity | Simpler, fewer deps |
| Loading spinners | Skeleton placeholders | 2022+ | Better perceived performance |

**Deprecated/outdated:**
- Pure black (#000) backgrounds: Too harsh, use gray-900
- Full-screen loading spinners: Skeletons provide better UX
- Complex wizard libraries for simple flows: Overkill for sequential review

## Open Questions

Things that couldn't be fully resolved:

1. **Wizard UX when no pending drafts**
   - What we know: "Revisar Todos" should be disabled or hidden
   - What's unclear: Show disabled button or hide entirely?
   - Recommendation: Hide button when no pending drafts (cleaner UI)

2. **Exact contrast values for dark mode**
   - What we know: Current values may not meet WCAG 4.5:1
   - What's unclear: Exact OKLCH values needed
   - Recommendation: Use browser dev tools contrast checker, iterate on specific elements

3. **Mobile responsiveness for Dialog**
   - What we know: Dialog should work on mobile but Sheet might be better
   - What's unclear: Whether to use responsive pattern (Dialog on desktop, Sheet on mobile)
   - Recommendation: Start with Dialog only, add responsive variant if feedback warrants

4. **Wizard keyboard navigation**
   - What we know: Arrow keys could navigate wizard
   - What's unclear: Whether this conflicts with existing shortcuts
   - Recommendation: Keep simple (action buttons only), add keyboard nav in future if requested

## Sources

### Primary (HIGH confidence)
- [shadcn/ui Dialog docs](https://ui.shadcn.com/docs/components/dialog) - Dialog API and patterns
- [shadcn/ui Sheet docs](https://ui.shadcn.com/docs/components/sheet) - Sheet vs Dialog comparison
- [Radix Dialog primitives](https://www.radix-ui.com/primitives/docs/components/dialog) - onOpenAutoFocus, focus management
- [Clerk useAuth docs](https://clerk.com/docs/react/reference/hooks/use-auth) - isLoaded property
- Project codebase - Existing components, theme, patterns

### Secondary (MEDIUM confidence)
- [Tailwind dark mode guide](https://tailwindcss.com/docs/dark-mode) - Class-based dark mode
- [WCAG contrast requirements](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html) - 4.5:1 ratio
- [PatternFly wizard guidelines](https://www.patternfly.org/components/wizard/design-guidelines/) - Modal wizard patterns

### Tertiary (LOW confidence)
- Web search results on wizard patterns - General patterns, not library-specific

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All components already in codebase
- Architecture: HIGH - Patterns verified from official documentation
- Pitfalls: MEDIUM - Based on common issues with these components
- Dark mode contrast: MEDIUM - Specific values may need iteration

**Research date:** 2026-02-04
**Valid until:** 60 days (stable components, patterns unlikely to change)
