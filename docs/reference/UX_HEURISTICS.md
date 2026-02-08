# UX Heuristics for Playground Tools

**Created**: 2026-02-05
**Purpose**: Lightweight quality checklist for playground UX audits
**Scope**: All 6 interactive playgrounds + future tools

## Overview

This is a **10-point heuristic checklist** for evaluating playground UX quality. Use this before releasing new playgrounds or major updates.

**Philosophy**: Lightweight, actionable, focused on user trust and efficiency.

**How to Use**:
1. Open playground to audit
2. Complete each heuristic check (Yes/No/Partial)
3. Document failures with severity (Critical/High/Medium/Low)
4. Fix Critical and High issues before release

---

## The 10 UX Heuristics

### 1. Can the user accomplish the primary task in ≤3 clicks?

**What to Check**:
- Identify the playground's primary task (see UX_TASK_FLOWS.md)
- Count clicks from open → task completion
- Clicks include: button press, dropdown select, modal interaction

**Examples**:
- ✅ **Workflow Hub Resume**: Open → Click [Resume Work] → Ready (2 clicks)
- ❌ **Workflow Hub Resume (current)**: Open → Load State modal → Select file → Confirm → Parse → Close modal → Scan dashboard → Find action (7+ clicks)

**Pass Criteria**: Primary task ≤3 clicks, no modals for common actions

**Severity if Failed**: High (directly impacts "zero friction" goal)

---

### 2. Is the current state always visible?

**What to Check**:
- User should know "where am I?" without clicking
- Current phase, track, session status shown prominently
- Timestamps for data freshness ("Last updated: 5s ago")

**Examples**:
- ✅ **Worktree Coordinator**: Shows branch name, ahead/behind, CI status at top
- ❌ **Workflow Hub (current)**: State buried in widgets, unclear what's active

**Pass Criteria**: Hero section shows context + freshness indicator

