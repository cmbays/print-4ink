import { describe, it, expect, vi } from "vitest";
import { z } from "zod";
import {
  agentResultSchema,
  type PRFacts,
  type AgentManifestEntry,
} from "@/lib/schemas/review-pipeline";
import { dispatch, type AgentLauncher } from "../dispatch";

// ---------------------------------------------------------------------------
// Shared test data
// ---------------------------------------------------------------------------

const mockFacts: PRFacts = {
  branch: "session/0216-test",
  baseBranch: "main",
  files: [
    {
      path: "lib/helpers/money.ts",
      additions: 10,
      deletions: 2,
      status: "modified",
    },
  ],
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

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("dispatch (Stage 5 — parallel agent launching)", () => {
  // -------------------------------------------------------------------------
  // 1. Launches all agents and returns results
  // -------------------------------------------------------------------------
  it("launches all agents and returns results", async () => {
    const launcher: AgentLauncher = vi.fn(async (entry) => ({
      agentId: entry.agentId,
      status: "success" as const,
      findings: [],
      durationMs: 100,
    }));

    const results = await dispatch(manifest, mockFacts, launcher);

    expect(results).toHaveLength(2);
    expect(launcher).toHaveBeenCalledTimes(2);

    // Validate all results against the Zod schema
    z.array(agentResultSchema).parse(results);

    expect(results.map((r) => r.agentId)).toEqual(
      expect.arrayContaining(["build-reviewer", "finance-sme"]),
    );
  });

  // -------------------------------------------------------------------------
  // 2. Handles agent timeout gracefully
  // -------------------------------------------------------------------------
  it("handles agent timeout gracefully", async () => {
    const launcher: AgentLauncher = vi.fn(async (entry) => {
      if (entry.agentId === "finance-sme") {
        throw new Error("Agent finance-sme timed out after 30s");
      }
      return {
        agentId: entry.agentId,
        status: "success" as const,
        findings: [],
        durationMs: 100,
      };
    });

    const results = await dispatch(manifest, mockFacts, launcher);

    expect(results).toHaveLength(2);

    const timedOut = results.find((r) => r.agentId === "finance-sme");
    expect(timedOut).toBeDefined();
    expect(timedOut!.status).toBe("timeout");
    expect(timedOut!.findings).toEqual([]);
    expect(timedOut!.error).toContain("timed out");
    expect(timedOut!.durationMs).toBeGreaterThanOrEqual(0);

    const success = results.find((r) => r.agentId === "build-reviewer");
    expect(success).toBeDefined();
    expect(success!.status).toBe("success");

    // Both results should be schema-valid
    z.array(agentResultSchema).parse(results);
  });

  // -------------------------------------------------------------------------
  // 3. Handles agent error gracefully
  // -------------------------------------------------------------------------
  it("handles agent error gracefully", async () => {
    const launcher: AgentLauncher = vi.fn(async (entry) => {
      if (entry.agentId === "build-reviewer") {
        throw new Error("Connection refused");
      }
      return {
        agentId: entry.agentId,
        status: "success" as const,
        findings: [],
        durationMs: 200,
      };
    });

    const results = await dispatch(manifest, mockFacts, launcher);

    expect(results).toHaveLength(2);

    const errored = results.find((r) => r.agentId === "build-reviewer");
    expect(errored).toBeDefined();
    expect(errored!.status).toBe("error");
    expect(errored!.findings).toEqual([]);
    expect(errored!.error).toContain("Connection refused");
    expect(errored!.durationMs).toBeGreaterThanOrEqual(0);

    // Both results should be schema-valid
    z.array(agentResultSchema).parse(results);
  });

  // -------------------------------------------------------------------------
  // 4. Returns empty results for empty manifest
  // -------------------------------------------------------------------------
  it("returns empty results for empty manifest", async () => {
    const launcher: AgentLauncher = vi.fn(async (entry) => ({
      agentId: entry.agentId,
      status: "success" as const,
      findings: [],
      durationMs: 50,
    }));

    const results = await dispatch([], mockFacts, launcher);

    expect(results).toEqual([]);
    expect(launcher).not.toHaveBeenCalled();
  });

  // -------------------------------------------------------------------------
  // 5. Launches agents in parallel (not sequential)
  // -------------------------------------------------------------------------
  it("launches agents in parallel (not sequential)", async () => {
    const callLog: string[] = [];

    const launcher: AgentLauncher = vi.fn(async (entry) => {
      callLog.push(`start:${entry.agentId}`);
      // Simulate async work so the event loop can interleave
      await new Promise((resolve) => setTimeout(resolve, 50));
      callLog.push(`end:${entry.agentId}`);
      return {
        agentId: entry.agentId,
        status: "success" as const,
        findings: [],
        durationMs: 50,
      };
    });

    await dispatch(manifest, mockFacts, launcher);

    // Both agents should start before either ends
    const firstEnd = callLog.findIndex((e) => e.startsWith("end:"));
    const starts = callLog.slice(0, firstEnd).filter((e) => e.startsWith("start:"));
    expect(starts).toHaveLength(2);
  });
});
