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
  // normalize calls execSync with { encoding: "utf-8" } which returns strings
  mockedExecSync.mockImplementation((cmd: string) => {
    const cmdStr = String(cmd);
    if (cmdStr.includes("--numstat")) {
      return "10\t2\tlib/helpers/money.ts\n5\t1\tcomponents/features/quotes/QuoteCard.tsx\n";
    }
    if (cmdStr.includes("--name-status")) {
      return "M\tlib/helpers/money.ts\nM\tcomponents/features/quotes/QuoteCard.tsx\n";
    }
    if (cmdStr.includes("git log")) {
      return "abc1234\x00feat: update pricing\x00Claude\n";
    }
    if (cmdStr.includes("git diff")) {
      return "diff --git a/lib/helpers/money.ts...";
    }
    return "";
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
          dismissible: false,
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
          concern:
            "Security concern detected — no security agent in registry yet",
          recommendation:
            "Create a security-reviewer agent for OWASP checks",
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
        return "bbb2222\x00chore: empty\x00Claude\n";
      }
      return "";
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
