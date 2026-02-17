---
title: "Review Orchestration Engine — Reference Guide"
subtitle: "Living reference for the automated PR quality gate: what it is, why it exists, how it works, and how to extend it"
date: 2026-02-17
phase: 1
pipelineName: "Review Orchestration Engine"
pipelineType: horizontal
products: []
tools: ["agent-system"]
stage: wrap-up
tags: [feature, decision, learning]
sessionId: "0ba68ef8-1b02-40be-a039-2c63d6d15cd1"
branch: "session/0217-i342-review-skills-finish"
status: complete
---

> **Living document.** Update this file when the engine's config, pipeline stages, agents, or gate logic change. This is the first place a new agent or developer should read to understand the review system.

---

## Why This Tool Exists

Screen Print Pro uses Claude agents to build features. Those agents finish implementation, run tests, and create PRs. The problem: deciding *which review agents to invoke*, and *what to check*, was left to the building agent itself.

That's the fox guarding the henhouse. The building agent is most likely to overlook its own mistakes. Manual reviewer selection meant:

- Financial code could merge without `finance-sme`
- UI changes could ship without `design-auditor`
- "Small" PRs skipped review entirely
- Coverage was random — dependent on the building agent's memory of what existed

The **Review Orchestration Engine** removes that discretion. Every build PR runs the same 6-stage pipeline. The right agents are dispatched automatically based on what changed. Coverage is consistent by construction.

---

## What It Is

A **skill** — `.claude/skills/review-orchestration/SKILL.md` — that runs inside the building agent's context during `build-session-protocol` Phase 2 (Self-Review). It is not a standalone agent, not a CI job (yet), and not an optional step. It is a required quality gate before any build PR can be created.

The skill runs a 6-stage pipeline:

```
Normalize → Classify → Compose → Gap Detect → Dispatch → Aggregate
```

Each stage has a clear input/output contract, validated by Zod schemas. The final output is a `ReviewReport` with a `GateDecision` that tells the building agent whether to fix things or proceed to PR creation.

---

## The 6 Stages in Plain Language

### Stage 1 — Normalize: *What changed?*

Extracts the raw facts from git: which files changed, how many lines, what the commits say. These facts are **immutable** — every subsequent stage reads them but never changes them.

```
Input:  git state
Output: PRFacts { filesChanged, linesAdded, linesRemoved, commitMessages, branch }
```

**Why immutable?** Following the Rule Engine pattern (Drools/OPA): data (facts) is separated from logic (rules) from execution (actions). Stages cannot corrupt the input.

**Edge case handled:** If `HEAD~1` doesn't exist (first commit, orphan branch), falls back to `git merge-base HEAD origin/main`.

---

### Stage 2 — Classify: *What kind of change is this?*

Runs deterministic glob-to-domain matching against `config/review-domains.json`. No LLM call. Fast.

```
Input:  PRFacts
Output: PRClassification { domains, riskScore, prType, scope }
```

**Example mappings** (from `config/review-domains.json`):
- `lib/schemas/**` → `financial`
- `lib/helpers/money*` → `financial`
- `components/features/**` → `ui-components`
- `app/globals.css` → `design-system`
- `config/**` → `config`

**Risk score** = base 10 + 5 per domain + 1 per 50 lines changed. A PR touching 3 domains with 200 lines changed scores ~35.

**PR type** inferred from commit message prefixes (`feat` → `feature`, `fix` → `fix`, `refactor` → `refactor`).

**Scope** classifies breadth: `narrow` (1-2 domains), `wide` (3+ domains), `cross-cutting` (touches `design-system` + any other).

---

### Stage 3 — Compose: *Which agents should review this?*

Evaluates composition policies from `config/review-composition.json`. Pure function — same input always produces the same output.

```
Input:  PRClassification
Output: AgentManifest[] { agentId, reason, focusFiles, priority }
```

**Three trigger types:**
- `always` — dispatch regardless of what changed (currently: `build-reviewer`)
- `domain` — dispatch when matched domains overlap policy's domain list
- `risk` — dispatch when `riskScore >= trigger.minRisk`

**Current composition policies:**

| Policy ID | Trigger | Dispatches |
|-----------|---------|------------|
| `universal-build-reviewer` | always | `build-reviewer` |
| `financial-domain-reviewer` | domains: `financial`, `dtf-optimization` | `finance-sme` |
| `design-domain-reviewer` | domains: `ui-components`, `design-system` | `design-auditor` |

---

### Stage 4 — Gap Detect: *Did we miss anything?*

The LLM layer. The building agent (not a sub-agent) reads the full diff and asks: *"Are there concerns in this diff that none of the dispatched agents are specialized to catch?"*

