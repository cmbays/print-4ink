import { z } from "zod";
import { severityEnum, reviewRiskLevelEnum } from "./review-config";

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const prTypeEnum = z.enum([
  "feature",
  "bugfix",
  "refactor",
  "docs",
  "test",
  "chore",
  "mixed",
]);

export const prScopeEnum = z.enum(["small", "medium", "large"]);

export const gateDecisionEnum = z.enum([
  "pass",
  "pass_with_warnings",
  "needs_fixes",
  "fail",
]);

// ---------------------------------------------------------------------------
// Stage 1: Normalize — PR Facts (immutable input)
// ---------------------------------------------------------------------------

export const fileChangeSchema = z.object({
  path: z.string().min(1),
  additions: z.number().int().nonnegative(),
  deletions: z.number().int().nonnegative(),
  status: z.enum(["added", "modified", "deleted", "renamed"]),
});

export const commitInfoSchema = z.object({
  sha: z.string().min(1),
  message: z.string().min(1),
  author: z.string().min(1),
});

export const prFactsSchema = z.object({
  prNumber: z.number().int().positive().optional(),
  branch: z.string().min(1),
  baseBranch: z.string().min(1),
  files: z.array(fileChangeSchema),
  totalAdditions: z.number().int().nonnegative(),
  totalDeletions: z.number().int().nonnegative(),
  commits: z.array(commitInfoSchema),
  domains: z.array(z.string().min(1)),
});

// ---------------------------------------------------------------------------
// Stage 2: Classify — PR Classification
// ---------------------------------------------------------------------------

export const prClassificationSchema = z.object({
  type: prTypeEnum,
  riskLevel: reviewRiskLevelEnum,
  domains: z.array(z.string().min(1)),
  scope: prScopeEnum,
  filesChanged: z.number().int().nonnegative(),
  linesChanged: z.number().int().nonnegative(),
});

// ---------------------------------------------------------------------------
// Stage 3: Compose — Agent Manifest
// ---------------------------------------------------------------------------

export const agentManifestEntrySchema = z.object({
  agentId: z.string().min(1),
  scope: z.array(z.string().min(1)),
  priority: z.number().int().min(0).max(100),
  rules: z.array(z.string().min(1)),
  reason: z.string().min(1),
});

// ---------------------------------------------------------------------------
// Stage 4: Gap Detect — Gap Log
// ---------------------------------------------------------------------------

export const gapLogEntrySchema = z.object({
  concern: z.string().min(10),
  recommendation: z.string().min(10),
  suggestedRule: z.string().optional(),
  suggestedAgent: z.string().optional(),
  confidence: z.number().min(0).max(1),
});

// ---------------------------------------------------------------------------
// Stage 5: Dispatch — Review Finding (uniform format)
// ---------------------------------------------------------------------------

export const reviewFindingSchema = z.object({
  ruleId: z.string().min(1),
  agent: z.string().min(1),
  severity: severityEnum,
  file: z.string().min(1),
  line: z.number().int().positive().optional(),
  message: z.string().min(1),
  fix: z.string().optional(),
  dismissible: z.boolean().default(false),
  category: z.string().min(1),
});

// ---------------------------------------------------------------------------
// Stage 6: Aggregate — Review Report + Gate Decision
// ---------------------------------------------------------------------------

export const severityMetricsSchema = z.object({
  critical: z.number().int().nonnegative(),
  major: z.number().int().nonnegative(),
  warning: z.number().int().nonnegative(),
  info: z.number().int().nonnegative(),
});

export const reviewReportSchema = z.object({
  findings: z.array(reviewFindingSchema),
  gaps: z.array(gapLogEntrySchema),
  metrics: severityMetricsSchema,
  agentsDispatched: z.number().int().nonnegative(),
  agentsCompleted: z.number().int().nonnegative(),
  timestamp: z.string().datetime(),
});

export const gateDecisionSchema = z.object({
  decision: gateDecisionEnum,
  metrics: severityMetricsSchema,
  summary: z.string().min(1),
});

// ---------------------------------------------------------------------------
// Type exports
// ---------------------------------------------------------------------------

export type PRType = z.infer<typeof prTypeEnum>;
export type PRScope = z.infer<typeof prScopeEnum>;
export type GateDecisionValue = z.infer<typeof gateDecisionEnum>;
export type FileChange = z.infer<typeof fileChangeSchema>;
export type CommitInfo = z.infer<typeof commitInfoSchema>;
export type PRFacts = z.infer<typeof prFactsSchema>;
export type PRClassification = z.infer<typeof prClassificationSchema>;
export type AgentManifestEntry = z.infer<typeof agentManifestEntrySchema>;
export type GapLogEntry = z.infer<typeof gapLogEntrySchema>;
export type ReviewFinding = z.infer<typeof reviewFindingSchema>;
export type SeverityMetrics = z.infer<typeof severityMetricsSchema>;
export type ReviewReport = z.infer<typeof reviewReportSchema>;
export type GateDecision = z.infer<typeof gateDecisionSchema>;
