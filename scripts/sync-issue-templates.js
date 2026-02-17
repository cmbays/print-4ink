#!/usr/bin/env node
/**
 * sync-issue-templates.js
 *
 * Generates the Product/Tool dropdown options from config/products.json and
 * config/tools.json, then rewrites the `options:` block in all 4 GitHub issue
 * templates that carry the marker comment:
 *
 *   # Sync with config/products.json + config/tools.json
 *
 * Idempotent — running twice produces the same output.
 * Exit code 0 on success, 1 on any error.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');

// ── Config files ─────────────────────────────────────────────────────────────

const products = JSON.parse(
  fs.readFileSync(path.join(root, 'config/products.json'), 'utf8')
);
const tools = JSON.parse(
  fs.readFileSync(path.join(root, 'config/tools.json'), 'utf8')
);

// Products first, then tools — preserves the existing ordering convention.
const labels = [
  ...products.map((p) => p.label),
  ...tools.map((t) => t.label),
];

// ── Templates ────────────────────────────────────────────────────────────────

const TEMPLATES = [
  '.github/ISSUE_TEMPLATE/feature-request.yml',
  '.github/ISSUE_TEMPLATE/bug-report.yml',
  '.github/ISSUE_TEMPLATE/research-task.yml',
  '.github/ISSUE_TEMPLATE/tracking-issue.yml',
];

// Matches the marker comment, the `options:` key, and every option line that
// follows (8-space-indented `- <text>`).  The group captures just the options
// lines so we can replace them without touching anything else.
//
// Pattern breakdown:
//   (      # Sync with ...)   — marker comment (kept verbatim in replacement)
//   (\n      options:\n)      — options key     (kept verbatim)
//   ((?:        - .+\n)*)    — captured option lines (replaced)
const SYNC_RE =
  /([ \t]*# Sync with config\/products\.json \+ config\/tools\.json\n[ \t]*options:\n)((?:[ \t]*- .+\n)*)/g;

const newOptionsBlock = labels.map((label) => `        - ${label}`).join('\n') + '\n';

let totalUpdated = 0;

for (const relPath of TEMPLATES) {
  const filePath = path.join(root, relPath);

  let original;
  try {
    original = fs.readFileSync(filePath, 'utf8');
  } catch (err) {
    console.error(`ERROR: Cannot read ${relPath}: ${err.message}`);
    process.exit(1);
  }

  const updated = original.replace(SYNC_RE, (_match, prefix, _oldOptions) => {
    return `${prefix}${newOptionsBlock}`;
  });

  if (updated === original) {
    console.log(`  no change  ${relPath}`);
  } else {
    fs.writeFileSync(filePath, updated, 'utf8');
    console.log(`  updated    ${relPath}`);
    totalUpdated++;
  }
}

console.log(`\nDone. ${totalUpdated} file(s) updated.`);
