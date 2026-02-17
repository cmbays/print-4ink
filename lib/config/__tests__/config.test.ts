// Tests the runtime config gateway (parseConfig, slug tuples, label lookups).
// The config/schemas/__tests__/config-validation.test.ts file tests schemas
// directly against raw JSON without the runtime layer.

import { describe, it, expect, vi } from "vitest";
import {
  domains,
  products,
  tools,
  stages,
  tags,
  pipelineTypes,
  pipelineGates,
  domainSlugs,
  productSlugs,
  toolSlugs,
  stageSlugs,
  tagSlugs,
  pipelineTypeSlugs,
  domainLabel,
  productLabel,
  toolLabel,
  stageLabel,
  tagLabel,
  pipelineTypeLabel,
} from "../index";
import {
  domainsConfigSchema,
  productsConfigSchema,
  toolsConfigSchema,
  stagesConfigSchema,
  tagsConfigSchema,
  pipelineTypesConfigSchema,
  pipelineGatesConfigSchema,
  configEntryBase,
} from "@/config/schemas";

// ── Helpers ─────────────────────────────────────────────────────────

const KEBAB_CASE = /^[a-z][a-z0-9-]*$/;

function assertNoDuplicateSlugs(entries: { slug: string }[], label: string) {
  const slugs = entries.map((e) => e.slug);
  const unique = new Set(slugs);
  expect(unique.size, `Duplicate slugs in ${label}`).toBe(slugs.length);
}

// ── Schema Validation ───────────────────────────────────────────────

describe("config schema validation", () => {
  it("domains.json validates against domainsConfigSchema", () => {
    expect(domains.length).toBeGreaterThan(0);
    expect(() => domainsConfigSchema.parse(domains)).not.toThrow();
  });

  it("products.json validates against productsConfigSchema", () => {
    expect(products.length).toBeGreaterThan(0);
    expect(() => productsConfigSchema.parse(products)).not.toThrow();
  });

  it("tools.json validates against toolsConfigSchema", () => {
    expect(tools.length).toBeGreaterThan(0);
    expect(() => toolsConfigSchema.parse(tools)).not.toThrow();
  });

  it("stages.json validates against stagesConfigSchema", () => {
    expect(stages.length).toBeGreaterThan(0);
    expect(() => stagesConfigSchema.parse(stages)).not.toThrow();
  });

  it("tags.json validates against tagsConfigSchema", () => {
    expect(tags.length).toBeGreaterThan(0);
    expect(() => tagsConfigSchema.parse(tags)).not.toThrow();
  });

  it("pipeline-types.json validates against pipelineTypesConfigSchema", () => {
    expect(pipelineTypes.length).toBeGreaterThan(0);
    expect(() => pipelineTypesConfigSchema.parse(pipelineTypes)).not.toThrow();
  });

  it("pipeline-gates.json validates against pipelineGatesConfigSchema", () => {
    expect(Object.keys(pipelineGates.stages).length).toBeGreaterThan(0);
    expect(() => pipelineGatesConfigSchema.parse(pipelineGates)).not.toThrow();
  });
});

// ── Structural Invariants ───────────────────────────────────────────

describe("structural invariants", () => {
  it("no duplicate slugs in domains", () => {
    assertNoDuplicateSlugs(domains, "domains");
  });

  it("no duplicate slugs in products", () => {
    assertNoDuplicateSlugs(products, "products");
  });

  it("no duplicate slugs in tools", () => {
    assertNoDuplicateSlugs(tools, "tools");
  });

  it("no duplicate slugs in stages", () => {
    assertNoDuplicateSlugs(stages, "stages");
  });

  it("no duplicate slugs in tags", () => {
    assertNoDuplicateSlugs(tags, "tags");
  });

  it("no duplicate slugs in pipeline-types", () => {
    assertNoDuplicateSlugs(pipelineTypes, "pipeline-types");
  });

  it("all slugs match kebab-case format", () => {
    const allSlugs = [
      ...domains.map((d) => d.slug),
      ...products.map((p) => p.slug),
      ...tools.map((t) => t.slug),
      ...stages.map((s) => s.slug),
      ...tags.map((t) => t.slug),
      ...pipelineTypes.map((p) => p.slug),
    ];
    for (const slug of allSlugs) {
      expect(slug, `"${slug}" is not kebab-case`).toMatch(KEBAB_CASE);
    }
  });

  it("configEntryBase rejects invalid slugs", () => {
    expect(() => configEntryBase.parse({ slug: "", label: "X", description: "D" })).toThrow();
    expect(() => configEntryBase.parse({ slug: "123", label: "X", description: "D" })).toThrow();
    expect(() => configEntryBase.parse({ slug: "A-Bad", label: "X", description: "D" })).toThrow();
    expect(() => configEntryBase.parse({ slug: "good-slug", label: "X", description: "D" })).not.toThrow();
  });

  it("configEntryBase rejects empty labels", () => {
    expect(() => configEntryBase.parse({ slug: "valid", label: "", description: "D" })).toThrow();
  });

  it("productsConfigSchema rejects entries without route", () => {
    expect(() =>
      productsConfigSchema.parse([{ slug: "test", label: "Test", description: "D" }]),
    ).toThrow();
  });

  it("tagsConfigSchema rejects entries without color", () => {
    expect(() =>
      tagsConfigSchema.parse([{ slug: "test", label: "Test", description: "D" }]),
    ).toThrow();
  });

  it("pipelineTypesConfigSchema rejects empty stages array", () => {
    expect(() =>
      pipelineTypesConfigSchema.parse([
        { slug: "test", label: "Test", description: "D", stages: [] },
      ]),
    ).toThrow();
  });

  it("stagesConfigSchema rejects invalid core type", () => {
    expect(() =>
      stagesConfigSchema.parse([{ slug: "test", label: "Test", description: "D", core: "yes" }]),
    ).toThrow();
  });

  it("all config schemas reject empty arrays", () => {
    expect(() => domainsConfigSchema.parse([])).toThrow();
    expect(() => productsConfigSchema.parse([])).toThrow();
    expect(() => toolsConfigSchema.parse([])).toThrow();
    expect(() => stagesConfigSchema.parse([])).toThrow();
    expect(() => tagsConfigSchema.parse([])).toThrow();
    expect(() => pipelineTypesConfigSchema.parse([])).toThrow();
  });
});

