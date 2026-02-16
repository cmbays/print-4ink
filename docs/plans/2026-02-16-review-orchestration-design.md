# Review Orchestration Engine — Design

**Date**: 2026-02-16
**Status**: Approved
**Epic**: #302 (Review Orchestration Engine)
**Sub-issues (Phase 1)**: #337 (Schemas), #338 (Config Data), #339 (Loaders + Tests), #340 (Pipeline Stages), #341 (Agent Migration), #342 (Skill + Protocol Integration)
**Sub-issues (Future)**: #308 (CI Integration), #310 (Agent Expansion), #312 (Pipeline Review Stage), #313 (TDD Evaluation)

---

## Problem

PR reviews today are manual and inconsistent. The human operator must prompt the building agent to "create a team of reviewers," manually deciding which agents to invoke and what to check. This leads to:

- **Random coverage**: Some PRs get thorough multi-agent reviews, others get a quick self-review
- **Missing specialized checks**: Financial calculations merged without `finance-sme`, UI changes without `design-auditor`
- **Growing technical debt**: Hard-coded values, repeated logic, and unextracted patterns slip through
- **The fox guarding the henhouse**: `build-session-protocol` relies on the building agent to self-invoke reviewers

As the project scales (7+ verticals, 529+ tests, stacked PRs across concurrent worktrees), manual review orchestration doesn't scale. We need a system that **automatically classifies PRs and dispatches the right review agents** as a quality gate before any build PR can merge.

## Scope

**In scope (this design)**: Automated quality gate on every build-phase PR (stacked PRs). The building agent's `build-session-protocol` Phase 2 invokes review orchestration automatically.

**Out of scope**:
- Pipeline review stage (full end-to-end review before main merge) — #312
- CI/GitHub Action integration — #308
- New agents (security, architecture, integration reviewers) — #310
- TDD evaluation — #313

## Professional Patterns Applied

This design is informed by research into 8 established software engineering patterns. We adopt these patterns because the review orchestration engine is infrastructure that must be extensible, robust, and maintainable as the project grows. Each pattern addresses a specific failure mode that ad-hoc review systems encounter at scale.

### 1. Rule Engine Pattern (Drools, OPA)

**What it is**: Decouples data (facts) from logic (rules) from execution (actions). Rules are declarative config, not imperative code.

**Why we apply it**: Review rules will be primarily authored by Claude agents via the gap feedback loop. Separating facts from rules from execution means:
- Adding a new rule = adding a config entry, not changing orchestration code
- PR metadata is immutable input that every stage reads but never mutates
- The dispatcher is dumb — it executes decisions, it doesn't make them

**How it manifests**: PR facts (Stage 1 output) are an immutable `PRFacts` object. Composition policies are declarative JSON config. The dispatcher just launches what the composer tells it to.

### 2. Quality Gate Pattern (SonarQube)

**What it is**: Severity-driven gating where gate conditions reference aggregate metrics, not individual rules. "0 blocking issues" auto-adapts as the rule set changes.

**Why we apply it**: Hard-coding gate logic ("if rule X fails, block merge") creates brittle gates that break when rules are added or removed. Metric-based gates are self-maintaining.

**How it manifests**: Gate decisions are computed from severity counts: `critical > 0 → FAIL`, `major > 0 → NEEDS_FIXES`, `warning > 0 → PASS_WITH_WARNINGS`. Adding new critical rules automatically makes the gate stricter without changing gate logic.

### 3. Uniform Finding Format (ESLint, Semgrep, CodeClimate)

**What it is**: All findings from all analyzers share the same structure: severity, category, file, line, message. Enables machine aggregation regardless of source.

**Why we apply it**: We have 3 review agents today, growing to 6+. Without a uniform schema, the aggregator needs agent-specific parsers — fragile and hard to maintain. With a uniform schema, the aggregator is agent-agnostic.

