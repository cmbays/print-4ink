# For Human

Learning and reference artifacts for the project owner.

## Purpose

This directory stores session summaries, decision logs, and reference materials that help you:

- **Review what was built and why** — each session produces a summary with context, decisions, and links
- **Understand the project** — architectural choices, methodology decisions, and trade-off rationale
- **Resume context quickly** — session files include the `claude --resume` command to pick up where you left off
- **Onboard others** — a self-contained history of how the project evolved

## Index

| File | Topic | Date | Type |
|------|-------|------|------|
| [2026-02-08-quoting-discovery.html](2026-02-08-quoting-discovery.html) | Quoting discovery complete: Playwright exploration, user interview, 10 friction points, improved journey design, S&S color swatch request | 2026-02-08 | Feature |
| [2026-02-08-strategic-pivot.html](2026-02-08-strategic-pivot.html) | Strategic pivot to vertical-by-vertical approach, 4-phase methodology, discovery docs | 2026-02-08 | Plan |
| [session-2026-02-08-agent-architecture.html](session-2026-02-08-agent-architecture.html) | 5 agents, 4 skills, orchestration patterns, agent registry | 2026-02-08 | Feature |
| [session-2026-02-07-shaping-skills.html](session-2026-02-07-shaping-skills.html) | Shaping skills evaluation, pre-build ritual, Phase 1 workflow | 2026-02-07 | Decision |
| [session-2026-02-07-skills-implementation.html](session-2026-02-07-skills-implementation.html) | Built screen-builder + quality-gate skills (20 files) | 2026-02-07 | Feature |
| [session-2026-02-07-ci-testing.html](session-2026-02-07-ci-testing.html) | GitHub Actions CI, Vitest schema tests (66), mock data UUID fix | 2026-02-07 | Feature |

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

## Bundling Rules

- **Bundle together**: Content from the same feature build, multi-session work on one screen, or closely related decisions
- **Keep separate**: Distinct features, standalone decisions, different phases of the project