// ── Cross-File Consistency ──────────────────────────────────────────

describe("cross-file consistency", () => {
  const validStageSlugs = new Set(stages.map((s) => s.slug));

  it("all pipeline-type stages exist in stages.json", () => {
    for (const pt of pipelineTypes) {
      for (const stageSlug of pt.stages) {
        expect(
          validStageSlugs.has(stageSlug),
          `pipeline-type "${pt.slug}" references unknown stage "${stageSlug}"`,
        ).toBe(true);
      }
    }
  });

  it("all pipeline-gate stage keys exist in stages.json", () => {
    for (const stageKey of Object.keys(pipelineGates.stages)) {
      expect(
        validStageSlugs.has(stageKey),
        `pipeline-gates references unknown stage key "${stageKey}"`,
      ).toBe(true);
    }
  });

  it("all pipeline-gate next values resolve to valid stages or null", () => {
    for (const [key, gate] of Object.entries(pipelineGates.stages)) {
      if (gate.next !== null) {
        expect(
          validStageSlugs.has(gate.next),
          `pipeline-gates stage "${key}" has next="${gate.next}" which is not a valid stage`,
        ).toBe(true);
      }
    }
  });
});

// ── Slug Tuples ─────────────────────────────────────────────────────

describe("slug tuples", () => {
  it("domainSlugs matches domains array", () => {
    expect(domainSlugs).toEqual(domains.map((d) => d.slug));
    expect(domainSlugs.length).toBeGreaterThan(0);
  });

  it("productSlugs matches products array", () => {
    expect(productSlugs).toEqual(products.map((p) => p.slug));
    expect(productSlugs.length).toBeGreaterThan(0);
  });

  it("toolSlugs matches tools array", () => {
    expect(toolSlugs).toEqual(tools.map((t) => t.slug));
    expect(toolSlugs.length).toBeGreaterThan(0);
  });

  it("stageSlugs matches stages array", () => {
    expect(stageSlugs).toEqual(stages.map((s) => s.slug));
    expect(stageSlugs.length).toBeGreaterThan(0);
  });

  it("tagSlugs matches tags array", () => {
    expect(tagSlugs).toEqual(tags.map((t) => t.slug));
    expect(tagSlugs.length).toBeGreaterThan(0);
  });

  it("pipelineTypeSlugs matches pipelineTypes array", () => {
    expect(pipelineTypeSlugs).toEqual(pipelineTypes.map((p) => p.slug));
    expect(pipelineTypeSlugs.length).toBeGreaterThan(0);
  });
});

// ── Label Lookups ───────────────────────────────────────────────────

describe("label lookups", () => {
  it("domainLabel returns correct label for known slug", () => {
    expect(domainLabel("garments")).toBe("Garments");
    expect(domainLabel("dtf")).toBe("Direct-to-Film");
  });

  it("productLabel returns correct label for known slug", () => {
    expect(productLabel("quotes")).toBe("Quotes");
    expect(productLabel("garments")).toBe("Garments");
  });

  it("toolLabel returns correct label for known slug", () => {
    expect(toolLabel("knowledge-base")).toBe("Knowledge Base");
  });

  it("stageLabel returns correct label for known slug", () => {
    expect(stageLabel("build")).toBe("Build");
    expect(stageLabel("wrap-up")).toBe("Wrap-up");
  });

  it("tagLabel returns correct label for known slug", () => {
    expect(tagLabel("feature")).toBe("Feature");
    expect(tagLabel("decision")).toBe("Decision");
  });

  it("pipelineTypeLabel returns correct label for known slug", () => {
    expect(pipelineTypeLabel("vertical")).toBe("Vertical");
    expect(pipelineTypeLabel("bug-fix")).toBe("Bug Fix");
  });

  it("label functions return kebab-to-title fallback and warn for unknown slugs", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    expect(domainLabel("unknown-thing")).toBe("Unknown Thing");
    expect(productLabel("not-real")).toBe("Not Real");
    expect(toolLabel("mystery-tool")).toBe("Mystery Tool");
    expect(stageLabel("fake-stage")).toBe("Fake Stage");
    expect(tagLabel("no-tag")).toBe("No Tag");
    expect(pipelineTypeLabel("custom-pipeline")).toBe("Custom Pipeline");

    expect(warnSpy).toHaveBeenCalledTimes(6);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('unknown slug "unknown-thing"'),
    );

    warnSpy.mockRestore();
  });
});
