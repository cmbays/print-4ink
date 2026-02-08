# UX Task Flows - Playground Tools

**Created**: 2026-02-05
**Context**: Documenting ideal user journeys for all 6 playgrounds
**Source**: UX User Research findings

## Overview

This document defines the **ideal task flows** for each playground, mapping:
- **Entry Point**: How user arrives
- **Primary Task**: What they're trying to accomplish
- **Steps**: Sequence of actions
- **Exit Point**: How they leave (with success/failure indicators)
- **Success Metric**: How to measure if flow is working

---

## 1. Workflow Hub - Quick Status Check

### Current Flow (Broken)

```
User opens Workflow Hub
  ↓
Dashboard loads (5+ widgets, overwhelming)
  ↓
User scans for relevant info (unclear where to look)
  ↓
Sees stale data → loses trust
  ↓
Closes hub, checks GitHub issues instead
```

**Time**: 30-60 seconds
**Success Rate**: 20% (user doesn't get actionable info)

### Ideal Flow (Target)

```
User opens Workflow Hub
  ↓
Hero section shows:
  "Wave 3 P1 - Day 5 (VERIFY phase)"
  "3 tasks ready to claim"
  [Resume Work] button (prominent)
  "Last updated: 3s ago" (live indicator)
  ↓
User scans 3-line summary (5 seconds)
  - Blocked: WAVE3-015 (waiting on #234)
  - In Progress: WAVE3-020 (testing)
  - Recent: Merged PR #227 (2h ago)
  ↓
User clicks [Resume Work]
  ↓
State loaded, worktree active, ready to code
```

**Time**: 5-10 seconds
**Success Rate**: 90%+ (user gets clear next action)

### Flow Variants

**Variant A: No Active Work**
```
User opens hub → Sees "No active work" + [Start New Task] → GitHub issues modal → Select issue → Worktree created
```

**Variant B: Multiple Tracks**
```
User opens hub → Sees "2 active tracks" + track picker → Select track → Resume flow
```

**Variant C: Blocked State**
```
User opens hub → Sees "Current track blocked (waiting on #234)" + [Switch Track] or [View Blocker]
```

---

## 2. Workflow Hub - Resume Session

### Primary Task
Recover context from previous session and continue work

### Ideal Flow

```
User opens Workflow Hub (day after)
  ↓
Session Recovery section shows:
  "Last session: 2026-02-04 (Wave 3 P1 Days 3-4)"
  "You were working on: WAVE3-020 (implementation)"
  "Status: Tests passing, ready for commit"
  [Resume Session] button
  ↓
User clicks [Resume Session]
  ↓
Hub loads:
  - WORKFLOW_STATE.md context
  - Git worktree state
  - Agent reports from previous session
  ↓
Hub displays:
  "Resuming: WAVE3-020"
  "Recommended next step: Run git-master commit"
  [Continue] button
  ↓
User clicks [Continue] → Ready to work
```

**Success Metric**: User can resume work without re-reading files or asking "what was I doing?"

---

## 3. Worktree Coordinator - Parallel Development Check

### Primary Task
Check status of multiple worktrees for parallel feature development

### Ideal Flow

```
User opens Worktree Coordinator
  ↓
Dashboard shows worktree list (auto-refreshed):

  ┌─ Worktree: dbt-playground--wave3-p1 ────────────┐
  │ Branch: feat/wave3-p1                           │
  │ Status: Clean (no uncommitted changes)          │
  │ Ahead: 3 commits | Behind: 0 commits            │
  │ PR: #242 (Draft) | CI: Passing                  │
  │ [Switch] [Push] [View PR]                       │
  └─────────────────────────────────────────────────┘

  ┌─ Worktree: dbt-playground--tuva ────────────────┐
  │ Branch: feat/tuva-integration                   │
  │ Status: 2 uncommitted files                     │
  │ Ahead: 1 commit | Behind: 5 commits (needs rebase) │
  │ PR: #240 (Open) | CI: Failing (see logs)        │
  │ [Switch] [Commit] [Rebase] [View PR]            │
  └─────────────────────────────────────────────────┘
  ↓
User identifies worktree needing attention (visual status: red border for failing CI)
  ↓
User clicks [View PR] → Opens PR in GitHub
  OR
User clicks [Switch] → CLI command ready to paste
  OR
User presses R → Refreshes status
```

**Success Metric**: User can identify problem worktrees in <5 seconds

---

## 4. Mermaid Designer - Create Architecture Diagram

### Primary Task
Quickly create a dbt layer diagram or agent workflow visualization

### Ideal Flow

```
User opens Mermaid Designer
  ↓
Template picker shown (6 options):
  - dbt Layers (staging → marts)
  - Agent Workflow (sequential phases)
  - ER Diagram (relationships)
  - Sequence Diagram (API calls)
  - Flowchart (decision tree)
  - Custom (blank)
  ↓
User clicks "dbt Layers"
  ↓
Editor loads with template:

  graph TB
    source[Source Data] --> stg[Staging]
    stg --> int[Intermediate]
    int --> mart[Marts]

  ↓
User edits (live preview updates with 400ms debounce)
  ↓
User clicks [Export] → Dropdown:
  - Copy Markdown
  - Download SVG
  - Download PNG
  ↓
User selects "Copy Markdown"
  ↓
Toast: "Copied to clipboard!"
  ↓
User pastes into docs/architecture.md
```

**Success Metric**: Create diagram in <2 minutes

---

## 5. Agent Visualizer - Understand Agent Execution

### Primary Task
See what agents did during feature development

### Ideal Flow

```
User opens Agent Visualizer (via Workflow Hub tab or standalone)
  ↓
File picker shown:
  "Load state from:"
  - Recent files (dropdown): temp/WORKFLOW_STATE.md, temp/v0.10_state.md
  - Drag & drop zone
  ↓
User selects temp/WORKFLOW_STATE.md
  ↓
Visualizer renders 3 sub-tabs:

  [Inspector] [Diagram] [Timeline]

  Inspector (default view):
    - Frontmatter: Active track, phase, timestamp
    - Session summary: Key decisions, artifacts

  Diagram:
    - Mermaid flowchart (phases → agents → deliverables)
    - Top-to-bottom layout

  Timeline:
    - Chronological events with agent labels
    - Relative timestamps ("2h ago")
  ↓
User navigates tabs to understand execution
  ↓
User closes visualizer (context understood)
```

**Success Metric**: Understand "what happened" in <60 seconds

---

## 6. Workflow Chronicle - Project Health Check

### Primary Task
Assess project health and identify patterns over time

### Ideal Flow

```
User opens Workflow Chronicle
  ↓
Timeline visualization renders (stratified layers):

  Surface Layer: Recent PRs, commits
  Features Layer: Major features delivered
  Decisions Layer: ADRs, architectural changes
  Bedrock Layer: Tech stack changes, migrations
  ↓
User hovers over event → Tooltip shows:
  - Title, date, agent attribution
  - Quick summary
  ↓
User clicks event → Detail modal:
  - Full context
  - Related artifacts
  - [View in GitHub] link
  ↓
Health Pulse indicator (bottom):
  Score: 85/100
  - Test Coverage: 80% ✅
  - Documentation: 90% ✅
  - Security: 75% ⚠️ (see findings)
  ↓
User identifies security gap
  ↓
User clicks "Security findings" → Opens security review checklist
```

**Success Metric**: Identify health gaps in <30 seconds

---

## 7. Learning Playground - Interactive Tutorial

### Primary Task
Learn dbt concepts through interactive lessons

### Ideal Flow

```
User opens Learning Playground
  ↓
Lesson picker shown:
  - Lesson 1: Staging Models
  - Lesson 2: Testing
  - Lesson 3: Macros
  - Lesson 4: Incremental Models
  ↓
User selects "Lesson 1: Staging Models"
  ↓
Reveal.js slides load:

  Slide 1: What is a staging model?
  [Next]

  Slide 2: Example code (syntax highlighted)
  [Try It] button

  Slide 3: Interactive quiz
  "What does `ref()` do?"
  - Option A, B, C

  Slide 4: Summary + Next Steps
  [Complete Lesson]
  ↓
User completes quiz → Confetti animation 🎉
  ↓
Progress saved (localStorage)
  ↓
User returns to lesson picker → Checkmark on Lesson 1
```

**Success Metric**: Complete lesson without external docs

---

## Common UX Patterns Across All Playgrounds

### 1. Immediate Orientation (5-Second Rule)

**Pattern**: User should know "where am I and what can I do" in 5 seconds

**Implementation**:
- Hero section with context (current state, primary action)
- Visual hierarchy (big → medium → small)
- Single primary action button (prominent)

### 2. Live Data Indicators

**Pattern**: User should trust the data is fresh

**Implementation**:
- "Last updated: Xs ago" timestamp
- Auto-refresh every 5-10s (configurable)
- Visual pulse on data change

### 3. Progressive Disclosure

**Pattern**: Start simple, expand on demand

**Implementation**:
- Summary view (3 lines max)
- [Show Details] accordion or modal
- Keyboard shortcuts for power users

### 4. Zero Friction Actions

**Pattern**: Primary task should be 1 click

**Implementation**:
- Prominent [Resume] / [Start] / [Export] button
- No modals for common actions
- Keyboard shortcuts (R: refresh, ?: help)

### 5. Error Recovery

**Pattern**: Errors should guide user to fix

**Implementation**:
- Clear error messages ("PM session failed: backlog.md not found")
- Fix instructions ("Run: npm run start-server")
- Graceful degradation (show partial data, note what's missing)

---

## Flow Metrics (How to Measure Success)

| Playground | Primary Metric | Target | Current |
|------------|----------------|--------|---------|
| Workflow Hub | Time to orientation | <5s | ~30s |
| Workflow Hub | Resume success rate | >90% | ~20% |
| Worktree Coordinator | Problem detection time | <5s | ~10s |
| Mermaid Designer | Diagram creation time | <2min | ~3min |
| Agent Visualizer | Context recovery time | <60s | Unknown |
| Workflow Chronicle | Health gap identification | <30s | Unknown |
| Learning Playground | Lesson completion rate | >80% | N/A (unused) |

---

## Next Steps

### Phase 1: Fix Critical Flows (P0)

1. **Workflow Hub - Quick Status Check**
   - Implement hero section with primary action
   - Add live data indicator
   - Progressive disclosure UI

2. **Workflow Hub - Resume Session**
   - Fix PM session loading
   - Auto-load state on open
   - Context recovery summary

### Phase 2: Polish Existing Flows (P1)

3. **Worktree Coordinator - Parallel Development**
   - Reliable worktree detection
   - Visual status indicators (color-coded borders)
   - Action buttons per worktree

4. **Mermaid Designer - Diagram Creation**
   - Template picker redesign
   - Export workflow simplification

### Phase 3: Enable Underused Playgrounds (P2)

5. **Agent Visualizer - Execution Understanding**
   - File drag-drop enhancement
   - Sub-tab navigation polish

6. **Workflow Chronicle - Health Check**
   - Health Pulse dashboard
   - Pattern detection UI

7. **Learning Playground - Tutorials**
   - Progress tracking
   - Quiz interactivity

---

**Document Status**: Draft v1.0
**Owner**: UX Research Track
**Next Review**: After P0 fixes implemented
