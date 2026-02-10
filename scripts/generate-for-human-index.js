#!/usr/bin/env node

/**
 * Generates for_human/index.html and for_human/README.md from individual session HTML files.
 *
 * Usage: node scripts/generate-for-human-index.js
 *
 * Scans for_human/*.html (excluding _template.html and index.html),
 * extracts metadata (title, subtitle, tags, date), and produces:
 *   - for_human/index.html (navigable card index)
 *   - for_human/README.md (markdown table index)
 *
 * Zero external dependencies. Uses only Node.js built-ins (fs, path).
 */

const fs = require('fs');
const path = require('path');

const FOR_HUMAN_DIR = path.join(__dirname, '..', 'for_human');
const EXCLUDE = new Set(['_template.html', 'index.html']);

// --- Extraction helpers ---

function extractBetween(html, startPattern, endStr) {
  const startIdx = html.indexOf(startPattern);
  if (startIdx === -1) return null;
  const contentStart = startIdx + startPattern.length;
  const endIdx = html.indexOf(endStr, contentStart);
  if (endIdx === -1) return null;
  return html.slice(contentStart, endIdx);
}

function decodeHtmlEntities(str) {
  return str
    .replace(/&mdash;/g, '\u2014')
    .replace(/&ndash;/g, '\u2013')
    .replace(/&rarr;/g, '\u2192')
    .replace(/&larr;/g, '\u2190')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function extractTitle(html) {
  const raw = extractBetween(html, '<h1>', '</h1>');
  return raw ? decodeHtmlEntities(raw.trim()) : null;
}

function extractSubtitle(html) {
  const raw = extractBetween(html, '<p class="subtitle">', '</p>');
  return raw ? decodeHtmlEntities(raw.trim()) : null;
}

function extractTags(html) {
  const tags = [];
  const tagRegex = /<span class="tag tag-(\w+)">([^<]+)<\/span>/g;
  let match;
  while ((match = tagRegex.exec(html)) !== null) {
    tags.push({ type: match[1], label: match[2].trim() });
  }

  // Also check for old index-style type-tag format
  if (tags.length === 0) {
    const altRegex = /<span class="type-tag (\w+)">([^<]+)<\/span>/g;
    while ((match = altRegex.exec(html)) !== null) {
      tags.push({ type: match[1], label: match[2].trim() });
    }
  }

  return tags;
}

function extractDate(html) {
  // First meta-value span is always the date
  const raw = extractBetween(html, '<span class="meta-value">', '</span>');
  if (!raw) return null;
  // Clean HTML entities and tags
  const cleaned = decodeHtmlEntities(raw.replace(/<[^>]+>/g, '').trim());
  return cleaned;
}

function parseSortableDate(dateStr) {
  if (!dateStr) return '0000-00-00';
  // Handle "2026-02-10" format directly
  const isoMatch = dateStr.match(/(\d{4}-\d{2}-\d{2})/);
  if (isoMatch) return isoMatch[1];
  // Handle "February 8-9, 2026" or similar formats
  const months = {
    January: '01', February: '02', March: '03', April: '04',
    May: '05', June: '06', July: '07', August: '08',
    September: '09', October: '10', November: '11', December: '12'
  };
  const longMatch = dateStr.match(/(\w+)\s+(\d+).*?(\d{4})/);
  if (longMatch && months[longMatch[1]]) {
    const m = months[longMatch[1]];
    const d = longMatch[2].padStart(2, '0');
    return `${longMatch[3]}-${m}-${d}`;
  }
  return '0000-00-00';
}

// --- Scan and parse ---

function scanEntries() {
  const files = fs.readdirSync(FOR_HUMAN_DIR)
    .filter(f => f.endsWith('.html') && !EXCLUDE.has(f));

  const entries = [];
  for (const file of files) {
    const html = fs.readFileSync(path.join(FOR_HUMAN_DIR, file), 'utf-8');
    const title = extractTitle(html);
    const subtitle = extractSubtitle(html);
    const tags = extractTags(html);
    const date = extractDate(html);

    if (!title) {
      console.warn(`  SKIP: ${file} (no <h1> found)`);
      continue;
    }

    entries.push({
      file,
      title,
      subtitle: subtitle || '',
      tags,
      date: date || '',
      sortDate: parseSortableDate(date)
    });
  }

  // Sort by date descending, then filename descending for same date
  entries.sort((a, b) => {
    const dateCmp = b.sortDate.localeCompare(a.sortDate);
    if (dateCmp !== 0) return dateCmp;
    return b.file.localeCompare(a.file);
  });

  return entries;
}

// --- Generate index.html ---

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function generateEntryCard(entry) {
  const tagSpans = entry.tags
    .map(t => `          <span class="type-tag ${t.type}">${escapeHtml(t.label)}</span>`)
    .join('\n');

  return `    <a class="entry" href="${escapeHtml(entry.file)}">
      <div class="entry-title">${escapeHtml(entry.title)}</div>
      <div class="entry-desc">${escapeHtml(entry.subtitle)}</div>
      <div class="entry-meta">
        <span>${escapeHtml(entry.date)}</span>
        <div class="tag-group">
${tagSpans}
        </div>
      </div>
    </a>`;
}

function generateIndexHtml(entries) {
  const cards = entries.map(e => generateEntryCard(e)).join('\n\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>For Human &mdash; Screen Print Pro</title>
  <style>
    :root {
      --bg-primary: #09090b;
      --bg-elevated: #18181b;
      --bg-surface: #1c1c1f;
      --text-primary: rgba(255,255,255,0.87);
      --text-secondary: rgba(255,255,255,0.60);
      --text-muted: rgba(255,255,255,0.38);
      --action: #22d3ee;
      --success: #34d399;
      --warning: #fbbf24;
      --border: rgba(255,255,255,0.08);
      --font-ui: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      --font-mono: 'JetBrains Mono', 'Fira Code', monospace;
    }

    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      background: var(--bg-primary);
      color: var(--text-primary);
      font-family: var(--font-ui);
      line-height: 1.6;
      padding: 48px 24px;
    }

    .container { max-width: 720px; margin: 0 auto; }

    header { margin-bottom: 48px; }

    .badge {
      display: inline-block;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: 4px 10px;
      border-radius: 4px;
      background: rgba(34, 211, 238, 0.12);
      color: var(--action);
      margin-bottom: 12px;
    }

    h1 {
      font-size: 28px;
      font-weight: 700;
      letter-spacing: -0.02em;
      margin-bottom: 8px;
    }

    .subtitle {
      color: var(--text-secondary);
      font-size: 15px;
    }

    h2 {
      font-size: 18px;
      font-weight: 600;
      margin-top: 40px;
      margin-bottom: 16px;
      letter-spacing: -0.01em;
      color: var(--text-muted);
      text-transform: uppercase;
      font-size: 11px;
      letter-spacing: 0.05em;
    }

    a {
      color: var(--action);
      text-decoration: none;
    }

    a:hover { text-decoration: underline; }

    .entry {
      display: block;
      background: var(--bg-elevated);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 12px;
      transition: border-color 0.15s ease;
      text-decoration: none;
    }

    .entry:hover {
      border-color: rgba(34, 211, 238, 0.3);
      text-decoration: none;
    }

    .entry-title {
      font-size: 16px;
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: 4px;
    }

    .entry-desc {
      font-size: 13px;
      color: var(--text-secondary);
      margin-bottom: 10px;
    }

    .entry-meta {
      display: flex;
      gap: 16px;
      font-size: 12px;
      color: var(--text-muted);
    }

    .type-tag {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: 2px 8px;
      border-radius: 4px;
    }

    .type-tag.feature,
    .type-tag.build    { background: rgba(52, 211, 153, 0.1); color: var(--success); }
    .type-tag.plan     { background: rgba(34, 211, 238, 0.1); color: var(--action); }
    .type-tag.decision,
    .type-tag.learning { background: rgba(251, 191, 36, 0.1); color: var(--warning); }
    .type-tag.research { background: rgba(167, 139, 250, 0.1); color: #a78bfa; }

    .tag-group { display: flex; gap: 6px; flex-wrap: wrap; }

    footer {
      margin-top: 48px;
      padding-top: 24px;
      border-top: 1px solid var(--border);
      font-size: 12px;
      color: var(--text-muted);
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div class="badge">Screen Print Pro</div>
      <h1>For Human</h1>
      <p class="subtitle">Session summaries, decisions, and build logs. Open any entry to review what was built and why.</p>
    </header>

    <h2>Sessions</h2>

${cards}

    <!-- NEW ENTRIES GO HERE -->

    <footer>
      Screen Print Pro &mdash; for_human index
    </footer>
  </div>
</body>
</html>
`;
}

// --- Generate README.md ---

function generateReadmeMd(entries) {
  const rows = entries.map(e => {
    const tags = e.tags.map(t => t.label).join(', ');
    return `| [${e.title}](${e.file}) | ${e.subtitle} | ${e.date} | ${tags} |`;
  }).join('\n');

  return `# For Human

Learning and reference artifacts for the project owner.

## Purpose

This directory stores session summaries, decision logs, and reference materials that help you:

- **Review what was built and why** — each session produces a summary with context, decisions, and links
- **Understand the project** — architectural choices, methodology decisions, and trade-off rationale
- **Resume context quickly** — session files include the \`claude --resume\` command to pick up where you left off
- **Onboard others** — a self-contained history of how the project evolved

## Index

| File | Topic | Date | Tags |
|------|-------|------|------|
${rows}

## How to Use

Open any \`.html\` file in your browser, or start with \`index.html\` for a navigable overview. Each session summary includes:
- What was discussed and decided
- Links to artifacts created or modified
- The \`claude --resume\` command to continue that session

## Regenerating This Index

This file and \`index.html\` are auto-generated. To regenerate after adding a new session doc:

\`\`\`bash
npm run gen:index
\`\`\`

## Finding the Session ID

Each session doc includes a \`claude --resume <session-id>\` command. To find the correct session ID:

\`\`\`bash
# Most recently modified .jsonl is the current/latest session
ls -t ~/.claude/projects/-Users-cmbays-Github-print-4ink/*.jsonl | head -1
\`\`\`

The filename (without \`.jsonl\`) is the session ID.

## Template

Every HTML file uses a standardized header template. See \`_template.html\` for the reference implementation.

### Tags

| Tag | Color | Use When |
|-----|-------|----------|
| \`Feature\` | Green | New functionality was built |
| \`Build\` | Green | Infrastructure, tooling, or scaffold work |
| \`Plan\` | Cyan | Strategy or roadmap was created |
| \`Decision\` | Amber | A choice was made between alternatives |
| \`Research\` | Purple | Competitive analysis, exploration, or investigation |
| \`Learning\` | Amber | A lesson was learned or gotcha documented |

Apply 1-3 tags per session.

## Bundling Rules

- **Bundle together**: Content from the same feature build, multi-session work on one screen, or closely related decisions
- **Keep separate**: Distinct features, standalone decisions, different phases of the project
`;
}

// --- Main ---

function main() {
  console.log('Scanning for_human/ directory...');
  const entries = scanEntries();
  console.log(`Found ${entries.length} session entries.`);

  const indexHtml = generateIndexHtml(entries);
  fs.writeFileSync(path.join(FOR_HUMAN_DIR, 'index.html'), indexHtml);
  console.log('Generated for_human/index.html');

  const readmeMd = generateReadmeMd(entries);
  fs.writeFileSync(path.join(FOR_HUMAN_DIR, 'README.md'), readmeMd);
  console.log('Generated for_human/README.md');

  console.log('Done.');
}

main();
