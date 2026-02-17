import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";
import {
  reviewRuleSchema,
  compositionPolicySchema,
  agentRegistryEntrySchema,
  domainMappingSchema,
} from "../review-config";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function loadJson<T>(filename: string): T {
  const filePath = resolve(__dirname, "../../../config", filename);
  return JSON.parse(readFileSync(filePath, "utf8")) as T;
}

// ---------------------------------------------------------------------------
// Load config files
// ---------------------------------------------------------------------------

const rules = loadJson<unknown[]>("review-rules.json");
const composition = loadJson<unknown[]>("review-composition.json");
const agents = loadJson<unknown[]>("review-agents.json");
const domains = loadJson<unknown[]>("review-domains.json");

// ---------------------------------------------------------------------------
// review-agents.json
// ---------------------------------------------------------------------------

describe("review-agents.json", () => {
  it("is a non-empty array", () => {
    expect(Array.isArray(agents)).toBe(true);
    expect(agents.length).toBeGreaterThan(0);
  });

  it("every entry passes agentRegistryEntrySchema", () => {
    for (const entry of agents) {
      expect(() => agentRegistryEntrySchema.parse(entry)).not.toThrow();
    }
  });

  it("has no duplicate agent IDs", () => {
    const parsed = agents.map((a) => agentRegistryEntrySchema.parse(a));
    const ids = parsed.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("contains expected agents", () => {
    const parsed = agents.map((a) => agentRegistryEntrySchema.parse(a));
    const ids = parsed.map((a) => a.id);
    expect(ids).toContain("build-reviewer");
    expect(ids).toContain("finance-sme");
    expect(ids).toContain("design-auditor");
  });
});

// ---------------------------------------------------------------------------
// review-domains.json
// ---------------------------------------------------------------------------

describe("review-domains.json", () => {
  it("is a non-empty array", () => {
    expect(Array.isArray(domains)).toBe(true);
    expect(domains.length).toBeGreaterThan(0);
  });

  it("every entry passes domainMappingSchema", () => {
    for (const entry of domains) {
      expect(() => domainMappingSchema.parse(entry)).not.toThrow();
    }
  });

  it("covers expected domains", () => {
    const parsed = domains.map((d) => domainMappingSchema.parse(d));
    const domainNames = [...new Set(parsed.map((d) => d.domain))];
    expect(domainNames).toContain("schemas");
    expect(domainNames).toContain("financial");
    expect(domainNames).toContain("ui-components");
    expect(domainNames).toContain("design-system");
    expect(domainNames).toContain("infrastructure");
    expect(domainNames).toContain("testing");
  });
});

// ---------------------------------------------------------------------------
// review-composition.json
// ---------------------------------------------------------------------------

describe("review-composition.json", () => {
  it("is a non-empty array", () => {
    expect(Array.isArray(composition)).toBe(true);
    expect(composition.length).toBeGreaterThan(0);
  });

  it("every entry passes compositionPolicySchema", () => {
    for (const entry of composition) {
      expect(() => compositionPolicySchema.parse(entry)).not.toThrow();
    }
  });

  it("has no duplicate policy IDs", () => {
    const parsed = composition.map((c) => compositionPolicySchema.parse(c));
    const ids = parsed.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("all dispatched agents exist in review-agents.json", () => {
    const agentIds = agents.map((a) => agentRegistryEntrySchema.parse(a).id);
    const parsed = composition.map((c) => compositionPolicySchema.parse(c));
    for (const policy of parsed) {
      expect(agentIds).toContain(policy.dispatch);
    }
  });

  it("all domain trigger values exist in review-domains.json", () => {
    const domainNames = [
      ...new Set(domains.map((d) => domainMappingSchema.parse(d).domain)),
    ];
    const parsed = composition.map((c) => compositionPolicySchema.parse(c));
    for (const policy of parsed) {
      if (policy.trigger.type === "domain") {
        for (const domain of policy.trigger.domains) {
          expect(domainNames).toContain(domain);
        }
      }
    }
  });
});

// ---------------------------------------------------------------------------
// review-rules.json
// ---------------------------------------------------------------------------

describe("review-rules.json", () => {
  it("is a non-empty array", () => {
    expect(Array.isArray(rules)).toBe(true);
    expect(rules.length).toBeGreaterThan(0);
  });

  it("every entry passes reviewRuleSchema", () => {
    for (const entry of rules) {
      expect(() => reviewRuleSchema.parse(entry)).not.toThrow();
    }
  });

  it("has no duplicate rule IDs", () => {
    const parsed = rules.map((r) => reviewRuleSchema.parse(r));
    const ids = parsed.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("has at least 50 rules", () => {
    expect(rules.length).toBeGreaterThanOrEqual(50);
  });

  it("all agent references exist in review-agents.json", () => {
    const agentIds = agents.map((a) => agentRegistryEntrySchema.parse(a).id);
    const parsed = rules.map((r) => reviewRuleSchema.parse(r));
    for (const rule of parsed) {
      expect(agentIds).toContain(rule.agent);
    }
  });

  it("every rule has a description of at least 10 characters", () => {
    const parsed = rules.map((r) => reviewRuleSchema.parse(r));
    for (const rule of parsed) {
      expect(rule.description.length).toBeGreaterThanOrEqual(10);
    }
  });

  it("every rule has detection of at least 10 characters", () => {
    const parsed = rules.map((r) => reviewRuleSchema.parse(r));
    for (const rule of parsed) {
      expect(rule.detection.length).toBeGreaterThanOrEqual(10);
    }
  });

  it("every rule has recommendation of at least 10 characters", () => {
    const parsed = rules.map((r) => reviewRuleSchema.parse(r));
    for (const rule of parsed) {
      expect(rule.recommendation.length).toBeGreaterThanOrEqual(10);
    }
  });

  it("covers expected concern groups", () => {
    const parsed = rules.map((r) => reviewRuleSchema.parse(r));
    const concerns = [...new Set(parsed.map((r) => r.concern))];
    expect(concerns).toContain("dry-extraction");
    expect(concerns).toContain("modularity");
    expect(concerns).toContain("type-safety");
    expect(concerns).toContain("design-tokens");
    expect(concerns).toContain("naming-conventions");
    expect(concerns).toContain("import-hygiene");
    expect(concerns).toContain("financial-arithmetic");
    expect(concerns).toContain("design-system");
    expect(concerns).toContain("mobile-responsive");
  });

  it("rule IDs follow prefix convention", () => {
    const parsed = rules.map((r) => reviewRuleSchema.parse(r));
    for (const rule of parsed) {
      expect(rule.id).toMatch(/^[A-Z]-[A-Z]+-\d+$/);
    }
  });

  describe("agent rule counts match expected distribution", () => {
    const parsed = rules.map((r) => reviewRuleSchema.parse(r));
    const byAgent = new Map<string, number>();
    for (const rule of parsed) {
      byAgent.set(rule.agent, (byAgent.get(rule.agent) ?? 0) + 1);
    }

    it("build-reviewer owns 31 rules", () => {
      expect(byAgent.get("build-reviewer")).toBe(31);
    });

    it("finance-sme owns 8 rules", () => {
      expect(byAgent.get("finance-sme")).toBe(8);
    });

    it("design-auditor owns 15 rules", () => {
      expect(byAgent.get("design-auditor")).toBe(15);
    });
  });
});