**How it manifests**: Every agent outputs `ReviewFinding[]` conforming to a single Zod schema. The aggregator merges, dedupes, and sorts without knowing which agent produced which finding.

### 4. Plugin Architecture (ESLint, Webpack)

**What it is**: Agents are plugins registered in config, loaded at runtime. Adding a new reviewer = adding a config entry.

**Why we apply it**: The review system must be extensible without code changes. New agents from #310 (security-reviewer, architecture-reviewer) should plug in by adding config entries.

**How it manifests**: `config/review-agents.json` is the agent registry. Composition policies reference agent IDs from this registry. The dispatcher loads agents by ID.

### 5. Pipeline / Middleware Pattern (Koa, Express)

**What it is**: Multi-stage processing where each stage does one thing, stages are independently testable, and context propagates through the chain.

**Why we apply it**: The orchestration has 6 stages (normalize → classify → compose → gap-detect → dispatch → aggregate). Each stage has clear input/output contracts. This makes the pipeline testable at each boundary and stages can be swapped or extended independently.

**How it manifests**: Each stage is a function: `(input: StageNInput) → StageNOutput`. Stages are composed in a pipeline. Each stage's output is the next stage's input, validated by Zod schemas at each boundary.

### 6. Policy as Code (OPA/Rego)

**What it is**: Decision logic expressed as declarative policies with pure input/output contracts. Same input always yields same output.

**Why we apply it**: Composition rules ("when financial code changes, dispatch finance-sme") are policy decisions. Expressing them declaratively in config means they can be audited, tested, and modified without touching orchestration code.

**How it manifests**: `config/review-composition.json` contains composition policies with `trigger` conditions and `dispatch` actions. The composer evaluates policies against PR classification — pure function, no side effects.

### 7. Batch Reporting (Danger.js)

**What it is**: Post all findings in one atomic update, not individual comments. Users see the complete picture.

**Why we apply it**: Individual PR comments per finding create noise and are hard to dismiss. A single structured report with severity breakdown gives the building agent (and human) a clear picture of what to fix.

**How it manifests**: The aggregator produces a single `ReviewReport` with findings grouped by severity, a gate decision, and gap log. This is consumed by the building agent to decide what to fix.

## Architecture

### Pipeline Stages

```
Building agent finishes implementation
       │
       ▼
build-session-protocol Phase 2 triggers
       │
       ▼
┌──────────────────────────────────────┐
│  Stage 1: NORMALIZE                  │
│  Extract PR facts (immutable input)  │
│  • files changed, lines changed      │
│  • file→domain mapping (config)      │
│  • commit metadata                   │
│  Output: PRFacts (Zod-validated)     │
└────────────┬─────────────────────────┘
             │
             ▼
┌──────────────────────────────────────┐
│  Stage 2: CLASSIFY (config base)     │
│  Deterministic pattern matching      │
│  • Glob→domain rules from config     │
│  • Risk scoring (lines, domains)     │
│  • PR type inference                 │
│  Output: PRClassification            │
└────────────┬─────────────────────────┘
             │
             ▼
┌──────────────────────────────────────┐
│  Stage 3: COMPOSE (policy engine)    │
│  Declarative rules → agent manifest  │
│  • Universal policies: always run    │
│  • Domain policies: triggered        │
│  • Risk escalation: severity-based   │
│  Output: AgentManifest[]             │
└────────────┬─────────────────────────┘
             │
             ▼
┌──────────────────────────────────────┐
│  Stage 4: GAP DETECT (LLM layer)    │
│  LLM analyzes diff for concerns     │
│  the config-based classifier missed  │
│  • Amends AgentManifest if needed    │
│  • Logs gaps for feedback loop       │
│  Output: AgentManifest (amended)     │
│        + GapLog[]                    │
└────────────┬─────────────────────────┘
             │
             ▼
┌──────────────────────────────────────┐
│  Stage 5: DISPATCH (parallel)        │
│  Launch agents from manifest         │
│  • Independent agents run parallel   │
│  • Each outputs ReviewFinding[]      │
│  • Timeout + retry per agent         │
│  Output: ReviewFinding[] per agent   │
└────────────┬─────────────────────────┘
             │
             ▼
┌──────────────────────────────────────┐
│  Stage 6: AGGREGATE                  │
│  Merge all findings, dedupe          │
│  • Severity-based gate decision      │
│  • Batch into single report          │
│  • Gap log → deferred issues         │
│  Output: ReviewReport + GateDecision │
└──────────────────────────────────────┘
```

