---
title: '{VERTICAL} Vertical — Learnings Synthesis'
subtitle: 'Cross-cutting patterns from the {VERTICAL} build cycle'
date: { DATE }
phase: 1
vertical: { VERTICAL }
verticalSecondary: []
stage: learnings
tags: [learning]
sessionId: '{SESSION_ID}'
branch: '{BRANCH}'
status: complete
---

## Summary

{2-3 sentences: what was built, how many sessions/PRs, overall assessment}

## Patterns

### Reusable Approaches

{Patterns that worked and should be replicated. Each needs 2+ supporting instances.}

| Pattern | First Seen       | Reused In        | Recommendation          |
| ------- | ---------------- | ---------------- | ----------------------- |
| {name}  | {PR/session ref} | {PR/session ref} | {keep/extract/document} |

### Component Patterns

{Shared components that emerged, with file paths and usage counts.}

### Schema Patterns

{Zod schema design patterns — what structures were most effective.}

## What Worked Well

{Bulleted list with specific references}

- **{Thing}**: {Why it worked} (ref: {PR/KB doc})
- ...

## Pain Points

{Each pain point includes symptom, root cause, and frequency}

| Pain Point | Root Cause | Frequency           | Impact            |
| ---------- | ---------- | ------------------- | ----------------- |
| {symptom}  | {cause}    | {one-off/recurring} | {high/medium/low} |

## Recommendations

### Process Changes

{Numbered list of specific, actionable changes}

1. **{Change}**: {What to do and why} — affects: {files/skills/agents}
2. ...

### CLAUDE.md Updates

{Proposed additions to Lessons Learned, if any}

```markdown
- **{Topic}**: {Explanation}
```

### New Skills or Agents Needed

{Any gaps identified that could be addressed with new tooling}

## Cross-Vertical Insights

{How this vertical's learnings apply to others}

- **Shared with {other-vertical}**: {insight}
- ...

## Metrics

| Metric                          | Value   |
| ------------------------------- | ------- |
| Total sessions                  | {N}     |
| Total PRs merged                | {N}     |
| Review rounds (avg)             | {N}     |
| Gary questions (total/resolved) | {N}/{N} |
| GitHub issues created           | {N}     |
| CLAUDE.md updates               | {N}     |

## References

- KB docs: {list}
- PRs: {list with numbers}
- Issues: {list with numbers}
