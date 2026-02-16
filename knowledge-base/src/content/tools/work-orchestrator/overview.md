---
title: "Work Orchestrator"
subtitle: "Shell function automating worktree creation, session management, pipeline orchestration, and progress reporting"
tool: work-orchestrator
docType: overview
lastUpdated: 2026-02-16
status: current
---

## Overview

The Work Orchestrator is a Bash shell function (`work()`) in `scripts/work.sh` that provides CLI subcommands for the full development workflow. It bridges Shape Up methodology to git worktrees + Zellij terminal sessions + Claude Code instances.

Source this file in your shell profile:

```bash
source ~/Github/print-4ink/scripts/work.sh
```

Then use `work <subcommand>` for all session lifecycle operations.

## Architecture

`work.sh` defines a single `work()` function that dispatches to internal `_work_*` functions based on the first argument. It sources 4 library files:

| Library | Purpose |
|---------|---------|
| `lib/registry.sh` | Session registry (JSON-based tracking of active/archived sessions) |
| `lib/kdl-generator.sh` | Zellij KDL layout generation for tabs and sessions |
| `lib/pipeline-registry.sh` | Pipeline state tracking |
| `lib/pipeline-entity.sh` | Pipeline entity operations |

### Config

| Variable | Default | Purpose |
|----------|---------|---------|
| `PRINT4INK_REPO` | `~/Github/print-4ink` | Main repo (stays on `main`) |
| `PRINT4INK_WORKTREES` | `~/Github/print-4ink-worktrees` | Worktree parent directory |
| `PRINT4INK_MAX_WORKTREES` | 15 | Safety limit |
| `PRINT4INK_PORT_MIN/MAX` | 3001-3015 | Dev server port range |

## Key Commands

### Session Creation

| Command | Purpose |
|---------|---------|
| `work <topic>` | New workstream: creates worktree from main, Zellij tab, npm install, session context |
| `work <topic> <base-branch>` | Related work: worktree from specified branch |
| `work --stack <topic>` | Stack from current branch (auto-detects `$PWD`) |
| `work <topic> --prompt "task"` | Seed new Claude with initial prompt |
| `work <topic> --yolo` | Skip Claude permissions (`--dangerously-skip-permissions`) |
| `work <topic> --claude-args "..."` | Pass arbitrary flags to Claude CLI |

### Pipeline Phase Commands

| Command | Pipeline Phase |
|---------|---------------|
| `work research <pipeline>` | Vertical discovery + competitor research |
| `work interview <pipeline>` | Requirements interrogation |
| `work breadboard <pipeline>` | Affordance mapping and wiring |
| `work plan <pipeline>` | Implementation planning |
| `work build <manifest> [--wave N]` | Multi-tab Zellij layout from YAML execution manifest |
| `work polish <pipeline>` | Post-build polish |
| `work review <pipeline>` | Quality gate + doc sync |
| `work learnings <pipeline>` | Cross-cutting pattern synthesis |
| `work cooldown <pipeline>` | 5-step retrospective |

Phase commands auto-generate topic names (`<pipeline>-<phase>`), load phase-specific prompt templates from `scripts/prompts/`, and register sessions with vertical and stage metadata.

### Session Management

| Command | Purpose |
|---------|---------|
| `work sessions [--vertical <name>]` | List sessions from registry (optionally filtered) |
| `work resume <topic>` | Resume Claude session by topic (looks up session ID from registry) |
| `work fork <new-topic> <source-topic>` | Fork a session with linked context |
| `work status` | Show all layers: registry, worktrees, Zellij, ports |
| `work next` | AI-powered focus recommendation (runs Claude in print mode) |

### Utilities

| Command | Purpose |
|---------|---------|
| `work list` | Quick overview: worktrees, Zellij sessions, dev server ports |
| `work clean <topic>` | Remove worktree + Zellij + branch + registry entry (with confirmation) |
| `work progress [--output <path>]` | Generate PROGRESS.md from live GitHub API data |
| `work help` | Full help text |

## `work progress` (Added Feb 16, 2026)

Queries GitHub API and writes a progress report to `PROGRESS.md` (gitignored — never committed):

```bash
work progress              # Write to repo root
work progress --output .   # Write to current directory
```

**Sections generated:**

| Section | Source | Purpose |
|---------|--------|---------|
| Milestones | GraphQL milestone query | Progress toward goals with issue checklists |
| Now (priority/now) | `gh issue list -l priority/now` | Current cycle work |
| Next (priority/next) | `gh issue list -l priority/next` | Up-next items |
| Tracked In | GraphQL sub-issue query | Issues that are sub-issues of tracking issues |
| Recent PRs | `gh pr list --state merged` (7 days) | Recent progress |
| Stale | `gh issue list` (>30 days) | Items needing attention |

Uses ~6 API calls total (GraphQL for milestones and sub-issues, REST for issues and PRs). All loops use `@tsv` extraction for safe parsing.

## `work build` (Manifest Execution)

Reads YAML execution manifests (produced by the `implementation-planning` skill) and launches parallel Zellij sessions:

```bash
work build docs/plans/manifest.yaml           # Launch wave 0 (default)
work build docs/plans/manifest.yaml --wave 1  # Launch wave 1
work build docs/plans/manifest.yaml --yolo    # Skip permissions for all sessions
```

For each session in the wave:
1. Creates a worktree from the manifest's `baseBranch`
2. Installs npm dependencies
3. Writes `.session-context.md` scratchpad
4. Generates KDL layout for Zellij tab
5. Registers session in registry with vertical, stage, and wave metadata

Inside Zellij: opens sessions as new tabs. Outside Zellij: generates a layout file to launch.

## How It Fits

The Work Orchestrator is the bridge between methodology and execution:

- **Shape Up** defines the pipeline stages (research → interview → shape → breadboard → plan → build → review → wrap-up)
- **`work <phase>`** creates the right environment for each stage (worktree, Claude session, phase-specific prompt)
- **`work build`** enables parallel execution of implementation plan waves
- **`work progress`** connects GitHub API state to human-readable status
- **`work clean`** handles the full lifecycle cleanup (worktree + Zellij + branch + registry)

## Source

[`scripts/work.sh`](https://github.com/cmbays/print-4ink/blob/main/scripts/work.sh) + library files in `scripts/lib/`.
