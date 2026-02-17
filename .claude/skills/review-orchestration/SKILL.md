---
name: review-orchestration
description: Automated quality gate — classifies PR, dispatches review agents, aggregates findings, gates merge
trigger: Invoked automatically by build-session-protocol Phase 2
prerequisites:
  - Working git worktree with feature branch
  - Changes committed (diff available)
  - CLAUDE.md loaded
---

# Review Orchestration Skill

## Purpose

Automated quality gate for every build-phase PR. Runs a deterministic 6-stage pipeline that classifies the diff, dispatches the appropriate review agents in parallel, aggregates their structured findings, and produces a gate decision before any PR can be created.

No manual agent selection. No guessing which reviewers are needed. Consistent coverage on every PR.

## Config References

All config is in the `config/` directory at the project root. Load via `lib/review/load-config.ts` — never import raw JSON directly.

| File | Contents |
|------|----------|
| `config/review-domains.json` | Glob→domain mappings for Stage 2 |
| `config/review-composition.json` | Dispatch policies for Stage 3 |
| `config/review-agents.json` | Agent registry (IDs: `build-reviewer`, `finance-sme`, `design-auditor`) |
| `config/review-rules.json` | Rule definitions consumed by Stage 6 aggregator |

All schemas are in `lib/schemas/review-config.ts` (config schemas) and `lib/schemas/review-pipeline.ts` (pipeline data schemas).

## Pipeline Execution

Run all 6 stages in sequence. Each stage's output is the next stage's input. Do not skip stages.

---

### Stage 1: NORMALIZE — Extract PR Facts

**Goal**: Produce an immutable `PRFacts` object from the current git diff.

**Instructions**:
1. Run `git diff HEAD~1 --stat` to get file list and line counts
2. Run `git diff HEAD~1 --name-only` to get the changed files
3. Run `git log --oneline -5` to capture commit metadata
4. Produce a `PRFacts` object conforming to `prFactsSchema` from `lib/schemas/review-pipeline.ts`:
   - `filesChanged`: array of changed file paths
   - `linesAdded`, `linesRemoved`: totals from git stat
   - `commitMessages`: last 5 commit messages
   - `branch`: current branch name from `git branch --show-current`

**Output**: `PRFacts` (immutable — stages 2-6 read but never mutate it)

---

### Stage 2: CLASSIFY — Deterministic Domain Mapping

**Goal**: Map changed files to domains and compute a risk score.

**Instructions**:
1. Load `config/review-domains.json` (via `lib/review/load-config.ts`)
2. For each file in `PRFacts.filesChanged`, match against glob patterns in the domain config
3. Collect the unique set of matched domains
4. Compute risk score: base 10 + 5 per additional domain + 1 per 50 lines changed
5. Infer PR type: `feature` | `fix` | `refactor` | `config` based on commit messages and file patterns
6. Produce `PRClassification` conforming to `prClassificationSchema`:
   - `domains`: array of matched domain strings
   - `riskScore`: numeric score
   - `prType`: inferred type
   - `scope`: `narrow` (1-2 domains) | `wide` (3+ domains) | `cross-cutting` (touches `design-system` + any other)

**Output**: `PRClassification`

---

### Stage 3: COMPOSE — Policy Evaluation

**Goal**: Produce the agent manifest — the list of agents to dispatch and their scope.

**Instructions**:
1. Load `config/review-composition.json` (via `lib/review/load-config.ts`)
2. For each composition policy:
   - If `trigger.type === "always"` → include the agent
   - If `trigger.type === "domain"` → include the agent if any `trigger.domains` intersect `PRClassification.domains`
   - If `trigger.type === "risk"` → include the agent if `PRClassification.riskScore >= trigger.minRisk`
3. Sort dispatched agents by priority (highest first)
4. For each dispatched agent, include scope context:
   - Which files they should focus on (filtered by their capabilities)
   - Which domains triggered their inclusion
5. Produce `AgentManifest[]` conforming to `agentManifestSchema`:
   - `agentId`: agent ID from registry
   - `reason`: why this agent was dispatched
   - `focusFiles`: files relevant to this agent's capabilities
   - `priority`: numeric priority from composition policy

**Output**: `AgentManifest[]`

---

### Stage 4: GAP DETECT — LLM Coverage Check

**Goal**: Identify concerns in the diff that the config-based classifier may have missed. Amend the manifest if needed.

**Instructions** (you are the LLM performing this step — no sub-agent spawned):
1. Read the full diff: `git diff HEAD~1`
2. Review the diff against the current `AgentManifest[]`
3. Ask yourself: "Are there patterns in this diff that none of the dispatched agents are specialized to catch?"
4. Examples of gaps to look for:
   - A financial calculation in a file that didn't match the financial domain glob
   - A new UI component in a config-only change
   - A schema change with downstream implications not covered by existing agents
   - Security-sensitive patterns (hardcoded values, input handling) with no security reviewer dispatched
