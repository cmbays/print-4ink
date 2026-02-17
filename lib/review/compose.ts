import picomatch from "picomatch";
import type {
  PRClassification,
  PRFacts,
  AgentManifestEntry,
} from "@/lib/schemas/review-pipeline";
import type {
  CompositionPolicy,
  ReviewRiskLevel,
} from "@/lib/schemas/review-config";
import {
  loadCompositionPolicies,
  loadReviewRules,
  loadDomainMappings,
} from "./load-config";

// ---------------------------------------------------------------------------
// Risk level ordering for comparison
// ---------------------------------------------------------------------------

const RISK_LEVEL_ORDER: Record<ReviewRiskLevel, number> = {
  low: 0,
  medium: 1,
  high: 2,
  critical: 3,
};

// ---------------------------------------------------------------------------
// Trigger evaluation
// ---------------------------------------------------------------------------

/**
 * Returns true if the policy's trigger condition matches the given
 * classification and facts.
 */
function evaluateTrigger(
  policy: CompositionPolicy,
  classification: PRClassification,
  facts: PRFacts,
): boolean {
  const { trigger } = policy;

  switch (trigger.type) {
    case "always":
      return true;

    case "domain":
      return trigger.domains.some((d) => classification.domains.includes(d));

    case "risk":
      return (
        RISK_LEVEL_ORDER[classification.riskLevel] >=
        RISK_LEVEL_ORDER[trigger.riskLevel]
      );

    case "content":
      if (!facts.diffContent) return false;
      return new RegExp(trigger.pattern).test(facts.diffContent);

    default:
      return false;
  }
}

// ---------------------------------------------------------------------------
// Scope computation
// ---------------------------------------------------------------------------

/**
 * Computes the set of changed files that fall within this policy's scope.
 *
 * - "always" / "risk" / "content" triggers => all changed files
 * - "domain" trigger => only files whose paths match the glob patterns
 *   of the triggered domains
 */
function computeScope(
  policy: CompositionPolicy,
  classification: PRClassification,
  facts: PRFacts,
  domainGlobs: Map<string, string[]>,
): string[] {
  const allPaths = facts.files.map((f) => f.path);

  if (policy.trigger.type !== "domain") {
    return allPaths;
  }

  // Collect all glob patterns for the triggered domains that are also
  // present in the classification
  const matchedDomains = policy.trigger.domains.filter((d) =>
    classification.domains.includes(d),
  );

  const patterns: string[] = [];
  for (const domain of matchedDomains) {
    const globs = domainGlobs.get(domain);
    if (globs) {
      patterns.push(...globs);
    }
  }

  if (patterns.length === 0) return allPaths;

  const isMatch = picomatch(patterns);
  return allPaths.filter((p) => isMatch(p));
}

// ---------------------------------------------------------------------------
// compose — Stage 3 entry point
// ---------------------------------------------------------------------------

/**
 * Policy engine that evaluates composition policies against a PR
 * classification and produces an agent dispatch manifest.
 *
 * Algorithm:
 * 1. Load policies, rules, and domain mappings
 * 2. Evaluate each policy's trigger against the classification + facts
 * 3. For matching policies, compute scope (file set)
 * 4. Filter applicable rules per agent
 * 5. Deduplicate by agentId (merge scope, keep highest priority, append reasons)
 * 6. Sort by priority descending
 */
export function compose(
  classification: PRClassification,
  facts: PRFacts,
): AgentManifestEntry[] {
  const policies = loadCompositionPolicies();
  const rules = loadReviewRules();
  const domainMappings = loadDomainMappings();

  // Build a map from domain name to its glob patterns
  const domainGlobs = new Map<string, string[]>();
  for (const mapping of domainMappings) {
    const existing = domainGlobs.get(mapping.domain) ?? [];
    existing.push(mapping.pattern);
    domainGlobs.set(mapping.domain, existing);
  }

  // Evaluate each policy and collect raw (pre-dedup) manifest entries
  const rawEntries: AgentManifestEntry[] = [];

  for (const policy of policies) {
    if (!evaluateTrigger(policy, classification, facts)) {
      continue;
    }

    const scope = computeScope(policy, classification, facts, domainGlobs);
    const agentRules = rules
      .filter((r) => r.agent === policy.dispatch)
      .map((r) => r.id);

    rawEntries.push({
      agentId: policy.dispatch,
      scope,
      priority: policy.priority,
      rules: agentRules,
      reason: policy.description,
      triggeredBy: policy.id,
    });
  }

  // Deduplicate by agentId: merge scope (union), keep highest priority,
  // append reasons
  const deduped = new Map<string, AgentManifestEntry>();

  for (const entry of rawEntries) {
    const existing = deduped.get(entry.agentId);
    if (!existing) {
      deduped.set(entry.agentId, { ...entry, scope: [...entry.scope] });
      continue;
    }

    // Merge scope (union via Set)
    const mergedScope = [...new Set([...existing.scope, ...entry.scope])];

    // Keep highest priority
    const maxPriority = Math.max(existing.priority, entry.priority);

    // Append reasons
    const mergedReason = existing.reason.includes(entry.reason)
      ? existing.reason
      : `${existing.reason}; ${entry.reason}`;

    // Merge rules (union via Set)
    const mergedRules = [...new Set([...existing.rules, ...entry.rules])];

    // Keep the triggeredBy of the higher-priority entry
    const triggeredBy =
      entry.priority > existing.priority
        ? entry.triggeredBy
        : existing.triggeredBy;

    deduped.set(entry.agentId, {
      agentId: entry.agentId,
      scope: mergedScope,
      priority: maxPriority,
      rules: mergedRules,
      reason: mergedReason,
      triggeredBy,
    });
  }

  // Sort by priority descending
  const manifest = [...deduped.values()].sort(
    (a, b) => b.priority - a.priority,
  );

  return manifest;
}
