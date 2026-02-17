import { z } from 'zod'
import { domainsConfigSchema, productsConfigSchema } from './schemas'
import rawDomains from './domains.json'
import rawProducts from './products.json'

// ---------------------------------------------------------------------------
// App-runtime config loader — domains and products only.
//
// Dev-tooling config (stages, tags, pipeline-types, etc.) lives in
// tools/orchestration/config/ and is loaded by lib/config/index.ts.
// ---------------------------------------------------------------------------

function parseConfig<T>(schema: z.ZodType<T>, data: unknown, fileName: string): T {
  try {
    return schema.parse(data)
  } catch (err) {
    throw new Error(
      `Config validation failed for ${fileName}:\n${err instanceof z.ZodError ? err.message : String(err)}`
    )
  }
}

export const domains = parseConfig(domainsConfigSchema, rawDomains, 'src/config/domains.json')
export const products = parseConfig(productsConfigSchema, rawProducts, 'src/config/products.json')

export const domainSlugs = domains.map((d) => d.slug) as [string, ...string[]]
export const productSlugs = products.map((p) => p.slug) as [string, ...string[]]

function labelFromSlug(slug: string): string {
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

function buildLabelMap(entries: { slug: string; label: string }[]): Record<string, string> {
  return Object.fromEntries(entries.map((e) => [e.slug, e.label]))
}

const domainLabelMap = buildLabelMap(domains)
const productLabelMap = buildLabelMap(products)

function lookupLabel(map: Record<string, string>, slug: string, configName: string): string {
  const label = map[slug]
  if (!label) {
    console.warn(`[config] ${configName}Label called with unknown slug "${slug}"`)
    return labelFromSlug(slug)
  }
  return label
}

export function domainLabel(slug: string): string {
  return lookupLabel(domainLabelMap, slug, 'domain')
}

export function productLabel(slug: string): string {
  return lookupLabel(productLabelMap, slug, 'product')
}

export { configEntryBase, domainsConfigSchema, productsConfigSchema } from './schemas'
export type { ConfigEntry, ProductEntry } from './schemas'
