import type {
  PRFacts,
  PRClassification,
  AgentManifestEntry,
  GapLogEntry,
} from '@domain/entities/review-pipeline'
import { mergeIntoManifest } from './manifest-utils'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Result returned by a GapAnalyzer callback. */
export type GapAnalysisResult = {
  /** Agents the analyzer wants to add to the manifest. */
  additionalAgents: AgentManifestEntry[]
  /** Concerns and recommendations logged during analysis. */
  gaps: GapLogEntry[]
}

/** Result returned by gapDetect. */
export type GapDetectResult = {
  /** The (possibly amended) agent manifest. */
  manifest: AgentManifestEntry[]
  /** Gap log entries from the analyzer. */
  gaps: GapLogEntry[]
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
  manifest: AgentManifestEntry[]
) => Promise<GapAnalysisResult>

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
  analyzer?: GapAnalyzer
): Promise<GapDetectResult> {
  // 1. No analyzer → passthrough
  if (!analyzer) {
    return { manifest, gaps: [] }
  }

  // 2. Call analyzer
  const analysis = await analyzer(facts, classification, manifest)

  // 3. Merge additional agents into manifest (dedup by agentId)
  const merged = mergeIntoManifest(manifest, analysis.additionalAgents)

  // 4. Return merged manifest + gaps
  return {
    manifest: merged,
    gaps: analysis.gaps,
  }
}