5. If a gap is found:
   - If an existing agent could catch it: add it to the manifest with `reason: "gap-detect"`
   - If no existing agent covers it: log the gap (do NOT dispatch an agent that isn't in the registry)
6. Produce amended `AgentManifest[]` and `GapLog[]`:
   - Each `GapLogEntry` conforming to `gapLogEntrySchema`:
     - `concern`: what was found
     - `location`: file + approximate line
     - `recommendation`: which new rule or agent would catch this in future

**Output**: Amended `AgentManifest[]` + `GapLog[]`

---

### Stage 5: DISPATCH — Parallel Agent Execution

**Goal**: Launch all agents from the manifest in parallel. Collect `ReviewFinding[]` from each.

**Instructions**:
1. For each agent in the amended `AgentManifest[]`, spawn a Task with:
   - `subagent_type`: the agent ID (e.g., `"build-reviewer"`, `"finance-sme"`, `"design-auditor"`)
   - `prompt`: structured prompt including:
     - List of files to review (`focusFiles` from manifest)
     - The diff output for those files
     - Instruction to output structured JSON conforming to `ReviewFinding[]`
     - Reference to `config/review-rules.json` for the rule IDs to check against
2. Agents run in parallel (use a single message with multiple Task tool calls)
3. Each agent returns `ReviewFinding[]` JSON. Parse and validate against `reviewFindingSchema` from `lib/schemas/review-pipeline.ts`.
4. If an agent returns invalid JSON or times out: log as a `GapLogEntry` with `concern: "agent-dispatch-failure"` and continue

**Agent prompt template**:
```
You are the [agent name] agent performing a structured code review.

Review the following changed files for issues:
[focusFiles list]

Git diff:
[filtered diff for focusFiles]

Output ONLY a JSON array of findings conforming to this schema:
{
  "id": "<rule-id from config/review-rules.json or generated>",
  "severity": "critical" | "major" | "warning" | "info",
  "category": "<category string>",
  "file": "<relative file path>",
  "line": <line number or null>,
  "message": "<clear description of the finding>",
  "recommendation": "<how to fix it>"
}

Return [] if no findings. Return only the JSON array — no markdown, no prose.
```

**Output**: `ReviewFinding[]` from each agent (merged into a flat array)

---

### Stage 6: AGGREGATE — Report + Gate Decision

**Goal**: Merge all findings, dedupe, compute gate decision, produce the final `ReviewReport`.

**Instructions**:
1. Merge all `ReviewFinding[]` arrays from Stage 5 into one flat array
2. Dedupe: if two findings have the same `file` + `line` + `category`, keep the one with higher severity
3. Sort by severity: `critical` → `major` → `warning` → `info`
4. Count by severity: `criticalCount`, `majorCount`, `warningCount`, `infoCount`
5. Compute gate decision (evaluate conditions in priority order — first match wins):
   - `criticalCount > 0` → `fail`
   - `majorCount > 0` → `needs_fixes`
   - `warningCount > 0` → `pass_with_warnings`
   - else → `pass`
6. Produce `ReviewReport` conforming to `reviewReportSchema`:
   - `gateDecision`: computed above
   - `findings`: sorted finding array
   - `agentsDispatched`: list of agent IDs that ran
   - `gapLog`: `GapLog[]` from Stage 4
   - `summary`: human-readable one-liner ("3 critical, 2 major, 1 warning — FAIL")

**Output**: `ReviewReport` + `GateDecision`

---

## Gate Decision Response

After Stage 6, act on the gate decision:

### `fail` — Critical findings present

1. Do NOT proceed to Phase 3 (PR creation)
2. Display all critical findings to yourself (not the user unless they're watching)
3. Fix every critical finding in the code
4. Re-run the full review orchestration pipeline from Stage 1
5. Repeat until gate is `pass` or `pass_with_warnings`

### `needs_fixes` — Major findings present

1. Do NOT proceed to Phase 3 (PR creation)
2. Fix all major findings
3. Re-run the review orchestration pipeline from Stage 1
4. Repeat until gate is `pass` or `pass_with_warnings`

### `pass_with_warnings` — Only warnings/info

1. Proceed to Phase 3 (PR creation)
2. For each warning finding, create a GitHub Issue with labels:
   - `type/tech-debt`, `source/review`, `priority/low`
3. Include warning count and issue links in the PR body

### `pass` — No findings

1. Proceed immediately to Phase 3 (PR creation)
2. Include the clean review result in the PR body

---

## PR Body Review Summary Block

Include this block in every PR body under `### Review summary`:

```
### Review summary
- **Agents dispatched**: [list of agent IDs]
- **Gate decision**: [PASS / PASS_WITH_WARNINGS / NEEDS_FIXES / FAIL]
- **Findings addressed**: [N critical, M major fixed before PR]
- **Warnings deferred**: [X warnings → GitHub Issues #NNN, #NNN]
- **Gaps detected**: [Y gaps logged for config improvement] or "None"
```

If any gaps were logged in Stage 4, add a note:
```
- **Review gaps**: [N concerns logged — will create config improvement issues in wrap-up]
```

---

## Gap Log Handling

After the PR is merged (or during wrap-up), for each `GapLogEntry`:
1. Create a GitHub Issue with:
   - Title: `review: add rule for [concern]`
   - Labels: `type/tooling`, `vertical/devx`, `priority/low`
   - Body: gap entry's `concern`, `location`, and `recommendation` fields
2. These issues feed back into `config/review-rules.json` and `config/review-domains.json` updates

This closes the feedback loop — the system self-improves as gaps are found and codified.

---

## Rules

- **Never skip stages** — run all 6, even if Stage 2 returns no domains
- **Never dispatch agents not in `config/review-agents.json`** — log gaps instead
- **Stage 4 is synchronous** — it runs in the current agent's context, not a sub-agent
- **Stage 5 is parallel** — dispatch all manifest agents in a single message
- **Gate conditions are priority-ordered** — first match wins, do not OR conditions
- **Never modify tests to make the gate pass** — fix the implementation
- **Re-run from Stage 1 after fixes** — not just Stage 6
