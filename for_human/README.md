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
| [session-2026-02-07-shaping-skills.html](session-2026-02-07-shaping-skills.html) | Shaping skills evaluation, pre-build ritual, Phase 1 workflow | 2026-02-07 | Decision |
| [session-2026-02-07-skills-implementation.html](session-2026-02-07-skills-implementation.html) | Built screen-builder + quality-gate skills (20 files) | 2026-02-07 | Feature |

## How to Use

Open any `.html` file in your browser, or start with `index.html` for a navigable overview. Each session summary includes:
- What was discussed and decided
- Links to artifacts created or modified
- The `claude --resume` command to continue that session

## Bundling Rules

- **Bundle together**: Content from the same feature build, multi-session work on one screen, or closely related decisions
- **Keep separate**: Distinct features, standalone decisions, different phases of the project
