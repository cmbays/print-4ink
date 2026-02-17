# Review Pipeline Stages Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement the 6-stage review orchestration pipeline (normalize, classify, compose, gap-detect, dispatch, aggregate) plus the orchestrator that composes them.

**Architecture:** Each stage is a pure function with typed input/output contracts validated by Zod schemas at every boundary. Stages 1-3 and 6 are deterministic pure functions. Stage 4 (gap-detect) is an LLM-guided analysis step that runs within the orchestrating agent. Stage 5 (dispatch) launches review sub-agents in parallel via the Task tool. The orchestrator composes all 6 stages sequentially, threading validated output from each stage into the next.

**Tech Stack:** TypeScript, Zod (schemas locked in `lib/schemas/review-pipeline.ts` + `lib/schemas/review-config.ts`), picomatch (glob matching, transitive dep v2.x), `execSync` from `child_process` (git diff — branch names are internal data, not user input), Vitest (tests).

**Existing artifacts:**
- Schemas: `lib/schemas/review-pipeline.ts`, `lib/schemas/review-config.ts`
- Config data: `config/review-{rules,composition,agents,domains}.json`
- Config loaders: `lib/review/load-config.ts`
- Design doc: `docs/plans/2026-02-16-review-orchestration-design.md`

**Security note:** The normalize stage shells out to `git diff` / `git log` with branch names derived from internal pipeline state (never from user input). The arguments are not interpolated from external data and do not require shell escaping. This is safe for the same reason that `git worktree add` commands in CLAUDE.md use branch names directly.

---

## Task 1: Stage 1 — Normalize (git diff to PRFacts)

**Files:**
- Create: `lib/review/normalize.ts`
- Create: `lib/review/__tests__/normalize.test.ts`

**Context:** This stage extracts immutable PR facts from the current branch's git diff. It shells out to `git diff --numstat` and `git diff --name-status -M` against the base branch. Binary files show `-` in numstat — parse as 0 additions/deletions. The output must conform to `prFactsSchema`.

**Step 1: Write the failing test**

```typescript
// lib/review/__tests__/normalize.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { prFactsSchema } from "@/lib/schemas/review-pipeline";

// Mock child_process to avoid real git calls in tests
vi.mock("child_process", () => ({
  execSync: vi.fn(),
}));

import { execSync } from "child_process";
import { normalize } from "../normalize";

const mockedExecSync = vi.mocked(execSync);

describe("normalize", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("parses a simple diff with added and modified files", () => {
    mockedExecSync.mockImplementation((cmd: string) => {
      const cmdStr = String(cmd);
      if (cmdStr.includes("--numstat")) {
        return Buffer.from(
          "10\t2\tlib/review/normalize.ts\n5\t0\tlib/review/classify.ts\n"
        );
      }
      if (cmdStr.includes("--name-status")) {
        return Buffer.from("M\tlib/review/normalize.ts\nA\tlib/review/classify.ts\n");
      }
      if (cmdStr.includes("git log")) {
        return Buffer.from('abc1234\x00feat: add normalize stage\x00Claude\n');
      }
      if (cmdStr.includes("git diff")) {
        return Buffer.from("diff --git a/lib/review/normalize.ts...");
      }
      return Buffer.from("");
    });

    const result = normalize("session/0216-test", "main");
    const parsed = prFactsSchema.parse(result);

    expect(parsed.branch).toBe("session/0216-test");
    expect(parsed.baseBranch).toBe("main");
    expect(parsed.files).toHaveLength(2);
    expect(parsed.files[0]).toMatchObject({
      path: "lib/review/normalize.ts",
      additions: 10,
      deletions: 2,
      status: "modified",
    });
    expect(parsed.files[1]).toMatchObject({
      path: "lib/review/classify.ts",
      additions: 5,
      deletions: 0,
      status: "added",
    });
    expect(parsed.totalAdditions).toBe(15);
    expect(parsed.totalDeletions).toBe(2);
    expect(parsed.commits).toHaveLength(1);
  });

  it("handles binary files (- in numstat) as 0 additions/deletions", () => {
    mockedExecSync.mockImplementation((cmd: string) => {
      const cmdStr = String(cmd);
      if (cmdStr.includes("--numstat")) {
        return Buffer.from("-\t-\tassets/logo.png\n3\t1\tREADME.md\n");
      }
      if (cmdStr.includes("--name-status")) {
        return Buffer.from("A\tassets/logo.png\nM\tREADME.md\n");
      }
      if (cmdStr.includes("git log")) {
        return Buffer.from('def5678\x00docs: update readme\x00Claude\n');
      }
      return Buffer.from("");
    });

    const result = normalize("session/0216-test", "main");
    const parsed = prFactsSchema.parse(result);

    const binaryFile = parsed.files.find((f) => f.path === "assets/logo.png");
    expect(binaryFile).toBeDefined();
    expect(binaryFile!.additions).toBe(0);
    expect(binaryFile!.deletions).toBe(0);
    expect(parsed.totalAdditions).toBe(3);
    expect(parsed.totalDeletions).toBe(1);
  });

  it("handles renamed files from --name-status -M", () => {
    mockedExecSync.mockImplementation((cmd: string) => {
      const cmdStr = String(cmd);
      if (cmdStr.includes("--numstat")) {
        return Buffer.from("2\t1\tlib/{old.ts => new.ts}\n");
      }
      if (cmdStr.includes("--name-status")) {
        return Buffer.from("R100\told.ts\tnew.ts\n");
      }
      if (cmdStr.includes("git log")) {
        return Buffer.from('aaa1111\x00refactor: rename\x00Claude\n');
      }
      return Buffer.from("");
    });

    const result = normalize("session/0216-test", "main");
    const parsed = prFactsSchema.parse(result);

    expect(parsed.files[0].status).toBe("renamed");
    expect(parsed.files[0].path).toBe("new.ts");
  });

  it("handles empty diff (no changes)", () => {
    mockedExecSync.mockImplementation((cmd: string) => {
      const cmdStr = String(cmd);
      if (cmdStr.includes("git log")) {
        return Buffer.from('bbb2222\x00chore: empty\x00Claude\n');
      }
      return Buffer.from("");
    });

    const result = normalize("session/0216-test", "main");
    const parsed = prFactsSchema.parse(result);
    expect(parsed.files).toHaveLength(0);
    expect(parsed.totalAdditions).toBe(0);
    expect(parsed.totalDeletions).toBe(0);
  });

  it("handles deleted files", () => {
    mockedExecSync.mockImplementation((cmd: string) => {
      const cmdStr = String(cmd);
      if (cmdStr.includes("--numstat")) {
        return Buffer.from("0\t50\tlib/old-file.ts\n");
      }
      if (cmdStr.includes("--name-status")) {
        return Buffer.from("D\tlib/old-file.ts\n");
      }
      if (cmdStr.includes("git log")) {
        return Buffer.from('ccc3333\x00chore: remove old file\x00Claude\n');
      }
      return Buffer.from("");
    });

    const result = normalize("session/0216-test", "main");
    const parsed = prFactsSchema.parse(result);
    expect(parsed.files[0].status).toBe("deleted");
    expect(parsed.files[0].deletions).toBe(50);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run lib/review/__tests__/normalize.test.ts`
Expected: FAIL — `normalize` module not found

**Step 3: Write minimal implementation**

