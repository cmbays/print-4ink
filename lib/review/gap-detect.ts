import type {
  PRFacts,
  PRClassification,
  AgentManifestEntry,
  GapLogEntry,
} from "@/lib/schemas/review-pipeline";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Result returned by a GapAnalyzer callback. */
export interface GapAnalysisResult {
  /** Agents the analyzer wants to add to the manifest. */
  additionalAgents: AgentManifestEntry[];
  /** Concerns and recommendations logged during analysis. */
  gaps: GapLogEntry[];
}

/** Result returned by gapDetect. */
export interface GapDetectResult {
  /** The (possibly amended) agent manifest. */
  manifest: AgentManifestEntry[];
  /** Gap log entries from the analyzer. */
  gaps: GapLogEntry[];
}

/**
 * Callback type for the gap analyzer.
 *
 * At runtime this is fulfilled by LLM-guided reasoning from the orchestrating
 * agent. Tests can provide a mock or omit it entirely for passthrough behavior.
 */
export type GapAnalyzer = (
  facts: PRFacts,
  classification: PRClassification,
  manifest: AgentManifestEntry[],
) => Promise<GapAnalysisResult>;

// ---------------------------------------------------------------------------
// Merge helpers
// ---------------------------------------------------------------------------

/** Deduplicated union of two string arrays, preserving insertion order. */
function unionStrings(a: string[], b: string[]): string[] {
  const set = new Set(a);
  for (const item of b) {
    set.add(item);
  }
  return [...set];
}

/**
 * Merge an additional agent into an existing manifest entry.
 *
 * - scope: union of both scopes
 * - rules: union of both rule lists
 * - priority: max of both priorities
 * - reason: append the new reason (separated by "; ")
 */
function mergeEntry(
  existing: AgentManifestEntry,
  incoming: AgentManifestEntry,
): AgentManifestEntry {
  return {
    agentId: existing.agentId,
    scope: unionStrings(existing.scope, incoming.scope),
    priority: Math.max(existing.priority, incoming.priority),
    rules: unionStrings(existing.rules, incoming.rules),
    reason: `${existing.reason}; ${incoming.reason}`,
    triggeredBy: existing.triggeredBy,
  };
}

// ---------------------------------------------------------------------------
// Stage 4: Gap Detect
// ---------------------------------------------------------------------------

/**
 * Stage 4 of the review pipeline — Gap Detect.
 *
 * If no `analyzer` is provided, the manifest passes through unchanged.
 * When an analyzer is present, its additional agents are merged into the
 * manifest (deduplicating by `agentId`) and its gap log is forwarded.
 */
export async function gapDetect(
  facts: PRFacts,
  classification: PRClassification,
  manifest: AgentManifestEntry[],
  analyzer?: GapAnalyzer,
): Promise<GapDetectResult> {
  // 1. No analyzer → passthrough
  if (!analyzer) {
    return { manifest, gaps: [] };
  }

  // 2. Call analyzer
  const analysis = await analyzer(facts, classification, manifest);

  // 3. Merge additional agents into manifest (dedup by agentId)
  const merged = [...manifest];

  for (const incoming of analysis.additionalAgents) {
    const existingIndex = merged.findIndex(
      (e) => e.agentId === incoming.agentId,
    );

    if (existingIndex >= 0) {
      // Agent already exists — merge scope, rules, priority, reason
      merged[existingIndex] = mergeEntry(merged[existingIndex], incoming);
    } else {
      // New agent — append
      merged.push(incoming);
    }
  }

  // 4. Return merged manifest + gaps
  return {
    manifest: merged,
    gaps: analysis.gaps,
  };
}
