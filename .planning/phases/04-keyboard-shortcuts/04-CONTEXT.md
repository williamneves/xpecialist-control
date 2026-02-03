# Phase 4: Keyboard Shortcuts - Context

**Gathered:** 2026-02-03
**Status:** Ready for planning

<domain>
## Phase Boundary

Power users can review drafts rapidly using keyboard-only navigation. Covers keybindings for approve, reject, edit, navigation, and a help overlay. No new functionality — this is an efficiency layer over existing actions.

</domain>

<decisions>
## Implementation Decisions

### Keybinding design
- Alt modifier for destructive actions: Alt+a (approve), Alt+r (reject), Alt+e (edit)
- Unmodified j/k for navigation between drafts (vim-style)
- Escape closes dialogs and sheets
- ? opens help overlay
- Alt required to prevent accidental actions

### Activation scope
- Shortcuts active globally except when focus is in text input/textarea
- If no draft selected, j/k do nothing (user must click first)
- Shortcuts work even when detail sheet is open (same context)
- Escape closes any open dialog/sheet

### Feedback & discovery
- Help overlay via ? key — modal dialog with simple flat list of shortcuts
- No extra visual feedback on keypress — the action result is the feedback
- No tooltip hints on buttons — keep UI clean

### Action behavior
- Double-tap pattern for approve: first Alt+a arms (visual ring/highlight), second Alt+a confirms
- Armed state lasts 5 seconds before auto-reset
- Alt+r quick-rejects with default reason ("Rejected via keyboard")
- Alt+e opens reject dialog for custom reason
- Auto-advance to next draft after approve/reject (same as button behavior)
- Alt+e for edit is single-press, no confirmation needed

### Claude's Discretion
- Exact visual style for "armed" state indicator
- Default rejection reason text
- Help modal styling and layout
- How to handle edge case of no more drafts after auto-advance

</decisions>

<specifics>
## Specific Ideas

- Double-tap pattern inspired by safety mechanisms — first press arms, second confirms
- vim-style j/k navigation is familiar to power users
- Keep UI clean: no tooltip hints cluttering buttons

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 04-keyboard-shortcuts*
*Context gathered: 2026-02-03*