```typescript
// lib/review/normalize.ts
import { execSync } from "child_process";
import type { PRFacts, FileChange, CommitInfo } from "@/lib/schemas/review-pipeline";

/**
 * Stage 1: Normalize — Extract immutable PR facts from git diff.
 *
 * Shells out to git to gather:
 * - File changes via `git diff --numstat` and `git diff --name-status -M`
 * - Commit metadata via `git log`
 * - Full diff content via `git diff`
 *
 * Security: branch/baseBranch are internal pipeline data (not user input).
 */
export function normalize(branch: string, baseBranch: string): PRFacts {
  const diffRange = `${baseBranch}...${branch}`;

  const numstatRaw = execSync(`git diff --numstat ${diffRange}`, {
    encoding: "utf-8",
  }).trim();

  const nameStatusRaw = execSync(
    `git diff --name-status -M ${diffRange}`,
    { encoding: "utf-8" }
  ).trim();

  const logRaw = execSync(
    `git log --format='%H%x00%s%x00%an' ${diffRange}`,
    { encoding: "utf-8" }
  ).trim();

  let diffContent: string | undefined;
  try {
    const raw = execSync(`git diff ${diffRange}`, { encoding: "utf-8" }).trim();
    if (raw.length > 0) diffContent = raw;
  } catch {
    // diff content is optional
  }

  const numstatLines = numstatRaw ? numstatRaw.split("\n") : [];
  const nameStatusLines = nameStatusRaw ? nameStatusRaw.split("\n") : [];

  // Build status map from name-status output
  const statusMap = new Map<string, { status: FileChange["status"]; newPath?: string }>();
  for (const line of nameStatusLines) {
    if (!line.trim()) continue;
    const parts = line.split("\t");
    const statusCode = parts[0];

    if (statusCode.startsWith("R")) {
      statusMap.set(parts[1], { status: "renamed", newPath: parts[2] });
    } else if (statusCode === "A") {
      statusMap.set(parts[1], { status: "added" });
    } else if (statusCode === "D") {
      statusMap.set(parts[1], { status: "deleted" });
    } else if (statusCode === "M") {
      statusMap.set(parts[1], { status: "modified" });
    }
  }

  // Parse numstat lines and merge with status info
  const files: FileChange[] = [];
  for (const line of numstatLines) {
    if (!line.trim()) continue;
    const parts = line.split("\t");
    const additions = parts[0] === "-" ? 0 : parseInt(parts[0], 10);
    const deletions = parts[1] === "-" ? 0 : parseInt(parts[1], 10);
    const rawPath = parts[2];

    let filePath = rawPath;
    let status: FileChange["status"] = "modified";

    // Check for renames in statusMap
    for (const [key, value] of statusMap.entries()) {
      if (value.status === "renamed" && value.newPath) {
        if (rawPath.includes("=>") || key === rawPath) {
          filePath = value.newPath;
          status = "renamed";
          statusMap.delete(key);
          break;
        }
      }
    }

    if (status !== "renamed") {
      const statusEntry = statusMap.get(rawPath);
      if (statusEntry) {
        status = statusEntry.status;
        filePath = statusEntry.newPath ?? rawPath;
      }
    }

    files.push({ path: filePath, additions, deletions, status });
  }

  // Include files from name-status not in numstat (e.g., pure binary)
  const numstatPaths = new Set(files.map((f) => f.path));
  for (const [path, entry] of statusMap.entries()) {
    const resolvedPath = entry.newPath ?? path;
    if (!numstatPaths.has(resolvedPath) && !numstatPaths.has(path)) {
      files.push({ path: resolvedPath, additions: 0, deletions: 0, status: entry.status });
    }
  }

  const totalAdditions = files.reduce((sum, f) => sum + f.additions, 0);
  const totalDeletions = files.reduce((sum, f) => sum + f.deletions, 0);

  const commits: CommitInfo[] = [];
  if (logRaw) {
    for (const line of logRaw.split("\n")) {
      if (!line.trim()) continue;
      const [sha, message, author] = line.split("\0");
      if (sha && message && author) {
        commits.push({ sha, message, author });
      }
    }
  }

  return { branch, baseBranch, files, totalAdditions, totalDeletions, commits, diffContent };
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run lib/review/__tests__/normalize.test.ts`
Expected: All 5 tests PASS

**Step 5: Commit**

```bash
git add lib/review/normalize.ts lib/review/__tests__/normalize.test.ts
git commit -m "feat(review): Stage 1 — normalize (git diff to PRFacts)"
git push -u origin session/0216-i340-review-pipeline-stages
```

---

## Task 2: Stage 2 — Classify (PRFacts to PRClassification)

**Files:**
- Create: `lib/review/classify.ts`
- Create: `lib/review/__tests__/classify.test.ts`

**Context:** Deterministic classification using glob-to-domain matching from `config/review-domains.json`. Uses `picomatch` (transitive dep v2.x — API: `picomatch.isMatch(path, pattern)`). Risk scoring algorithm: scope (line count) x domain severity yields 0-100 riskScore which maps to riskLevel enum via thresholds. Scope: small (<100 lines), medium (100-500), large (>500). PR type inferred from commit message prefixes and file paths.

**Step 1: Write the failing test**

```typescript
// lib/review/__tests__/classify.test.ts
import { describe, it, expect } from "vitest";
import { prClassificationSchema, type PRFacts } from "@/lib/schemas/review-pipeline";
import { classify } from "../classify";

function makeFacts(overrides: Partial<PRFacts> = {}): PRFacts {
  return {
    branch: "session/0216-test",
    baseBranch: "main",
    files: [],
    totalAdditions: 0,
    totalDeletions: 0,
    commits: [{ sha: "abc123", message: "feat: test", author: "Claude" }],
    ...overrides,
  };
}

describe("classify", () => {
  it("classifies a small feature PR touching financial domain", () => {
    const facts = makeFacts({
      files: [
        { path: "lib/helpers/money.ts", additions: 10, deletions: 2, status: "modified" },
        { path: "components/features/quotes/QuoteTotal.tsx", additions: 20, deletions: 5, status: "modified" },
      ],
      totalAdditions: 30,
      totalDeletions: 7,
      commits: [{ sha: "abc123", message: "feat: add quote total", author: "Claude" }],
    });

    const result = classify(facts);
    const parsed = prClassificationSchema.parse(result);

    expect(parsed.domains).toContain("financial");
    expect(parsed.type).toBe("feature");
    expect(parsed.scope).toBe("small");
    expect(parsed.filesChanged).toBe(2);
    expect(parsed.linesChanged).toBe(37);
    expect(parsed.riskScore).toBeGreaterThanOrEqual(0);
    expect(parsed.riskScore).toBeLessThanOrEqual(100);
  });

  it("classifies a large refactor PR as high risk", () => {
    const facts = makeFacts({
      files: [
        { path: "lib/schemas/quote.ts", additions: 200, deletions: 150, status: "modified" },
        { path: "lib/schemas/invoice.ts", additions: 100, deletions: 80, status: "modified" },
        { path: "components/features/quotes/QuoteForm.tsx", additions: 150, deletions: 100, status: "modified" },
        { path: "app/(dashboard)/quotes/page.tsx", additions: 50, deletions: 30, status: "modified" },
        { path: "lib/helpers/money.ts", additions: 20, deletions: 10, status: "modified" },
      ],
      totalAdditions: 520,
      totalDeletions: 370,
      commits: [{ sha: "def456", message: "refactor: restructure quote pipeline", author: "Claude" }],
    });

    const result = classify(facts);
    const parsed = prClassificationSchema.parse(result);

    expect(parsed.scope).toBe("large");
    expect(parsed.type).toBe("refactor");
    expect(parsed.domains).toContain("schemas");
    expect(parsed.domains).toContain("financial");
    expect(parsed.riskLevel).toMatch(/high|critical/);
  });

  it("classifies a docs-only PR as low risk", () => {
    const facts = makeFacts({
      files: [
        { path: "docs/ROADMAP.md", additions: 10, deletions: 2, status: "modified" },
      ],
      totalAdditions: 10,
      totalDeletions: 2,
      commits: [{ sha: "ghi789", message: "docs: update roadmap", author: "Claude" }],
    });

    const result = classify(facts);
    const parsed = prClassificationSchema.parse(result);

    expect(parsed.type).toBe("docs");
    expect(parsed.domains).toContain("documentation");
    expect(parsed.riskLevel).toBe("low");
    expect(parsed.scope).toBe("small");
  });

  it("classifies a test-only PR correctly", () => {
    const facts = makeFacts({
      files: [
        { path: "lib/review/__tests__/normalize.test.ts", additions: 80, deletions: 0, status: "added" },
      ],
      totalAdditions: 80,
      totalDeletions: 0,
      commits: [{ sha: "jkl012", message: "test: add normalize tests", author: "Claude" }],
    });

    const result = classify(facts);
    const parsed = prClassificationSchema.parse(result);

    expect(parsed.type).toBe("test");
    expect(parsed.domains).toContain("testing");
  });

  it("classifies mixed PR with multiple domains", () => {
    const facts = makeFacts({
      files: [
        { path: "lib/helpers/money.ts", additions: 5, deletions: 1, status: "modified" },
        { path: "components/ui/button.tsx", additions: 10, deletions: 3, status: "modified" },
        { path: "docs/ROADMAP.md", additions: 5, deletions: 2, status: "modified" },
      ],
      totalAdditions: 20,
      totalDeletions: 6,
      commits: [
        { sha: "mno345", message: "feat: update button and money helper", author: "Claude" },
        { sha: "pqr678", message: "docs: update roadmap", author: "Claude" },
      ],
    });

    const result = classify(facts);
    const parsed = prClassificationSchema.parse(result);

    expect(parsed.type).toBe("mixed");
    expect(parsed.domains.length).toBeGreaterThanOrEqual(2);
  });

  it("handles empty diff (no files)", () => {
    const facts = makeFacts();

    const result = classify(facts);
    const parsed = prClassificationSchema.parse(result);

    expect(parsed.filesChanged).toBe(0);
    expect(parsed.linesChanged).toBe(0);
    expect(parsed.scope).toBe("small");
    expect(parsed.riskLevel).toBe("low");
    expect(parsed.domains).toHaveLength(0);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run lib/review/__tests__/classify.test.ts`
