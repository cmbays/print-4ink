import { describe, it, expect } from "vitest";
import {
  severityEnum,
  ruleScopeEnum,
  reviewRiskLevelEnum,
  reviewRuleSchema,
  triggerConditionSchema,
  compositionPolicySchema,
  agentRegistryEntrySchema,
  domainMappingSchema,
} from "../review-config";

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

describe("severityEnum", () => {
  it.each(["critical", "major", "warning", "info"])(
    "accepts '%s'",
    (val) => {
      expect(severityEnum.parse(val)).toBe(val);
    },
  );

  it("rejects invalid severity", () => {
    expect(() => severityEnum.parse("high")).toThrow();
    expect(() => severityEnum.parse("error")).toThrow();
  });
});

describe("ruleScopeEnum", () => {
  it.each(["local", "cross-file", "architectural"])(
    "accepts '%s'",
    (val) => {
      expect(ruleScopeEnum.parse(val)).toBe(val);
    },
  );

  it("rejects invalid scope", () => {
    expect(() => ruleScopeEnum.parse("global")).toThrow();
  });
});

describe("reviewRiskLevelEnum", () => {
  it.each(["low", "medium", "high", "critical"])(
    "accepts '%s'",
    (val) => {
      expect(reviewRiskLevelEnum.parse(val)).toBe(val);
    },
  );

  it("rejects invalid risk level", () => {
    expect(() => reviewRiskLevelEnum.parse("extreme")).toThrow();
    expect(() => reviewRiskLevelEnum.parse("major")).toThrow();
  });
});

// ---------------------------------------------------------------------------
// reviewRuleSchema
// ---------------------------------------------------------------------------

describe("reviewRuleSchema", () => {
  const validRule = {
    id: "br-type-safety-01",
    name: "No any types",
    concern: "type-safety",
    severity: "major" as const,
    agent: "build-reviewer",
    category: "type-safety",
    description:
      "TypeScript any types bypass the type system and hide bugs",
    detection:
      "Explicit any annotations, type assertions to any, implicit any from missing return types",
    recommendation:
      "Use Zod inference (z.infer<typeof schema>) or explicit types",
    scope: "local" as const,
  };

  it("accepts a valid rule", () => {
    const result = reviewRuleSchema.parse(validRule);
    expect(result.id).toBe("br-type-safety-01");
    expect(result.severity).toBe("major");
    expect(result.scope).toBe("local");
  });

  it("accepts optional goodExample", () => {
    const result = reviewRuleSchema.parse({
      ...validRule,
      goodExample: "type Foo = z.infer<typeof fooSchema>;",
    });
    expect(result.goodExample).toBe(
      "type Foo = z.infer<typeof fooSchema>;",
    );
  });

  it("rejects description shorter than 10 chars", () => {
    expect(() =>
      reviewRuleSchema.parse({ ...validRule, description: "Too short" }),
    ).toThrow();
  });

  it("rejects detection shorter than 10 chars", () => {
    expect(() =>
      reviewRuleSchema.parse({ ...validRule, detection: "short" }),
    ).toThrow();
  });

  it("rejects recommendation shorter than 10 chars", () => {
    expect(() =>
      reviewRuleSchema.parse({ ...validRule, recommendation: "fix it" }),
    ).toThrow();
  });

  it("rejects empty id", () => {
    expect(() =>
      reviewRuleSchema.parse({ ...validRule, id: "" }),
    ).toThrow();
  });

  it("rejects empty name", () => {
    expect(() =>
      reviewRuleSchema.parse({ ...validRule, name: "" }),
    ).toThrow();
  });

  it("rejects invalid severity", () => {
    expect(() =>
      reviewRuleSchema.parse({ ...validRule, severity: "high" }),
    ).toThrow();
  });

  it("rejects invalid scope", () => {
    expect(() =>
      reviewRuleSchema.parse({ ...validRule, scope: "global" }),
    ).toThrow();
  });
});

// ---------------------------------------------------------------------------
// triggerConditionSchema (discriminated union)
// ---------------------------------------------------------------------------

describe("triggerConditionSchema", () => {
  it("accepts always trigger", () => {
    const result = triggerConditionSchema.parse({ type: "always" });
    expect(result.type).toBe("always");
  });

  it("accepts domain trigger with domains", () => {
    const result = triggerConditionSchema.parse({
      type: "domain",
      domains: ["financial", "pricing"],
    });
    expect(result.type).toBe("domain");
    if (result.type === "domain") {
      expect(result.domains).toEqual(["financial", "pricing"]);
    }
  });

  it("accepts risk trigger with riskLevel", () => {
    const result = triggerConditionSchema.parse({
      type: "risk",
      riskLevel: "high",
    });
    expect(result.type).toBe("risk");
    if (result.type === "risk") {
      expect(result.riskLevel).toBe("high");
    }
  });

  it("accepts content trigger with pattern", () => {
    const result = triggerConditionSchema.parse({
      type: "content",
      pattern: "TODO|FIXME|HACK",
    });
    expect(result.type).toBe("content");
    if (result.type === "content") {
      expect(result.pattern).toBe("TODO|FIXME|HACK");
    }
  });

  it("rejects domain trigger without domains", () => {
    expect(() =>
      triggerConditionSchema.parse({ type: "domain" }),
    ).toThrow();
  });

  it("rejects domain trigger with empty domains", () => {
    expect(() =>
      triggerConditionSchema.parse({ type: "domain", domains: [] }),
    ).toThrow();
  });

  it("rejects risk trigger without riskLevel", () => {
    expect(() =>
      triggerConditionSchema.parse({ type: "risk" }),
    ).toThrow();
  });

  it("rejects content trigger without pattern", () => {
    expect(() =>
      triggerConditionSchema.parse({ type: "content" }),
    ).toThrow();
  });

  it("rejects invalid trigger type", () => {
    expect(() =>
      triggerConditionSchema.parse({ type: "manual" }),
    ).toThrow();
  });

  it("risk trigger uses reviewRiskLevelEnum values", () => {
    for (const level of ["low", "medium", "high", "critical"]) {
      const result = triggerConditionSchema.parse({
        type: "risk",
        riskLevel: level,
      });
      expect(result.type).toBe("risk");
    }
  });

  it("rejects risk trigger with severity values", () => {
    expect(() =>
      triggerConditionSchema.parse({ type: "risk", riskLevel: "major" }),
    ).toThrow();
    expect(() =>
      triggerConditionSchema.parse({ type: "risk", riskLevel: "warning" }),
    ).toThrow();
  });
});

