# Phase 4: Keyboard Shortcuts - Research

**Researched:** 2026-02-03
**Domain:** React keyboard event handling, hotkey libraries
**Confidence:** HIGH

## Summary

This phase adds keyboard shortcuts as a power-user efficiency layer over existing draft review actions. The research focused on: (1) the standard library for keyboard shortcuts in React, (2) patterns for modifier key handling and input field exclusion, (3) implementing the double-tap confirmation pattern, and (4) help modal overlays.

The ecosystem has converged on `react-hotkeys-hook` as the standard solution for React keyboard shortcuts. Version 5.2.4 provides a declarative `useHotkeys` hook with built-in support for modifier keys (`alt+a`), form field exclusion, and dynamic enabling/disabling. The library handles cross-browser key code normalization and supports the exact patterns specified in CONTEXT.md.

The double-tap "armed state" confirmation pattern is a custom implementation — no library provides this out of the box. It involves tracking state with a timeout, which is straightforward to implement with React's useState and useEffect.

**Primary recommendation:** Use `react-hotkeys-hook` v5 for all keybinding logic. Implement the double-tap armed state pattern as a custom hook wrapping the approve action.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-hotkeys-hook | 5.2.4 | Declarative keyboard shortcuts | 3.4k stars, 40.7k dependents, actively maintained, handles modifier keys and form field exclusion |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| radix-ui (Dialog) | 1.4.3 | Help overlay modal | Already in codebase, handles accessibility and Escape key |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| react-hotkeys-hook | Native useEffect + keydown listener | More boilerplate, no modifier key parsing, must handle form field exclusion manually |
| react-hotkeys-hook | react-use-hotkeys | Smaller but less features, fewer users |
| react-hotkeys-hook | @blueprintjs/core useHotkeys | Requires memoization, more complex API |

**Installation:**
```bash
npm install react-hotkeys-hook
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── hooks/
│   └── useKeyboardShortcuts.ts    # Central hook managing all shortcuts
├── components/
│   └── KeyboardHelpDialog.tsx     # ? key help overlay
```

### Pattern 1: Central Keyboard Controller Hook
**What:** Single custom hook that registers all keyboard shortcuts and coordinates with application state
**When to use:** When shortcuts need access to shared state (selectedDraft, sheetOpen, etc.)
**Example:**
```typescript
// Source: https://react-hotkeys-hook.vercel.app/docs/api/use-hotkeys
import { useHotkeys } from 'react-hotkeys-hook'

function useKeyboardShortcuts({
  selectedDraft,
  onApprove,
  onReject,
  onEdit,
  onNavigateNext,
  onNavigatePrev,
  onOpenHelp,
}) {
  // Alt+a for approve (double-tap pattern handled separately)
  useHotkeys('alt+a', handleApprove, {
    enabled: !!selectedDraft && selectedDraft.status === 'pending',
  })

  // j/k for navigation - no modifier needed
  useHotkeys('j', onNavigateNext, { enabled: !!selectedDraft })
  useHotkeys('k', onNavigatePrev, { enabled: !!selectedDraft })

  // ? for help overlay
  useHotkeys('shift+/', onOpenHelp) // ? is shift+/ on most keyboards
}
```

### Pattern 2: Armed State for Double-Tap Confirmation
**What:** First keypress enters "armed" state with visual indicator, second keypress within timeout confirms
**When to use:** Destructive or irreversible actions (approve in this case)
**Example:**
```typescript
function useArmedAction(action: () => void, timeout = 5000) {
  const [isArmed, setIsArmed] = useState(false)
  const timerRef = useRef<number | null>(null)

  const arm = useCallback(() => {
    if (isArmed) {
      // Second press - execute action
      if (timerRef.current) clearTimeout(timerRef.current)
      setIsArmed(false)
      action()
    } else {
      // First press - arm
      setIsArmed(true)
      timerRef.current = window.setTimeout(() => {
        setIsArmed(false)
      }, timeout)
    }
  }, [isArmed, action, timeout])

  const disarm = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setIsArmed(false)
  }, [])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  return { isArmed, arm, disarm }
}
```

### Pattern 3: Form Field Exclusion (Default Behavior)
**What:** Shortcuts are disabled when user is typing in input/textarea
**When to use:** Always for navigation and action shortcuts
**Example:**
```typescript
// react-hotkeys-hook excludes form fields by default
// This is the default behavior - no special config needed
useHotkeys('j', navigateNext) // Won't fire when typing in textarea

// To explicitly enable on form tags (NOT recommended for our use case):
// useHotkeys('meta+s', save, { enableOnFormTags: ['input', 'textarea'] })
```