Expected: FAIL — `classify` module not found

**Step 3: Write minimal implementation**

```typescript
// lib/review/classify.ts
import picomatch from "picomatch";
import { loadDomainMappings } from "./load-config";
import type { PRFacts, PRClassification, PRType, PRScope } from "@/lib/schemas/review-pipeline";
import type { ReviewRiskLevel } from "@/lib/schemas/review-config";

// Domain severity weights for risk calculation
const DOMAIN_SEVERITY: Record<string, number> = {
  financial: 30,
  "dtf-optimization": 25,
  schemas: 20,
  infrastructure: 15,
  "ui-components": 10,
  "design-system": 10,
  "data-layer": 10,
  testing: 5,
  documentation: 5,
};

const DEFAULT_DOMAIN_SEVERITY = 10;

/**
 * Stage 2: Classify — Deterministic pattern matching against config.
 *
 * Maps changed files to domains via picomatch glob patterns, computes risk
 * from line count + domain count + domain severity, infers PR type from
 * file paths and commit messages.
 */
export function classify(facts: PRFacts): PRClassification {
  const domainMappings = loadDomainMappings();
  const linesChanged = facts.totalAdditions + facts.totalDeletions;
  const filesChanged = facts.files.length;

  // Map files to domains
  const domainSet = new Set<string>();
  for (const file of facts.files) {
    for (const mapping of domainMappings) {
      if (picomatch.isMatch(file.path, mapping.pattern)) {
        domainSet.add(mapping.domain);
      }
    }
  }
  const domains = [...domainSet];

  const scope = inferScope(linesChanged);
  const riskScore = computeRiskScore(linesChanged, domains, filesChanged);
  const riskLevel = deriveRiskLevel(riskScore);
  const type = inferPRType(facts);

  return { type, riskLevel, riskScore, domains, scope, filesChanged, linesChanged };
}

function inferScope(linesChanged: number): PRScope {
  if (linesChanged > 500) return "large";
  if (linesChanged >= 100) return "medium";
  return "small";
}

function computeRiskScore(linesChanged: number, domains: string[], filesChanged: number): number {
  // Line-count component (0-40): logarithmic scale
  const lineScore = Math.min(40, Math.round(Math.log2(linesChanged + 1) * 4));
  // Domain severity component (0-40): sum of triggered domain severities
  const domainScore = Math.min(
    40,
    domains.reduce((sum, d) => sum + (DOMAIN_SEVERITY[d] ?? DEFAULT_DOMAIN_SEVERITY), 0)
  );
  // File spread component (0-20): more files = more integration risk
  const fileScore = Math.min(20, filesChanged * 2);

  return Math.min(100, lineScore + domainScore + fileScore);
}

function deriveRiskLevel(score: number): ReviewRiskLevel {
  if (score >= 75) return "critical";
  if (score >= 50) return "high";
  if (score >= 25) return "medium";
  return "low";
}

function inferPRType(facts: PRFacts): PRType {
  const messages = facts.commits.map((c) => c.message.toLowerCase());
  const paths = facts.files.map((f) => f.path);

  const hasFeature = messages.some((m) => m.startsWith("feat"));
  const hasFix = messages.some((m) => m.startsWith("fix"));
  const hasRefactor = messages.some((m) => m.startsWith("refactor"));
  const hasDocs = messages.some((m) => m.startsWith("docs"));
  const hasTest = messages.some((m) => m.startsWith("test"));
  const hasChore = messages.some((m) => m.startsWith("chore"));

  const types = [hasFeature, hasFix, hasRefactor, hasDocs, hasTest, hasChore].filter(Boolean);
  if (types.length > 1) return "mixed";

  if (hasFeature) return "feature";
  if (hasFix) return "bugfix";
  if (hasRefactor) return "refactor";

  const allDocs = paths.every((p) => p.startsWith("docs/") || p.startsWith("knowledge-base/") || p.endsWith(".md"));
  if (hasDocs || allDocs) return "docs";

  const allTests = paths.every((p) => p.includes("__tests__") || p.includes(".test."));
  if (hasTest || allTests) return "test";

  if (hasChore) return "chore";
  return "feature";
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run lib/review/__tests__/classify.test.ts`
Expected: All 6 tests PASS

**Step 5: Commit**

```bash
git add lib/review/classify.ts lib/review/__tests__/classify.test.ts
git commit -m "feat(review): Stage 2 — classify (PRFacts to PRClassification)"
git push
```

---

## Task 3: Stage 3 — Compose (PRClassification to AgentManifestEntry[])

**Files:**
- Create: `lib/review/compose.ts`
- Create: `lib/review/__tests__/compose.test.ts`

**Context:** Policy engine that evaluates composition policies against the classification. For each policy in `review-composition.json`, check if its trigger matches the classification. If so, add the agent to the manifest with scope (relevant file paths) and rules (from `review-rules.json` filtered by agent). Sort by priority descending.

Trigger evaluation:
- `type: "always"` — always matches
- `type: "domain"` — matches if any of the trigger's domains appear in classification.domains
- `type: "risk"` — matches if classification.riskLevel >= trigger.riskLevel (ordered: low < medium < high < critical)
- `type: "content"` — matches if diffContent contains the pattern (regex)

**Step 1: Write the failing test**

