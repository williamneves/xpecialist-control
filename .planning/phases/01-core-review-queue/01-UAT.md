---
status: complete
phase: 01-core-review-queue
source: [01-01-SUMMARY.md, 01-02-SUMMARY.md, 01-03-SUMMARY.md, 01-04-SUMMARY.md, 01-05-SUMMARY.md]
started: 2026-02-03T09:15:00Z
updated: 2026-02-03T09:20:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Auth Protection - Dashboard
expected: Navigate to http://localhost:3000 while logged out. You should see a centered sign-in prompt with Clerk modal (not the dashboard content). After signing in, you should see the dashboard with pending drafts.
result: pass

### 2. Rejection Reason Required
expected: Open a pending draft, click "Rejeitar", try to confirm with less than 10 characters. You should see an error message and the submit button should be disabled until you enter 10+ characters.
result: pass

### 3. Hold-to-Approve Gesture
expected: Open a pending draft, hold the "Segurar para Aprovar" button for ~500ms. You should see a progress bar filling from left to right, and the draft gets approved when you complete the hold.
result: pass

### 4. Status Tabs - Filtering
expected: Dashboard shows 5 tabs: Pendentes, Aprovados, Rejeitados, Agendados, Publicados. Clicking each tab should filter drafts to show only that status. Each tab should have an icon.
result: pass

### 5. Rejected Draft Info
expected: Go to "Rejeitados" tab. Hover over a rejected draft's info column. You should see a tooltip showing the rejection reason.
result: pass

### 6. Auto-Advance After Action
expected: On Pendentes tab, open a draft and approve it. Instead of the sheet closing, it should automatically open the next pending draft. If it's the last pending, you should see a success toast.
result: pass

### 7. Thread Grouping Display
expected: On Pendentes tab, if there are thread drafts (multiple tweets with same threadId), they should appear as collapsible groups showing tweet count. Clicking expands to show all tweets in the thread.
result: pass

### 8. Thread Bulk Approve
expected: Expand a thread group, click and hold the bulk approve button. All drafts in the thread should be approved together.
result: pass

### 9. Thread Bulk Reject
expected: Expand a thread group, click the reject button, enter a reason (10+ chars), confirm. All drafts in the thread should be rejected with that reason.
result: pass

### 10. Single Draft Cards
expected: On Pendentes tab, single drafts (not threads) should appear as clickable cards. Clicking opens the detail sheet.
result: pass

### 11. Non-Pending Table View
expected: On Aprovados/Rejeitados/Agendados/Publicados tabs, drafts should display in table format (not cards) with columns for content preview and relevant info.
result: pass

## Summary

total: 11
passed: 11
issues: 0
pending: 0
skipped: 0

## Gaps

[none]
