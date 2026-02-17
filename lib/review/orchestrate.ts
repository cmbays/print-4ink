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

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface OrchestratorDeps {
  launcher: AgentLauncher;
  gapAnalyzer?: GapAnalyzer;
}

export interface OrchestrationResult {
  report: ReviewReport;
  gateDecision: GateDecision;
}

// ---------------------------------------------------------------------------
// Pipeline orchestrator — composes all 6 stages with Zod validation
// at every boundary.
// ---------------------------------------------------------------------------

export async function runReviewOrchestration(
  branch: string,
  baseBranch: string,
  deps: OrchestratorDeps,
): Promise<OrchestrationResult> {
  // Stage 1: Normalize
  const facts = prFactsSchema.parse(normalize(branch, baseBranch));

  // Stage 2: Classify
  const classification = prClassificationSchema.parse(classify(facts));

  // Stage 3: Compose
  const manifest = z
    .array(agentManifestEntrySchema)
    .parse(compose(classification, facts));

  // Stage 4: Gap Detect (graceful degradation — analyzer failures don't block)
  let amendedManifest: z.infer<typeof agentManifestEntrySchema>[];
  let gaps: z.infer<typeof gapLogEntrySchema>[];

  try {
    const gapResult = await gapDetect(
      facts,
      classification,
      manifest,
      deps.gapAnalyzer,
    );
    amendedManifest = z
      .array(agentManifestEntrySchema)
      .parse(gapResult.manifest);
    gaps = z.array(gapLogEntrySchema).parse(gapResult.gaps);
  } catch {
    // Analyzer failure: fall back to Stage 3 manifest, log a gap entry
    amendedManifest = manifest;
    gaps = [
      {
        concern:
          "Gap analyzer failed — pipeline continued with Stage 3 manifest",
        recommendation:
          "Investigate gap analyzer failure and re-run review",
        confidence: 0,
      },
    ];
  }

  // Stage 5: Dispatch
  const agentResults = z
    .array(agentResultSchema)
    .parse(await dispatch(amendedManifest, facts, deps.launcher));

  // Stage 6: Aggregate
  const { report: rawReport, gateDecision: rawGate } = aggregate(
    agentResults,
    gaps,
  );
  const report = reviewReportSchema.parse(rawReport);
  const gateDecision = gateDecisionSchema.parse(rawGate);

  return { report, gateDecision };
}