```typescript
// lib/review/__tests__/compose.test.ts
import { describe, it, expect } from "vitest";
import { agentManifestEntrySchema } from "@/lib/schemas/review-pipeline";
import type { PRClassification, PRFacts } from "@/lib/schemas/review-pipeline";
import { z } from "zod";
import { compose } from "../compose";

function makeClassification(overrides: Partial<PRClassification> = {}): PRClassification {
  return {
    type: "feature",
    riskLevel: "low",
    riskScore: 20,
    domains: [],
    scope: "small",
    filesChanged: 1,
    linesChanged: 20,
    ...overrides,
  };
}

function makeFacts(overrides: Partial<PRFacts> = {}): PRFacts {
  return {
    branch: "session/0216-test",
    baseBranch: "main",
    files: [],
    totalAdditions: 0,
    totalDeletions: 0,
    commits: [{ sha: "abc123", message: "feat: test", author: "Claude" }],
    ...overrides,
  };
}

describe("compose", () => {
  it("always dispatches build-reviewer (universal policy)", () => {
    const classification = makeClassification();
    const facts = makeFacts();

    const manifest = compose(classification, facts);
    z.array(agentManifestEntrySchema).parse(manifest);

    const buildReviewer = manifest.find((e) => e.agentId === "build-reviewer");
    expect(buildReviewer).toBeDefined();
    expect(buildReviewer!.triggeredBy).toBe("universal-build-reviewer");
  });

  it("dispatches finance-sme when financial domain is present", () => {
    const classification = makeClassification({ domains: ["financial"] });
    const facts = makeFacts({
      files: [{ path: "lib/helpers/money.ts", additions: 5, deletions: 1, status: "modified" }],
    });

    const manifest = compose(classification, facts);
    const financeSme = manifest.find((e) => e.agentId === "finance-sme");
    expect(financeSme).toBeDefined();
    expect(financeSme!.scope).toContain("lib/helpers/money.ts");
    expect(financeSme!.triggeredBy).toBe("financial-domain-reviewer");
  });

  it("dispatches design-auditor when ui-components domain is present", () => {
    const classification = makeClassification({ domains: ["ui-components"] });
    const facts = makeFacts({
      files: [{ path: "components/features/quotes/QuoteCard.tsx", additions: 20, deletions: 5, status: "modified" }],
    });

    const manifest = compose(classification, facts);
    const designAuditor = manifest.find((e) => e.agentId === "design-auditor");
    expect(designAuditor).toBeDefined();
    expect(designAuditor!.scope).toContain("components/features/quotes/QuoteCard.tsx");
  });

  it("includes rules for each dispatched agent", () => {
    const classification = makeClassification({ domains: ["financial"] });
    const facts = makeFacts({
      files: [{ path: "lib/helpers/money.ts", additions: 5, deletions: 1, status: "modified" }],
    });

    const manifest = compose(classification, facts);
    const financeSme = manifest.find((e) => e.agentId === "finance-sme");
    expect(financeSme).toBeDefined();
    expect(financeSme!.rules.length).toBeGreaterThan(0);
    expect(financeSme!.rules.some((r) => r.startsWith("D-FIN-"))).toBe(true);
  });

  it("sorts manifest by priority descending", () => {
    const classification = makeClassification({ domains: ["financial", "ui-components"] });
    const facts = makeFacts({
      files: [
        { path: "lib/helpers/money.ts", additions: 5, deletions: 1, status: "modified" },
        { path: "components/features/quotes/QuoteCard.tsx", additions: 10, deletions: 2, status: "modified" },
      ],
    });

    const manifest = compose(classification, facts);
    for (let i = 1; i < manifest.length; i++) {
      expect(manifest[i - 1].priority).toBeGreaterThanOrEqual(manifest[i].priority);
    }
  });

  it("deduplicates agents triggered by multiple policies", () => {
    const classification = makeClassification({ domains: ["financial", "dtf-optimization"] });
    const facts = makeFacts({
      files: [
        { path: "lib/helpers/money.ts", additions: 5, deletions: 1, status: "modified" },
        { path: "lib/dtf/optimizer.ts", additions: 10, deletions: 2, status: "modified" },
      ],
    });

    const manifest = compose(classification, facts);
    const financeEntries = manifest.filter((e) => e.agentId === "finance-sme");
    expect(financeEntries).toHaveLength(1);
    expect(financeEntries[0].scope).toContain("lib/helpers/money.ts");
    expect(financeEntries[0].scope).toContain("lib/dtf/optimizer.ts");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run lib/review/__tests__/compose.test.ts`
Expected: FAIL — `compose` module not found

**Step 3: Write minimal implementation**

```typescript
// lib/review/compose.ts
import picomatch from "picomatch";
import { loadCompositionPolicies, loadDomainMappings, loadReviewRules } from "./load-config";
import type { PRClassification, PRFacts, AgentManifestEntry } from "@/lib/schemas/review-pipeline";
import type { ReviewRiskLevel, CompositionPolicy } from "@/lib/schemas/review-config";

const RISK_LEVEL_ORDER: ReviewRiskLevel[] = ["low", "medium", "high", "critical"];

/**
 * Stage 3: Compose — Evaluate composition policies against classification.
 *
 * For each policy, checks if the trigger matches. Matching policies dispatch
 * their agent with scoped file paths and filtered rules. Deduplicates agents
 * (merges scope), sorts by priority descending.
 */
export function compose(classification: PRClassification, facts: PRFacts): AgentManifestEntry[] {
  const policies = loadCompositionPolicies();
  const rules = loadReviewRules();
  const domainMappings = loadDomainMappings();

  const agentMap = new Map<string, AgentManifestEntry>();

  for (const policy of policies) {
    if (!triggerMatches(policy, classification, facts)) continue;

    const agentId = policy.dispatch;
    const scope = computeScope(policy, classification, facts, domainMappings);
    const agentRules = rules.filter((r) => r.agent === agentId).map((r) => r.id);

    if (agentMap.has(agentId)) {
      const existing = agentMap.get(agentId)!;
      const mergedScope = [...new Set([...existing.scope, ...scope])];
      agentMap.set(agentId, {
        ...existing,
        scope: mergedScope,
        priority: Math.max(existing.priority, policy.priority),
        reason: `${existing.reason}; ${policy.description}`,
      });
    } else {
      agentMap.set(agentId, {
        agentId,
        scope,
        priority: policy.priority,
        rules: agentRules,
        reason: policy.description,
        triggeredBy: policy.id,
      });
    }
  }

  return [...agentMap.values()].sort((a, b) => b.priority - a.priority);
}

function triggerMatches(
  policy: CompositionPolicy,
  classification: PRClassification,
  facts: PRFacts
): boolean {
  const trigger = policy.trigger;

  switch (trigger.type) {
    case "always":
      return true;
    case "domain":
      return trigger.domains.some((d) => classification.domains.includes(d));
    case "risk": {
      const classLevel = RISK_LEVEL_ORDER.indexOf(classification.riskLevel);
      const triggerLevel = RISK_LEVEL_ORDER.indexOf(trigger.riskLevel);
      return classLevel >= triggerLevel;
    }
    case "content":
      return facts.diffContent ? new RegExp(trigger.pattern).test(facts.diffContent) : false;
    default:
      return false;
  }
}

function computeScope(
  policy: CompositionPolicy,
  _classification: PRClassification,
  facts: PRFacts,
  domainMappings: readonly { pattern: string; domain: string }[]
): string[] {
  const trigger = policy.trigger;

  if (trigger.type === "always") {
    return facts.files.map((f) => f.path);
  }

  if (trigger.type === "domain") {
    const domainPatterns = domainMappings
      .filter((dm) => trigger.domains.includes(dm.domain))
      .map((dm) => dm.pattern);
    return facts.files
      .filter((f) => domainPatterns.some((pat) => picomatch.isMatch(f.path, pat)))
      .map((f) => f.path);
  }

  return facts.files.map((f) => f.path);
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run lib/review/__tests__/compose.test.ts`
Expected: All 6 tests PASS

**Step 5: Commit**

```bash
git add lib/review/compose.ts lib/review/__tests__/compose.test.ts
git commit -m "feat(review): Stage 3 — compose (PRClassification to AgentManifest[])"
git push
```

---

## Task 4: Stage 4 — Gap Detect (LLM analysis layer)

**Files:**
- Create: `lib/review/gap-detect.ts`
- Create: `lib/review/__tests__/gap-detect.test.ts`

**Context:** NOT an LLM API call — runs as prompt-guided reasoning by the orchestrating agent. Exposed as a function that accepts an optional `GapAnalyzer` callback. The real callback is injected by the review orchestration skill at runtime. For unit tests, a mock or no-op callback is used.

**Step 1: Write the failing test**

