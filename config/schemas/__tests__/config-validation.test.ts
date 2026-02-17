// Tests schema definitions directly against raw JSON.
// The lib/config/__tests__/config.test.ts file tests the runtime gateway
// (parseConfig helper, slug tuples, label lookups).

import { describe, it, expect } from "vitest";
import {
  configEntryBase,
  domainsConfigSchema,
  productsConfigSchema,
  toolsConfigSchema,
  stagesConfigSchema,
  tagsConfigSchema,
  pipelineTypesConfigSchema,
  pipelineGatesConfigSchema,
} from "../index";

import rawDomains from "../../domains.json";
import rawProducts from "../../products.json";
import rawTools from "../../tools.json";
import rawStages from "../../stages.json";
import rawTags from "../../tags.json";
import rawPipelineTypes from "../../pipeline-types.json";
import rawPipelineGates from "../../pipeline-gates.json";

// ── Data Validation (JSON against schemas) ─────────────────────────

describe("config data validates against schemas", () => {
  it("domains.json", () => {
    expect(() => domainsConfigSchema.parse(rawDomains)).not.toThrow();
  });

  it("products.json", () => {
    expect(() => productsConfigSchema.parse(rawProducts)).not.toThrow();
  });

  it("tools.json", () => {
    expect(() => toolsConfigSchema.parse(rawTools)).not.toThrow();
  });

  it("stages.json", () => {
    expect(() => stagesConfigSchema.parse(rawStages)).not.toThrow();
  });

  it("tags.json", () => {
    expect(() => tagsConfigSchema.parse(rawTags)).not.toThrow();
  });

  it("pipeline-types.json", () => {
    expect(() => pipelineTypesConfigSchema.parse(rawPipelineTypes)).not.toThrow();
  });

  it("pipeline-gates.json", () => {
    expect(() => pipelineGatesConfigSchema.parse(rawPipelineGates)).not.toThrow();
  });
});

// ── Negative Tests (contract enforcement) ──────────────────────────

describe("configEntryBase contract", () => {
  it("rejects missing description", () => {
    expect(() =>
      configEntryBase.parse({ slug: "valid", label: "Valid" }),
    ).toThrow();
  });

  it("rejects empty description", () => {
    expect(() =>
      configEntryBase.parse({ slug: "valid", label: "Valid", description: "" }),
    ).toThrow();
  });
});

describe("productsConfigSchema rejects", () => {
  const base = { slug: "test", label: "Test", description: "D" };

  it("missing icon", () => {
    expect(() =>
      productsConfigSchema.parse([{ ...base, route: "/test" }]),
    ).toThrow();
  });

  it("invalid route format (no leading slash)", () => {
    expect(() =>
      productsConfigSchema.parse([{ ...base, route: "test", icon: "TestIcon" }]),
    ).toThrow();
  });

  it("invalid icon format (not PascalCase)", () => {
    expect(() =>
      productsConfigSchema.parse([{ ...base, route: "/test", icon: "testIcon" }]),
    ).toThrow();
  });
});

describe("toolsConfigSchema rejects", () => {
  const base = { slug: "test", label: "Test", description: "D" };

  it("missing icon", () => {
    expect(() =>
      toolsConfigSchema.parse([base]),
    ).toThrow();
  });

  it("invalid icon format (not PascalCase)", () => {
    expect(() =>
      toolsConfigSchema.parse([{ ...base, icon: "lowercase" }]),
    ).toThrow();
  });
});

describe("tagsConfigSchema rejects", () => {
  const base = { slug: "test", label: "Test", description: "D" };

  it("invalid color name", () => {
    expect(() =>
      tagsConfigSchema.parse([{ ...base, color: "magenta" }]),
    ).toThrow();
  });

  it("accepts valid color names", () => {
    for (const color of ["green", "blue", "amber", "purple"]) {
      expect(() =>
        tagsConfigSchema.parse([{ ...base, color }]),
      ).not.toThrow();
    }
  });
});

describe("pipelineTypesConfigSchema rejects", () => {
  it("unknown stage slugs", () => {
    expect(() =>
      pipelineTypesConfigSchema.parse([
        { slug: "test", label: "Test", description: "D", stages: ["nonexistent-stage"] },
      ]),
    ).toThrow();
  });
});

describe("pipelineGatesConfigSchema rejects", () => {
  it("missing description on gate stage entry", () => {
    expect(() =>
      pipelineGatesConfigSchema.parse({
        stages: {
          test: {
            artifacts: [],
            gate: "artifact-exists",
            next: null,
          },
        },
        "auto-overrides": {},
      }),
    ).toThrow();
  });

  it("invalid gate type", () => {
    expect(() =>
      pipelineGatesConfigSchema.parse({
        stages: {
          test: {
            description: "D",
            artifacts: [],
            gate: "unknown-gate-type",
            next: null,
          },
        },
        "auto-overrides": {},
      }),
    ).toThrow();
  });
});
