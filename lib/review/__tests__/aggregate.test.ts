import { describe, it, expect } from "vitest";
import { aggregate } from "../aggregate";
import {
  reviewReportSchema,
  gateDecisionSchema,
  type ReviewFinding,
  type AgentResult,
  type GapLogEntry,
} from "@/lib/schemas/review-pipeline";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeFinding(overrides: Partial<ReviewFinding> = {}): ReviewFinding {
  return {
    ruleId: "U-TYPE-1",
    agent: "build-reviewer",
    severity: "warning",
    file: "lib/test.ts",
    message: "Test finding",
    category: "type-safety",
    dismissible: false,
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

function makeGap(overrides: Partial<GapLogEntry> = {}): GapLogEntry {
  return {
    concern: "No test coverage for edge case scenario",
    recommendation: "Add tests for boundary conditions in the module",
    confidence: 0.7,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("aggregate (Stage 6 — findings to ReviewReport + GateDecision)", () => {
  // -------------------------------------------------------------------------
  // 1. Produces a valid ReviewReport from agent results
  // -------------------------------------------------------------------------
  it("produces a valid ReviewReport from agent results", () => {
    const results: AgentResult[] = [
      makeResult({
        agentId: "build-reviewer",
        findings: [makeFinding({ severity: "warning", message: "Warn 1" })],
      }),
      makeResult({
        agentId: "finance-sme",
        findings: [makeFinding({ severity: "info", ruleId: "F-CALC-1", message: "Info 1" })],
      }),
    ];

    const { report, gateDecision } = aggregate(results, []);

    // Validate against Zod schemas — will throw if invalid
    reviewReportSchema.parse(report);
    gateDecisionSchema.parse(gateDecision);

    expect(report.agentsDispatched).toBe(2);
    expect(report.agentsCompleted).toBe(2);
    expect(report.findings).toHaveLength(2);
    expect(report.timestamp).toBeDefined();
  });

  // -------------------------------------------------------------------------
  // 2. Deduplicates findings with same (ruleId, file, line)
  // -------------------------------------------------------------------------
  it("deduplicates findings with same (ruleId, file, line)", () => {
    const finding = makeFinding({ ruleId: "U-TYPE-1", file: "lib/test.ts", line: 10 });
    const results: AgentResult[] = [
      makeResult({
        agentId: "build-reviewer",
        findings: [{ ...finding, agent: "build-reviewer" }],
      }),
      makeResult({
        agentId: "finance-sme",
        findings: [{ ...finding, agent: "finance-sme" }],
      }),
    ];

    const { report } = aggregate(results, []);

    reviewReportSchema.parse(report);

    // Same ruleId+file+line from 2 agents → 1 finding in output
    expect(report.findings).toHaveLength(1);
    expect(report.deduplicated).toBe(1);
  });

  // -------------------------------------------------------------------------
  // 3. Does NOT deduplicate findings with different lines
  // -------------------------------------------------------------------------
  it("does NOT deduplicate findings with different lines", () => {
    const results: AgentResult[] = [
      makeResult({
        findings: [makeFinding({ ruleId: "U-TYPE-1", file: "lib/test.ts", line: 10 })],
      }),
      makeResult({
        agentId: "finance-sme",
        findings: [makeFinding({ ruleId: "U-TYPE-1", file: "lib/test.ts", line: 20 })],
      }),
    ];

    const { report } = aggregate(results, []);

    reviewReportSchema.parse(report);

    // Same ruleId+file but different line → both kept
    expect(report.findings).toHaveLength(2);
    expect(report.deduplicated).toBe(0);
  });

  // -------------------------------------------------------------------------
  // 4. Gate: FAIL when critical findings exist
  // -------------------------------------------------------------------------
  it("gate: FAIL when critical findings exist", () => {
    const results: AgentResult[] = [
      makeResult({
        findings: [makeFinding({ severity: "critical", message: "Critical issue" })],
      }),
    ];

    const { gateDecision } = aggregate(results, []);

    gateDecisionSchema.parse(gateDecision);

    expect(gateDecision.decision).toBe("fail");
    expect(gateDecision.metrics.critical).toBe(1);
  });

  // -------------------------------------------------------------------------
  // 5. Gate: NEEDS_FIXES when major findings exist (no critical)
  // -------------------------------------------------------------------------
  it("gate: NEEDS_FIXES when major findings exist (no critical)", () => {
    const results: AgentResult[] = [
      makeResult({
        findings: [
          makeFinding({ severity: "major", message: "Major issue" }),
          makeFinding({ severity: "warning", ruleId: "W-1", message: "Warning" }),
        ],
      }),
    ];

    const { gateDecision } = aggregate(results, []);

    gateDecisionSchema.parse(gateDecision);

    expect(gateDecision.decision).toBe("needs_fixes");
    expect(gateDecision.metrics.major).toBe(1);
    expect(gateDecision.metrics.warning).toBe(1);
    expect(gateDecision.metrics.critical).toBe(0);
  });

  // -------------------------------------------------------------------------
  // 6. Gate: PASS_WITH_WARNINGS when only warnings exist
  // -------------------------------------------------------------------------
  it("gate: PASS_WITH_WARNINGS when only warnings exist", () => {
    const results: AgentResult[] = [
      makeResult({
        findings: [
          makeFinding({ severity: "warning", message: "Warning 1" }),
          makeFinding({ severity: "warning", ruleId: "W-2", file: "lib/other.ts", message: "Warning 2" }),
        ],
      }),
    ];

    const { gateDecision } = aggregate(results, []);

    gateDecisionSchema.parse(gateDecision);

    expect(gateDecision.decision).toBe("pass_with_warnings");
    expect(gateDecision.metrics.warning).toBe(2);
    expect(gateDecision.metrics.critical).toBe(0);
    expect(gateDecision.metrics.major).toBe(0);
  });

  // -------------------------------------------------------------------------
  // 7. Gate: PASS when no findings or only info
  // -------------------------------------------------------------------------
  it("gate: PASS when only info findings exist", () => {
    const results: AgentResult[] = [
      makeResult({
        findings: [makeFinding({ severity: "info", message: "Info note" })],
      }),
    ];

    const { gateDecision } = aggregate(results, []);

    gateDecisionSchema.parse(gateDecision);

    expect(gateDecision.decision).toBe("pass");
    expect(gateDecision.metrics.info).toBe(1);
  });

  // -------------------------------------------------------------------------
  // 8. Gate: PASS when no findings at all
  // -------------------------------------------------------------------------
  it("gate: PASS when no findings at all", () => {
    const results: AgentResult[] = [makeResult({ findings: [] })];

    const { gateDecision } = aggregate(results, []);

    gateDecisionSchema.parse(gateDecision);

    expect(gateDecision.decision).toBe("pass");
    expect(gateDecision.summary).toContain("All checks passed");
    expect(gateDecision.metrics).toEqual({
      critical: 0,
      major: 0,
      warning: 0,
      info: 0,
    });
  });

  // -------------------------------------------------------------------------
  // 9. Includes gap log entries in report
  // -------------------------------------------------------------------------
  it("includes gap log entries in report", () => {
    const gaps: GapLogEntry[] = [
      makeGap({ concern: "Missing test coverage for edge cases" }),
      makeGap({ concern: "No lint rule for async error handling" }),
    ];

    const { report } = aggregate([makeResult()], gaps);

    reviewReportSchema.parse(report);

    expect(report.gaps).toHaveLength(2);
    expect(report.gaps[0].concern).toBe("Missing test coverage for edge cases");
    expect(report.gaps[1].concern).toBe("No lint rule for async error handling");
  });

  // -------------------------------------------------------------------------
  // 10. Counts agents correctly including timeout/error
  // -------------------------------------------------------------------------
  it("counts agents correctly — agentsCompleted only counts success", () => {
    const results: AgentResult[] = [
      makeResult({ agentId: "build-reviewer", status: "success" }),
      makeResult({ agentId: "finance-sme", status: "timeout", error: "Agent timed out after 30s" }),
      makeResult({ agentId: "design-auditor", status: "error", error: "Agent crashed unexpectedly" }),
    ];

    const { report } = aggregate(results, []);

    reviewReportSchema.parse(report);

    expect(report.agentsDispatched).toBe(3);
    expect(report.agentsCompleted).toBe(1);
  });

  // -------------------------------------------------------------------------
  // 11. Sorts findings by severity (critical first)
  // -------------------------------------------------------------------------
  it("sorts findings by severity (critical first, then major, warning, info)", () => {
    const results: AgentResult[] = [
      makeResult({
        findings: [
          makeFinding({ severity: "info", ruleId: "I-1", file: "a.ts", message: "Info" }),
          makeFinding({ severity: "critical", ruleId: "C-1", file: "b.ts", message: "Critical" }),
          makeFinding({ severity: "warning", ruleId: "W-1", file: "c.ts", message: "Warning" }),
          makeFinding({ severity: "major", ruleId: "M-1", file: "d.ts", message: "Major" }),
        ],
      }),
    ];

    const { report } = aggregate(results, []);

    reviewReportSchema.parse(report);

    expect(report.findings).toHaveLength(4);
    expect(report.findings[0].severity).toBe("critical");
    expect(report.findings[1].severity).toBe("major");
    expect(report.findings[2].severity).toBe("warning");
    expect(report.findings[3].severity).toBe("info");
  });
});
