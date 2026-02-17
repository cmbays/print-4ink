import type {
  AgentManifestEntry,
  PRFacts,
  AgentResult,
} from "@domain/entities/review-pipeline";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Callback that launches a single review agent. Accepts a manifest entry
 * (scope, rules, priority) and the PR facts. Returns an agent result on
 * success, or throws on timeout/error.
 *
 * The launcher may omit `error` on success — dispatch will strip it to
 * satisfy the schema refinement that forbids `error` on success status.
 */
export type AgentLauncher = (
  entry: AgentManifestEntry,
  facts: PRFacts,
) => Promise<Omit<AgentResult, "error"> & { error?: string }>;

// ---------------------------------------------------------------------------
// dispatch — Stage 5
// ---------------------------------------------------------------------------

/**
 * Launches review agents from the manifest in parallel.
 *
 * Each agent is launched via the injected `launcher` callback, making it
 * easy to swap real agent invocations with test doubles.
 *
 * Errors are caught per-agent so a single failure never takes down the
 * whole pipeline:
 *   - Timeout errors (message contains "timed out" or "timeout") → status "timeout"
 *   - All other errors → status "error"
 *   - In both cases: findings = [], error message recorded, duration computed
 */
export async function dispatch(
  manifest: AgentManifestEntry[],
  facts: PRFacts,
  launcher: AgentLauncher,
): Promise<AgentResult[]> {
  if (manifest.length === 0) {
    return [];
  }

  const promises = manifest.map(async (entry): Promise<AgentResult> => {
    const startMs = Date.now();

    try {
      const raw = await launcher(entry, facts);
      // Strip error field for success status to satisfy the schema refinement
      const result: AgentResult = {
        agentId: raw.agentId,
        status: raw.status,
        findings: raw.findings,
        durationMs: raw.durationMs,
      };
      // Only attach error for non-success statuses
      if (raw.status !== "success" && raw.error) {
        result.error = raw.error;
      }
      return result;
    } catch (err: unknown) {
      const durationMs = Date.now() - startMs;
      const message =
        err instanceof Error ? err.message : String(err);

      const isTimeout =
        message.toLowerCase().includes("timed out") ||
        message.toLowerCase().includes("timeout");

      return {
        agentId: entry.agentId,
        status: isTimeout ? "timeout" : "error",
        findings: [],
        durationMs,
        error: message,
      };
    }
  });

  return Promise.all(promises);
}
