import { describe, it, expect } from "vitest";
import { z } from "zod";
import {
  agentManifestEntrySchema,
  type PRClassification,
  type PRFacts,
} from "@/lib/schemas/review-pipeline";
import { compose } from "../compose";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeClassification(
  overrides: Partial<PRClassification> = {},
): PRClassification {
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

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("compose (Stage 3 — PRClassification to AgentManifestEntry[])", () => {
  // -------------------------------------------------------------------------
  // 1. Always dispatches build-reviewer (universal policy)
  // -------------------------------------------------------------------------
  it("always dispatches build-reviewer via universal policy", () => {
    const classification = makeClassification();
    const facts = makeFacts({
      files: [
        { path: "lib/utils.ts", additions: 10, deletions: 2, status: "modified" },
      ],
    });

    const manifest = compose(classification, facts);
    const parsed = z.array(agentManifestEntrySchema).parse(manifest);

    const buildReviewer = parsed.find((e) => e.agentId === "build-reviewer");
    expect(buildReviewer).toBeDefined();
    expect(buildReviewer!.triggeredBy).toBe("universal-build-reviewer");
    expect(buildReviewer!.scope).toContain("lib/utils.ts");
  });

  // -------------------------------------------------------------------------
  // 2. Dispatches finance-sme when financial domain is present
  // -------------------------------------------------------------------------
  it("dispatches finance-sme when financial domain is present", () => {
    const classification = makeClassification({
      domains: ["financial"],
    });
    const facts = makeFacts({
      files: [
        {
          path: "lib/helpers/money.ts",
          additions: 5,
          deletions: 1,
          status: "modified",
        },
        {
          path: "lib/utils.ts",
          additions: 2,
          deletions: 0,
          status: "modified",
        },
      ],
    });

    const manifest = compose(classification, facts);
    const parsed = z.array(agentManifestEntrySchema).parse(manifest);

    const financeSme = parsed.find((e) => e.agentId === "finance-sme");
    expect(financeSme).toBeDefined();
    expect(financeSme!.scope).toContain("lib/helpers/money.ts");
  });

  // -------------------------------------------------------------------------
  // 3. Dispatches design-auditor when ui-components domain is present
  // -------------------------------------------------------------------------
  it("dispatches design-auditor when ui-components domain is present", () => {
    const classification = makeClassification({
      domains: ["ui-components"],
    });
    const facts = makeFacts({
      files: [
        {
          path: "components/features/quotes/QuoteCard.tsx",
          additions: 20,
          deletions: 5,
          status: "modified",
        },
      ],
    });

    const manifest = compose(classification, facts);
    const parsed = z.array(agentManifestEntrySchema).parse(manifest);

    const designAuditor = parsed.find((e) => e.agentId === "design-auditor");
    expect(designAuditor).toBeDefined();
    expect(designAuditor!.scope).toContain(
      "components/features/quotes/QuoteCard.tsx",
    );
  });

  // -------------------------------------------------------------------------
  // 4. Includes rules for each dispatched agent
  // -------------------------------------------------------------------------
  it("includes rules for each dispatched agent (finance-sme has D-FIN-* rules)", () => {
    const classification = makeClassification({
      domains: ["financial"],
    });
    const facts = makeFacts({
      files: [
        {
          path: "lib/helpers/money.ts",
          additions: 5,
          deletions: 1,
          status: "modified",
        },
      ],
    });

    const manifest = compose(classification, facts);
    const parsed = z.array(agentManifestEntrySchema).parse(manifest);

    const financeSme = parsed.find((e) => e.agentId === "finance-sme");
    expect(financeSme).toBeDefined();
    expect(financeSme!.rules.length).toBeGreaterThan(0);
    // All finance-sme rules should start with D-FIN-
    expect(financeSme!.rules.every((r) => r.startsWith("D-FIN-"))).toBe(true);

    // build-reviewer should also have its rules
    const buildReviewer = parsed.find((e) => e.agentId === "build-reviewer");
    expect(buildReviewer).toBeDefined();
    expect(buildReviewer!.rules.length).toBeGreaterThan(0);
    expect(buildReviewer!.rules.every((r) => r.startsWith("U-"))).toBe(true);
  });

  // -------------------------------------------------------------------------
  // 5. Sorts manifest by priority descending
  // -------------------------------------------------------------------------
  it("sorts manifest by priority descending", () => {
    const classification = makeClassification({
      domains: ["financial", "ui-components"],
    });
    const facts = makeFacts({
      files: [
        {
          path: "lib/helpers/money.ts",
          additions: 5,
          deletions: 1,
          status: "modified",
        },
        {
          path: "components/features/quotes/QuoteCard.tsx",
          additions: 20,
          deletions: 5,
          status: "modified",
        },
      ],
    });

    const manifest = compose(classification, facts);
    const parsed = z.array(agentManifestEntrySchema).parse(manifest);

    // Should have 3 agents: finance-sme (80), design-auditor (70), build-reviewer (50)
    expect(parsed.length).toBeGreaterThanOrEqual(3);

    // Verify descending priority order
    for (let i = 1; i < parsed.length; i++) {
      expect(parsed[i - 1].priority).toBeGreaterThanOrEqual(parsed[i].priority);
    }

    // First should be finance-sme (priority 80)
    expect(parsed[0].agentId).toBe("finance-sme");
  });

  // -------------------------------------------------------------------------
  // 6. Deduplicates agents triggered by multiple policies
  // -------------------------------------------------------------------------
  it("deduplicates agents triggered by multiple policies (financial + dtf-optimization)", () => {
    const classification = makeClassification({
      domains: ["financial", "dtf-optimization"],
    });
    const facts = makeFacts({
      files: [
        {
          path: "lib/helpers/money.ts",
          additions: 5,
          deletions: 1,
          status: "modified",
        },
        {
          path: "lib/dtf/optimizer.ts",
          additions: 10,
          deletions: 3,
          status: "modified",
        },
      ],
    });

    const manifest = compose(classification, facts);
    const parsed = z.array(agentManifestEntrySchema).parse(manifest);

    // finance-sme should appear exactly once despite being triggered by
    // financial-domain-reviewer policy (which matches both "financial" and
    // "dtf-optimization" domains)
    const financeSmeEntries = parsed.filter(
      (e) => e.agentId === "finance-sme",
    );
    expect(financeSmeEntries).toHaveLength(1);

    // The merged entry should have both files in scope
    const financeSme = financeSmeEntries[0];
    expect(financeSme.scope).toContain("lib/helpers/money.ts");
    expect(financeSme.scope).toContain("lib/dtf/optimizer.ts");
  });
});