```typescript
// lib/review/__tests__/gap-detect.test.ts
import { describe, it, expect } from "vitest";
import { agentManifestEntrySchema, gapLogEntrySchema } from "@/lib/schemas/review-pipeline";
import type { PRFacts, PRClassification, AgentManifestEntry, GapLogEntry } from "@/lib/schemas/review-pipeline";
import { z } from "zod";
import { gapDetect, type GapAnalyzer } from "../gap-detect";

const baseFacts: PRFacts = {
  branch: "session/0216-test",
  baseBranch: "main",
  files: [{ path: "lib/helpers/money.ts", additions: 10, deletions: 2, status: "modified" }],
  totalAdditions: 10,
  totalDeletions: 2,
  commits: [{ sha: "abc123", message: "feat: update money helper", author: "Claude" }],
};

const baseClassification: PRClassification = {
  type: "feature",
  riskLevel: "medium",
  riskScore: 40,
  domains: ["financial"],
  scope: "small",
  filesChanged: 1,
  linesChanged: 12,
};

const baseManifest: AgentManifestEntry[] = [
  {
    agentId: "build-reviewer",
    scope: ["lib/helpers/money.ts"],
    priority: 50,
    rules: ["U-DRY-1"],
    reason: "Universal code quality",
    triggeredBy: "universal-build-reviewer",
  },
  {
    agentId: "finance-sme",
    scope: ["lib/helpers/money.ts"],
    priority: 80,
    rules: ["D-FIN-1", "D-FIN-2"],
    reason: "Financial domain",
    triggeredBy: "financial-domain-reviewer",
  },
];

describe("gapDetect", () => {
  it("passes through manifest unchanged when no analyzer is provided", async () => {
    const result = await gapDetect(baseFacts, baseClassification, baseManifest);
    expect(result.manifest).toEqual(baseManifest);
    expect(result.gaps).toHaveLength(0);
    z.array(agentManifestEntrySchema).parse(result.manifest);
    z.array(gapLogEntrySchema).parse(result.gaps);
  });

  it("passes through when analyzer returns no gaps", async () => {
    const noGapAnalyzer: GapAnalyzer = async () => ({ additionalAgents: [], gaps: [] });
    const result = await gapDetect(baseFacts, baseClassification, baseManifest, noGapAnalyzer);
    expect(result.manifest).toEqual(baseManifest);
    expect(result.gaps).toHaveLength(0);
  });

  it("amends manifest when analyzer returns additional agents", async () => {
    const gapAnalyzer: GapAnalyzer = async () => ({
      additionalAgents: [
        {
          agentId: "design-auditor",
          scope: ["lib/helpers/money.ts"],
          priority: 60,
          rules: ["D-DSN-1"],
          reason: "Gap detected: money helper changes affect UI display",
          triggeredBy: "gap-detect",
        },
      ],
      gaps: [
        {
          concern: "Money helper changes may affect currency display formatting in UI components",
          recommendation: "Add design-auditor to verify currency display consistency",
          suggestedAgent: "design-auditor",
          confidence: 0.7,
        },
      ],
    });

    const result = await gapDetect(baseFacts, baseClassification, baseManifest, gapAnalyzer);
    expect(result.manifest).toHaveLength(3);
    expect(result.manifest.find((e) => e.agentId === "design-auditor")).toBeDefined();
    expect(result.gaps).toHaveLength(1);
    z.array(agentManifestEntrySchema).parse(result.manifest);
    z.array(gapLogEntrySchema).parse(result.gaps);
  });

  it("does not duplicate agents already in manifest", async () => {
    const duplicateAnalyzer: GapAnalyzer = async () => ({
      additionalAgents: [
        {
          agentId: "finance-sme",
          scope: ["lib/helpers/money.ts"],
          priority: 90,
          rules: ["D-FIN-3"],
          reason: "Gap: additional financial concern",
          triggeredBy: "gap-detect",
        },
      ],
      gaps: [
        {
          concern: "Additional financial concern detected that overlaps existing coverage",
          recommendation: "Existing finance-sme agent already covers this",
          confidence: 0.5,
        },
      ],
    });

    const result = await gapDetect(baseFacts, baseClassification, baseManifest, duplicateAnalyzer);
    const financeEntries = result.manifest.filter((e) => e.agentId === "finance-sme");
    expect(financeEntries).toHaveLength(1);
    expect(financeEntries[0].rules).toContain("D-FIN-3");
    expect(result.gaps).toHaveLength(1);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run lib/review/__tests__/gap-detect.test.ts`
Expected: FAIL — `gap-detect` module not found

**Step 3: Write minimal implementation**

```typescript
// lib/review/gap-detect.ts
import type {
  PRFacts,
  PRClassification,
  AgentManifestEntry,
  GapLogEntry,
} from "@/lib/schemas/review-pipeline";

export interface GapAnalysisResult {
  additionalAgents: AgentManifestEntry[];
  gaps: GapLogEntry[];
}

/**
 * Callback for LLM-guided gap analysis. At runtime, the review orchestration
 * skill injects the real analyzer. Tests use a mock or omit it entirely.
 */
export type GapAnalyzer = (
  facts: PRFacts,
  classification: PRClassification,
  currentManifest: AgentManifestEntry[]
) => Promise<GapAnalysisResult>;

export interface GapDetectResult {
  manifest: AgentManifestEntry[];
  gaps: GapLogEntry[];
}

/**
 * Stage 4: Gap Detect — LLM-guided analysis layer.
 *
 * If an analyzer is provided, it examines the diff for concerns the config
 * missed. Additional agents are merged (deduped) into the manifest.
 * If no analyzer, manifest passes through unchanged.
 */
export async function gapDetect(
  facts: PRFacts,
  classification: PRClassification,
  manifest: AgentManifestEntry[],
  analyzer?: GapAnalyzer
): Promise<GapDetectResult> {
  if (!analyzer) {
    return { manifest, gaps: [] };
  }

  const analysis = await analyzer(facts, classification, manifest);

  const mergedManifest = [...manifest];
  for (const newAgent of analysis.additionalAgents) {
    const existingIndex = mergedManifest.findIndex((e) => e.agentId === newAgent.agentId);

    if (existingIndex >= 0) {
      const existing = mergedManifest[existingIndex];
      mergedManifest[existingIndex] = {
        ...existing,
        scope: [...new Set([...existing.scope, ...newAgent.scope])],
        rules: [...new Set([...existing.rules, ...newAgent.rules])],
        priority: Math.max(existing.priority, newAgent.priority),
        reason: `${existing.reason}; ${newAgent.reason}`,
      };
    } else {
      mergedManifest.push(newAgent);
    }
  }

  return { manifest: mergedManifest, gaps: analysis.gaps };
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run lib/review/__tests__/gap-detect.test.ts`
Expected: All 4 tests PASS

**Step 5: Commit**

```bash
git add lib/review/gap-detect.ts lib/review/__tests__/gap-detect.test.ts
git commit -m "feat(review): Stage 4 — gap-detect (LLM analysis layer)"
git push
```

---

## Task 5: Stage 5 — Dispatch (parallel agent launching)

**Files:**
- Create: `lib/review/dispatch.ts`
- Create: `lib/review/__tests__/dispatch.test.ts`

**Context:** Launches review agents from the manifest in parallel. Accepts an `AgentLauncher` callback for testability. Handles timeouts and errors per-agent without failing the whole pipeline. Results conform to `agentResultSchema`.

**Step 1: Write the failing test**

