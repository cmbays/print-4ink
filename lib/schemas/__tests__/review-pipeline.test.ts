import { describe, it, expect } from "vitest";
import {
  prTypeEnum,
  riskLevelEnum,
  gateDecisionEnum,
  fileChangeSchema,
  commitInfoSchema,
  prFactsSchema,
  prClassificationSchema,
  agentManifestEntrySchema,
  gapLogEntrySchema,
  reviewFindingSchema,
  severityMetricsSchema,
  reviewReportSchema,
  gateDecisionSchema,
} from "../review-pipeline";

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

describe("prTypeEnum", () => {
  it.each(["feature", "bugfix", "refactor", "docs", "test", "chore", "mixed"])(
    "accepts '%s'",
    (val) => {
      expect(prTypeEnum.parse(val)).toBe(val);
    },
  );

  it("rejects invalid type", () => {
    expect(() => prTypeEnum.parse("hotfix")).toThrow();
  });
});

describe("riskLevelEnum", () => {
  it.each(["low", "medium", "high", "critical"])("accepts '%s'", (val) => {
    expect(riskLevelEnum.parse(val)).toBe(val);
  });

  it("rejects invalid risk level", () => {
    expect(() => riskLevelEnum.parse("extreme")).toThrow();
  });
});

describe("gateDecisionEnum", () => {
  it.each(["pass", "pass_with_warnings", "needs_fixes", "fail"])(
    "accepts '%s'",
    (val) => {
      expect(gateDecisionEnum.parse(val)).toBe(val);
    },
  );

  it("rejects invalid decision", () => {
    expect(() => gateDecisionEnum.parse("skip")).toThrow();
  });
});

// ---------------------------------------------------------------------------
// Stage 1: fileChangeSchema, commitInfoSchema, prFactsSchema
// ---------------------------------------------------------------------------

describe("fileChangeSchema", () => {
  const validFile = {
    path: "lib/schemas/quote.ts",
    additions: 10,
    deletions: 3,
    status: "modified" as const,
  };

  it("accepts a valid file change", () => {
    const result = fileChangeSchema.parse(validFile);
    expect(result.path).toBe("lib/schemas/quote.ts");
    expect(result.status).toBe("modified");
  });

  it.each(["added", "modified", "deleted", "renamed"] as const)(
    "accepts status '%s'",
    (status) => {
      expect(fileChangeSchema.parse({ ...validFile, status }).status).toBe(
        status,
      );
    },
  );

  it("rejects empty path", () => {
    expect(() =>
      fileChangeSchema.parse({ ...validFile, path: "" }),
    ).toThrow();
  });

  it("rejects negative additions", () => {
    expect(() =>
      fileChangeSchema.parse({ ...validFile, additions: -1 }),
    ).toThrow();
  });

  it("rejects negative deletions", () => {
    expect(() =>
      fileChangeSchema.parse({ ...validFile, deletions: -1 }),
    ).toThrow();
  });

  it("accepts zero additions and deletions", () => {
    const result = fileChangeSchema.parse({
      ...validFile,
      additions: 0,
      deletions: 0,
    });
    expect(result.additions).toBe(0);
    expect(result.deletions).toBe(0);
  });
});

describe("commitInfoSchema", () => {
  const validCommit = {
    sha: "abc123def456",
    message: "feat: add review schemas",
    author: "cmbays",
  };

  it("accepts a valid commit", () => {
    const result = commitInfoSchema.parse(validCommit);
    expect(result.sha).toBe("abc123def456");
  });

  it("rejects empty sha", () => {
    expect(() =>
      commitInfoSchema.parse({ ...validCommit, sha: "" }),
    ).toThrow();
  });

  it("rejects empty message", () => {
    expect(() =>
      commitInfoSchema.parse({ ...validCommit, message: "" }),
    ).toThrow();
  });
});

