import type {
  AgentResult,
  GapLogEntry,
  GateDecision,
  GateDecisionValue,
  ReviewFinding,
  ReviewReport,
  SeverityMetrics,
} from "@/lib/schemas/review-pipeline";
import type { Severity } from "@/lib/schemas/review-config";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AggregateResult {
  report: ReviewReport;
  gateDecision: GateDecision;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SEVERITY_ORDER: Severity[] = ["critical", "major", "warning", "info"];

// ---------------------------------------------------------------------------
// Implementation
// ---------------------------------------------------------------------------

/**
 * Stage 6 — Aggregate: merges findings from all agents, deduplicates,
 * sorts by severity, computes metrics, and applies gate logic.
 */
export function aggregate(
  agentResults: AgentResult[],
  gaps: GapLogEntry[],
): AggregateResult {
  // 1. Flatten all findings from all agent results
  const allFindings: ReviewFinding[] = agentResults.flatMap((r) => r.findings);

  // 2. Deduplicate by key `${ruleId}::${file}::${line ?? "none"}`
  //    First occurrence wins; count dupes
  const seen = new Map<string, ReviewFinding>();
  let deduplicated = 0;

  for (const finding of allFindings) {
    const key = `${finding.ruleId}::${finding.file}::${finding.line ?? "none"}`;
    if (seen.has(key)) {
      deduplicated++;
    } else {
      seen.set(key, finding);
    }
  }

  const uniqueFindings = Array.from(seen.values());

  // 3. Sort by severity order: critical=0, major=1, warning=2, info=3
  uniqueFindings.sort(
    (a, b) =>
      SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity),
  );

  // 4. Compute metrics: count findings per severity level
  const metrics: SeverityMetrics = {
    critical: 0,
    major: 0,
    warning: 0,
    info: 0,
  };
  for (const finding of uniqueFindings) {
    metrics[finding.severity]++;
  }

  // 5. Count agents
  const agentsDispatched = agentResults.length;
  const agentsCompleted = agentResults.filter(
    (r) => r.status === "success",
  ).length;

  // 6. Build ReviewReport
  const report: ReviewReport = {
    agentResults,
    findings: uniqueFindings,
    gaps,
    metrics,
    agentsDispatched,
    agentsCompleted,
    deduplicated,
    timestamp: new Date().toISOString(),
  };

  // 7. Compute gate decision
  const gateDecision = computeGateDecision(metrics);

  return { report, gateDecision };
}

// ---------------------------------------------------------------------------
// Gate logic
// ---------------------------------------------------------------------------

function computeGateDecision(metrics: SeverityMetrics): GateDecision {
  let decision: GateDecisionValue;
  let summary: string;

  if (metrics.critical > 0) {
    decision = "fail";
    summary = `${metrics.critical} critical finding${metrics.critical === 1 ? "" : "s"} found`;
  } else if (metrics.major > 0) {
    decision = "needs_fixes";
    summary = `${metrics.major} major finding${metrics.major === 1 ? "" : "s"} found`;
  } else if (metrics.warning > 0) {
    decision = "pass_with_warnings";
    summary = `${metrics.warning} warning${metrics.warning === 1 ? "" : "s"} found`;
  } else {
    decision = "pass";
    summary = "All checks passed";
  }

  return { decision, metrics, summary };
}
