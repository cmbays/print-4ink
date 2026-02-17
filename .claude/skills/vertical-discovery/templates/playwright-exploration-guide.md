# Playwright Exploration Guide

**Vertical**: [VERTICAL NAME]
**Competitor**: [COMPETITOR NAME]
**Entry URL**: [URL]
**Date**: [DATE]

---

## Before You Start

### Using Playwright MCP (Preferred)

If `@playwright/mcp` is configured, you have direct browser tools:

- `browser_navigate` — Go to a URL
- `browser_click` — Click an element (by text, selector, or coordinates)
- `browser_type` — Type text into an input
- `browser_snapshot` — Get structured accessibility snapshot (text content, element tree)
- `browser_take_screenshot` — Capture visual screenshot
- `browser_select_option` — Select from dropdown
- `browser_hover` — Hover over element
- `browser_go_back` / `browser_go_forward` — Navigation
- `browser_wait` — Wait for element or timeout

**Strategy**: Use `browser_snapshot` for structured data extraction. Use `browser_take_screenshot` when you need to analyze visual layout, colors, or spatial relationships.

### Using Manual Playwright Scripts (Fallback)

```bash
mkdir -p /tmp/pw-explorer && cd /tmp/pw-explorer
npm init -y && npm install playwright
```

Then write `.mjs` scripts to navigate and screenshot.

---

## Exploration Checklist

### Pass 1: Happy Path (Simple Flow)

**Goal**: Navigate the simplest complete workflow end-to-end.

- [ ] Load entry URL, wait for page to fully render
- [ ] Screenshot the starting screen
- [ ] Document: What does the user see first? What are the available actions?
- [ ] Complete each step of the workflow:

| Step | URL/Screen | Action Taken | Screenshot | Time | Clicks | Notes |
| ---- | ---------- | ------------ | ---------- | ---- | ------ | ----- |
| 1    |            |              |            |      |        |       |
| 2    |            |              |            |      |        |       |
| 3    |            |              |            |      |        |       |
| 4    |            |              |            |      |        |       |
| 5    |            |              |            |      |        |       |
| 6    |            |              |            |      |        |       |

- [ ] Document the end state: What happens after submission?
- [ ] Total clicks: \_\_\_
- [ ] Estimated time: \_\_\_

### Pass 2: Complex Flow (Multi-Item/Edge Cases)

**Goal**: Test the workflow with multiple items, variations, or complex inputs.

- [ ] Start the same flow but with more items/complexity
- [ ] Note what changes: Does the UI scale well? More steps?
- [ ] Test: Can you go back and edit previous steps?
- [ ] Test: What happens if you skip a step?
- [ ] Test: What happens with invalid input?

| Step | What Changed from Simple | Friction Added | Screenshot |
| ---- | ------------------------ | -------------- | ---------- |
|      |                          |                |            |
|      |                          |                |            |

### Pass 3: Hidden Features & Edge Cases

- [ ] Look for settings, preferences, or configuration screens
- [ ] Check keyboard navigation: Can you Tab through the form?
- [ ] Check mobile/responsive: Resize viewport to 375px width
- [ ] Check empty states: What does the screen look like with no data?
- [ ] Check error states: Submit invalid data
- [ ] Check navigation: What happens if you use browser back/forward?
- [ ] Check session persistence: Navigate away and come back
- [ ] Look for hidden features: right-click menus, keyboard shortcuts, URLs

---

## Data to Capture Per Screen

For each screen/step, record:

1. **URL**: The current URL
2. **Page title/header**: What does the screen call itself?
3. **Primary action**: What is the main thing the user does here?
4. **UI elements**: List all interactive elements (buttons, inputs, dropdowns, etc.)
5. **Data displayed**: What information is shown? Where does it come from?
6. **Navigation**: How does the user get here? Where can they go next?
7. **Friction**: What slows the user down or confuses them?
8. **Screenshot filename**: For reference

---

## Friction Point Template

| #   | Screen/Step | Friction | Severity                 | Impact | Notes |
| --- | ----------- | -------- | ------------------------ | ------ | ----- |
| 1   |             |          | Critical/High/Medium/Low |        |       |
| 2   |             |          |                          |        |       |
| 3   |             |          |                          |        |       |

**Severity Guide**:

- **Critical**: Blocks workflow or causes data loss
- **High**: Adds significant time or causes rework
- **Medium**: Annoying but workable
- **Low**: Minor inconvenience

---

## Technical Observations

- [ ] Framework/library used (check page source, JS bundle names)
- [ ] API calls made (check network tab if using headed mode)
- [ ] Data sources (CDN URLs, API endpoints)
- [ ] Loading behavior (server-rendered vs SPA vs hybrid)
- [ ] State management (URL-based? Session-based? Cookie-based?)