describe("prFactsSchema", () => {
  const validFacts = {
    branch: "session/0216-review-schemas",
    baseBranch: "main",
    files: [
      {
        path: "lib/schemas/review-config.ts",
        additions: 80,
        deletions: 0,
        status: "added" as const,
      },
    ],
    totalAdditions: 80,
    totalDeletions: 0,
    commits: [
      {
        sha: "abc123",
        message: "feat: add review config schemas",
        author: "cmbays",
      },
    ],
    domains: ["schemas"],
  };

  it("accepts valid PR facts", () => {
    const result = prFactsSchema.parse(validFacts);
    expect(result.branch).toBe("session/0216-review-schemas");
    expect(result.files).toHaveLength(1);
    expect(result.domains).toEqual(["schemas"]);
  });

  it("accepts optional prNumber", () => {
    const result = prFactsSchema.parse({ ...validFacts, prNumber: 42 });
    expect(result.prNumber).toBe(42);
  });

  it("rejects prNumber of 0", () => {
    expect(() =>
      prFactsSchema.parse({ ...validFacts, prNumber: 0 }),
    ).toThrow();
  });

  it("accepts empty files array", () => {
    const result = prFactsSchema.parse({ ...validFacts, files: [] });
    expect(result.files).toEqual([]);
  });

  it("rejects negative totalAdditions", () => {
    expect(() =>
      prFactsSchema.parse({ ...validFacts, totalAdditions: -1 }),
    ).toThrow();
  });
});

// ---------------------------------------------------------------------------
// Stage 2: prClassificationSchema
// ---------------------------------------------------------------------------

describe("prClassificationSchema", () => {
  const validClassification = {
    type: "feature" as const,
    riskLevel: "medium" as const,
    domains: ["schemas", "testing"],
    scope: "medium" as const,
    filesChanged: 4,
    linesChanged: 200,
  };

  it("accepts a valid classification", () => {
    const result = prClassificationSchema.parse(validClassification);
    expect(result.type).toBe("feature");
    expect(result.riskLevel).toBe("medium");
    expect(result.scope).toBe("medium");
  });

  it.each(["small", "medium", "large"] as const)(
    "accepts scope '%s'",
    (scope) => {
      expect(
        prClassificationSchema.parse({ ...validClassification, scope }).scope,
      ).toBe(scope);
    },
  );

  it("rejects invalid scope", () => {
    expect(() =>
      prClassificationSchema.parse({
        ...validClassification,
        scope: "tiny",
      }),
    ).toThrow();
  });

  it("rejects negative filesChanged", () => {
    expect(() =>
      prClassificationSchema.parse({
        ...validClassification,
        filesChanged: -1,
      }),
    ).toThrow();
  });

  it("rejects negative linesChanged", () => {
    expect(() =>
      prClassificationSchema.parse({
        ...validClassification,
        linesChanged: -1,
      }),
    ).toThrow();
  });
});

// ---------------------------------------------------------------------------
// Stage 3: agentManifestEntrySchema
// ---------------------------------------------------------------------------

describe("agentManifestEntrySchema", () => {
  const validEntry = {
    agentId: "build-reviewer",
    scope: ["lib/schemas/review-config.ts"],
    priority: 50,
    rules: ["br-type-safety-01", "br-dry-01"],
    reason: "Universal policy: always dispatch build-reviewer",
  };

  it("accepts a valid manifest entry", () => {
    const result = agentManifestEntrySchema.parse(validEntry);
    expect(result.agentId).toBe("build-reviewer");
    expect(result.rules).toHaveLength(2);
  });

  it("accepts priority 0", () => {
    const result = agentManifestEntrySchema.parse({
      ...validEntry,
      priority: 0,
    });
    expect(result.priority).toBe(0);
  });

  it("accepts priority 100", () => {
    const result = agentManifestEntrySchema.parse({
      ...validEntry,
      priority: 100,
    });
    expect(result.priority).toBe(100);
  });

  it("rejects priority above 100", () => {
    expect(() =>
      agentManifestEntrySchema.parse({ ...validEntry, priority: 101 }),
    ).toThrow();
  });

  it("rejects priority below 0", () => {
    expect(() =>
      agentManifestEntrySchema.parse({ ...validEntry, priority: -1 }),
    ).toThrow();
  });

  it("rejects empty agentId", () => {
    expect(() =>
      agentManifestEntrySchema.parse({ ...validEntry, agentId: "" }),
    ).toThrow();
  });

  it("rejects empty reason", () => {
    expect(() =>
      agentManifestEntrySchema.parse({ ...validEntry, reason: "" }),
    ).toThrow();
  });
});

