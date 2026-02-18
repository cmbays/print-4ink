import stagesConfig from '../../../tools/orchestration/config/stages.json'
import tagsConfig from '../../../tools/orchestration/config/tags.json'
import productsConfig from '../../../src/config/products.json'
import toolsConfig from '../../../tools/orchestration/config/tools.json'
import domainsConfig from '../../../src/config/domains.json'

// ── Pipeline stage constants (config-driven) ─────────────────────

/** Ordered pipeline stages (excludes non-pipeline stages like cooldown) */
export const pipelineStages = stagesConfig
  .filter((s: { slug: string; pipeline?: boolean }) => s.pipeline !== false)
  .map((s: { slug: string; label: string; description: string }) => ({
    slug: s.slug,
    label: s.label,
    description: s.description,
  }))

/** Pipeline stage slug → label map */
export const pipelineStageLabelMap: Record<string, string> = Object.fromEntries(
  pipelineStages.map((s) => [s.slug, s.label])
)

/** Pipeline stage slug → description map */
export const pipelineStageDescriptionMap: Record<string, string> = Object.fromEntries(
  pipelineStages.map((s) => [s.slug, s.description])
)

/** Ordered pipeline stage slugs */
export const pipelineStageSlugs: string[] = pipelineStages.map((s) => s.slug)

/** Core stages that indicate a pipeline is "Active" (config-driven) */
export const CORE_STAGES: string[] = stagesConfig
  .filter((s: { slug: string; core?: boolean }) => s.core === true)
  .map((s: { slug: string }) => s.slug)

/** Maximum phase number for phase filters */
export const MAX_PHASE = 3

// ── Label lookups (config-driven) ────────────────────────────────

const stageLabelMap: Record<string, string> = Object.fromEntries(
  stagesConfig.map((s) => [s.slug, s.label])
)

const productLabelMap: Record<string, string> = Object.fromEntries(
  productsConfig.map((p) => [p.slug, p.label])
)

const toolLabelMap: Record<string, string> = Object.fromEntries(
  toolsConfig.map((t) => [t.slug, t.label])
)

const domainLabelMap: Record<string, string> = Object.fromEntries(
  domainsConfig.map((d) => [d.slug, d.label])
)

/** Fallback: convert kebab-case slug to Title Case */
export function labelFromSlug(s: string): string {
  return s
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

/** Pipeline label — free text names, use labelFromSlug fallback only */
export function pipelineLabel(slug: string): string {
  return labelFromSlug(slug)
}

/** Config-driven stage label with fallback */
export function stageLabel(slug: string): string {
  return stageLabelMap[slug] || labelFromSlug(slug)
}

/** Config-driven product label with fallback */
export function productLabel(slug: string): string {
  return productLabelMap[slug] || labelFromSlug(slug)
}

/** Config-driven tool label with fallback */
export function toolLabel(slug: string): string {
  return toolLabelMap[slug] || labelFromSlug(slug)
}

/** Config-driven domain label with fallback */
export function domainLabel(slug: string): string {
  return domainLabelMap[slug] || labelFromSlug(slug)
}

// ── Tag colors (config-driven) ───────────────────────────────────

const TAG_COLOR_CLASSES: Record<string, string> = {
  green: 'bg-success/12 text-success',
  blue: 'bg-action/12 text-action',
  amber: 'bg-warning/12 text-warning',
  purple: 'bg-purple/12 text-purple',
}

const tagColorMap: Record<string, string> = Object.fromEntries(
  tagsConfig.map((t) => [t.slug, TAG_COLOR_CLASSES[t.color] || 'bg-surface text-muted-foreground'])
)

export function tagColor(tag: string): string {
  return tagColorMap[tag] || 'bg-surface text-muted-foreground'
}

// ── Status display ───────────────────────────────────────────────

/** Badge color classes (background + text) for status/docType values */
export function statusColorClass(status: string): string {
  switch (status) {
    case 'current':
    case 'complete':
      return 'bg-success/12 text-success'
    case 'in-progress':
    case 'planning':
      return 'bg-action/12 text-action'
    case 'draft':
    case 'deprecated':
    case 'cooldown':
      return 'bg-warning/12 text-warning'
    case 'superseded':
      return 'bg-surface text-muted-foreground'
    default:
      return 'bg-warning/12 text-warning'
  }
}

export function statusColor(status: string): string {
  if (status === 'complete') return 'text-success'
  if (status === 'in-progress') return 'text-action'
  if (status === 'superseded') return 'text-muted-foreground'
  return 'text-muted-foreground'
}

export function statusLabel(status: string): string {
  if (status === 'in-progress') return 'In Progress'
  return status.charAt(0).toUpperCase() + status.slice(1)
}

// ── Date formatting ──────────────────────────────────────────────

export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]
}

// ── Collection helpers ──────────────────────────────────────────

/** Sort comparator for collections by date descending (newest first) */
export function sortByDateDesc(a: { data: { date: Date } }, b: { data: { date: Date } }): number {
  return b.data.date.getTime() - a.data.date.getTime()
}

/** Pluralize a word: pluralize(3, 'doc') → '3 docs', pluralize(1, 'entry', 'entries') → '1 entry' */
export function pluralize(count: number, singular: string, plural?: string): string {
  return `${count} ${count === 1 ? singular : plural || singular + 's'}`
}