### Three-Layer Classifier

1. **Config base** (Stage 2) — deterministic glob→domain matching from `config/review-domains.json`. Fast, no LLM call.
2. **LLM gap detector** (Stage 4) — analyzes the diff for concerns the config missed. Dispatches additional agents if needed.
3. **Gap logger** (Stage 4) — records what the config missed. Surfaces in wrap-up phase as GitHub issues to update the rules config. Self-improving system.

### Gate Decision Logic

Metric-based, not rule-based (SonarQube pattern):

| Condition | Decision | Action |
|-----------|----------|--------|
| `critical > 0` | `fail` | Building agent must fix before proceeding |
| `major > 0` | `needs_fixes` | Building agent should fix |
| `warning > 0` | `pass_with_warnings` | Create tech-debt issues for deferred items |
| All clean | `pass` | Proceed to PR creation |

## Schema-Driven Design

All config and pipeline data is schema-validated. Schemas are the source of truth, config is data that must conform, and tests verify the contract.

### Config Schemas (`lib/schemas/review-config.ts`)

| Schema | Validates |
|--------|-----------|
| `reviewRuleSchema` | Single review rule (id, name, severity, agent, description, detection, etc.) |
| `compositionPolicySchema` | When to dispatch which agent (trigger conditions, dispatch target, priority) |
| `agentRegistryEntrySchema` | Agent metadata (id, name, tools, capabilities) |
| `domainMappingSchema` | File glob pattern → domain classification |

### Pipeline Schemas (`lib/schemas/review-pipeline.ts`)

| Schema | Validates | Stage |
|--------|-----------|-------|
| `prFactsSchema` | Immutable PR metadata | Stage 1 output |
| `prClassificationSchema` | Domains, risk, type, scope | Stage 2 output |
| `agentManifestSchema` | Which agents to dispatch with scope | Stage 3 output |
| `gapLogEntrySchema` | What the config missed + recommendation | Stage 4 output |
| `reviewFindingSchema` | Single finding from any agent (uniform format) | Stage 5 output |
| `reviewReportSchema` | Aggregated report with all findings | Stage 6 output |
| `gateDecisionSchema` | PASS / NEEDS_FIXES / FAIL with metrics | Stage 6 output |

### Config Files

| File | Schema | Contents |
|------|--------|----------|
| `config/review-rules.json` | `reviewRuleSchema[]` | ~60 rules for existing agents |
| `config/review-composition.json` | `compositionPolicySchema[]` | Dispatch policies |
| `config/review-agents.json` | `agentRegistryEntrySchema[]` | Agent registry |
| `config/review-domains.json` | `domainMappingSchema[]` | Glob→domain mappings |

### Loaders (`lib/review/load-config.ts`)

Every consumer goes through validated loaders. Raw JSON is never imported directly by pipeline stages.

### Test Coverage (`__tests__/review-config.test.ts`)

- All rules have required fields (schema validation)
- All rule IDs are unique
- All agent references resolve to registered agents
- All severity values are valid enum members
- All composition policies reference valid domains
- All domain mappings are valid glob patterns
- No orphan rules (rules without a composition policy dispatching their agent)
- Universal policies exist (trigger.type === "always")
- Priority values within 0-100 range
- Description fields are non-empty (documentation as validated data)

## Agent Migration