// ---------------------------------------------------------------------------
// Stage 4: gapLogEntrySchema
// ---------------------------------------------------------------------------

describe("gapLogEntrySchema", () => {
  const validGap = {
    concern:
      "Financial calculations in lib/helpers/money.ts not covered by dispatched agents",
    recommendation:
      "Add finance-sme to the agent manifest for this PR",
    confidence: 0.85,
  };

  it("accepts a valid gap log entry", () => {
    const result = gapLogEntrySchema.parse(validGap);
    expect(result.confidence).toBe(0.85);
  });

  it("accepts optional suggestedRule", () => {
    const result = gapLogEntrySchema.parse({
      ...validGap,
      suggestedRule: "fin-bigjs-02",
    });
    expect(result.suggestedRule).toBe("fin-bigjs-02");
  });

  it("accepts optional suggestedAgent", () => {
    const result = gapLogEntrySchema.parse({
      ...validGap,
      suggestedAgent: "finance-sme",
    });
    expect(result.suggestedAgent).toBe("finance-sme");
  });

  it("accepts confidence 0", () => {
    const result = gapLogEntrySchema.parse({ ...validGap, confidence: 0 });
    expect(result.confidence).toBe(0);
  });

  it("accepts confidence 1", () => {
    const result = gapLogEntrySchema.parse({ ...validGap, confidence: 1 });
    expect(result.confidence).toBe(1);
  });

  it("rejects confidence below 0", () => {
    expect(() =>
      gapLogEntrySchema.parse({ ...validGap, confidence: -0.1 }),
    ).toThrow();
  });

  it("rejects confidence above 1", () => {
    expect(() =>
      gapLogEntrySchema.parse({ ...validGap, confidence: 1.1 }),
    ).toThrow();
  });

  it("rejects concern shorter than 10 chars", () => {
    expect(() =>
      gapLogEntrySchema.parse({ ...validGap, concern: "Too short" }),
    ).toThrow();
  });

  it("rejects recommendation shorter than 10 chars", () => {
    expect(() =>
      gapLogEntrySchema.parse({ ...validGap, recommendation: "Fix it" }),
    ).toThrow();
  });
});

// ---------------------------------------------------------------------------
// Stage 5: reviewFindingSchema
// ---------------------------------------------------------------------------

describe("reviewFindingSchema", () => {
  const validFinding = {
    ruleId: "br-type-safety-01",
    agent: "build-reviewer",
    severity: "major" as const,
    file: "lib/helpers/money.ts",
    line: 42,
    message: "Explicit any type found on return value",
    fix: "Replace with Big return type",
    category: "type-safety",
  };

  it("accepts a valid finding", () => {
    const result = reviewFindingSchema.parse(validFinding);
    expect(result.ruleId).toBe("br-type-safety-01");
    expect(result.severity).toBe("major");
    expect(result.dismissible).toBe(false);
  });

  it("defaults dismissible to false", () => {
    const result = reviewFindingSchema.parse(validFinding);
    expect(result.dismissible).toBe(false);
  });

  it("accepts dismissible true", () => {
    const result = reviewFindingSchema.parse({
      ...validFinding,
      dismissible: true,
    });
    expect(result.dismissible).toBe(true);
  });

  it("accepts optional line", () => {
    const { line: _, ...noLine } = validFinding;
    const result = reviewFindingSchema.parse(noLine);
    expect(result.line).toBeUndefined();
  });

  it("accepts optional fix", () => {
    const { fix: _, ...noFix } = validFinding;
    const result = reviewFindingSchema.parse(noFix);
    expect(result.fix).toBeUndefined();
  });

  it("rejects line of 0", () => {
    expect(() =>
      reviewFindingSchema.parse({ ...validFinding, line: 0 }),
    ).toThrow();
  });

  it("rejects negative line", () => {
    expect(() =>
      reviewFindingSchema.parse({ ...validFinding, line: -1 }),
    ).toThrow();
  });

  it("rejects empty ruleId", () => {
    expect(() =>
      reviewFindingSchema.parse({ ...validFinding, ruleId: "" }),
    ).toThrow();
  });

  it("rejects empty message", () => {
    expect(() =>
      reviewFindingSchema.parse({ ...validFinding, message: "" }),
    ).toThrow();
  });

  it("rejects invalid severity", () => {
    expect(() =>
      reviewFindingSchema.parse({ ...validFinding, severity: "high" }),
    ).toThrow();
  });
});

