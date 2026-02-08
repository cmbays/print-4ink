# UX User Research - Playground Tools

**Conducted**: 2026-02-05
**Participant**: Chris (Primary User)
**Interviewer**: Claude (Supervisor)
**Context**: Following Phase 2.5 Design System completion, assessing UX gaps

## Executive Summary

The playgrounds have a **mature UI design** (Phase 2.5 complete) but **critical UX failures** in data freshness, workflow guidance, and state management. The core problem is not visual design - it's **stale data and lack of live updates**.

**Key Finding**: "Workflow Hub would be good IF everything worked, stayed lively, and Claude properly updated state"

---

## Usage Patterns

### Playground Usage Frequency

| Playground | Usage | Notes |
|------------|-------|-------|
| **Workflow Hub** | Most used | Current primary tool despite UX confusion |
| **Worktree Coordinator** | Periodic | Worked well when managing multiple workstreams |
| **Learning Playground** | Never used | Not needed yet / unaware of value |
| **Mermaid Designer** | Not discussed | |
| **Agent Visualizer** | Not discussed | |
| **Workflow Chronicle** | Not discussed | |

**Session Frequency**: Periodic (check back a few times during work session)

### Primary Use Cases

**Workflow Hub**:
- **Intent**: Check status → Quick orientation
- **Success Metric**: "See project state in 5 seconds"
- **Current Reality**: Confusing, overwhelming, unclear actions, stale data

**Worktree Coordinator**:
- **Success Factors** (when it worked):
  - Live updates (R key refresh)
  - Clear visual status
  - Simple layout

---

## Critical Pain Points

### 1. Data Freshness (CRITICAL)

**Problem**: Static data that doesn't reflect reality

**Specific Failures**:
- **PM Session loading**: "Cannot connect to backlog.md, requires connecting server"
- **Workflow session stale**: Shows outdated activity
- **State Inspector manual load**: Requires clicking "Load State" instead of auto-polling
- **No live updates**: User must manually refresh to see changes

**Impact**: User cannot trust the dashboard, defeats entire purpose

### 2. Git Worktree Detection (CRITICAL)

**Problem**: Claude forgets to create worktree branches, dashboard doesn't reflect multiple active sessions

**Specific Failures**:
- Dashboard shows single session when user has multiple worktrees active
- Git state doesn't match displayed state
- Merged/deleted branches shown as active

**Impact**: Dashboard actively misleads user about parallel development state

### 3. Information Overload (HIGH)

**Problem**: "Too much information, unclear actions, no clear user journey or connection between widgets"

**What User Needs to Know Immediately** (Priority Order):
1. **What's blocked** - Blockers preventing progress
2. **Recent activity** - What happened since last check (past day, reverse chronological)
3. **What's in progress** - Active tasks, current phase

**What's Currently Shown**: Everything at once, no hierarchy

### 4. Lack of Workflow Guidance (HIGH)

**Problem**: Dashboard is passive, doesn't guide user to next action

**Current State**:
- User checks Workflow Hub for status
- User goes to **GitHub issues** to decide what to work on next
- Dashboard doesn't help with task selection

**Desired State**:
- Dashboard suggests: "Resume Wave 3 P1?" or "Start new work?"
- Single primary action button visible on load
- Proactive nudges: "This is blocked", "You should merge this"

### 5. Widget Disconnection (MEDIUM)

**Problem**: Widgets feel like independent islands, no flow

**What's Missing**:
- **Progressive disclosure**: Start simple, expand details on demand
- **Context bridges**: Clicking worktree should highlight related tasks
- **Single primary action**: One obvious "Resume work" or "Start new task" button

**User's Mental Model**: Flow from "What's happening?" → "What should I do?" → "Take action"

---

## Success Criteria (User-Defined)

### "Love Factor" Requirements

**All four must be true for user to LOVE (not just tolerate) playgrounds:**

1. **Always correct** - 100% trust in data, never stale
2. **Save time** - Faster than GitHub/CLI/manual checks
3. **Guided workflow** - Proactive suggestions and next actions
4. **Zero friction** - Open → action → close in <10 seconds

### Ideal Workflow Hub Experience

**On open, user should immediately see:**
1. **Instant clarity** (5-second scan) - What's blocked, in progress, next action
2. **Live dashboard** - Auto-refresh or "Last updated: 2s ago" indicator
3. **Guided workflow** - "Resume Wave 3 P1?" or "3 tasks ready to claim"
4. **Simple controls** - Refresh/load/switch with 1 click, no modal hell

---

## Task Flow Analysis

### Current: Workflow Hub Task Selection

```
User opens Workflow Hub
  ↓
Sees overwhelming dashboard (unclear priority)
  ↓
Closes Workflow Hub
  ↓
Opens GitHub Issues to find next task
```

**Problem**: Dashboard doesn't help with primary use case (task selection)

### Desired: Workflow Hub Task Selection

```
User opens Workflow Hub
  ↓
Sees: "Wave 3 P1 - Day 5 (VERIFY phase)" + "3 tasks ready" + [Resume] button
  ↓
Clicks [Resume] → State loaded, ready to work
  ↓
Optional: Expand details (blockers, recent commits, worktree status)
```

**Benefit**: 5-second orientation + immediate action

---

## Root Cause Analysis

### UI vs UX Gap

| Layer | Status | Assessment |
|-------|--------|------------|
| **Visual Design (UI)** | ✅ Mature | Phase 2.5 complete, tokens, accessibility, polish |
| **Data Layer** | ❌ Broken | Stale, not live, manual refresh required |
| **Workflow Logic** | ❌ Missing | No guidance, no primary actions, no flow |
| **State Management** | ❌ Unreliable | Claude doesn't consistently update WORKFLOW_STATE.md |

