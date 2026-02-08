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
| [2026-02-08-vercel-setup.html](2026-02-08-vercel-setup.html) | Vercel deployment with access code protection (env var: DEMO_ACCESS_CODE), middleware, login page, API validation | 2026-02-08 | Build |
| [2026-02-08-quoting-breadboard.html](2026-02-08-quoting-breadboard.html) | Quoting breadboard: 7 Places, 65 UI affordances, 32 code affordances, Mermaid diagrams, build order | 2026-02-08 | Plan, Build |
| [2026-02-08-breadboarding-skill.html](2026-02-08-breadboarding-skill.html) | Breadboarding skill created, integrated into vertical workflow as Phase 2.5, skill count 6 to 8 | 2026-02-08 | Feature, Decision |
| [2026-02-08-quoting-discovery.html](2026-02-08-quoting-discovery.html) | Quoting discovery complete: Playwright exploration, user interview, 10 friction points, improved journey design, S&S color swatch request | 2026-02-08 | Feature, Research |
| [2026-02-08-strategic-pivot.html](2026-02-08-strategic-pivot.html) | Strategic pivot to vertical-by-vertical approach, 4-phase methodology, discovery docs | 2026-02-08 | Plan, Decision |
| [session-2026-02-08-agent-architecture.html](session-2026-02-08-agent-architecture.html) | 5 agents, 4 skills, orchestration patterns, agent registry | 2026-02-08 | Feature, Build |
| [session-2026-02-07-shaping-skills.html](session-2026-02-07-shaping-skills.html) | Shaping skills evaluation, pre-build ritual, Phase 1 workflow | 2026-02-07 | Decision, Research |
| [session-2026-02-07-skills-implementation.html](session-2026-02-07-skills-implementation.html) | Built screen-builder + quality-gate skills (20 files) | 2026-02-07 | Feature, Build |
| [session-2026-02-07-ci-testing.html](session-2026-02-07-ci-testing.html) | GitHub Actions CI, Vitest schema tests (66), mock data UUID fix | 2026-02-07 | Feature, Build, Learning |

## How to Use

Open any `.html` file in your browser, or start with `index.html` for a navigable overview. Each session summary includes:
- What was discussed and decided
- Links to artifacts created or modified
- The `claude --resume` command to continue that session

## Finding the Session ID

Each session doc includes a `claude --resume <session-id>` command. To find the correct session ID:

```bash
# Most recently modified .jsonl is the current/latest session
ls -t ~/.claude/projects/-Users-cmbays-Github-print-4ink/*.jsonl | head -1
```

The filename (without `.jsonl`) is the session ID. For example:
```text
58358bf9-61aa-4451-a184-c3d91d1871bd.jsonl
→ claude --resume 58358bf9-61aa-4451-a184-c3d91d1871bd
```

> **Note**: The project path is derived from the absolute path with `/` replaced by `-`. For this project at `/Users/cmbays/Github/print-4ink`, the directory is `-Users-cmbays-Github-print-4ink`.

You can also list recent sessions to find a specific one:
```bash
# Show 5 most recent sessions with dates
ls -lt ~/.claude/projects/-Users-cmbays-Github-print-4ink/*.jsonl | head -5
```

## Template

Every HTML file uses a standardized header template. See `_template.html` for the reference implementation.

### Header Structure

1. **Back navigation** — `← Back to Index` link at the top
2. **Tags** — One or more tag pills describing the session type
3. **Title + subtitle** — What was done, one-line summary
4. **Meta grid** — Date, Branch, Phase, Vertical (2x2 grid)
5. **Session resume** — Copyable `claude --resume <id>` command
6. **Related sessions** — Navigation buttons to related `for_human/` docs (optional)
7. **Divider** — Separates the header from body content

### Tags

| Tag | Color | Use When |
|-----|-------|----------|
| `Feature` | Green | New functionality was built |
| `Build` | Green | Infrastructure, tooling, or scaffold work |
| `Plan` | Cyan | Strategy or roadmap was created |
| `Decision` | Amber | A choice was made between alternatives |
| `Research` | Purple | Competitive analysis, exploration, or investigation |
| `Learning` | Amber | A lesson was learned or gotcha documented |

Apply 1-3 tags per session. Most sessions combine two (e.g., Feature + Build, Decision + Research).

## Bundling Rules

- **Bundle together**: Content from the same feature build, multi-session work on one screen, or closely related decisions
- **Keep separate**: Distinct features, standalone decisions, different phases of the project
