---
status: complete
phase: 04-react-site
source: 04-01-SUMMARY.md, 04-02-SUMMARY.md, 04-03-SUMMARY.md, 04-04-SUMMARY.md
started: 2026-05-17T00:00:00Z
updated: 2026-05-17T01:00:00Z
---

## Current Test
<!-- OVERWRITE each test - shows where we are -->

[testing complete]

## Tests

### 1. Site starts and loads
expected: Run `cd site && npm run dev` — dev server starts on localhost:5173 (or similar). Open the URL in a browser. The page loads without a blank screen or console errors. A loading skeleton (animated gray cards) appears briefly, then photos load from the fixture.
result: pass

### 2. Hebrew RTL layout
expected: The page title and all text are in Hebrew. Text flows right-to-left — headings align to the right, the layout reads naturally in RTL. The font looks clean (Heebo).
result: pass

### 3. Gallery shows 5 phase sections with correct Hebrew labels
expected: Five gallery sections appear on the page, one per wedding phase. The section headings should be exactly: מתכוננים, מצטלמים, מתחתנים, אוכלים, רוקדים (in that order top to bottom). Each section shows a photo count in parentheses.
result: pass

### 4. Photographer filter chips with Hebrew names
expected: The filter bar (sticky at top) shows photographer chips. The names should include אביר סולטן and מגנטים. A third photographer chip is also present. All chips are unselected by default.
result: pass

### 5. Phase filter chips in order
expected: The filter bar also shows 5 phase chips: מתכוננים, מצטלמים, מתחתנים, אוכלים, רוקדים. Order matches the gallery sections. "הצג הכל" (Clear All) button is NOT visible when no filters are active.
result: pass

### 6. Photographer filter works
expected: Click one photographer chip. The gallery updates to show only photos by that photographer — other photos disappear from their sections, or sections with no matching photos collapse entirely (no empty section headings for empty sections). The chip appears selected/highlighted.
result: pass

### 7. Phase filter works
expected: With no active filters, click one phase chip (e.g., מתחתנים). The gallery updates to show only that phase's section. The other four phase sections are no longer visible.
result: pass

### 8. Clear All resets gallery
expected: With at least one filter active, a "הצג הכל" button appears in the filter bar. Clicking it clears all filters and restores all 5 phase sections with all photos.
result: pass

### 9. Lightbox opens on photo click
expected: Click any photo thumbnail. A full-screen lightbox opens showing that photo at large size. The lightbox has navigation arrows and a close button. Pressing Escape or clicking the close button dismisses it.
result: pass

### 10. Lightbox respects active filters
expected: Apply a photographer filter (e.g., one photographer). Then click a photo. Navigate through the lightbox with the arrows — only photos matching the active filter appear in the navigation sequence. Photos from the filtered-out photographer are not reachable via lightbox arrows.
result: pass

### 11. Face filter absent
expected: The filter bar does NOT show any face filter option (since people[] is empty in the fixture). There are only the photographer chips, phase chips, and Clear All button — no faces section.
result: pass

## Summary

total: 11
passed: 11
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps

[none yet]