**Conclusion**: The problem is NOT visual design. The problem is:
1. **Data staleness** (technical: no polling, no auto-refresh)
2. **Claude discipline** (process: forgetting to update state files)
3. **Workflow guidance** (UX: no progressive disclosure or primary actions)

---

## Priority Fixes (by Impact)

### P0: Data Freshness (Blocking "Love Factor")

**Without this, nothing else matters.**

1. **Auto-refresh for Workflow Hub**
   - Poll WORKFLOW_STATE.md every 5-10 seconds
   - Show "Last updated: Xs ago" indicator
   - Visual pulse when data changes

2. **Fix PM Session loading**
   - Investigate "cannot connect to backlog.md" error
   - Graceful degradation if server unavailable
   - Clear error messages with fix instructions

3. **Auto-load State Inspector**
   - Load state on page open (no manual click)
   - Optional: Stream updates via WebSocket
   - Cache for instant display

### P1: Workflow Guidance (Unlocks Task Selection)

1. **Primary action button**
   - Prominent [Resume Work] or [Start New Task] on load
   - Context-aware label based on WORKFLOW_STATE.md
   - Single click → ready to work

2. **Progressive disclosure**
   - Start with: Current track, phase, next action (3 lines max)
   - Expand: Blockers, recent activity, worktree details (on demand)
   - Visual hierarchy: Big → Medium → Small (importance)

3. **Proactive suggestions**
   - "WAVE3-020 ready to merge" (based on git status)
   - "WAVE3-015 blocked by #234" (based on dependencies)
   - "2 worktrees need rebasing" (based on git ahead/behind)

### P2: Git Worktree Detection (Parallel Work)

1. **Reliable worktree scanning**
   - `git worktree list` on every refresh
   - Detect multiple Claude sessions via `git branch` + process analysis
   - Show all active worktrees with branch, status, last commit

2. **Claude process discipline**
   - Enforce worktree creation via git-master
   - Validate branch exists before displaying
   - Auto-cleanup merged/deleted branches

### P3: Widget Context Bridges (Nice-to-Have)

1. **Clickable relationships**
   - Click worktree → highlight related tasks
   - Click task → highlight related worktree + git state
   - Visual connections (arrows, color coding)

2. **Unified state model**
   - Single source of truth (WORKFLOW_STATE.md + git state)
   - All widgets read from same data
   - Mutations trigger re-render across all widgets

---

## Recommended UX Methodology

### Lightweight UX Standards (Not Heavy Framework)

**Adopt**: 10 UX Heuristics for Playgrounds (see UX_HEURISTICS.md)

**Skip**:
- Formal UX tooling (Figma prototyping, Storybook)
- Extensive persona research (user = Chris)
- A/B testing (not enough users)

### Three Deliverables

1. **UX_USER_RESEARCH.md** (this document) ✅
2. **UX_TASK_FLOWS.md** - Document ideal flows for all 6 playgrounds
3. **UX_HEURISTICS.md** - 10-point checklist for playground quality

---

## Next Steps

### Immediate (Before New Features)

1. **Fix data freshness** (P0)
   - Auto-refresh Workflow Hub
   - Fix PM Session loading
   - Auto-load State Inspector

2. **Add primary action button** (P1)
   - [Resume Work] / [Start New Task]
   - Context-aware label
   - Single click to action

3. **Document ideal task flows** (P1)
   - Create UX_TASK_FLOWS.md
   - Map: Entry → Steps → Exit for all 6 playgrounds

### Future Enhancements

4. **Progressive disclosure UI** (P1)
5. **Proactive suggestions** (P1)
6. **Worktree detection fixes** (P2)
7. **Widget context bridges** (P3)

---

## Appendix: Interview Transcript

### Question 1: Usage Frequency
- **Most used**: Workflow Hub (confusing UX), Worktree Monitor (worked decently with multiple workstreams)
- **Frequency**: Periodically during work session

### Question 2: Workflow Hub Intent
- **First action**: Check status
- **Confusion factors**: Too much info, unclear actions, stale data, **no clear user journey between widgets**
- **Success case**: Quick orientation (5-second state visibility)

### Question 3: Priority Information
- **Top 3 needs**: Blocked items, Recent activity (past day, reverse chronological), What's in progress

### Question 4: Task Selection
- **Current method**: Check GitHub issues (NOT Workflow Hub)

### Question 5: Recent Activity Window
- **Ideal**: Major bodies of work from past day, reverse chronological priority

### Question 6: Staleness Issues
- **Specific failures**:
  - Static data (manual refresh required)
  - PM session: "cannot connect to backlog.md"
  - Workflow session often stale
  - State Inspector requires manual load (no polling/pushing)
  - Claude forgets to create worktree branches → dashboard doesn't show multiple sessions
  - Git state mismatch (merged branches shown as active)

### Question 7: Worktree Success Factors
- **What worked**: Live updates (R key), clear visual status, simple layout

### Question 8: Priority Playground
- **Answer**: "Different tools for different tasks. Worktree monitor good for multiple workstreams. Workflow Hub would be good IF everything worked, stayed lively, and Claude properly updated state."

### Question 9: Ideal Workflow Hub
- **All selected**: Live dashboard, guided workflow, instant clarity, simple controls

### Question 10: Widget Connection Missing
- **Needed**: Progressive disclosure, context bridges, single primary action

### Question 11: Learning Playground
- **Answer**: Haven't used it

### Question 12: Love Factor
- **Requirements**: Always correct data, save time, guided workflow, zero friction

---

**Interview Complete**: 2026-02-05
**Key Insight**: Fix data freshness first, then guidance. UI design is already good.