**Severity if Failed**: Critical (user can't trust data)

---

### 3. Can the user undo/recover from mistakes?

**What to Check**:
- Destructive actions have confirmation ("Are you sure?")
- Non-destructive actions are reversible (close modal, clear filter)
- User can always return to previous state

**Examples**:
- ✅ **Mermaid Designer**: Template selection doesn't clear unsaved work (localStorage backup)
- ⚠️ **Workflow Hub**: Closing modal loses selected state (should cache)

**Pass Criteria**: No data loss on accidental clicks, confirmations for destructive actions

**Severity if Failed**: Medium (frustration, not blocking)

---

### 4. Are keyboard shortcuts discoverable?

**What to Check**:
- ? key shows help modal with shortcuts
- Common shortcuts labeled on buttons (e.g., "Refresh (R)")
- Shortcuts work consistently across playgrounds

**Examples**:
- ✅ **Worktree Coordinator**: ? shows help, R refreshes, Esc closes modals
- ❌ **Workflow Hub**: No help modal, shortcuts undiscoverable

**Pass Criteria**: ? key help modal, primary shortcuts labeled

**Severity if Failed**: Low (power users only)

---

### 5. Does progressive disclosure work (simple → advanced)?

**What to Check**:
- Default view shows summary (3-5 lines max)
- [Show Details] / [Expand] reveals complexity
- Advanced features hidden until needed

**Examples**:
- ✅ **Mermaid Designer**: Start with template picker, advanced options in settings
- ❌ **Workflow Hub**: All widgets shown at once (no summary mode)

**Pass Criteria**: Summary view on load, expand controls for details

**Severity if Failed**: High (contributes to "too much information" problem)

---

### 6. Are empty states helpful (not just blank)?

**What to Check**:
- Empty state shows why it's empty + how to populate
- Includes illustration or icon (optional but helpful)
- Primary action button to get started

**Examples**:
- ✅ **Agent Visualizer**: "No state loaded. Drag file here or select from dropdown."
- ⚠️ **Workflow Hub (if no tracks)**: Should show "No active work. [Start New Task]"

**Pass Criteria**: Helpful message + action button

**Severity if Failed**: Medium (confusing for new users)

---

### 7. Are loading states informative?

**What to Check**:
- User knows something is happening (spinner, progress bar)
- Estimated time shown if >3 seconds
- Partial data shown while loading (optimistic UI)

**Examples**:
- ✅ **Worktree Coordinator**: "Refreshing worktrees..." spinner during git operations
- ❌ **Workflow Hub PM Session**: Silent failure, no indication of why it didn't load

**Pass Criteria**: Spinner + status message, no silent failures

**Severity if Failed**: High (user thinks playground is broken)

---

### 8. Do error messages explain how to fix?

**What to Check**:
- Error message states what went wrong
- Includes fix instructions ("Run: npm start")
- Offers fallback ("View cached data instead?")

**Examples**:
- ✅ **Worktree Coordinator**: "Git command failed. Ensure you're in a git repository."
- ❌ **Workflow Hub PM Session**: "Cannot connect to backlog.md" (no fix instructions)

**Pass Criteria**: Error + fix instructions + fallback option

**Severity if Failed**: Critical (user stuck with no recovery path)

---

### 9. Is help accessible without leaving context?

**What to Check**:
- ? key or [Help] button opens in-context modal
- Help content specific to current view
- Links to full docs if needed

**Examples**:
- ✅ **Worktree Coordinator**: ? shows shortcuts + workflow tips
- ❌ **Most playgrounds**: No help system, user must check PLAYGROUND-TOOLS.md externally

**Pass Criteria**: ? key help modal with context-specific tips

**Severity if Failed**: Low (documentation gap, not blocking)

---

### 10. Does the tool remember user preferences?

**What to Check**:
- Last selected file/state cached (localStorage)
- UI preferences saved (theme, collapsed sections)
- Restored on next visit

**Examples**:
- ✅ **Mermaid Designer**: Restores last diagram from localStorage
- ⚠️ **Workflow Hub**: Should remember last track, auto-load on open

**Pass Criteria**: Key preferences cached, restored on load

**Severity if Failed**: Medium (quality of life, not critical)

---

## Heuristic Scorecard Template

Use this table to audit each playground:

| Heuristic | Pass? | Severity | Notes |
|-----------|-------|----------|-------|
| 1. ≤3 clicks to primary task | | | |
| 2. Current state visible | | | |
| 3. Undo/recovery | | | |
| 4. Shortcuts discoverable | | | |
| 5. Progressive disclosure | | | |
| 6. Helpful empty states | | | |
| 7. Informative loading | | | |
| 8. Fix-oriented errors | | | |
| 9. In-context help | | | |
| 10. Remember preferences | | | |

**Scoring**:
- ✅ Pass = 1 point
- ⚠️ Partial = 0.5 points
- ❌ Fail = 0 points

**Quality Thresholds**:
- **9-10 points**: Excellent UX, ready to ship
- **7-8 points**: Good UX, minor polish needed
- **5-6 points**: Acceptable UX, notable gaps
- **<5 points**: Poor UX, major rework needed

---

## Workflow Hub Audit Example (Current State)

| Heuristic | Pass? | Severity | Notes |
|-----------|-------|----------|-------|
| 1. ≤3 clicks to primary task | ❌ | High | 7+ clicks to resume work (modals, file selection) |
| 2. Current state visible | ❌ | Critical | State buried in widgets, unclear active track |
| 3. Undo/recovery | ⚠️ | Medium | Modals close without saving selected state |
| 4. Shortcuts discoverable | ❌ | Low | No ? help, shortcuts unlabeled |
| 5. Progressive disclosure | ❌ | High | All widgets shown at once, overwhelming |
| 6. Helpful empty states | ❌ | Medium | Unknown (not tested without active work) |
| 7. Informative loading | ❌ | High | PM session fails silently, no spinner |
| 8. Fix-oriented errors | ❌ | Critical | "Cannot connect" with no fix instructions |
| 9. In-context help | ❌ | Low | No help modal |
| 10. Remember preferences | ❌ | Medium | State Inspector requires manual load every time |

**Score**: 0.5 / 10 (5%)
**Assessment**: Poor UX, major rework needed

**Priority Fixes** (Critical + High):
1. Show current state in hero section (Heuristic 2)
2. Add fix instructions to error messages (Heuristic 8)
3. Implement progressive disclosure (Heuristic 5)
4. Fix silent PM session failure (Heuristic 7)
5. Reduce clicks to primary task (Heuristic 1)

---

## Worktree Coordinator Audit Example (Current State)

| Heuristic | Pass? | Severity | Notes |
|-----------|-------|----------|-------|
| 1. ≤3 clicks to primary task | ✅ | - | Open → Scan status → Done (1-2 clicks) |
| 2. Current state visible | ✅ | - | Branch, ahead/behind, CI status prominent |
| 3. Undo/recovery | ✅ | - | Read-only dashboard, no destructive actions |
| 4. Shortcuts discoverable | ✅ | - | ? help modal, R refresh labeled |
| 5. Progressive disclosure | ⚠️ | Medium | Could hide detailed git info in accordion |
| 6. Helpful empty states | ⚠️ | Medium | Shows "No worktrees" but no next action |
| 7. Informative loading | ✅ | - | "Refreshing..." spinner during git commands |
| 8. Fix-oriented errors | ⚠️ | Medium | Git errors shown but fix instructions minimal |
| 9. In-context help | ✅ | - | ? modal with shortcuts + workflow tips |
| 10. Remember preferences | ✅ | - | Last refresh time cached |

**Score**: 8 / 10 (80%)
**Assessment**: Good UX, minor polish needed

**Priority Fixes** (Medium):
1. Add [Create Worktree] button to empty state (Heuristic 6)
2. Expand git error messages with fix instructions (Heuristic 8)
3. Optional: Collapse detailed git info (Heuristic 5)

---

## Integration with Development Workflow

### When to Run Heuristic Audit

**Required**:
- Before releasing new playground
- Before merging major UI changes
- As part of VERIFY phase (standard workflow)

**Recommended**:
- After user feedback session
- During UX-focused sprints (e.g., v0.11)

### Who Runs Audit

**Primary**: Designer or UX-focused agent (design-reviewer persona)
**Fallback**: Developer self-audit before code review

### Output Format

Create audit document in:
```
temp/AGENT_REPORTS/[feature]/UX_AUDIT.md
```

Include:
- Scorecard table (10 heuristics)
- Total score + assessment
- Priority fix list (Critical/High issues)
- Recommendations for future enhancements

---

## Relationship to Design Audit

**Design Audit** (15-point checklist in DESIGN_AUDIT.md):
- Focus: Visual design (color, typography, spacing, accessibility)
- Layer: UI (presentation)

**UX Heuristics** (10-point checklist, this document):
- Focus: User workflows and task efficiency
- Layer: UX (interaction)

**Both Required** for complete quality check:
1. Design Audit ensures visual polish
2. UX Heuristics ensure functional usability

---

## Heuristic Evolution

This is v1.0 of the heuristics. **Update this document** when:
- New patterns emerge across playgrounds
- User research reveals new pain points
- Playgrounds expand beyond dashboard tools

**Change Log**:
- 2026-02-05: v1.0 created (10 heuristics)

---

**Document Status**: v1.0 Complete
**Owner**: UX Research Track
**Next Review**: After P0 fixes implemented (Q1 2026)
