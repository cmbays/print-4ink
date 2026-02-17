import type { AgentManifestEntry } from "@/lib/schemas/review-pipeline";

// ---------------------------------------------------------------------------
// Shared manifest merge utilities
//
// Used by Stage 3 (compose) and Stage 4 (gap-detect) to deduplicate and
// merge agent manifest entries by agentId.
// ---------------------------------------------------------------------------

/** Deduplicated union of two string arrays, preserving insertion order. */
export function unionStrings(a: string[], b: string[]): string[] {
  const set = new Set(a);
  for (const item of b) {
    set.add(item);
  }
  return [...set];
}

/**
 * Merge two manifest entries for the same agentId.
 *
 * - scope: union
 * - rules: union
 * - priority: max
 * - reason: append (skips if already present)
 * - triggeredBy: kept from `existing`
 */
export function mergeManifestEntry(
  existing: AgentManifestEntry,
  incoming: AgentManifestEntry,
): AgentManifestEntry {
  const mergedReason = existing.reason.includes(incoming.reason)
    ? existing.reason
    : `${existing.reason}; ${incoming.reason}`;

  return {
    agentId: existing.agentId,
    scope: unionStrings(existing.scope, incoming.scope),
    priority: Math.max(existing.priority, incoming.priority),
    rules: unionStrings(existing.rules, incoming.rules),
    reason: mergedReason,
    triggeredBy: existing.triggeredBy,
  };
}

/**
 * Deduplicate a list of manifest entries by agentId, merging duplicates.
 *
 * When `triggeredByHighestPriority` is true, the triggeredBy value from
 * the higher-priority entry wins (used by compose where multiple policies
 * can trigger the same agent).
 */
export function deduplicateManifest(
  entries: AgentManifestEntry[],
  opts?: { triggeredByHighestPriority?: boolean },
): AgentManifestEntry[] {
  const map = new Map<string, AgentManifestEntry>();

  for (const entry of entries) {
    const existing = map.get(entry.agentId);
    if (!existing) {
      map.set(entry.agentId, { ...entry, scope: [...entry.scope] });
      continue;
    }

    const merged = mergeManifestEntry(existing, entry);

    if (opts?.triggeredByHighestPriority && entry.priority > existing.priority) {
      merged.triggeredBy = entry.triggeredBy;
    }

    map.set(entry.agentId, merged);
  }

  return [...map.values()];
}

/**
 * Merge additional entries into an existing manifest, deduplicating by agentId.
 *
 * New agents are appended; existing agents are merged via mergeManifestEntry.
 */
export function mergeIntoManifest(
  base: AgentManifestEntry[],
  additions: AgentManifestEntry[],
): AgentManifestEntry[] {
  const result = base.map((e) => ({ ...e }));

  for (const incoming of additions) {
    const idx = result.findIndex((e) => e.agentId === incoming.agentId);

    if (idx >= 0) {
      result[idx] = mergeManifestEntry(result[idx], incoming);
    } else {
      result.push(incoming);
    }
  }

  return result;
}