```typescript
// lib/review/__tests__/dispatch.test.ts
import { describe, it, expect, vi } from "vitest";
import { agentResultSchema } from "@/lib/schemas/review-pipeline";
import type { AgentManifestEntry, PRFacts } from "@/lib/schemas/review-pipeline";
import { z } from "zod";
import { dispatch, type AgentLauncher } from "../dispatch";

const mockFacts: PRFacts = {
  branch: "session/0216-test",
  baseBranch: "main",
  files: [{ path: "lib/helpers/money.ts", additions: 10, deletions: 2, status: "modified" }],
  totalAdditions: 10,
  totalDeletions: 2,
  commits: [{ sha: "abc123", message: "feat: test", author: "Claude" }],
};

const manifest: AgentManifestEntry[] = [
  {
    agentId: "build-reviewer",
    scope: ["lib/helpers/money.ts"],
    priority: 50,
    rules: ["U-DRY-1", "U-TYPE-1"],
    reason: "Universal quality",
    triggeredBy: "universal-build-reviewer",
  },
  {
    agentId: "finance-sme",
    scope: ["lib/helpers/money.ts"],
    priority: 80,
    rules: ["D-FIN-1", "D-FIN-2"],
    reason: "Financial domain",
    triggeredBy: "financial-domain-reviewer",
  },
];

describe("dispatch", () => {
  it("launches all agents and returns results", async () => {
    const launcher: AgentLauncher = async (entry) => ({
      agentId: entry.agentId,
      status: "success",
      findings: [
        {
          ruleId: entry.rules[0],
          agent: entry.agentId,
          severity: "warning",
          file: entry.scope[0],
          message: `Mock finding from ${entry.agentId}`,
          category: "test",
        },
      ],
      durationMs: 1500,
    });

    const results = await dispatch(manifest, mockFacts, launcher);
    expect(results).toHaveLength(2);
    z.array(agentResultSchema).parse(results);
    expect(results[0].agentId).toBe("build-reviewer");
    expect(results[1].agentId).toBe("finance-sme");
  });

  it("handles agent timeout gracefully", async () => {
    const launcher: AgentLauncher = async (entry) => {
      if (entry.agentId === "finance-sme") {
        throw new Error("Agent timed out after 120000ms");
      }
      return { agentId: entry.agentId, status: "success", findings: [], durationMs: 1000 };
    };

    const results = await dispatch(manifest, mockFacts, launcher);
    expect(results).toHaveLength(2);

    const financeResult = results.find((r) => r.agentId === "finance-sme");
    expect(financeResult!.status).toBe("timeout");
    expect(financeResult!.error).toBeDefined();
    expect(financeResult!.findings).toHaveLength(0);
    z.array(agentResultSchema).parse(results);
  });

  it("handles agent error gracefully", async () => {
    const launcher: AgentLauncher = async (entry) => {
      if (entry.agentId === "build-reviewer") {
        throw new Error("Agent crashed: unexpected state");
      }
      return { agentId: entry.agentId, status: "success", findings: [], durationMs: 500 };
    };

    const results = await dispatch(manifest, mockFacts, launcher);
    const errorResult = results.find((r) => r.agentId === "build-reviewer");
    expect(errorResult!.status).toBe("error");
    expect(errorResult!.error).toContain("unexpected state");
  });

  it("returns empty results for empty manifest", async () => {
    const launcher: AgentLauncher = vi.fn();
    const results = await dispatch([], mockFacts, launcher);
    expect(results).toHaveLength(0);
    expect(launcher).not.toHaveBeenCalled();
  });

  it("launches agents in parallel (not sequential)", async () => {
    const callOrder: string[] = [];
    const launcher: AgentLauncher = async (entry) => {
      callOrder.push(`start:${entry.agentId}`);
      await new Promise((r) => setTimeout(r, 10));
      callOrder.push(`end:${entry.agentId}`);
      return { agentId: entry.agentId, status: "success", findings: [], durationMs: 10 };
    };

    await dispatch(manifest, mockFacts, launcher);

    const firstEndIndex = callOrder.findIndex((c) => c.startsWith("end:"));
    const starts = callOrder.slice(0, firstEndIndex);
    expect(starts).toHaveLength(2);
    expect(starts[0]).toMatch(/^start:/);
    expect(starts[1]).toMatch(/^start:/);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run lib/review/__tests__/dispatch.test.ts`
Expected: FAIL — `dispatch` module not found

**Step 3: Write minimal implementation**

```typescript
// lib/review/dispatch.ts
import type { AgentManifestEntry, AgentResult, PRFacts } from "@/lib/schemas/review-pipeline";

/**
 * Callback for launching a single review agent. Production uses Claude Code's
 * Task tool. Tests inject a mock launcher.
 */
export type AgentLauncher = (
  entry: AgentManifestEntry,
  facts: PRFacts
) => Promise<Omit<AgentResult, "error"> & { error?: string }>;

/**
 * Stage 5: Dispatch — Launch review agents from manifest in parallel.
 *
 * All agents run concurrently via Promise.all. Timeouts and errors are caught
 * per-agent and recorded as timeout/error status without failing the pipeline.
 */
export async function dispatch(
  manifest: AgentManifestEntry[],
  facts: PRFacts,
  launcher: AgentLauncher
): Promise<AgentResult[]> {
  if (manifest.length === 0) return [];

  const promises = manifest.map(async (entry): Promise<AgentResult> => {
    const agentStart = Date.now();
    try {
      const result = await launcher(entry, facts);
      return {
        agentId: result.agentId,
        status: result.status,
        findings: result.findings,
        durationMs: result.durationMs,
        ...(result.error ? { error: result.error } : {}),
      };
    } catch (err) {
      const duration = Date.now() - agentStart;
      const message = err instanceof Error ? err.message : String(err);
      const isTimeout = message.toLowerCase().includes("timed out") || message.toLowerCase().includes("timeout");

      return {
        agentId: entry.agentId,
        status: isTimeout ? "timeout" : "error",
        findings: [],
        durationMs: duration,
        error: message,
      };
    }
  });

  return Promise.all(promises);
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run lib/review/__tests__/dispatch.test.ts`
Expected: All 5 tests PASS

**Step 5: Commit**

```bash
git add lib/review/dispatch.ts lib/review/__tests__/dispatch.test.ts
git commit -m "feat(review): Stage 5 — dispatch (parallel agent launching)"
git push
```

---

## Task 6: Stage 6 — Aggregate (findings to ReviewReport + GateDecision)

**Files:**
- Create: `lib/review/aggregate.ts`
- Create: `lib/review/__tests__/aggregate.test.ts`

**Context:** Merges findings from all agents, deduplicates by `(ruleId, file, line)`, sorts by severity (critical > major > warning > info), computes metrics, applies gate logic. Gate: `critical > 0` fail, `major > 0` needs_fixes, `warning > 0` pass_with_warnings, clean pass.

**Step 1: Write the failing test**

