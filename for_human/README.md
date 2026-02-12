# For Human — Knowledge Base

Session summaries, decisions, and build logs organized by vertical and stage.

## Index

| File | Vertical | Stage | Date | Tags |
|------|----------|-------|------|------|
| [Price Matrix Build](2026-02-12-price-matrix-build.html) | Price Matrix | Build | 2026-02-12 | feature, build, learning |
| [Price Matrix Breadboard](2026-02-11-price-matrix-breadboard.html) | Price Matrix | Breadboarding | 2026-02-11 | plan, decision |
| [Invoicing Vertical Build](2026-02-11-invoicing-build.html) | Invoicing | Build | 2026-02-11 | feature, build |
| [Invoicing Breadboard](2026-02-11-invoicing-breadboard.html) | Invoicing | Breadboarding | 2026-02-11 | plan, research |
| [Git Worktree Migration + Memory Refactoring](2026-02-10-worktree-migration.html) | Meta / Infrastructure | Build | 2026-02-10 | build, decision |
| [work() — Worktree Orchestrator](2026-02-10-work-orchestrator.html) | Meta / Infrastructure | Build | 2026-02-10 | build, feature |
| [Quoting–Customer Interconnection](2026-02-10-quoting-interconnection.html) | Quoting | Build | 2026-02-10 | feature, build |
| [Price Matrix Vertical Research](2026-02-10-price-matrix-research.html) | Price Matrix | Research | 2026-02-10 | research, plan, decision |
| [Invoicing Vertical Research](2026-02-10-invoicing-vertical-research.html) | Invoicing | Research | 2026-02-10 | research, plan |
| [Customer Management Quality Gate](2026-02-10-customer-quality-gate.html) | Customer Management | Review | 2026-02-10 | build, feature |
| [Customer Management Breadboard](2026-02-10-customer-mgmt-breadboard.html) | Customer Management | Breadboarding | 2026-02-10 | plan, build |
| [Customer List Page](2026-02-10-customer-list-page.html) | Customer Management | Build | 2026-02-10 | feature, build |
| [Customer Management Feedback](2026-02-10-customer-feedback.html) | Customer Management | Review | 2026-02-10 | feature, build |
| [Agent Architecture](session-2026-02-08-agent-architecture.html) | Meta / Infrastructure | Build | 2026-02-08 | feature, build |
| [Vercel Setup with Access Code Protection](2026-02-08-vercel-setup.html) | Meta / Infrastructure | Build | 2026-02-08 | build |
| [Strategic Pivot: Vertical-by-Vertical](2026-02-08-strategic-pivot.html) | Meta / Infrastructure | Implementation Planning | 2026-02-08 | plan, decision |
| [Quoting Discovery: Complete](2026-02-08-quoting-discovery.html) | Quoting | Research | 2026-02-08 | feature, research |
| [Quoting Vertical Build](2026-02-08-quoting-build.html) | Quoting | Build | 2026-02-08 | feature, build |
| [Quoting Breadboard](2026-02-08-quoting-breadboard.html) | Quoting | Breadboarding | 2026-02-08 | plan, build |
| [Breadboarding Skill](2026-02-08-breadboarding-skill.html) | Meta / Infrastructure | Build | 2026-02-08 | feature, decision |
| [Skills Implementation](session-2026-02-07-skills-implementation.html) | Meta / Infrastructure | Build | 2026-02-07 | feature, build |
| [Shaping Skills Evaluation](session-2026-02-07-shaping-skills.html) | Meta / Infrastructure | Research | 2026-02-07 | decision, research |
| [CI & Testing Setup](session-2026-02-07-ci-testing.html) | Meta / Infrastructure | Build | 2026-02-07 | feature, build, learning |

## Verticals

| Vertical | Docs |
|----------|------|
| Quoting | 4 |
| Customer Management | 4 |
| Invoicing | 3 |
| Price Matrix | 3 |
| Meta / Infrastructure | 9 |

## How to Use

Open `index.html` in your browser for the full knowledge base with search, vertical navigation, and stage pipeline visualization.

Individual session docs are standalone HTML files that can be opened directly.

## Regenerating

This file, `index.html`, `gary-tracker.html`, `manifest.json`, and `_stage/*.html` are all auto-generated:

```bash
npm run gen:index
```

## Gary Questions

Questions for Gary (the shop owner) are tracked in `gary-tracker.html`. To add a question, use the `.gary-question` markup in any session doc, then re-run `npm run gen:index`.
