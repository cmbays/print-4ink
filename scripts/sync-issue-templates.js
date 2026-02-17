#!/usr/bin/env node
/**
 * sync-issue-templates.js
 *
 * Generates the Product / Domain / Tool dropdown options from
 * config/products.json, config/domains.json, and config/tools.json, then
 * rewrites the `options:` block in all 4 GitHub issue templates that carry
 * the marker comment:
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

function readConfig(relPath) {
  const filePath = path.join(root, relPath);
  let raw;
  try {
    raw = fs.readFileSync(filePath, 'utf8');
  } catch (err) {
    console.error(`ERROR: Cannot read ${relPath}: ${err.message}`);
    process.exit(1);
  }
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) {
    console.error(`ERROR: Expected an array in ${relPath}, got ${typeof parsed}`);
    process.exit(1);
  }
  return parsed;
}

const products = readConfig('config/products.json');
const domains = readConfig('config/domains.json');
const tools = readConfig('config/tools.json');

// Build label list: Products → Domains → Tools.
function validateEntry(entry, relPath) {
  if (!entry.label || typeof entry.label !== 'string') {
    console.error(
      `ERROR: Config entry is missing a valid "label" field in ${relPath}: ${JSON.stringify(entry)}`
    );
    process.exit(1);
  }
}

const labels = [];
for (const entry of products) {
  validateEntry(entry, 'config/products.json');
  labels.push(`Product: ${entry.label}`);
}
for (const entry of domains) {
  validateEntry(entry, 'config/domains.json');
  labels.push(`Domain: ${entry.label}`);
}
for (const entry of tools) {
  validateEntry(entry, 'config/tools.json');
  labels.push(`Tool: ${entry.label}`);
}

if (labels.length === 0) {
  console.error('ERROR: No labels found in config files — refusing to write empty options block.');
  process.exit(1);
}

// ── Templates ────────────────────────────────────────────────────────────────

const TEMPLATES = [
  '.github/ISSUE_TEMPLATE/feature-request.yml',
  '.github/ISSUE_TEMPLATE/bug-report.yml',
  '.github/ISSUE_TEMPLATE/research-task.yml',
  '.github/ISSUE_TEMPLATE/tracking-issue.yml',
];

// Matches the marker comment, the `options:` key (capturing its indentation
// separately so we can derive item indentation), and every option line.
//
// Groups:
//   1 — full prefix: marker comment + "options:\n"
//   2 — whitespace before "options:" (used to compute item indentation)
//   3 — existing option lines (replaced)
//
// The final \n? makes the last option line match even if the file lacks a
// trailing newline after it.
const SYNC_RE =
  /([ \t]*# Sync with config\/products\.json \+ config\/tools\.json\n([ \t]*)options:\n)((?:[ \t]*- .+\n)*[ \t]*- .+\n?)?/;

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

  // Verify the marker exists in this file before attempting replacement.
  if (!SYNC_RE.test(original)) {
    console.error(
      `ERROR: Marker comment not found in ${relPath}. ` +
        'Expected: "# Sync with config/products.json + config/tools.json"'
    );
    process.exit(1);
  }

  const updated = original.replace(
    SYNC_RE,
    (_match, prefix, optionsIndent) => {
      // Derive item indentation from the `options:` line indent + 2 spaces.
      const itemIndent = optionsIndent + '  ';
      const newBlock = labels.map((label) => `${itemIndent}- ${label}`).join('\n') + '\n';
      return `${prefix}${newBlock}`;
    }
  );

  if (updated === original) {
    console.log(`  no change  ${relPath}`);
  } else {
    fs.writeFileSync(filePath, updated, 'utf8');
    console.log(`  updated    ${relPath}`);
    totalUpdated++;
  }
}

console.log(`\nDone. ${totalUpdated} file(s) updated.`);