```typescript
// lib/review/__tests__/aggregate.test.ts
import { describe, it, expect } from "vitest";
import {
  reviewReportSchema,
  gateDecisionSchema,
  type AgentResult,
  type GapLogEntry,
  type ReviewFinding,
} from "@/lib/schemas/review-pipeline";
import { aggregate } from "../aggregate";

function makeFinding(overrides: Partial<ReviewFinding> = {}): ReviewFinding {
  return {
    ruleId: "U-TYPE-1",
    agent: "build-reviewer",
    severity: "warning",
    file: "lib/test.ts",
    message: "Test finding",
    category: "type-safety",
    ...overrides,
  };
}

function makeResult(overrides: Partial<AgentResult> = {}): AgentResult {
  return {
    agentId: "build-reviewer",
    status: "success",
    findings: [],
    durationMs: 1000,
    ...overrides,
  };
}

describe("aggregate", () => {
  it("produces a valid ReviewReport from agent results", () => {
    const results: AgentResult[] = [
      makeResult({
        findings: [
          makeFinding({ severity: "warning" }),
          makeFinding({ ruleId: "U-DRY-1", severity: "major", message: "DRY violation" }),
        ],
      }),
    ];

    const { report, gateDecision } = aggregate(results, []);
    reviewReportSchema.parse(report);
    gateDecisionSchema.parse(gateDecision);

    expect(report.findings).toHaveLength(2);
    expect(report.metrics.major).toBe(1);
    expect(report.metrics.warning).toBe(1);
    expect(report.agentsDispatched).toBe(1);
    expect(report.agentsCompleted).toBe(1);
  });

  it("deduplicates findings with same (ruleId, file, line)", () => {
    const dup = makeFinding({ ruleId: "U-TYPE-1", file: "lib/test.ts", line: 10 });
    const results: AgentResult[] = [
      makeResult({ agentId: "agent-a", findings: [dup] }),
      makeResult({ agentId: "agent-b", findings: [{ ...dup, agent: "agent-b" }] }),
    ];

    const { report } = aggregate(results, []);
    expect(report.findings).toHaveLength(1);
    expect(report.deduplicated).toBe(1);
  });

  it("does NOT deduplicate findings with different lines", () => {
    const results: AgentResult[] = [
      makeResult({
        findings: [
          makeFinding({ ruleId: "U-TYPE-1", file: "lib/test.ts", line: 10 }),
          makeFinding({ ruleId: "U-TYPE-1", file: "lib/test.ts", line: 20 }),
        ],
      }),
    ];

    const { report } = aggregate(results, []);
    expect(report.findings).toHaveLength(2);
    expect(report.deduplicated).toBe(0);
  });

  it("gate: FAIL when critical findings exist", () => {
    const results: AgentResult[] = [
      makeResult({ findings: [makeFinding({ severity: "critical" })] }),
    ];
    const { gateDecision } = aggregate(results, []);
    expect(gateDecision.decision).toBe("fail");
    expect(gateDecision.metrics.critical).toBe(1);
  });

  it("gate: NEEDS_FIXES when major findings exist (no critical)", () => {
    const results: AgentResult[] = [
      makeResult({ findings: [makeFinding({ severity: "major" })] }),
    ];
    const { gateDecision } = aggregate(results, []);
    expect(gateDecision.decision).toBe("needs_fixes");
  });

  it("gate: PASS_WITH_WARNINGS when only warnings exist", () => {
    const results: AgentResult[] = [
      makeResult({ findings: [makeFinding({ severity: "warning" })] }),
    ];
    const { gateDecision } = aggregate(results, []);
    expect(gateDecision.decision).toBe("pass_with_warnings");
  });

  it("gate: PASS when no findings or only info", () => {
    const results: AgentResult[] = [
      makeResult({ findings: [makeFinding({ severity: "info" })] }),
    ];
    const { gateDecision } = aggregate(results, []);
    expect(gateDecision.decision).toBe("pass");
  });

  it("gate: PASS when no findings at all", () => {
    const results: AgentResult[] = [makeResult()];
    const { gateDecision } = aggregate(results, []);
    expect(gateDecision.decision).toBe("pass");
  });

  it("includes gap log entries in report", () => {
    const gaps: GapLogEntry[] = [
      {
        concern: "Security concern not covered by any agent in the current manifest",
        recommendation: "Add a security-reviewer agent to the registry",
        suggestedAgent: "security-reviewer",
        confidence: 0.8,
      },
    ];
    const { report } = aggregate([makeResult()], gaps);
    expect(report.gaps).toHaveLength(1);
    expect(report.gaps[0].suggestedAgent).toBe("security-reviewer");
  });

  it("counts agents correctly including timeout/error", () => {
    const results: AgentResult[] = [
      makeResult({ agentId: "a", status: "success" }),
      makeResult({ agentId: "b", status: "timeout", error: "timed out" }),
      makeResult({ agentId: "c", status: "error", error: "crashed" }),
    ];
    const { report } = aggregate(results, []);
    expect(report.agentsDispatched).toBe(3);
    expect(report.agentsCompleted).toBe(1);
  });

  it("sorts findings by severity (critical first)", () => {
    const results: AgentResult[] = [
      makeResult({
        findings: [
          makeFinding({ severity: "info", ruleId: "r1" }),
          makeFinding({ severity: "critical", ruleId: "r2" }),
          makeFinding({ severity: "warning", ruleId: "r3" }),
          makeFinding({ severity: "major", ruleId: "r4" }),
        ],
      }),
    ];
    const { report } = aggregate(results, []);
    expect(report.findings[0].severity).toBe("critical");
    expect(report.findings[1].severity).toBe("major");
    expect(report.findings[2].severity).toBe("warning");
    expect(report.findings[3].severity).toBe("info");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run lib/review/__tests__/aggregate.test.ts`
Expected: FAIL — `aggregate` module not found

**Step 3: Write minimal implementation**

```typescript
// lib/review/aggregate.ts
import type {
  AgentResult,
  GapLogEntry,
  ReviewReport,
  GateDecision,
  ReviewFinding,
  SeverityMetrics,
  GateDecisionValue,
} from "@/lib/schemas/review-pipeline";
import type { Severity } from "@/lib/schemas/review-config";

const SEVERITY_ORDER: Severity[] = ["critical", "major", "warning", "info"];

export interface AggregateResult {
  report: ReviewReport;
  gateDecision: GateDecision;
}

/**
 * Stage 6: Aggregate — Merge findings, deduplicate, compute gate decision.
 *
 * Deduplication key: (ruleId, file, line). Gate logic:
 * critical > 0 fail, major > 0 needs_fixes, warning > 0 pass_with_warnings, clean pass.
 */
export function aggregate(agentResults: AgentResult[], gaps: GapLogEntry[]): AggregateResult {
  const allFindings: ReviewFinding[] = [];
  for (const result of agentResults) {
    allFindings.push(...result.findings);
  }

  // Deduplicate by (ruleId, file, line)
  const seen = new Map<string, ReviewFinding>();
  let deduplicated = 0;
  for (const finding of allFindings) {
    const key = `${finding.ruleId}::${finding.file}::${finding.line ?? "none"}`;
    if (seen.has(key)) {
      deduplicated++;
    } else {
      seen.set(key, finding);
    }
  }

  const findings = [...seen.values()].sort(
    (a, b) => SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity)
  );

  const metrics: SeverityMetrics = { critical: 0, major: 0, warning: 0, info: 0 };
  for (const f of findings) {
    metrics[f.severity]++;
  }

  const agentsDispatched = agentResults.length;
  const agentsCompleted = agentResults.filter((r) => r.status === "success").length;

  const report: ReviewReport = {
    agentResults,
    findings,
    gaps,
    metrics,
    agentsDispatched,
    agentsCompleted,
    deduplicated,
    timestamp: new Date().toISOString(),
  };

  const gateDecision = computeGateDecision(metrics);
  return { report, gateDecision };
}

function computeGateDecision(metrics: SeverityMetrics): GateDecision {
  let decision: GateDecisionValue;
  let summary: string;

  if (metrics.critical > 0) {
    decision = "fail";
    summary = `${metrics.critical} critical finding(s) must be fixed before proceeding`;
  } else if (metrics.major > 0) {
    decision = "needs_fixes";
    summary = `${metrics.major} major finding(s) should be fixed`;
  } else if (metrics.warning > 0) {
    decision = "pass_with_warnings";
    summary = `${metrics.warning} warning(s) — consider creating tech-debt issues`;
  } else {
    decision = "pass";
    summary = "All checks passed — no findings";
  }

  return { decision, metrics, summary };
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run lib/review/__tests__/aggregate.test.ts`
Expected: All 11 tests PASS

**Step 5: Commit**

```bash
git add lib/review/aggregate.ts lib/review/__tests__/aggregate.test.ts
git commit -m "feat(review): Stage 6 — aggregate (findings to ReviewReport + GateDecision)"
git push
```

---

## Task 7: Pipeline Orchestrator (compose all 6 stages)

**Files:**
- Create: `lib/review/orchestrate.ts`
- Create: `lib/review/__tests__/orchestrate.test.ts`

**Context:** Composes all 6 stages into a single async function. Each stage validates its output with Zod before passing to the next. Accepts injectable deps (GapAnalyzer, AgentLauncher) for testability.

**Step 1: Write the failing test**