// ---------------------------------------------------------------------------
// compositionPolicySchema
// ---------------------------------------------------------------------------

describe("compositionPolicySchema", () => {
  const validPolicy = {
    id: "universal-build-reviewer",
    trigger: { type: "always" as const },
    dispatch: "build-reviewer",
    priority: 50,
    description:
      "Always dispatch the build reviewer for code quality checks",
  };

  it("accepts a valid policy", () => {
    const result = compositionPolicySchema.parse(validPolicy);
    expect(result.id).toBe("universal-build-reviewer");
    expect(result.dispatch).toBe("build-reviewer");
    expect(result.priority).toBe(50);
  });

  it("accepts priority 0", () => {
    const result = compositionPolicySchema.parse({
      ...validPolicy,
      priority: 0,
    });
    expect(result.priority).toBe(0);
  });

  it("accepts priority 100", () => {
    const result = compositionPolicySchema.parse({
      ...validPolicy,
      priority: 100,
    });
    expect(result.priority).toBe(100);
  });

  it("rejects priority below 0", () => {
    expect(() =>
      compositionPolicySchema.parse({ ...validPolicy, priority: -1 }),
    ).toThrow();
  });

  it("rejects priority above 100", () => {
    expect(() =>
      compositionPolicySchema.parse({ ...validPolicy, priority: 101 }),
    ).toThrow();
  });

  it("rejects description shorter than 10 chars", () => {
    expect(() =>
      compositionPolicySchema.parse({
        ...validPolicy,
        description: "Too short",
      }),
    ).toThrow();
  });

  it("rejects empty dispatch", () => {
    expect(() =>
      compositionPolicySchema.parse({ ...validPolicy, dispatch: "" }),
    ).toThrow();
  });
});

// ---------------------------------------------------------------------------
// agentRegistryEntrySchema
// ---------------------------------------------------------------------------

describe("agentRegistryEntrySchema", () => {
  const validAgent = {
    id: "build-reviewer",
    name: "Build Reviewer",
    tools: ["Read", "Grep", "Glob"],
    capabilities: ["type-safety", "dry", "tailwind", "patterns"],
    description:
      "Reviews code for quality, DRY violations, type safety, and project conventions",
    outputFormat: "json" as const,
  };

  it("accepts a valid agent entry", () => {
    const result = agentRegistryEntrySchema.parse(validAgent);
    expect(result.id).toBe("build-reviewer");
    expect(result.tools).toHaveLength(3);
    expect(result.outputFormat).toBe("json");
  });

  it("accepts markdown output format", () => {
    const result = agentRegistryEntrySchema.parse({
      ...validAgent,
      outputFormat: "markdown",
    });
    expect(result.outputFormat).toBe("markdown");
  });

  it("rejects invalid output format", () => {
    expect(() =>
      agentRegistryEntrySchema.parse({
        ...validAgent,
        outputFormat: "xml",
      }),
    ).toThrow();
  });

  it("rejects description shorter than 10 chars", () => {
    expect(() =>
      agentRegistryEntrySchema.parse({
        ...validAgent,
        description: "Too short",
      }),
    ).toThrow();
  });

  it("rejects empty tools array", () => {
    expect(() =>
      agentRegistryEntrySchema.parse({ ...validAgent, tools: [] }),
    ).toThrow();
  });

  it("rejects empty capabilities array", () => {
    expect(() =>
      agentRegistryEntrySchema.parse({ ...validAgent, capabilities: [] }),
    ).toThrow();
  });
});

// ---------------------------------------------------------------------------
// domainMappingSchema
// ---------------------------------------------------------------------------

describe("domainMappingSchema", () => {
  const validMapping = {
    pattern: "lib/helpers/money.ts",
    domain: "financial",
    description:
      "Financial arithmetic helpers using big.js for precision",
  };

  it("accepts a valid domain mapping", () => {
    const result = domainMappingSchema.parse(validMapping);
    expect(result.pattern).toBe("lib/helpers/money.ts");
    expect(result.domain).toBe("financial");
  });

  it("accepts glob patterns", () => {
    const result = domainMappingSchema.parse({
      ...validMapping,
      pattern: "lib/schemas/**/*.ts",
    });
    expect(result.pattern).toBe("lib/schemas/**/*.ts");
  });

  it("rejects empty pattern", () => {
    expect(() =>
      domainMappingSchema.parse({ ...validMapping, pattern: "" }),
    ).toThrow();
  });

  it("rejects empty domain", () => {
    expect(() =>
      domainMappingSchema.parse({ ...validMapping, domain: "" }),
    ).toThrow();
  });

  it("rejects description shorter than 10 chars", () => {
    expect(() =>
      domainMappingSchema.parse({
        ...validMapping,
        description: "Too short",
      }),
    ).toThrow();
  });
});