```
Input:  full git diff + AgentManifest[]
Output: amended AgentManifest[] + GapLog[]
```

**Examples of gaps it catches:**
- A `+` operator on a money value in a file that didn't match the `financial` glob
- A new `<input>` element in a TypeScript utility file (UI concern outside `components/`)
- A hardcoded API URL in a config file that no security reviewer would see
- Schema changes with downstream implications not covered by existing agents

**If a gap is found:**
- An existing agent can cover it → add to manifest with `reason: "gap-detect"`
- No existing agent covers it → log to `GapLog[]` (don't invent agents)

**Gap log** entries become GitHub Issues during wrap-up. Each gap closes the feedback loop — it either updates `config/review-domains.json` (so Stage 2 catches it next time) or `config/review-rules.json` (so an agent checks for it explicitly). The system self-improves.

---

### Stage 5 — Dispatch: *Run the agents.*

Launches all agents from the final manifest **in parallel** (single message, multiple Task tool calls).

```
Input:  AgentManifest[]
Output: ReviewFinding[] from each agent (merged flat)
```

Each agent receives:
1. List of files to focus on (`focusFiles` from manifest)
2. Git diff filtered to those files
3. Instruction to output `ReviewFinding[]` JSON only — no prose, no markdown tables
4. Reference to `config/review-rules.json` for rule IDs to check against

**Finding schema** (uniform across all agents):
```json
{
  "id": "rule-id-from-config",
  "severity": "critical | major | warning | info",
  "category": "type-safety | financial-arithmetic | design-system | ...",
  "file": "relative/path/to/file.ts",
  "line": 42,
  "message": "What is wrong",
  "recommendation": "How to fix it"
}
```

`line` may be `null` for file-level findings (e.g., "this file is missing tests").

**Failure handling:** If an agent returns invalid JSON or times out, a `GapLogEntry` is created with `concern: "agent-dispatch-failure"` and the pipeline continues.

---

### Stage 6 — Aggregate: *What's the verdict?*

Merges all findings, deduplicates, sorts, counts by severity, and computes the gate decision.

```
Input:  ReviewFinding[] (all agents)
Output: ReviewReport + GateDecision
```

**Deduplication:** Same `file` + `line` + `category` → keep higher severity. For `line: null` findings, same `file` + `category` → keep higher severity.

**Gate decision** (conditions evaluated top-to-bottom, first match wins):

| Condition | Decision | What happens |
|-----------|----------|-------------|
| `criticalCount > 0` | `fail` | Must fix, re-run from Stage 1 |
| `majorCount > 0` | `needs_fixes` | Should fix, re-run from Stage 1 |
| `warningCount > 0` | `pass_with_warnings` | File as GitHub Issues, proceed |
| otherwise | `pass` | Proceed immediately |

**Metric-based, not rule-based** (SonarQube pattern). Adding new rules to config automatically makes the gate stricter without changing any gate logic code.

---

## The Gate Decision Flow

```
Stage 6 returns gate decision
         │
         ├─ fail ──────────────────────────────┐
         │                                     │
         ├─ needs_fixes ───────────────────┐   │
         │                                 │   ▼
         ├─ pass_with_warnings ────┐    Fix critical/major findings
         │                        │    Re-run from Stage 1
         ├─ pass ─────────────┐   │
                              │   │
                              ▼   ▼
                      Proceed to Phase 3
                      (PR creation)
```

For `pass_with_warnings`: create GitHub Issues with labels:
- `vertical/<name>` — which vertical owns the deferred item
- `type/tech-debt` — it's deferred technical debt
- `source/review` — originated from review, not a feature request
- `priority/low` or `priority/medium` — based on impact

---

## PR Body Review Summary

Every PR created after orchestration includes this block:

```markdown
### Review summary
- **Agents dispatched**: build-reviewer, finance-sme
- **Gate decision**: PASS (clean on first run)
- **Findings addressed**: 0
- **Warnings deferred**: None
- **Gaps detected**: None
```

Or after a fix cycle:

```markdown
### Review summary
- **Agents dispatched**: build-reviewer, finance-sme, design-auditor
- **Gate decision**: PASS_WITH_WARNINGS (resolved from FAIL on attempt 1)
- **Findings addressed**: 2 critical fixed (big.js arithmetic in QuoteRow, QuoteTotal)
- **Warnings deferred**: 1 → GitHub Issue #NNN (hardcoded px value in QuoteCard)
- **Gaps detected**: 1 → will file config improvement issue in wrap-up
```

---

## Worked Examples

### Example 1: Pure Config Change

**PR**: Adds a new entry to `config/review-composition.json`

**Stage 2**: domains = `["config"]`, riskScore = 11 (base 10 + 1 per 10 lines)

**Stage 3**: Only `build-reviewer` dispatched (universal policy; no `domain`-triggered agents match `config`)

**Stage 4**: LLM scans diff — the new entry adds a `risk` trigger with a very low threshold. No concern for an existing agent. No gap logged.

**Stage 5**: `build-reviewer` runs. Finds no issues.

**Stage 6**: 0 findings. Gate = `pass`. PR created immediately.

---

### Example 2: Financial Code Change

**PR**: Modifies `lib/schemas/quote.ts` and `components/features/QuoteRow.tsx`

**Stage 2**: domains = `["financial", "ui-components"]`, riskScore = 27

**Stage 3**: `build-reviewer` (universal) + `finance-sme` (financial domain) + `design-auditor` (ui-components domain)

**Stage 4**: LLM scans diff. Notices a `+` operator on a `subtotal` variable in `QuoteRow.tsx` — this file matched `ui-components` in Stage 2, but `finance-sme`'s `focusFiles` will include it because Stage 3 set `focusFiles` based on capabilities. No manifest amendment needed, no gap logged.

**Stage 5**: Three agents run in parallel.
- `finance-sme` finds: `+` operator on `subtotal` (critical, `fin-bigjs-01`)
- `build-reviewer` finds: no issues
- `design-auditor` finds: `mt-[14px]` hardcoded value (warning, `ds-spacing-01`)

**Stage 6**: 1 critical, 1 warning. Gate = `fail`.

**Building agent**: Fixes `subtotal + tax` → `money(subtotal).plus(tax)`. Re-runs from Stage 1.

**Second pass**: 0 critical, 1 warning. Gate = `pass_with_warnings`.

**Building agent**: Files GitHub Issue for the px value. Proceeds to PR with review summary noting 1 critical fixed, 1 warning deferred.

---

### Example 3: Gap Detect Catches a Miss

**PR**: Adds a new utility function `lib/helpers/dtf-waste-calc.ts` for DTF cost calculations

**Stage 2**: `lib/helpers/` doesn't match any financial glob (it matches `lib/helpers/money*` but not `lib/helpers/dtf-*`). domains = `[]`. riskScore = 10.

**Stage 3**: Only `build-reviewer` dispatched.

**Stage 4**: LLM reads the diff. Sees arithmetic like `wastage * pricePerSheet` directly in the utility. `finance-sme` isn't in the manifest. Gap logged:
```json
{
  "concern": "Monetary arithmetic operators found in lib/helpers/dtf-waste-calc.ts not covered by finance-sme",
  "location": "lib/helpers/dtf-waste-calc.ts:18",
  "recommendation": "Add glob 'lib/helpers/dtf-*' to financial domain in config/review-domains.json"
}
```
`finance-sme` added to manifest with `reason: "gap-detect"`.

**Stage 5**: `build-reviewer` + `finance-sme` run in parallel. `finance-sme` finds the raw multiplication on a money value (critical).

**Stage 6**: 1 critical. Gate = `fail`. Building agent fixes it.

**Wrap-up**: Gap log issue filed → `config/review-domains.json` updated to add `lib/helpers/dtf-*` to the financial domain. This gap will never happen again.

---

## Config Files Reference

All four config files live at the project root. All changes are validated by Zod at import time via `lib/review/load-config.ts`.

### `config/review-agents.json`

The agent registry. Every agent that can be dispatched must be registered here.

```json
{
  "id": "build-reviewer",
  "name": "Code Quality Reviewer",
  "tools": ["Read", "Grep", "Glob"],
  "capabilities": ["type-safety", "dry", "tailwind", "naming", ...],
  "description": "...",
  "outputFormat": "json"
}
```

To add a new agent: add an entry here, then add composition policies referencing the new `id`.

### `config/review-domains.json`

Maps file glob patterns to domain names. Used in Stage 2 classification.

```json
{
  "glob": "lib/schemas/**",
  "domain": "financial",
  "description": "Zod schemas often define monetary field shapes"
}
```

To fix a gap (Stage 4 found something Stage 2 missed): add a glob entry here.

### `config/review-composition.json`

Dispatch policies. Controls which agents run for which domains/risks.

```json
{
  "id": "financial-domain-reviewer",
  "trigger": { "type": "domain", "domains": ["financial"] },
  "dispatch": "finance-sme",
  "priority": 80,
  "description": "..."
}
```

To dispatch a new agent for a domain: add a policy entry referencing the agent's registered `id`.

### `config/review-rules.json`

~60 rules defining what each agent checks. Consumed by: (1) agents as their checklist, (2) Stage 6 aggregator to enrich findings with context.

```json
{
  "id": "fin-bigjs-01",
  "name": "Financial arithmetic uses big.js",
  "severity": "critical",
  "agent": "finance-sme",
  "category": "financial-arithmetic",
  "description": "IEEE 754 causes silent rounding errors",
  "detection": "Arithmetic operators on monetary variables",
  "recommendation": "Use money(), round2(), toNumber() from lib/helpers/money.ts"
}
```

---

## How to Extend the Engine

### Add a new review domain

1. Add glob patterns to `config/review-domains.json`
2. Add a composition policy to `config/review-composition.json` pointing to the relevant agent
3. Run `npm test` — schema tests verify all policy references resolve

### Add a new review agent

1. Create the agent in `.claude/agents/your-agent.md` with structured JSON output format
2. Register it in `config/review-agents.json`
3. Add rules to `config/review-rules.json` with `"agent": "your-agent"`
4. Add composition policies to `config/review-composition.json`
5. Run `npm test` — schema tests catch orphan rules and unresolved references

### Add a new rule to an existing agent

1. Add the rule to `config/review-rules.json`
2. If the rule needs a new domain, add the domain mapping too
3. Run `npm test` to verify

### Change the gate thresholds

The gate is metric-based — you can't change "thresholds" without changing the severity of rules. To make the gate stricter: upgrade a `warning` rule to `major`. To relax: downgrade a `major` rule to `warning`.

---

## Schema Reference

### Config schemas (`lib/schemas/review-config.ts`)

| Schema | Fields |
|--------|--------|
| `reviewRuleSchema` | id, name, severity, agent, category, description, detection, recommendation |
| `compositionPolicySchema` | id, trigger (type, domains?, minRisk?), dispatch, priority, description |
| `agentRegistryEntrySchema` | id, name, tools, capabilities, description, outputFormat |
| `domainMappingSchema` | glob, domain, description |

### Pipeline schemas (`lib/schemas/review-pipeline.ts`)

| Schema | Stage | Key fields |
|--------|-------|-----------|
| `prFactsSchema` | 1 output | filesChanged, linesAdded, linesRemoved, commitMessages, branch |
| `prClassificationSchema` | 2 output | domains, riskScore, prType, scope |
| `agentManifestSchema` | 3/4 output | agentId, reason, focusFiles, priority |
| `gapLogEntrySchema` | 4 output | concern, location, recommendation |
| `reviewFindingSchema` | 5 output | id, severity, category, file, line, message, recommendation |
| `reviewReportSchema` | 6 output | gateDecision, findings, agentsDispatched, gapLog, summary |
| `gateDecisionSchema` | 6 output | decision, criticalCount, majorCount, warningCount, infoCount |

---

## Review Agents

| Agent | Capabilities | Triggered When | Output |
|-------|-------------|----------------|--------|
| `build-reviewer` | type-safety, dry, tailwind, naming, patterns, accessibility, schema-consistency | Always (universal) | `ReviewFinding[]` JSON |
| `finance-sme` | big-js, money-arithmetic, rounding, currency, financial-invariants | `financial`, `dtf-optimization` domains | `ReviewFinding[]` JSON |
| `design-auditor` | design-system, visual-hierarchy, mobile-responsive, accessibility, color-tokens, spacing | `ui-components`, `design-system` domains | `ReviewFinding[]` JSON |

When invoked **directly** (outside review orchestration), all three return human-readable audit reports in `agent-outputs/`.

---

## What's Coming Next

This engine handles **build-phase PR quality gates** (issues #337–#342 in epic #302). Future phases extend it without changing the core pipeline:

| Issue | What | When |
|-------|------|------|
| #308 | CI/GitHub Actions integration — run on `git push`, not just agent invocation | Phase 2 |
| #310 | New agents: security-reviewer, architecture-reviewer | Phase 2 |
| #312 | Pipeline review stage — holistic review before `main` merge (different from per-PR gate) | Phase 2 |
| #313 | TDD evaluation integration — gate on test coverage metrics | TBD |

---

## Related Sessions

- **Build session** (this epic's final sub-issue): https://github.com/cmbays/print-4ink/blob/main/knowledge-base/src/content/pipelines/2026-02-17-review-orchestration-engine.md
- **Skill file**: `.claude/skills/review-orchestration/SKILL.md`
- **Design doc**: `docs/plans/2026-02-16-review-orchestration-design.md`
- **Epic #302**: https://github.com/cmbays/print-4ink/issues/302
- **PR #407**: https://github.com/cmbays/print-4ink/pull/407