// ---------------------------------------------------------------------------
// Stage 6: severityMetricsSchema, reviewReportSchema, gateDecisionSchema
// ---------------------------------------------------------------------------

describe("severityMetricsSchema", () => {
  const validMetrics = { critical: 0, major: 2, warning: 5, info: 10 };

  it("accepts valid metrics", () => {
    const result = severityMetricsSchema.parse(validMetrics);
    expect(result.critical).toBe(0);
    expect(result.major).toBe(2);
  });

  it("rejects negative counts", () => {
    expect(() =>
      severityMetricsSchema.parse({ ...validMetrics, critical: -1 }),
    ).toThrow();
  });
});

describe("reviewReportSchema", () => {
  const validReport = {
    findings: [
      {
        ruleId: "br-type-safety-01",
        agent: "build-reviewer",
        severity: "major" as const,
        file: "lib/helpers/money.ts",
        line: 42,
        message: "Explicit any type found",
        category: "type-safety",
      },
    ],
    gaps: [],
    metrics: { critical: 0, major: 1, warning: 0, info: 0 },
    agentsDispatched: 2,
    agentsCompleted: 2,
    timestamp: "2026-02-16T10:00:00Z",
  };

  it("accepts a valid report", () => {
    const result = reviewReportSchema.parse(validReport);
    expect(result.findings).toHaveLength(1);
    expect(result.agentsDispatched).toBe(2);
  });

  it("accepts empty findings and gaps", () => {
    const result = reviewReportSchema.parse({
      ...validReport,
      findings: [],
      gaps: [],
    });
    expect(result.findings).toEqual([]);
    expect(result.gaps).toEqual([]);
  });

  it("rejects invalid timestamp", () => {
    expect(() =>
      reviewReportSchema.parse({ ...validReport, timestamp: "not-a-date" }),
    ).toThrow();
  });

  it("rejects negative agentsDispatched", () => {
    expect(() =>
      reviewReportSchema.parse({ ...validReport, agentsDispatched: -1 }),
    ).toThrow();
  });
});

describe("gateDecisionSchema", () => {
  const validDecision = {
    decision: "needs_fixes" as const,
    metrics: { critical: 0, major: 2, warning: 1, info: 3 },
    summary: "2 major findings require fixes before merge",
  };

  it("accepts a valid gate decision", () => {
    const result = gateDecisionSchema.parse(validDecision);
    expect(result.decision).toBe("needs_fixes");
  });

  it.each(["pass", "pass_with_warnings", "needs_fixes", "fail"] as const)(
    "accepts decision '%s'",
    (decision) => {
      expect(
        gateDecisionSchema.parse({ ...validDecision, decision }).decision,
      ).toBe(decision);
    },
  );

  it("rejects empty summary", () => {
    expect(() =>
      gateDecisionSchema.parse({ ...validDecision, summary: "" }),
    ).toThrow();
  });

  it("rejects invalid decision value", () => {
    expect(() =>
      gateDecisionSchema.parse({ ...validDecision, decision: "skip" }),
    ).toThrow();
  });
});
