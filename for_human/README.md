# For Human

Learning and reference artifacts for the project owner.

## Purpose

This directory stores session summaries, decision logs, and reference materials that help you:

- **Review what was built and why** — each session produces a summary with context, decisions, and links
- **Understand the project** — architectural choices, methodology decisions, and trade-off rationale
- **Resume context quickly** — session files include the `claude --resume` command to pick up where you left off
- **Onboard others** — a self-contained history of how the project evolved

## Index

| File | Topic | Date | Tags |
|------|-------|------|------|
| [Price Matrix Breadboard](2026-02-11-price-matrix-breadboard.html) | UI affordance map, wiring, component boundaries, and parallelized build order for the Price Matrix vertical | 2026-02-11 | Plan, Decision |
| [Invoicing Breadboard](2026-02-11-invoicing-breadboard.html) | UI affordances, code affordances, wiring, and component boundaries for the invoicing vertical — the buildable blueprint before code. | 2026-02-11 | Plan, Research |
| [Git Worktree Migration + Memory Refactoring](2026-02-10-worktree-migration.html) | Migrated from git checkout to git worktrees for concurrent session isolation, auto-generated for_human index, and slimmed progress/memory files by 70%. | 2026-02-10 | Build, Decision |
| [work() — Worktree Orchestrator](2026-02-10-work-orchestrator.html) | Single command to create worktrees, tmux sessions, and launch Claude — with Agent Teams integration via tmux hook. | 2026-02-10 | Build, Feature |
| [Quoting–Customer Interconnection](2026-02-10-quoting-interconnection.html) | Enhanced CustomerCombobox with lifecycle badges, enriched customer context, and cross-vertical search. | 2026-02-10 | Feature, Build |
| [Price Matrix Vertical Research](2026-02-10-price-matrix-research.html) | Comprehensive market research, competitor analysis, and prioritized feature recommendations for the pricing engine vertical | 2026-02-10 | Research, Plan, Decision |
| [Invoicing Vertical Research](2026-02-10-invoicing-vertical-research.html) | Comprehensive competitive, UX, integration, compliance, and industry research for the Screen Print Pro invoicing vertical | 2026-02-10 | Research, Plan |
| [Customer Management Quality Gate](2026-02-10-customer-quality-gate.html) | Comprehensive 5-subagent audit of Customer List + Customer Detail pages. 10 fixes across 11 files. | 2026-02-10 | Build, Feature |
| [Customer Management Breadboard](2026-02-10-customer-mgmt-breadboard.html) | Interactive visualization of Places, Components, Wiring, and Build Order for the Customer Management vertical | 2026-02-10 | Plan, Build |
| [Customer List Page](2026-02-10-customer-list-page.html) | Smart views, search, filters, stats bar, responsive table — the /customers browse experience | 2026-02-10 | Feature, Build |
| [Customer Management Feedback](2026-02-10-customer-feedback.html) | 8 feedback items from 4Ink owner review. Layout consistency, inline column filters, timeline interactivity, workflow improvements, and code quality refinements. | 2026-02-10 | Feature, Build |
| [Agent Architecture](session-2026-02-08-agent-architecture.html) | 5 specialized agents, 4 new skills, orchestration patterns, and an agent registry. Agents preload skills for domain expertise and chain together for complex workflows. | 2026-02-08 | Feature, Build |
| [Vercel Setup with Access Code Protection](2026-02-08-vercel-setup.html) |  | 2026-02-08 | Build |
| [Strategic Pivot: Vertical-by-Vertical](2026-02-08-strategic-pivot.html) | Moving from linear 10-step implementation plan to user-validated vertical development focused on 4Ink's core pain points. | 2026-02-08 | Plan, Decision |
| [Quoting Discovery: Complete](2026-02-08-quoting-discovery.html) | Full competitive analysis, user interview, and improved journey design for the Quoting vertical | 2026-02-08 | Feature, Research |
| [Quoting Vertical Build](2026-02-08-quoting-build.html) | Complete implementation of the Quoting vertical — 3 pages, 15+ components, artwork system, flat pricing model, collapsible form sections. Built with parallel agents, polished via CodeRabbit review. | February 8–9, 2026 | Feature, Build |
| [Quoting Breadboard](2026-02-08-quoting-breadboard.html) | Visual blueprint mapping all Places, UI affordances, code affordances, and wiring for the Quoting vertical. Produced by the breadboarding skill as input to the frontend-builder agent. | 2026-02-08 | Plan, Build |
| [Breadboarding Skill](2026-02-08-breadboarding-skill.html) | Promoted breadboarding from Phase 2 deferral to full Phase 1 skill. Maps UI affordances, code affordances, data stores, and wiring before any code is written. | 2026-02-08 | Feature, Decision |
| [Skills Implementation](session-2026-02-07-skills-implementation.html) | Built two project-specific Claude Code skills — <code>screen-builder</code> and <code>quality-gate</code> — encoding design system, quality checklist, and domain knowledge into repeatable workflows for all 10 remaining screens. | 2026-02-07 | Feature, Build |
| [Shaping Skills Evaluation](session-2026-02-07-shaping-skills.html) | Evaluated Ryan Singer's shaping-skills methodology and extracted three high-value patterns for Screen Print Pro's build process. | 2026-02-07 | Decision, Research |
| [CI & Testing Setup](session-2026-02-07-ci-testing.html) | GitHub Actions CI workflow, Vitest schema tests, and mock data UUID fix. Catches build/lint/type/test failures on every push and PR. | 2026-02-07 | Feature, Build, Learning |

## How to Use

Open any `.html` file in your browser, or start with `index.html` for a navigable overview. Each session summary includes:
- What was discussed and decided
- Links to artifacts created or modified
- The `claude --resume` command to continue that session

## Regenerating This Index

This file and `index.html` are auto-generated. To regenerate after adding a new session doc:

```bash
npm run gen:index
```

## Finding the Session ID

Each session doc includes a `claude --resume <session-id>` command. To find the correct session ID:

```bash
# Most recently modified .jsonl is the current/latest session
ls -t ~/.claude/projects/-Users-cmbays-Github-print-4ink/*.jsonl | head -1
```

The filename (without `.jsonl`) is the session ID.

## Template

Every HTML file uses a standardized header template. See `_template.html` for the reference implementation.

### Tags

| Tag | Color | Use When |
|-----|-------|----------|
| `Feature` | Green | New functionality was built |
| `Build` | Green | Infrastructure, tooling, or scaffold work |
| `Plan` | Cyan | Strategy or roadmap was created |
| `Decision` | Amber | A choice was made between alternatives |
| `Research` | Purple | Competitive analysis, exploration, or investigation |
| `Learning` | Amber | A lesson was learned or gotcha documented |

Apply 1-3 tags per session.

## Bundling Rules

- **Bundle together**: Content from the same feature build, multi-session work on one screen, or closely related decisions
- **Keep separate**: Distinct features, standalone decisions, different phases of the project