The 3 existing review agents (`build-reviewer`, `finance-sme`, `design-auditor`) currently output markdown reports. They must be migrated to output structured JSON conforming to `reviewFindingSchema`.

**What changes in each agent prompt**:
- Add structured output format section requiring `ReviewFinding[]` JSON
- Keep the existing review logic (what they check, how they scan)
- Remove markdown table output format, replace with JSON

**What stays the same**:
- Read-only (agents don't modify code)
- Same tools (Read, Grep, Glob)
- Same domain expertise and scan strategies

## build-session-protocol Integration

Phase 2 (Self-Review) of `build-session-protocol` currently says "launch sub-agent reviews" with manual agent selection. This changes to:

**Before** (manual):
```
Phase 2: Self-Review
7. Use build-reviewer agent to check for...
8. If diff touches financial files, use finance-sme agent...
9. Security scan (manual checklist)
```

**After** (automated):
```
Phase 2: Self-Review
7. Invoke review orchestration skill
   - Skill runs the full 6-stage pipeline automatically
   - Returns ReviewReport with gate decision
8. If gate = FAIL or NEEDS_FIXES:
   - Fix all critical/major findings
   - Re-run review orchestration
9. If gate = PASS or PASS_WITH_WARNINGS:
   - Proceed to Phase 3 (Create PR)
   - Include review summary in PR body
```

## File Structure

```
config/
  review-rules.json           # Rule definitions (~60 rules)
  review-composition.json     # Composition policies
  review-agents.json          # Agent registry
  review-domains.json         # Glob→domain mappings

lib/schemas/
  review-config.ts            # Zod schemas for config files
  review-pipeline.ts          # Zod schemas for pipeline data

lib/review/
  load-config.ts              # Config loaders with validation
  normalize.ts                # Stage 1: Extract PR facts
  classify.ts                 # Stage 2: Deterministic classification
  compose.ts                  # Stage 3: Policy evaluation
  gap-detect.ts               # Stage 4: LLM gap detection
  dispatch.ts                 # Stage 5: Agent launching
  aggregate.ts                # Stage 6: Finding aggregation + gating

__tests__/
  review-config.test.ts       # Config validation tests
  review-pipeline.test.ts     # Pipeline stage unit tests

.claude/skills/
  review-orchestration/
    SKILL.md                  # Skill definition (invoked by build-session-protocol)

.claude/agents/
  build-reviewer.md           # Updated: structured JSON output
  finance-sme.md              # Updated: structured JSON output
  design-auditor.md           # Updated: structured JSON output
```

## End Goal

A building agent finishing implementation invokes the review orchestration skill as part of `build-session-protocol` Phase 2. The skill automatically:

1. Analyzes what changed
2. Determines which review agents are needed
3. Dispatches them in parallel
4. Aggregates their findings into a unified report
5. Gates the PR based on severity metrics
6. Logs any gaps in the rules config for future improvement

No human prompting required. No manual agent selection. Consistent, comprehensive, automated quality gates on every build PR.

## Design Decisions Log

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Config format | JSON | Agent-authored rules need strict parsing; description fields = validated documentation (unlike YAML comments which are invisible to Zod) |
| Invocation model | build-session-protocol integration | Quality gate on every build PR, not a manual command |
| Classifier layers | Config base + LLM gap detector + gap logger | Deterministic base for speed, LLM for coverage, gap log for self-improvement |
| Rule scope | Existing agents only (~60 rules) | New agents (#310) are a separate issue |
| Schema separation | Config schemas + pipeline schemas | Data at rest vs data in motion — separate concerns |
| Gate logic | Severity metrics, not rule counts | Self-maintaining as rules are added/removed |
| Agent output | Structured JSON (migrated from markdown) | Enables machine aggregation across agents |
| `work review` command | Out of scope (pipeline review stage, #312) | Different concern — holistic review vs per-PR quality gate |
