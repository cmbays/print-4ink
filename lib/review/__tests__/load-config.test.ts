import { describe, it, expect } from "vitest";
import {
  loadReviewRules,
  loadCompositionPolicies,
  loadAgentRegistry,
  loadDomainMappings,
} from "../load-config";

// ---------------------------------------------------------------------------
// Loader return types and basic correctness
// ---------------------------------------------------------------------------

describe("loadReviewRules", () => {
  it("returns a non-empty array", () => {
    const rules = loadReviewRules();
    expect(Array.isArray(rules)).toBe(true);
    expect(rules.length).toBeGreaterThan(0);
  });

  it("returns frozen (immutable) data", () => {
    const rules = loadReviewRules();
    expect(Object.isFrozen(rules)).toBe(true);
  });

  it("is idempotent — returns equal data on repeated calls", () => {
    const a = loadReviewRules();
    const b = loadReviewRules();
    expect(a).toEqual(b);
  });
});

describe("loadCompositionPolicies", () => {
  it("returns a non-empty array", () => {
    const policies = loadCompositionPolicies();
    expect(Array.isArray(policies)).toBe(true);
    expect(policies.length).toBeGreaterThan(0);
  });

  it("returns frozen (immutable) data", () => {
    const policies = loadCompositionPolicies();
    expect(Object.isFrozen(policies)).toBe(true);
  });

  it("is idempotent — returns equal data on repeated calls", () => {
    const a = loadCompositionPolicies();
    const b = loadCompositionPolicies();
    expect(a).toEqual(b);
  });
});

describe("loadAgentRegistry", () => {
  it("returns a non-empty array", () => {
    const agents = loadAgentRegistry();
    expect(Array.isArray(agents)).toBe(true);
    expect(agents.length).toBeGreaterThan(0);
  });

  it("returns frozen (immutable) data", () => {
    const agents = loadAgentRegistry();
    expect(Object.isFrozen(agents)).toBe(true);
  });

  it("is idempotent — returns equal data on repeated calls", () => {
    const a = loadAgentRegistry();
    const b = loadAgentRegistry();
    expect(a).toEqual(b);
  });
});

describe("loadDomainMappings", () => {
  it("returns a non-empty array", () => {
    const domains = loadDomainMappings();
    expect(Array.isArray(domains)).toBe(true);
    expect(domains.length).toBeGreaterThan(0);
  });

  it("returns frozen (immutable) data", () => {
    const domains = loadDomainMappings();
    expect(Object.isFrozen(domains)).toBe(true);
  });

  it("is idempotent — returns equal data on repeated calls", () => {
    const a = loadDomainMappings();
    const b = loadDomainMappings();
    expect(a).toEqual(b);
  });
});

// ---------------------------------------------------------------------------
// Cross-reference tests not covered by review-config-data.test.ts
// ---------------------------------------------------------------------------

describe("cross-reference: every agent has at least one rule", () => {
  it("no orphan agents — every registered agent is referenced by at least one rule", () => {
    const agents = loadAgentRegistry();
    const rules = loadReviewRules();
    const ruleAgents = new Set(rules.map((r) => r.agent));

    for (const agent of agents) {
      expect(ruleAgents).toContain(agent.id);
    }
  });
});

describe("domain pattern syntax", () => {
  it("every domain pattern uses valid glob syntax (no empty segments, no trailing spaces)", () => {
    const domains = loadDomainMappings();

    for (const d of domains) {
      // No leading/trailing whitespace
      expect(d.pattern).toBe(d.pattern.trim());
      // No empty path segments (e.g., "lib//schemas")
      expect(d.pattern).not.toMatch(/\/\//);
      // Must contain at least one path character
      expect(d.pattern.length).toBeGreaterThan(0);
      // No backslash path separators (unix globs only)
      expect(d.pattern).not.toContain("\\");
    }
  });

  it("every pattern contains a recognizable path or glob element", () => {
    const domains = loadDomainMappings();

    for (const d of domains) {
      // Each pattern should have either a file extension, a glob wildcard, or a directory separator
      const hasExtension = /\.\w+$/.test(d.pattern);
      const hasWildcard = /[*?]/.test(d.pattern);
      const hasDirectory = d.pattern.includes("/");
      expect(hasExtension || hasWildcard || hasDirectory).toBe(true);
    }
  });
});
