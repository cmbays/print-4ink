import verticalsConfig from '../../../config/verticals.json';
import stagesConfig from '../../../config/stages.json';
import tagsConfig from '../../../config/tags.json';
import productsConfig from '../../../config/products.json';
import toolsConfig from '../../../config/tools.json';

// ── Label lookups (config-driven) ────────────────────────────────

const pipelineLabelMap: Record<string, string> = Object.fromEntries(
  verticalsConfig.map((v) => [v.slug, v.label]),
);

const stageLabelMap: Record<string, string> = Object.fromEntries(
  stagesConfig.map((s) => [s.slug, s.label]),
);

const productLabelMap: Record<string, string> = Object.fromEntries(
  productsConfig.map((p) => [p.slug, p.label]),
);

const toolLabelMap: Record<string, string> = Object.fromEntries(
  toolsConfig.map((t) => [t.slug, t.label]),
);

/** Fallback: convert kebab-case slug to Title Case */
export function labelFromSlug(s: string): string {
  return s
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/** Config-driven pipeline label with fallback */
export function pipelineLabel(slug: string): string {
  return pipelineLabelMap[slug] || labelFromSlug(slug);
}

/** Config-driven stage label with fallback */
export function stageLabel(slug: string): string {
  return stageLabelMap[slug] || labelFromSlug(slug);
}

/** Config-driven product label with fallback */
export function productLabel(slug: string): string {
  return productLabelMap[slug] || labelFromSlug(slug);
}

/** Config-driven tool label with fallback */
export function toolLabel(slug: string): string {
  return toolLabelMap[slug] || labelFromSlug(slug);
}

// ── Tag colors (config-driven) ───────────────────────────────────

const TAG_COLOR_CLASSES: Record<string, string> = {
  green: 'bg-success/12 text-success',
  blue: 'bg-action/12 text-action',
  amber: 'bg-warning/12 text-warning',
  purple: 'bg-purple/12 text-purple',
};

const tagColorMap: Record<string, string> = Object.fromEntries(
  tagsConfig.map((t) => [t.slug, TAG_COLOR_CLASSES[t.color] || 'bg-bg-surface text-text-muted']),
);

export function tagColor(tag: string): string {
  return tagColorMap[tag] || 'bg-bg-surface text-text-muted';
}

// ── Status display ───────────────────────────────────────────────

export function statusColor(status: string): string {
  if (status === 'complete') return 'text-success';
  if (status === 'in-progress') return 'text-action';
  if (status === 'superseded') return 'text-text-muted';
  return 'text-text-secondary';
}

export function statusLabel(status: string): string {
  if (status === 'in-progress') return 'In Progress';
  return status.charAt(0).toUpperCase() + status.slice(1);
}

// ── Date formatting ──────────────────────────────────────────────

export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}
