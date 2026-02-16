#!/usr/bin/env node
/**
 * Migrate pipeline doc frontmatter:
 * - Rename vertical → pipeline
 * - Remove verticalSecondary
 * - Add pipelineType, products, tools
 */
import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';

const PIPELINES_DIR = join(import.meta.dirname, 'knowledge-base/src/content/pipelines');

// Skip the cooldown doc — it moves to strategy collection in Task 8
const SKIP_FILES = ['2026-02-14-phase1-cooldown.md'];

// Classification mapping from the task spec
const CLASSIFICATION = {
  'quoting':              { pipelineType: 'vertical',   products: ['quotes'],    tools: [] },
  'customer-management':  { pipelineType: 'vertical',   products: ['customers'], tools: [] },
  'invoicing':            { pipelineType: 'vertical',   products: ['invoices'],  tools: [] },
  'price-matrix':         { pipelineType: 'vertical',   products: ['pricing'],   tools: [] },
  'jobs':                 { pipelineType: 'vertical',   products: ['jobs'],      tools: [] },
  'screen-room':          { pipelineType: 'vertical',   products: ['screens'],   tools: [] },
  'garments':             { pipelineType: 'vertical',   products: ['garments'],  tools: [] },
  'dashboard':            { pipelineType: 'vertical',   products: ['dashboard'], tools: [] },
  'mobile-optimization':  { pipelineType: 'horizontal', products: ['dashboard', 'quotes', 'customers', 'invoices', 'jobs', 'garments', 'pricing'], tools: [] },
  'dtf-gang-sheet':       { pipelineType: 'vertical',   products: ['garments'],  tools: [] },
  'devx':                 { pipelineType: 'horizontal', products: [],            tools: ['work-orchestrator', 'skills-framework', 'agent-system', 'knowledge-base', 'ci-pipeline'] },
  'meta':                 { pipelineType: 'horizontal', products: [],            tools: ['knowledge-base'] },
};

// Special overrides for specific files
const FILE_OVERRIDES = {
  '2026-02-15-ss-integration-research.md': { products: ['garments'] },
};

function formatArray(arr) {
  if (arr.length === 0) return '[]';
  return '[' + arr.join(', ') + ']';
}

function migrateFrontmatter(content, filename) {
  // Split on frontmatter delimiters
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) {
    console.error(`  ERROR: Could not parse frontmatter in ${filename}`);
    return null;
  }

  const frontmatter = match[1];
  const body = match[2];

  // Extract vertical value
  const verticalMatch = frontmatter.match(/^vertical:\s*(.+)$/m);
  if (!verticalMatch) {
    console.error(`  ERROR: No 'vertical:' field found in ${filename}`);
    return null;
  }
  const verticalValue = verticalMatch[1].trim();

  // Look up classification
  const classification = CLASSIFICATION[verticalValue];
  if (!classification) {
    console.error(`  ERROR: Unknown vertical '${verticalValue}' in ${filename}`);
    return null;
  }

  // Apply file-specific overrides
  const override = FILE_OVERRIDES[filename] || {};
  const finalProducts = override.products || classification.products;
  const finalTools = override.tools || classification.tools;

  // Build new frontmatter lines
  const lines = frontmatter.split('\n');
  const newLines = [];

  for (const line of lines) {
    // Skip verticalSecondary line
    if (line.match(/^verticalSecondary:/)) {
      continue;
    }

    // Replace vertical with pipeline + add new fields
    if (line.match(/^vertical:/)) {
      newLines.push(`pipeline: ${verticalValue}`);
      newLines.push(`pipelineType: ${classification.pipelineType}`);
      newLines.push(`products: ${formatArray(finalProducts)}`);
      newLines.push(`tools: ${formatArray(finalTools)}`);
      continue;
    }

    newLines.push(line);
  }

  return `---\n${newLines.join('\n')}\n---\n${body}`;
}

// Main
const files = readdirSync(PIPELINES_DIR).filter(f => f.endsWith('.md'));
let migrated = 0;
let skipped = 0;
let errors = 0;

for (const file of files) {
  if (SKIP_FILES.includes(file)) {
    console.log(`SKIP: ${file} (will be moved to strategy)`);
    skipped++;
    continue;
  }

  const filepath = join(PIPELINES_DIR, file);
  const content = readFileSync(filepath, 'utf-8');
  const result = migrateFrontmatter(content, file);

  if (result === null) {
    errors++;
    continue;
  }

  writeFileSync(filepath, result, 'utf-8');
  migrated++;
  console.log(`OK: ${file}`);
}

console.log(`\nDone: ${migrated} migrated, ${skipped} skipped, ${errors} errors`);
if (errors > 0) process.exit(1);