### Anti-Patterns to Avoid
- **Global event listeners without cleanup:** Use useHotkeys which handles cleanup automatically
- **Checking e.target.tagName manually:** Library handles form field exclusion
- **Hardcoding key codes:** Use key names ('alt+a'), library normalizes across browsers
- **Multiple scattered useHotkeys calls:** Centralize in one hook for maintainability

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Keyboard shortcut detection | addEventListener with manual key parsing | react-hotkeys-hook | Modifier key normalization, cross-browser support, form field exclusion |
| Modal dialog | Custom div with z-index | Radix Dialog (already in codebase) | Focus trap, Escape handling, accessibility |
| Key combination parsing | Manual e.altKey && e.key === 'a' | useHotkeys('alt+a', cb) | Case insensitivity, cross-platform support |

**Key insight:** Browser keyboard events vary across platforms and layouts. `react-hotkeys-hook` v5 listens to key codes (not produced keys) to handle different keyboard layouts consistently.

## Common Pitfalls

### Pitfall 1: Shortcuts firing while typing
**What goes wrong:** User types 'j' in rejection reason textarea, navigates to next draft
**Why it happens:** Not excluding form fields from shortcut scope
**How to avoid:** react-hotkeys-hook excludes form fields by default; don't set `enableOnFormTags: true`
**Warning signs:** Accidental navigation during text input

### Pitfall 2: Escape closing wrong thing
**What goes wrong:** Pressing Escape closes the sheet when user intended to cancel reject form
**Why it happens:** Multiple components listening for Escape
**How to avoid:** Let Radix Sheet/Dialog handle their own Escape; only add custom Escape handling for custom UI states (like armed state reset)
**Warning signs:** Nested dialogs/sheets behaving unexpectedly

### Pitfall 3: Armed state not reset on draft change
**What goes wrong:** User arms approve on Draft A, navigates to Draft B, second Alt+a approves wrong draft
**Why it happens:** Armed state persists across draft selection changes
**How to avoid:** Reset armed state when selectedDraft changes (useEffect dependency)
**Warning signs:** Approving wrong draft after navigation

### Pitfall 4: Stale closure in hotkey callback
**What goes wrong:** Callback references old state value
**Why it happens:** Missing dependencies in useHotkeys
**How to avoid:** Pass dependencies array to useHotkeys: `useHotkeys('j', navigate, [currentIndex])`
**Warning signs:** Actions using outdated state

### Pitfall 5: Hotkey conflicts with browser/OS
**What goes wrong:** Shortcut doesn't work or triggers browser action
**Why it happens:** Some key combinations are reserved by browser/OS
**How to avoid:** Alt modifier is safe; avoid meta+w, meta+n, meta+t (browser reserved)
**Warning signs:** Check in multiple browsers if shortcut seems ignored

## Code Examples

Verified patterns from official sources:

### Basic Hotkey with Modifier
```typescript
// Source: https://react-hotkeys-hook.vercel.app/docs/api/use-hotkeys
import { useHotkeys } from 'react-hotkeys-hook'

function Component() {
  useHotkeys('alt+a', () => {
    console.log('Alt+A pressed')
  })
}
```

### Conditional Enabling
```typescript
// Source: https://react-hotkeys-hook.vercel.app/docs/documentation/useHotkeys/disable-hotkeys
useHotkeys('alt+a', handleApprove, {
  enabled: !!selectedDraft && selectedDraft.status === 'pending',
})
```

### Help Modal Trigger (? Key)
```typescript
// Source: https://github.com/JohannesKlauss/react-hotkeys-hook
// Note: ? is shift+/ on US keyboard
useHotkeys('shift+/', () => setHelpOpen(true))
// OR use ignoreModifiers for the literal character
useHotkeys('?', () => setHelpOpen(true), { ignoreModifiers: true })
```

### Armed State Visual Indicator (Tailwind)
```typescript
// Source: https://tailwindcss.com/docs/ring-width
// Armed state adds ring indicator
<div className={cn(
  'rounded-lg p-4',
  isArmed && 'ring-2 ring-offset-2 ring-[#1DA1F2] animate-pulse'
)}>
  {/* Draft content */}
</div>
```