```typescript
// lib/review/__tests__/orchestrate.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { reviewReportSchema, gateDecisionSchema } from "@/lib/schemas/review-pipeline";

vi.mock("child_process", () => ({
  execSync: vi.fn(),
}));

import { execSync } from "child_process";
import { runReviewOrchestration } from "../orchestrate";
import type { AgentLauncher } from "../dispatch";
import type { GapAnalyzer } from "../gap-detect";

const mockedExecSync = vi.mocked(execSync);

function setupGitMocks() {
  mockedExecSync.mockImplementation((cmd: string) => {
    const cmdStr = String(cmd);
    if (cmdStr.includes("--numstat")) {
      return Buffer.from("10\t2\tlib/helpers/money.ts\n5\t1\tcomponents/features/quotes/QuoteCard.tsx\n");
    }
    if (cmdStr.includes("--name-status")) {
      return Buffer.from("M\tlib/helpers/money.ts\nM\tcomponents/features/quotes/QuoteCard.tsx\n");
    }
    if (cmdStr.includes("git log")) {
      return Buffer.from('abc1234\x00feat: update pricing\x00Claude\n');
    }
    if (cmdStr.includes("git diff")) {
      return Buffer.from("diff --git a/lib/helpers/money.ts...");
    }
    return Buffer.from("");
  });
}

describe("runReviewOrchestration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupGitMocks();
  });

  it("runs the full pipeline and produces valid output", async () => {
    const mockLauncher: AgentLauncher = async (entry) => ({
      agentId: entry.agentId,
      status: "success",
      findings: [
        {
          ruleId: entry.rules[0] ?? "test-rule",
          agent: entry.agentId,
          severity: "warning",
          file: entry.scope[0] ?? "test.ts",
          message: `Mock finding from ${entry.agentId}`,
          category: "test",
        },
      ],
      durationMs: 100,
    });

    const result = await runReviewOrchestration("session/0216-test", "main", {
      launcher: mockLauncher,
    });

    reviewReportSchema.parse(result.report);
    gateDecisionSchema.parse(result.gateDecision);

    expect(result.report.agentsDispatched).toBeGreaterThan(0);
    expect(result.report.findings.length).toBeGreaterThan(0);
    expect(result.gateDecision.decision).toBeDefined();
  });

  it("validates all stage boundaries (no corrupt data passes through)", async () => {
    const mockLauncher: AgentLauncher = async (entry) => ({
      agentId: entry.agentId,
      status: "success",
      findings: [],
      durationMs: 50,
    });

    const result = await runReviewOrchestration("session/0216-test", "main", {
      launcher: mockLauncher,
    });

    expect(result.report).toBeDefined();
    expect(result.gateDecision.decision).toBe("pass");
  });

  it("integrates gap analyzer when provided", async () => {
    const mockLauncher: AgentLauncher = async (entry) => ({
      agentId: entry.agentId,
      status: "success",
      findings: [],
      durationMs: 50,
    });

    const mockAnalyzer: GapAnalyzer = async () => ({
      additionalAgents: [],
      gaps: [
        {
          concern: "Security concern detected — no security agent in registry yet",
          recommendation: "Create a security-reviewer agent for OWASP checks",
          confidence: 0.6,
        },
      ],
    });

    const result = await runReviewOrchestration("session/0216-test", "main", {
      launcher: mockLauncher,
      gapAnalyzer: mockAnalyzer,
    });

    expect(result.report.gaps).toHaveLength(1);
    expect(result.report.gaps[0].concern).toContain("Security");
  });

  it("handles empty diff gracefully", async () => {
    mockedExecSync.mockImplementation((cmd: string) => {
      const cmdStr = String(cmd);
      if (cmdStr.includes("git log")) {
        return Buffer.from('bbb2222\x00chore: empty\x00Claude\n');
      }
      return Buffer.from("");
    });

    const mockLauncher: AgentLauncher = async (entry) => ({
      agentId: entry.agentId,
      status: "success",
      findings: [],
      durationMs: 50,
    });

    const result = await runReviewOrchestration("session/0216-test", "main", {
      launcher: mockLauncher,
    });

    expect(result.gateDecision.decision).toBe("pass");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run lib/review/__tests__/orchestrate.test.ts`
Expected: FAIL — `orchestrate` module not found

**Step 3: Write minimal implementation**

```typescript
// lib/review/orchestrate.ts
import {
  prFactsSchema,
  prClassificationSchema,
  agentManifestEntrySchema,
  gapLogEntrySchema,
  agentResultSchema,
  reviewReportSchema,
  gateDecisionSchema,
  type ReviewReport,
  type GateDecision,
} from "@/lib/schemas/review-pipeline";
import { z } from "zod";
import { normalize } from "./normalize";
import { classify } from "./classify";
import { compose } from "./compose";
import { gapDetect, type GapAnalyzer } from "./gap-detect";
import { dispatch, type AgentLauncher } from "./dispatch";
import { aggregate } from "./aggregate";

export interface OrchestratorDeps {
  launcher: AgentLauncher;
  gapAnalyzer?: GapAnalyzer;
}

export interface OrchestrationResult {
  report: ReviewReport;
  gateDecision: GateDecision;
}

/**
 * Pipeline orchestrator — composes all 6 stages with Zod validation
 * at every boundary.
 */
export async function runReviewOrchestration(
  branch: string,
  baseBranch: string,
  deps: OrchestratorDeps
): Promise<OrchestrationResult> {
  // Stage 1: Normalize
  const facts = prFactsSchema.parse(normalize(branch, baseBranch));

  // Stage 2: Classify
  const classification = prClassificationSchema.parse(classify(facts));

  // Stage 3: Compose
  const manifest = z.array(agentManifestEntrySchema).parse(compose(classification, facts));

  // Stage 4: Gap Detect
  const gapResult = await gapDetect(facts, classification, manifest, deps.gapAnalyzer);
  const amendedManifest = z.array(agentManifestEntrySchema).parse(gapResult.manifest);
  const gaps = z.array(gapLogEntrySchema).parse(gapResult.gaps);

  // Stage 5: Dispatch
  const agentResults = z.array(agentResultSchema).parse(
    await dispatch(amendedManifest, facts, deps.launcher)
  );

  // Stage 6: Aggregate
  const { report: rawReport, gateDecision: rawGate } = aggregate(agentResults, gaps);
  const report = reviewReportSchema.parse(rawReport);
  const gateDecision = gateDecisionSchema.parse(rawGate);

  return { report, gateDecision };
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run lib/review/__tests__/orchestrate.test.ts`
Expected: All 4 tests PASS

**Step 5: Commit**

```bash
git add lib/review/orchestrate.ts lib/review/__tests__/orchestrate.test.ts
git commit -m "feat(review): pipeline orchestrator (compose all 6 stages)"
git push
```

---

## Task 8: Run full test suite + type check

**Files:** No new files — verification only

**Step 1: Run all pipeline tests**

Run: `npx vitest run lib/review/`
Expected: All tests PASS (~41 tests across 7 test files)

**Step 2: Run full project test suite**

Run: `npm test`
Expected: All tests PASS

**Step 3: Run TypeScript type check**

Run: `npx tsc --noEmit`
Expected: No type errors

**Step 4: Run linter**

Run: `npm run lint`
Expected: No lint errors

**Step 5: Commit if fixes needed**

```bash
git add -A
git commit -m "fix(review): address test/lint/type issues"
git push
```

---

## Task 9: Create PR

```bash
gh pr create \
  --title "feat(review): pipeline stages — normalize, classify, compose, gap-detect, dispatch, aggregate (#340)" \
  --body "## Summary

Implements the 6-stage review orchestration pipeline (#340):

- **Stage 1: Normalize** — Extracts PR facts from git diff (files, lines, commits)
- **Stage 2: Classify** — Deterministic domain classification via picomatch globs, risk scoring
- **Stage 3: Compose** — Policy engine evaluating composition triggers to build agent manifest
- **Stage 4: Gap Detect** — Injectable LLM analysis layer for coverage gap detection
- **Stage 5: Dispatch** — Parallel agent launching with timeout/error handling
- **Stage 6: Aggregate** — Finding merge, dedup by (ruleId, file, line), severity-based gate
- **Orchestrator** — Composes all 6 stages with Zod validation at every boundary

All stages are pure functions with injectable dependencies for testability. ~41 unit tests.

## Test plan

- [ ] npx vitest run lib/review/ — all pipeline stage tests pass
- [ ] npm test — full test suite passes
- [ ] npx tsc --noEmit — no type errors
- [ ] npm run lint — no lint errors

Closes #340"
```

---

## Dependency Graph

```
Task 1 (normalize) ──┐
                      ├─ Task 7 (orchestrate) ─ Task 8 (verify) ─ Task 9 (PR)
Task 2 (classify)  ──┤
                      │
Task 3 (compose)   ──┤
                      │
Task 4 (gap-detect)──┤
                      │
Task 5 (dispatch)  ──┤
                      │
Task 6 (aggregate) ──┘
```

**Parallelizable:** Tasks 1-6 are independent (each uses only schemas + config loaders, no cross-stage imports). They CAN be built in parallel by separate agents. Task 7 depends on all of 1-6. Tasks 8-9 are sequential after 7.
