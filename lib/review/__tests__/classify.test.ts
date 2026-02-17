import { describe, it, expect } from "vitest";
import { classify } from "../classify";
import { prClassificationSchema, type PRFacts } from "@domain/entities/review-pipeline";

// ---------------------------------------------------------------------------
// Helper — builds a minimal PRFacts with sensible defaults
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("classify", () => {
  it("classifies a small feature PR touching financial domain", () => {
    const facts = makeFacts({
      files: [
        { path: "lib/helpers/money.ts", additions: 15, deletions: 5, status: "modified" },
        { path: "components/features/Quote/QuoteCalc.tsx", additions: 20, deletions: 3, status: "modified" },
      ],
      totalAdditions: 35,
      totalDeletions: 8,
      commits: [{ sha: "abc123", message: "feat: add deposit calculation", author: "Claude" }],
    });

    const result = classify(facts);

    // Schema validation
    prClassificationSchema.parse(result);

    expect(result.type).toBe("feature");
    expect(result.domains).toContain("financial");
    expect(result.scope).toBe("small");
    expect(result.filesChanged).toBe(2);
    expect(result.linesChanged).toBe(43);
    // Financial domain has severity weight 30, so risk should be non-trivial
    expect(result.riskScore).toBeGreaterThan(0);
  });

  it("classifies a large refactor PR as high risk", () => {
    const facts = makeFacts({
      files: [
        { path: "lib/schemas/review-pipeline.ts", additions: 200, deletions: 150, status: "modified" },
        { path: "lib/schemas/review-config.ts", additions: 100, deletions: 80, status: "modified" },
        { path: "lib/review/load-config.ts", additions: 50, deletions: 30, status: "modified" },
        { path: "config/review-rules.json", additions: 40, deletions: 20, status: "modified" },
        { path: "config/review-agents.json", additions: 30, deletions: 10, status: "modified" },
        { path: "lib/helpers/money.ts", additions: 60, deletions: 40, status: "modified" },
      ],
      totalAdditions: 480,
      totalDeletions: 330,
      commits: [{ sha: "def456", message: "refactor: restructure review pipeline schemas", author: "Claude" }],
    });

    const result = classify(facts);

    prClassificationSchema.parse(result);

    expect(result.type).toBe("refactor");
    expect(result.scope).toBe("large");
    expect(result.riskLevel).toMatch(/high|critical/);
    expect(result.riskScore).toBeGreaterThanOrEqual(50);
    expect(result.filesChanged).toBe(6);
    expect(result.linesChanged).toBe(810);
    // Should detect schemas, infrastructure, and financial domains
    expect(result.domains).toContain("schemas");
    expect(result.domains).toContain("infrastructure");
    expect(result.domains).toContain("financial");
  });

  it("classifies a docs-only PR as low risk", () => {
    const facts = makeFacts({
      files: [
        { path: "docs/PRD.md", additions: 5, deletions: 1, status: "modified" },
      ],
      totalAdditions: 5,
      totalDeletions: 1,
      commits: [{ sha: "ghi789", message: "docs: update project documentation", author: "Claude" }],
    });

    const result = classify(facts);

    prClassificationSchema.parse(result);

    expect(result.type).toBe("docs");
    expect(result.domains).toContain("documentation");
    expect(result.scope).toBe("small");
    expect(result.riskLevel).toBe("low");
    expect(result.riskScore).toBeLessThan(25);
    expect(result.filesChanged).toBe(1);
    expect(result.linesChanged).toBe(6);
  });

  it("classifies a test-only PR correctly", () => {
    const facts = makeFacts({
      files: [
        { path: "lib/review/__tests__/load-config.test.ts", additions: 50, deletions: 10, status: "modified" },
        { path: "lib/schemas/__tests__/review-config-data.test.ts", additions: 30, deletions: 5, status: "added" },
      ],
      totalAdditions: 80,
      totalDeletions: 15,
      commits: [{ sha: "jkl012", message: "test: add review config validation tests", author: "Claude" }],
    });

    const result = classify(facts);

    prClassificationSchema.parse(result);

    expect(result.type).toBe("test");
    expect(result.domains).toContain("testing");
    expect(result.scope).toBe("small");
    expect(result.filesChanged).toBe(2);
    expect(result.linesChanged).toBe(95);
  });

  it("classifies mixed PR with multiple domains", () => {
    const facts = makeFacts({
      files: [
        { path: "lib/helpers/money.ts", additions: 20, deletions: 5, status: "modified" },
        { path: "docs/PRD.md", additions: 10, deletions: 2, status: "modified" },
        { path: "components/ui/button.tsx", additions: 15, deletions: 3, status: "modified" },
        { path: "lib/review/__tests__/classify.test.ts", additions: 40, deletions: 0, status: "added" },
      ],
      totalAdditions: 85,
      totalDeletions: 10,
      commits: [
        { sha: "mno345", message: "feat: update money helpers", author: "Claude" },
        { sha: "pqr678", message: "docs: update PRD", author: "Claude" },
      ],
    });

    const result = classify(facts);

    prClassificationSchema.parse(result);

    expect(result.type).toBe("mixed");
    expect(result.domains).toContain("financial");
    expect(result.domains).toContain("documentation");
    expect(result.domains).toContain("design-system");
    expect(result.domains).toContain("testing");
    expect(result.filesChanged).toBe(4);
    expect(result.linesChanged).toBe(95);
    // Multiple domains — each domain appears exactly once
    const uniqueDomains = new Set(result.domains);
    expect(uniqueDomains.size).toBe(result.domains.length);
  });

  it("handles empty diff (no files)", () => {
    const facts = makeFacts({
      files: [],
      totalAdditions: 0,
      totalDeletions: 0,
      commits: [{ sha: "stu901", message: "chore: empty commit", author: "Claude" }],
    });

    const result = classify(facts);

    prClassificationSchema.parse(result);

    expect(result.type).toBe("chore");
    expect(result.domains).toEqual([]);
    expect(result.scope).toBe("small");
    expect(result.filesChanged).toBe(0);
    expect(result.linesChanged).toBe(0);
    expect(result.riskLevel).toBe("low");
    expect(result.riskScore).toBe(0);
  });
});
