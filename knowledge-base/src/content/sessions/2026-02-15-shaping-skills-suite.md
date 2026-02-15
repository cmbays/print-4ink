---
title: "Shaping Skills Suite Adoption"
subtitle: "Full rjs/shaping-skills methodology adapted for Screen Print Pro pipeline"
date: 2026-02-15
phase: 2
vertical: meta
verticalSecondary: []
stage: build
tags: [build, decision]
sessionId: "0ba68ef8-1b02-40be-a039-2c63d6d15cd1"
branch: "session/0215-shaping-skill"
status: complete
---

## Summary

Adopted the full [rjs/shaping-skills](https://github.com/rjs/shaping-skills) methodology
as a 4-deliverable suite:

1. **Shaping skill** (new) — R × S methodology with pipeline integration
2. **Breadboarding skill** (upgraded) — upstream 61KB as base, regaining slicing, chunking, examples, Mermaid
3. **Breadboard-reflection skill** (new) — design smell QA
4. **Shaping ripple hook** (new) — multi-level consistency reminders

## Key Decisions

- **R × S only** — shaping skill handles methodology, not full phase orchestration
- **Slicing stays in breadboarding** — conceptual decomposition, not execution planning
- **Auto mode** — all skills support interactive (human checkpoints) and auto (agent proceeds) modes
- **Breadboarding upgrade** — adopted upstream 61KB as base instead of keeping our 580-line simplification
- **Separation**: creation (breadboarding) and analysis (reflection) are different cognitive modes

## Pipeline

```text
Interview → Shaping (R × S) → Breadboarding → BB Reflection → Impl Planning
```

Each skill produces artifacts consumed by the next:
- Shaping → Frame doc + Shaping doc (selected shape with parts)
- Breadboarding → Sliced breadboard with affordance tables + Mermaid
- BB Reflection → Audited breadboard (fixes smells in-place)
- Impl Planning → Execution manifest (waves, sessions, prompts)

## Artifacts

- Design doc: `docs/plans/2026-02-15-shaping-skills-suite-design.md`
- Implementation plan: `docs/plans/2026-02-15-shaping-skills-suite-impl-plan.md`
- Skills: `.claude/skills/shaping/`, `.claude/skills/breadboarding/`, `.claude/skills/breadboard-reflection/`
- Hook: `.claude/hooks/shaping-ripple.sh`

## Related

- [#112](https://github.com/cmbays/print-4ink/issues/112) — Primary tracking issue
- [#192](https://github.com/cmbays/print-4ink/issues/192) — Pipeline architecture (consumes these skills)
- [#197](https://github.com/cmbays/print-4ink/issues/197) — KB decision tagging (auto vs human)
- Prior eval: [2026-02-07-shaping-skills](./2026-02-07-shaping-skills)
- Prior adoption: [2026-02-08-breadboarding-skill](./2026-02-08-breadboarding-skill)