### Full Hook Implementation Skeleton
```typescript
// Central keyboard shortcuts hook
import { useHotkeys } from 'react-hotkeys-hook'
import { useCallback, useEffect, useState, useRef } from 'react'

interface UseKeyboardShortcutsProps {
  selectedDraft: Draft | null
  onApprove: () => void
  onReject: () => void
  onEdit: () => void
  onNavigateNext: () => void
  onNavigatePrev: () => void
}

export function useKeyboardShortcuts({
  selectedDraft,
  onApprove,
  onReject,
  onEdit,
  onNavigateNext,
  onNavigatePrev,
}: UseKeyboardShortcutsProps) {
  const [helpOpen, setHelpOpen] = useState(false)
  const [isArmed, setIsArmed] = useState(false)
  const armedTimerRef = useRef<number | null>(null)

  // Reset armed state when draft changes
  useEffect(() => {
    setIsArmed(false)
    if (armedTimerRef.current) {
      clearTimeout(armedTimerRef.current)
    }
  }, [selectedDraft?._id])

  // Double-tap approve
  const handleAltA = useCallback(() => {
    if (isArmed) {
      if (armedTimerRef.current) clearTimeout(armedTimerRef.current)
      setIsArmed(false)
      onApprove()
    } else {
      setIsArmed(true)
      armedTimerRef.current = window.setTimeout(() => {
        setIsArmed(false)
      }, 5000)
    }
  }, [isArmed, onApprove])

  const canAct = !!selectedDraft && selectedDraft.status === 'pending'

  useHotkeys('alt+a', handleAltA, { enabled: canAct }, [handleAltA])
  useHotkeys('alt+r', onReject, { enabled: canAct })
  useHotkeys('alt+e', onEdit, { enabled: canAct })
  useHotkeys('j', onNavigateNext, { enabled: !!selectedDraft })
  useHotkeys('k', onNavigatePrev, { enabled: !!selectedDraft })
  useHotkeys('shift+/', () => setHelpOpen(true))
  // Escape handled by Radix Sheet/Dialog

  return { helpOpen, setHelpOpen, isArmed }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| mousetrap library | react-hotkeys-hook | ~2020 | React-native hooks, better TypeScript support |
| Manual keyCode numbers | Key name strings | ES2020+ | No magic numbers, readable code |
| useEffect + addEventListener | useHotkeys hook | react-hotkeys-hook v4+ | Less boilerplate, automatic cleanup |
| enableOnTags option | enableOnFormTags option | v5.0 | Clearer naming, ARIA role support |

**Deprecated/outdated:**
- `keyCode` property: Use `key` property instead (keyCode is deprecated)
- `mousetrap` library: Not React-native, react-hotkeys-hook is the modern choice

## Open Questions

Things that couldn't be fully resolved:

1. **? key detection across keyboard layouts**
   - What we know: On US keyboard, ? is shift+/
   - What's unclear: Behavior on international keyboards
   - Recommendation: Use `ignoreModifiers: true` with literal '?' character, test on target keyboards

2. **Armed state visual - exact styling**
   - What we know: User wants ring/highlight, Tailwind has ring utilities
   - What's unclear: Exact color, animation preference
   - Recommendation: Use project's primary color (#1DA1F2) with subtle pulse animation, iterate based on user feedback

3. **Edge case: no more drafts after auto-advance**
   - What we know: Sheet should close, possibly show toast
   - What's unclear: Exact UX when queue is empty
   - Recommendation: Close sheet, show success toast "All drafts reviewed!" (matches existing pattern in index.tsx)

## Sources

### Primary (HIGH confidence)
- [react-hotkeys-hook GitHub](https://github.com/JohannesKlauss/react-hotkeys-hook) - API, version 5.2.4, installation
- [react-hotkeys-hook Docs - useHotkeys API](https://react-hotkeys-hook.vercel.app/docs/api/use-hotkeys) - Options, enableOnFormTags, scopes
- [react-hotkeys-hook Docs - Disable Hotkeys](https://react-hotkeys-hook.vercel.app/docs/documentation/useHotkeys/disable-hotkeys) - enabled option, form field behavior
- [Tailwind CSS Ring Width](https://tailwindcss.com/docs/ring-width) - Visual indicators for armed state

### Secondary (MEDIUM confidence)
- [Headless UI Dialog](https://headlessui.com/react/dialog) - Modal patterns (Radix Dialog in codebase is similar)

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - react-hotkeys-hook is clearly the ecosystem standard with 3.4k stars and 40.7k dependents
- Architecture: HIGH - Patterns verified from official documentation
- Pitfalls: HIGH - Based on documented behaviors and library defaults

**Research date:** 2026-02-03
**Valid until:** 60 days (stable library, infrequent major changes)
