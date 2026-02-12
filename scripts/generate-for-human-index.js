#!/usr/bin/env node

/**
 * Generates the for_human knowledge base from individual session HTML files.
 *
 * Usage: node scripts/generate-for-human-index.js
 *
 * Scans for_human/*.html, extracts structured data-* metadata, and produces:
 *   - for_human/manifest.json         — Structured data for all docs
 *   - for_human/index.html            — SPA with sidebar, pipeline, search
 *   - for_human/README.md             — Markdown table index
 *   - for_human/gary-tracker.html     — Auto-generated Gary questions tracker
 *   - for_human/_stage/*.html         — Stage summary pages per vertical+phase+stage
 *
 * Zero external dependencies. Uses only Node.js built-ins (fs, path).
 */

/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');

const FOR_HUMAN_DIR = path.join(__dirname, '..', 'for_human');
const STAGE_DIR = path.join(FOR_HUMAN_DIR, '_stage');
const EXCLUDE = new Set([
  '_template.html', 'index.html', 'gary-tracker.html', 'manifest.json', 'README.md'
]);

// --- Registries ---

const VERTICALS = [
  { slug: 'quoting', label: 'Quoting', order: 1, category: 'domain' },
  { slug: 'customer-management', label: 'Customer Management', order: 2, category: 'domain' },
  { slug: 'invoicing', label: 'Invoicing', order: 3, category: 'domain' },
  { slug: 'price-matrix', label: 'Price Matrix', order: 4, category: 'domain' },
  { slug: 'jobs', label: 'Jobs', order: 5, category: 'domain' },
  { slug: 'screen-room', label: 'Screen Room', order: 6, category: 'domain' },
  { slug: 'garments', label: 'Garments', order: 7, category: 'domain' },
  { slug: 'dashboard', label: 'Dashboard', order: 8, category: 'domain' },
  { slug: 'meta', label: 'Meta / Infrastructure', order: 99, category: 'infra' },
];

const STAGES = [
  { slug: 'research', label: 'Research', order: 1, short: 'Res' },
  { slug: 'interview', label: 'Interview', order: 2, short: 'Int' },
  { slug: 'breadboarding', label: 'Breadboarding', order: 3, short: 'BB' },
  { slug: 'implementation-planning', label: 'Implementation Planning', order: 4, short: 'Plan' },
  { slug: 'build', label: 'Build', order: 5, short: 'Build' },
  { slug: 'review', label: 'Review', order: 6, short: 'Review' },
  { slug: 'learnings', label: 'Learnings', order: 7, short: 'Learn' },
];

const VERTICAL_MAP = Object.fromEntries(VERTICALS.map(v => [v.slug, v]));
const STAGE_MAP = Object.fromEntries(STAGES.map(s => [s.slug, s]));

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

/**
 * Primary extraction: parse data-* attributes from <html> tag.
 * Returns null if no data-doc-id found (fall back to legacy extraction).
 */
function extractDataAttributes(html) {
  // Match the <html ...> opening tag (may span multiple lines)
  const htmlTagMatch = html.match(/<html[^>]*>/s);
  if (!htmlTagMatch) return null;
  const htmlTag = htmlTagMatch[0];

  // Check for data-doc-id to confirm this doc has structured metadata
  if (!htmlTag.includes('data-doc-id')) return null;

  function getAttr(name) {
    const re = new RegExp(`${name}="([^"]*)"`, 's');
    const m = htmlTag.match(re);
    return m ? decodeHtmlEntities(m[1].trim()) : '';
  }

  return {
    id: getAttr('data-doc-id'),
    title: getAttr('data-title'),
    subtitle: getAttr('data-subtitle'),
    date: getAttr('data-date'),
    phase: parseInt(getAttr('data-phase') || '1', 10),
    vertical: getAttr('data-vertical'),
    verticalSecondary: getAttr('data-vertical-secondary')
      ? getAttr('data-vertical-secondary').split(',').map(s => s.trim()).filter(Boolean)
      : [],
    stage: getAttr('data-stage'),
    tags: getAttr('data-tags')
      ? getAttr('data-tags').split(',').map(s => s.trim()).filter(Boolean)
      : [],
    sessionId: getAttr('data-session-id'),
    branch: getAttr('data-branch'),
    pr: getAttr('data-pr'),
    status: getAttr('data-status') || 'complete',
  };
}

/**
 * Legacy extraction: scrape title/subtitle/tags/date from HTML content.
 * Used as fallback for docs that haven't been retrofitted with data-* attrs.
 */
function extractLegacy(html, filename) {
  const title = (() => {
    const raw = extractBetween(html, '<h1>', '</h1>');
    return raw ? decodeHtmlEntities(raw.trim()) : filename;
  })();

  const subtitle = (() => {
    const raw = extractBetween(html, '<p class="subtitle">', '</p>');
    return raw ? decodeHtmlEntities(raw.trim()) : '';
  })();

  const tags = (() => {
    const result = [];
    const tagRegex = /<span class="tag tag-(\w+)">([^<]+)<\/span>/g;
    let match;
    while ((match = tagRegex.exec(html)) !== null) {
      result.push(match[1].trim().toLowerCase());
    }
    return result;
  })();

  const date = (() => {
    const raw = extractBetween(html, '<span class="meta-value">', '</span>');
    if (!raw) return '';
    const cleaned = decodeHtmlEntities(raw.replace(/<[^>]+>/g, '').trim());
    return parseSortableDate(cleaned);
  })();

  return {
    id: filename.replace('.html', ''),
    title,
    subtitle,
    date,
    phase: 1,
    vertical: 'meta',
    verticalSecondary: [],
    stage: 'build',
    tags: tags.length > 0 ? tags : ['build'],
    sessionId: '',
    branch: '',
    pr: '',
    status: 'complete',
  };
}

function parseSortableDate(dateStr) {
  if (!dateStr) return '0000-00-00';
  const isoMatch = dateStr.match(/(\d{4}-\d{2}-\d{2})/);
  if (isoMatch) return isoMatch[1];
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

/**
 * Extract Gary questions from a session doc.
 */
function extractGaryQuestions(html, docId) {
  const questions = [];
  const regex = /<div class="gary-question"[^>]*data-question-id="([^"]*)"[^>]*data-vertical="([^"]*)"[^>]*data-status="([^"]*)"[^>]*>/gs;
  let match;
  while ((match = regex.exec(html)) !== null) {
    const questionId = match[1];
    const vertical = match[2];
    const status = match[3];

    // Extract question text
    const afterMatch = html.slice(match.index);
    const textMatch = afterMatch.match(/<p class="gary-question-text">([^<]*)<\/p>/);
    const contextMatch = afterMatch.match(/<p class="gary-question-context">([^<]*)<\/p>/);
    const answerMatch = afterMatch.match(/<div class="gary-answer"[^>]*data-answered-date="([^"]*)"[^>]*>([^<]*)<\/div>/s);

    questions.push({
      questionId,
      docId,
      vertical,
      status,
      text: textMatch ? decodeHtmlEntities(textMatch[1]) : '',
      context: contextMatch ? decodeHtmlEntities(contextMatch[1]) : '',
      answeredDate: answerMatch ? answerMatch[1] : '',
      answer: answerMatch ? decodeHtmlEntities(answerMatch[2].trim()) : '',
    });
  }
  return questions;
}

// --- Scan and parse ---

function scanEntries() {
  const files = fs.readdirSync(FOR_HUMAN_DIR)
    .filter(f => f.endsWith('.html') && !EXCLUDE.has(f) && !f.startsWith('_'));

  const entries = [];
  const allGaryQuestions = [];

  for (const file of files) {
    const html = fs.readFileSync(path.join(FOR_HUMAN_DIR, file), 'utf-8');

    // Try structured data-* extraction first, fall back to legacy
    let entry = extractDataAttributes(html);
    if (!entry) {
      console.warn(`  LEGACY: ${file} (no data-* attributes, using HTML scraping)`);
      entry = extractLegacy(html, file);
    }

    entry.file = file;
    entry.sortDate = parseSortableDate(entry.date);

    // Extract Gary questions
    const questions = extractGaryQuestions(html, entry.id);
    allGaryQuestions.push(...questions);

    entries.push(entry);
  }

  // Sort by date descending, then filename descending for same date
  entries.sort((a, b) => {
    const dateCmp = b.sortDate.localeCompare(a.sortDate);
    if (dateCmp !== 0) return dateCmp;
    return b.file.localeCompare(a.file);
  });

  return { entries, garyQuestions: allGaryQuestions };
}

// --- Build manifest ---

function buildManifest(entries, garyQuestions) {
  // Compute vertical aggregations
  const verticals = VERTICALS
    .filter(v => entries.some(e => e.vertical === v.slug))
    .map(v => {
      const vEntries = entries.filter(e => e.vertical === v.slug);
      const phases = {};

      for (const e of vEntries) {
        const phaseKey = String(e.phase);
        if (!phases[phaseKey]) phases[phaseKey] = { stages: {} };

        const stageSlug = e.stage;
        if (!phases[phaseKey].stages[stageSlug]) {
          phases[phaseKey].stages[stageSlug] = { status: 'complete', docCount: 0 };
        }
        phases[phaseKey].stages[stageSlug].docCount++;

        // If any doc in this stage is in-progress, mark stage as in-progress
        if (e.status === 'in-progress') {
          phases[phaseKey].stages[stageSlug].status = 'in-progress';
        }
      }

      return {
        slug: v.slug,
        label: v.label,
        order: v.order,
        category: v.category,
        phases,
      };
    });

  const documents = entries.map(e => ({
    id: e.id,
    file: e.file,
    title: e.title,
    subtitle: e.subtitle,
    date: e.date,
    phase: e.phase,
    vertical: e.vertical,
    verticalSecondary: e.verticalSecondary,
    stage: e.stage,
    tags: e.tags,
    sessionId: e.sessionId || '',
    status: e.status,
  }));

  const activeVerticals = new Set(entries.map(e => e.vertical));
  const openQuestions = garyQuestions.filter(q => q.status !== 'answered');

  return {
    generated: new Date().toISOString(),
    verticals,
    documents,
    garyQuestions,
    stats: {
      totalDocs: entries.length,
      totalVerticals: activeVerticals.size,
      garyQuestionsOpen: openQuestions.length,
      garyQuestionsTotal: garyQuestions.length,
    },
  };
}

// --- HTML helpers ---

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeJsonForHtml(obj) {
  return JSON.stringify(obj)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026');
}

// --- Design tokens (shared CSS) ---

const DESIGN_TOKENS_CSS = `
    :root {
      --bg-primary: #09090b;
      --bg-elevated: #18181b;
      --bg-surface: #1c1c1f;
      --text-primary: rgba(255,255,255,0.87);
      --text-secondary: rgba(255,255,255,0.60);
      --text-muted: rgba(255,255,255,0.38);
      --action: #22d3ee;
      --success: #34d399;
      --error: #f87171;
      --warning: #fbbf24;
      --purple: #a78bfa;
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
    }
    a { color: var(--action); text-decoration: none; }
    a:hover { text-decoration: underline; }
`;

// --- Generate index.html (SPA) ---

function generateIndexHtml(manifest) {
  const manifestJson = escapeJsonForHtml(manifest);
  const stagesJson = JSON.stringify(STAGES);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>For Human \u2014 Screen Print Pro Knowledge Base</title>
  <style>
${DESIGN_TOKENS_CSS}

    /* --- LAYOUT --- */
    .app {
      display: grid;
      grid-template-columns: 240px 1fr;
      grid-template-rows: auto 1fr;
      min-height: 100vh;
    }

    /* --- TOPBAR --- */
    .topbar {
      grid-column: 1 / -1;
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 12px 24px;
      border-bottom: 1px solid var(--border);
      background: var(--bg-elevated);
    }

    .topbar-badge {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: 4px 10px;
      border-radius: 4px;
      background: rgba(34, 211, 238, 0.12);
      color: var(--action);
      white-space: nowrap;
    }

    .topbar-title {
      font-size: 15px;
      font-weight: 600;
      white-space: nowrap;
    }

    .search-box {
      flex: 1;
      max-width: 400px;
      margin-left: auto;
    }

    .search-input {
      width: 100%;
      background: var(--bg-surface);
      border: 1px solid var(--border);
      border-radius: 6px;
      padding: 8px 12px;
      font-size: 13px;
      color: var(--text-primary);
      font-family: var(--font-ui);
      outline: none;
      transition: border-color 0.15s ease;
    }

    .search-input::placeholder { color: var(--text-muted); }
    .search-input:focus { border-color: rgba(34, 211, 238, 0.4); }

    .phase-filters {
      display: flex;
      gap: 4px;
    }

    .phase-btn {
      background: transparent;
      border: 1px solid var(--border);
      border-radius: 4px;
      padding: 4px 10px;
      font-size: 12px;
      font-weight: 500;
      color: var(--text-muted);
      cursor: pointer;
      font-family: var(--font-ui);
      transition: all 0.15s ease;
    }

    .phase-btn:hover { color: var(--text-secondary); border-color: rgba(255,255,255,0.15); }
    .phase-btn.active { background: rgba(34, 211, 238, 0.12); color: var(--action); border-color: rgba(34, 211, 238, 0.3); }

    /* --- SIDEBAR --- */
    .sidebar {
      border-right: 1px solid var(--border);
      background: var(--bg-elevated);
      padding: 16px 0;
      overflow-y: auto;
    }

    .sidebar-section {
      padding: 0 12px;
      margin-bottom: 20px;
    }

    .sidebar-heading {
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-muted);
      padding: 0 8px;
      margin-bottom: 6px;
    }

    .sidebar-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 6px 8px;
      border-radius: 4px;
      cursor: pointer;
      transition: background 0.1s ease;
      font-size: 13px;
      color: var(--text-secondary);
      user-select: none;
    }

    .sidebar-item:hover { background: rgba(255,255,255,0.04); }
    .sidebar-item.active { background: rgba(34, 211, 238, 0.08); color: var(--action); }

    .sidebar-count {
      font-size: 11px;
      font-weight: 600;
      color: var(--text-muted);
      background: rgba(255,255,255,0.04);
      padding: 1px 6px;
      border-radius: 3px;
    }

    .sidebar-item.active .sidebar-count {
      background: rgba(34, 211, 238, 0.12);
      color: var(--action);
    }

    /* --- MAIN CONTENT --- */
    .main {
      padding: 24px;
      overflow-y: auto;
    }

    .main-header {
      margin-bottom: 24px;
    }

    .main-title {
      font-size: 20px;
      font-weight: 700;
      letter-spacing: -0.02em;
      margin-bottom: 4px;
    }

    .main-subtitle {
      font-size: 13px;
      color: var(--text-muted);
    }

    /* --- STAGE PIPELINE --- */
    .pipeline {
      display: flex;
      align-items: center;
      gap: 0;
      margin-bottom: 24px;
      padding: 16px 0;
      overflow-x: auto;
    }

    .pipeline-stage {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      cursor: pointer;
      position: relative;
      min-width: 60px;
    }

    .pipeline-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: var(--bg-surface);
      border: 2px solid rgba(255,255,255,0.15);
      transition: all 0.2s ease;
      position: relative;
      z-index: 1;
    }

    .pipeline-stage.complete .pipeline-dot {
      background: var(--success);
      border-color: var(--success);
    }

    .pipeline-stage.in-progress .pipeline-dot {
      background: var(--action);
      border-color: var(--action);
      animation: pulse 2s ease-in-out infinite;
    }

    .pipeline-stage.active .pipeline-dot {
      box-shadow: 0 0 0 3px rgba(34, 211, 238, 0.3);
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    .pipeline-label {
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.03em;
      color: var(--text-muted);
      text-align: center;
      white-space: nowrap;
    }

    .pipeline-stage.complete .pipeline-label { color: var(--success); }
    .pipeline-stage.in-progress .pipeline-label { color: var(--action); }
    .pipeline-stage.active .pipeline-label { color: var(--text-primary); }

    .pipeline-count {
      font-size: 9px;
      color: var(--text-muted);
    }

    .pipeline-connector {
      flex: 1;
      height: 2px;
      background: rgba(255,255,255,0.08);
      min-width: 20px;
      margin-top: -18px;
    }

    .pipeline-connector.complete { background: var(--success); opacity: 0.4; }

    /* --- DOCUMENT CARDS --- */
    .doc-list { display: flex; flex-direction: column; gap: 8px; }

    .doc-card {
      display: block;
      background: var(--bg-elevated);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 16px 20px;
      transition: border-color 0.15s ease;
      text-decoration: none;
    }

    .doc-card:hover { border-color: rgba(34, 211, 238, 0.3); text-decoration: none; }

    .doc-card-top {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 6px;
    }

    .doc-card-title {
      font-size: 15px;
      font-weight: 600;
      color: var(--text-primary);
    }

    .doc-card-date {
      font-size: 12px;
      color: var(--text-muted);
      white-space: nowrap;
    }

    .doc-card-subtitle {
      font-size: 13px;
      color: var(--text-secondary);
      margin-bottom: 8px;
    }

    .doc-card-meta {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
      align-items: center;
    }

    .doc-tag {
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      padding: 2px 7px;
      border-radius: 3px;
    }

    .doc-tag-feature, .doc-tag-build { background: rgba(52, 211, 153, 0.1); color: var(--success); }
    .doc-tag-plan { background: rgba(34, 211, 238, 0.1); color: var(--action); }
    .doc-tag-decision, .doc-tag-learning { background: rgba(251, 191, 36, 0.1); color: var(--warning); }
    .doc-tag-research { background: rgba(167, 139, 250, 0.1); color: var(--purple); }

    .doc-stage-badge {
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      padding: 2px 7px;
      border-radius: 3px;
      background: rgba(34, 211, 238, 0.08);
      color: var(--action);
      opacity: 0.7;
    }

    .doc-vertical-badge {
      font-size: 10px;
      color: var(--text-muted);
    }

    /* --- EMPTY STATE --- */
    .empty-state {
      text-align: center;
      padding: 48px 24px;
      color: var(--text-muted);
    }

    .empty-state-icon {
      font-size: 32px;
      margin-bottom: 12px;
      opacity: 0.3;
    }

    /* --- RESPONSIVE --- */
    @media (max-width: 768px) {
      .app {
        grid-template-columns: 1fr;
      }
      .sidebar {
        display: none;
      }
      .sidebar.mobile-open {
        display: block;
        position: fixed;
        top: 0;
        left: 0;
        width: 280px;
        height: 100vh;
        z-index: 100;
        box-shadow: 4px 0 24px rgba(0,0,0,0.5);
      }
      .topbar-title { display: none; }
    }
  </style>
</head>
<body>
  <div class="app" id="app">
    <!-- Topbar -->
    <div class="topbar">
      <span class="topbar-badge">Screen Print Pro</span>
      <span class="topbar-title">Knowledge Base</span>
      <div class="search-box">
        <input type="text" class="search-input" id="search" placeholder="Search docs..." autocomplete="off">
      </div>
      <div class="phase-filters" id="phase-filters">
        <button class="phase-btn active" data-phase="all">All</button>
        <button class="phase-btn" data-phase="1">Phase 1</button>
        <button class="phase-btn" data-phase="2">Phase 2</button>
        <button class="phase-btn" data-phase="3">Phase 3</button>
      </div>
    </div>

    <!-- Sidebar -->
    <nav class="sidebar" id="sidebar">
      <div class="sidebar-section">
        <div class="sidebar-heading">Views</div>
        <div class="sidebar-item active" data-view="all">
          <span>All Sessions</span>
          <span class="sidebar-count" id="count-all">${manifest.stats.totalDocs}</span>
        </div>
        <div class="sidebar-item" data-view="gary">
          <span>Gary Tracker</span>
          <span class="sidebar-count" id="count-gary">${manifest.stats.garyQuestionsOpen}</span>
        </div>
      </div>
      <div class="sidebar-section">
        <div class="sidebar-heading">Verticals</div>
        <div id="sidebar-verticals"></div>
      </div>
      <div class="sidebar-section">
        <div class="sidebar-heading">Infrastructure</div>
        <div id="sidebar-infra"></div>
      </div>
    </nav>

    <!-- Main -->
    <main class="main" id="main">
      <div class="main-header">
        <div class="main-title" id="main-title">All Sessions</div>
        <div class="main-subtitle" id="main-subtitle">${manifest.stats.totalDocs} documents across ${manifest.stats.totalVerticals} verticals</div>
      </div>
      <div id="pipeline-container"></div>
      <div class="doc-list" id="doc-list"></div>
    </main>
  </div>

  <script>
  window.__MANIFEST__ = ${manifestJson};

  (function() {
    var M = window.__MANIFEST__;
    var STAGES = ${stagesJson};
    var STAGE_MAP = {};
    STAGES.forEach(function(s) { STAGE_MAP[s.slug] = s; });

    // State
    var currentView = 'all';
    var currentVertical = null;
    var currentStage = null;
    var currentPhase = 'all';
    var searchQuery = '';
    var debounceTimer = null;

    // DOM refs
    var searchInput = document.getElementById('search');
    var sidebarVerticals = document.getElementById('sidebar-verticals');
    var sidebarInfra = document.getElementById('sidebar-infra');
    var mainTitle = document.getElementById('main-title');
    var mainSubtitle = document.getElementById('main-subtitle');
    var pipelineContainer = document.getElementById('pipeline-container');
    var docList = document.getElementById('doc-list');
    var countAll = document.getElementById('count-all');

    function escH(s) {
      return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    // --- Render sidebar ---
    function renderSidebar() {
      var domainVerticals = M.verticals.filter(function(v) { return v.category === 'domain'; });
      var infraVerticals = M.verticals.filter(function(v) { return v.category === 'infra'; });

      sidebarVerticals.innerHTML = domainVerticals.map(function(v) {
        var totalCount = M.documents.filter(function(d) { return d.vertical === v.slug; }).length;
        var isActive = currentView === 'vertical' && currentVertical === v.slug;
        return '<div class="sidebar-item' + (isActive ? ' active' : '') + '" data-view="vertical" data-vertical="' + v.slug + '">'
          + '<span>' + escH(v.label) + '</span>'
          + '<span class="sidebar-count">' + totalCount + '</span>'
          + '</div>';
      }).join('');

      sidebarInfra.innerHTML = infraVerticals.map(function(v) {
        var totalCount = M.documents.filter(function(d) { return d.vertical === v.slug; }).length;
        var isActive = currentView === 'vertical' && currentVertical === v.slug;
        return '<div class="sidebar-item' + (isActive ? ' active' : '') + '" data-view="vertical" data-vertical="' + v.slug + '">'
          + '<span>' + escH(v.label) + '</span>'
          + '<span class="sidebar-count">' + totalCount + '</span>'
          + '</div>';
      }).join('');

      // Rebind clicks
      var items = document.querySelectorAll('.sidebar-item');
      for (var i = 0; i < items.length; i++) {
        items[i].addEventListener('click', handleSidebarClick);
      }
    }

    function handleSidebarClick() {
      var view = this.dataset.view;
      var vertical = this.dataset.vertical;

      if (view === 'gary') {
        window.location.href = 'gary-tracker.html';
        return;
      }

      var allItems = document.querySelectorAll('.sidebar-item');
      for (var i = 0; i < allItems.length; i++) { allItems[i].classList.remove('active'); }
      this.classList.add('active');

      if (view === 'all') {
        currentView = 'all';
        currentVertical = null;
        currentStage = null;
      } else if (view === 'vertical') {
        currentView = 'vertical';
        currentVertical = vertical;
        currentStage = null;
      }
      searchQuery = '';
      searchInput.value = '';
      render();
    }

    // --- Filter docs ---
    function getFilteredDocs() {
      var docs = M.documents;

      if (currentPhase !== 'all') {
        docs = docs.filter(function(d) { return String(d.phase) === currentPhase; });
      }

      if (searchQuery) {
        var words = searchQuery.toLowerCase().split(/\\s+/).filter(Boolean);
        docs = docs.filter(function(d) {
          var hay = (d.title + ' ' + d.subtitle + ' ' + d.tags.join(' ') + ' ' + d.vertical + ' ' + d.stage).toLowerCase();
          return words.every(function(w) { return hay.indexOf(w) !== -1; });
        });
      } else if (currentView === 'vertical' && currentVertical) {
        docs = docs.filter(function(d) {
          return d.vertical === currentVertical || (d.verticalSecondary && d.verticalSecondary.indexOf(currentVertical) !== -1);
        });
        if (currentStage) {
          docs = docs.filter(function(d) { return d.stage === currentStage; });
        }
      }

      return docs;
    }

    // --- Render pipeline ---
    function renderPipeline() {
      if (currentView !== 'vertical' || !currentVertical) {
        pipelineContainer.innerHTML = '';
        return;
      }

      var vDocs = M.documents.filter(function(d) {
        var matchVertical = d.vertical === currentVertical || (d.verticalSecondary && d.verticalSecondary.indexOf(currentVertical) !== -1);
        var matchPhase = currentPhase === 'all' || String(d.phase) === currentPhase;
        return matchVertical && matchPhase;
      });

      var stageDocCounts = {};
      var stageStatuses = {};
      vDocs.forEach(function(d) {
        stageDocCounts[d.stage] = (stageDocCounts[d.stage] || 0) + 1;
        if (d.status === 'in-progress') stageStatuses[d.stage] = 'in-progress';
        else if (!stageStatuses[d.stage]) stageStatuses[d.stage] = 'complete';
      });

      var html = '<div class="pipeline">';
      var first = true;
      STAGES.forEach(function(stage) {
        var count = stageDocCounts[stage.slug] || 0;
        var status = stageStatuses[stage.slug] || 'future';
        var isActive = currentStage === stage.slug;

        if (!first) {
          var connClass = count > 0 ? ' complete' : '';
          html += '<div class="pipeline-connector' + connClass + '"></div>';
        }
        first = false;

        var stageClass = (count > 0 ? status : 'future') + (isActive ? ' active' : '');
        html += '<div class="pipeline-stage ' + stageClass + '" data-stage="' + stage.slug + '">'
          + '<div class="pipeline-dot"></div>'
          + '<div class="pipeline-label">' + stage.short + '</div>'
          + (count > 0 ? '<div class="pipeline-count">' + count + '</div>' : '')
          + '</div>';
      });
      html += '</div>';
      pipelineContainer.innerHTML = html;

      // Bind pipeline clicks
      var pStages = pipelineContainer.querySelectorAll('.pipeline-stage');
      for (var i = 0; i < pStages.length; i++) {
        pStages[i].addEventListener('click', function() {
          var stage = this.dataset.stage;
          currentStage = (currentStage === stage) ? null : stage;
          render();
        });
      }
    }

    // --- Render doc list ---
    function renderDocList() {
      var docs = getFilteredDocs();

      if (docs.length === 0) {
        docList.innerHTML = '<div class="empty-state">'
          + '<div class="empty-state-icon">&#128269;</div>'
          + '<p>No documents match your filters.</p>'
          + '</div>';
        return;
      }

      docList.innerHTML = docs.map(function(d) {
        // Filter out tags that duplicate the stage (e.g. "build" tag when stage is "build")
        var deduped = d.tags.filter(function(t) { return t !== d.stage; });
        var tags = deduped.map(function(t) { return '<span class="doc-tag doc-tag-' + t + '">' + t + '</span>'; }).join('');
        var stageLabel = STAGE_MAP[d.stage] ? STAGE_MAP[d.stage].short : d.stage;
        var showVertical = currentView === 'all' || searchQuery;

        return '<a class="doc-card" href="' + escH(d.file) + '">'
          + '<div class="doc-card-top">'
          + '<div class="doc-card-title">' + escH(d.title) + '</div>'
          + '<div class="doc-card-date">' + escH(d.date) + '</div>'
          + '</div>'
          + (d.subtitle ? '<div class="doc-card-subtitle">' + escH(d.subtitle) + '</div>' : '')
          + '<div class="doc-card-meta">'
          + tags
          + '<span class="doc-stage-badge">' + escH(stageLabel) + '</span>'
          + (showVertical ? '<span class="doc-vertical-badge">' + escH(d.vertical) + '</span>' : '')
          + '</div>'
          + '</a>';
      }).join('');
    }

    // --- Render header ---
    function renderHeader() {
      var docs = getFilteredDocs();

      if (searchQuery) {
        mainTitle.textContent = 'Search Results';
        mainSubtitle.textContent = docs.length + ' document' + (docs.length !== 1 ? 's' : '') + ' found';
      } else if (currentView === 'vertical' && currentVertical) {
        var vData = M.verticals.find(function(v) { return v.slug === currentVertical; });
        var label = vData ? vData.label : currentVertical;
        mainTitle.textContent = label;
        if (currentStage) {
          var sData = STAGE_MAP[currentStage];
          mainSubtitle.textContent = (sData ? sData.label : currentStage) + ' \\u2014 ' + docs.length + ' document' + (docs.length !== 1 ? 's' : '');
        } else {
          mainSubtitle.textContent = docs.length + ' document' + (docs.length !== 1 ? 's' : '') + ' in this vertical';
        }
      } else {
        mainTitle.textContent = 'All Sessions';
        mainSubtitle.textContent = docs.length + ' document' + (docs.length !== 1 ? 's' : '') + ' across ' + M.stats.totalVerticals + ' verticals';
      }

      countAll.textContent = M.documents.filter(function(d) { return currentPhase === 'all' || String(d.phase) === currentPhase; }).length;
    }

    // --- Full render ---
    function render() {
      renderSidebar();
      renderHeader();
      renderPipeline();
      renderDocList();
    }

    // --- Event listeners ---
    searchInput.addEventListener('input', function() {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(function() {
        searchQuery = searchInput.value.trim();
        if (searchQuery) {
          currentView = 'all';
          currentVertical = null;
          currentStage = null;
          var allItems = document.querySelectorAll('.sidebar-item');
          for (var i = 0; i < allItems.length; i++) { allItems[i].classList.remove('active'); }
        }
        render();
      }, 200);
    });

    document.getElementById('phase-filters').addEventListener('click', function(e) {
      var btn = e.target.closest('.phase-btn');
      if (!btn) return;
      var allBtns = document.querySelectorAll('.phase-btn');
      for (var i = 0; i < allBtns.length; i++) { allBtns[i].classList.remove('active'); }
      btn.classList.add('active');
      currentPhase = btn.dataset.phase;
      render();
    });

    // --- Init ---
    render();
  })();
  </script>
</body>
</html>`;
}

// --- Generate stage summary pages ---

function generateStageSummaries(manifest) {
  // Ensure _stage directory exists
  if (!fs.existsSync(STAGE_DIR)) {
    fs.mkdirSync(STAGE_DIR, { recursive: true });
  }

  // Clean old stage summaries
  const existing = fs.readdirSync(STAGE_DIR).filter(f => f.endsWith('.html'));
  for (const f of existing) {
    fs.unlinkSync(path.join(STAGE_DIR, f));
  }

  const generated = [];

  for (const vertical of manifest.verticals) {
    for (const [phaseKey, phaseData] of Object.entries(vertical.phases)) {
      for (const [stageSlug, stageData] of Object.entries(phaseData.stages)) {
        const filename = `${vertical.slug}-phase${phaseKey}-${stageSlug}.html`;
        const stageMeta = STAGE_MAP[stageSlug] || { label: stageSlug, short: stageSlug };

        // Get docs for this combo
        const docs = manifest.documents.filter(d =>
          d.vertical === vertical.slug &&
          String(d.phase) === phaseKey &&
          d.stage === stageSlug
        ).sort((a, b) => a.date.localeCompare(b.date));

        // Find prev/next stages in this vertical+phase
        const stagesInPhase = Object.keys(phaseData.stages)
          .map(s => STAGE_MAP[s] || { slug: s, order: 99 })
          .sort((a, b) => a.order - b.order);
        const currentIdx = stagesInPhase.findIndex(s => s.slug === stageSlug);
        const prevStage = currentIdx > 0 ? stagesInPhase[currentIdx - 1] : null;
        const nextStage = currentIdx < stagesInPhase.length - 1 ? stagesInPhase[currentIdx + 1] : null;

        const docTimeline = docs.map(d =>
          `      <a class="doc-card" href="../${escapeHtml(d.file)}">
        <div class="doc-card-top">
          <div class="doc-card-title">${escapeHtml(d.title)}</div>
          <div class="doc-card-date">${escapeHtml(d.date)}</div>
        </div>
        ${d.subtitle ? '<div class="doc-card-subtitle">' + escapeHtml(d.subtitle) + '</div>' : ''}
        <div class="doc-card-meta">
          ${d.tags.filter(t => t !== d.stage).map(t => '<span class="doc-tag doc-tag-' + t + '">' + t + '</span>').join('')}
        </div>
      </a>`
        ).join('\n');

        const stageNavHtml = `
      <div class="stage-nav">
        ${prevStage ? '<a class="stage-nav-btn" href="' + vertical.slug + '-phase' + phaseKey + '-' + prevStage.slug + '.html">&larr; ' + escapeHtml(prevStage.label) + '</a>' : '<span></span>'}
        ${nextStage ? '<a class="stage-nav-btn" href="' + vertical.slug + '-phase' + phaseKey + '-' + nextStage.slug + '.html">' + escapeHtml(nextStage.label) + ' &rarr;</a>' : '<span></span>'}
      </div>`;

        const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(vertical.label)} \u2014 ${escapeHtml(stageMeta.label)} \u2014 Screen Print Pro</title>
  <style>
${DESIGN_TOKENS_CSS}
    body { padding: 48px 24px; }
    .container { max-width: 720px; margin: 0 auto; }
    .top-nav { margin-bottom: 24px; }
    .back-btn {
      display: inline-flex; align-items: center; gap: 6px;
      color: var(--text-muted); font-size: 13px; font-weight: 500;
      text-decoration: none; padding: 6px 12px; border-radius: 6px;
      border: 1px solid var(--border); transition: all 0.15s ease;
    }
    .back-btn:hover { color: var(--action); border-color: rgba(34, 211, 238, 0.3); text-decoration: none; }
    header { margin-bottom: 32px; }
    .stage-badge {
      display: inline-block; font-size: 11px; font-weight: 600;
      text-transform: uppercase; letter-spacing: 0.05em;
      padding: 4px 10px; border-radius: 4px;
      background: rgba(34, 211, 238, 0.12); color: var(--action);
      margin-bottom: 12px;
    }
    .phase-badge {
      display: inline-block; font-size: 11px; font-weight: 600;
      text-transform: uppercase; letter-spacing: 0.05em;
      padding: 4px 10px; border-radius: 4px;
      background: rgba(255,255,255,0.05); color: var(--text-muted);
      margin-left: 8px;
    }
    h1 { font-size: 28px; font-weight: 700; letter-spacing: -0.02em; margin-bottom: 8px; }
    .subtitle { color: var(--text-secondary); font-size: 15px; margin-bottom: 20px; }
    h2 {
      font-size: 11px; font-weight: 600; text-transform: uppercase;
      letter-spacing: 0.05em; color: var(--text-muted);
      margin-top: 32px; margin-bottom: 16px;
    }
    .doc-card {
      display: block; background: var(--bg-elevated); border: 1px solid var(--border);
      border-radius: 8px; padding: 16px 20px; margin-bottom: 8px;
      transition: border-color 0.15s ease; text-decoration: none;
    }
    .doc-card:hover { border-color: rgba(34, 211, 238, 0.3); text-decoration: none; }
    .doc-card-top { display: flex; justify-content: space-between; gap: 12px; margin-bottom: 6px; }
    .doc-card-title { font-size: 15px; font-weight: 600; color: var(--text-primary); }
    .doc-card-date { font-size: 12px; color: var(--text-muted); white-space: nowrap; }
    .doc-card-subtitle { font-size: 13px; color: var(--text-secondary); margin-bottom: 8px; }
    .doc-card-meta { display: flex; gap: 6px; flex-wrap: wrap; }
    .doc-tag {
      font-size: 10px; font-weight: 600; text-transform: uppercase;
      letter-spacing: 0.04em; padding: 2px 7px; border-radius: 3px;
    }
    .doc-tag-feature, .doc-tag-build { background: rgba(52, 211, 153, 0.1); color: var(--success); }
    .doc-tag-plan { background: rgba(34, 211, 238, 0.1); color: var(--action); }
    .doc-tag-decision, .doc-tag-learning { background: rgba(251, 191, 36, 0.1); color: var(--warning); }
    .doc-tag-research { background: rgba(167, 139, 250, 0.1); color: var(--purple); }
    .stage-nav {
      display: flex; justify-content: space-between; margin-top: 32px;
      padding-top: 24px; border-top: 1px solid var(--border);
    }
    .stage-nav-btn {
      font-size: 13px; color: var(--text-secondary); text-decoration: none;
      padding: 8px 14px; border-radius: 6px; border: 1px solid var(--border);
      background: var(--bg-elevated); transition: all 0.15s ease;
    }
    .stage-nav-btn:hover { color: var(--action); border-color: rgba(34, 211, 238, 0.3); text-decoration: none; }
    footer {
      margin-top: 48px; padding-top: 24px; border-top: 1px solid var(--border);
      font-size: 12px; color: var(--text-muted); text-align: center;
    }
  </style>
</head>
<body>
  <div class="container">
    <nav class="top-nav">
      <a class="back-btn" href="../index.html">&larr; Back to Knowledge Base</a>
    </nav>
    <header>
      <span class="stage-badge">${escapeHtml(stageMeta.label)}</span>
      <span class="phase-badge">Phase ${escapeHtml(phaseKey)}</span>
      <h1>${escapeHtml(vertical.label)}</h1>
      <p class="subtitle">${docs.length} session${docs.length !== 1 ? 's' : ''} in ${escapeHtml(stageMeta.label).toLowerCase()} stage</p>
    </header>

    <h2>Contributing Sessions</h2>
${docTimeline}
${stageNavHtml}

    <footer>
      Screen Print Pro \u2014 ${escapeHtml(vertical.label)} \u2014 ${escapeHtml(stageMeta.label)}
    </footer>
  </div>
</body>
</html>`;

        fs.writeFileSync(path.join(STAGE_DIR, filename), html);
        generated.push(filename);
      }
    }
  }

  return generated;
}

// --- Generate Gary tracker ---

function generateGaryTracker(manifest) {
  const questions = manifest.garyQuestions;
  const answered = questions.filter(q => q.status === 'answered');
  const unanswered = questions.filter(q => q.status !== 'answered');

  // Group by vertical
  const byVertical = {};
  for (const q of questions) {
    if (!byVertical[q.vertical]) byVertical[q.vertical] = [];
    byVertical[q.vertical].push(q);
  }

  const verticalSections = Object.entries(byVertical).map(([vSlug, qs]) => {
    const vLabel = VERTICAL_MAP[vSlug] ? VERTICAL_MAP[vSlug].label : vSlug;
    const cards = qs.map(q => {
      const statusClass = q.status === 'answered' ? 'answered' : 'unanswered';
      return `      <div class="gary-q-card ${statusClass}">
        <div class="gary-q-text">${escapeHtml(q.text)}</div>
        ${q.context ? '<div class="gary-q-context">' + escapeHtml(q.context) + '</div>' : ''}
        <div class="gary-q-meta">
          <span>Source: <a href="${escapeHtml(q.docId)}.html">${escapeHtml(q.docId)}</a></span>
          ${q.status === 'answered' && q.answeredDate ? '<span>Answered: ' + escapeHtml(q.answeredDate) + '</span>' : ''}
        </div>
        ${q.answer ? '<div class="gary-q-answer">' + escapeHtml(q.answer) + '</div>' : ''}
      </div>`;
    }).join('\n');

    return `    <h2>${escapeHtml(vLabel)}</h2>\n${cards}`;
  }).join('\n\n');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Gary Questions Tracker \u2014 Screen Print Pro</title>
  <style>
${DESIGN_TOKENS_CSS}
    body { padding: 48px 24px; }
    .container { max-width: 720px; margin: 0 auto; }
    .top-nav { margin-bottom: 24px; }
    .back-btn {
      display: inline-flex; align-items: center; gap: 6px;
      color: var(--text-muted); font-size: 13px; font-weight: 500;
      text-decoration: none; padding: 6px 12px; border-radius: 6px;
      border: 1px solid var(--border); transition: all 0.15s ease;
    }
    .back-btn:hover { color: var(--action); border-color: rgba(34, 211, 238, 0.3); text-decoration: none; }
    header { margin-bottom: 32px; }
    .badge {
      display: inline-block; font-size: 11px; font-weight: 600;
      text-transform: uppercase; letter-spacing: 0.05em;
      padding: 4px 10px; border-radius: 4px;
      background: rgba(167, 139, 250, 0.12); color: var(--purple);
      margin-bottom: 12px;
    }
    h1 { font-size: 28px; font-weight: 700; letter-spacing: -0.02em; margin-bottom: 8px; }
    .subtitle { color: var(--text-secondary); font-size: 15px; margin-bottom: 20px; }
    .stats-bar {
      display: flex; gap: 24px; margin-bottom: 24px;
      padding: 12px 16px; background: var(--bg-elevated);
      border: 1px solid var(--border); border-radius: 8px;
    }
    .stats-item { display: flex; align-items: baseline; gap: 6px; }
    .stats-number { font-size: 20px; font-weight: 700; color: var(--action); }
    .stats-number.warn { color: var(--warning); }
    .stats-number.ok { color: var(--success); }
    .stats-label { font-size: 12px; color: var(--text-muted); }
    h2 {
      font-size: 11px; font-weight: 600; text-transform: uppercase;
      letter-spacing: 0.05em; color: var(--text-muted);
      margin-top: 32px; margin-bottom: 16px;
    }
    .gary-q-card {
      background: var(--bg-elevated); border: 1px solid var(--border);
      border-left: 3px solid var(--purple); border-radius: 0 8px 8px 0;
      padding: 16px 20px; margin-bottom: 8px;
    }
    .gary-q-card.answered { border-left-color: var(--success); opacity: 0.7; }
    .gary-q-text { font-size: 14px; font-weight: 600; color: var(--text-primary); margin-bottom: 4px; }
    .gary-q-context { font-size: 13px; color: var(--text-muted); font-style: italic; margin-bottom: 8px; }
    .gary-q-meta { font-size: 12px; color: var(--text-muted); display: flex; gap: 16px; }
    .gary-q-answer {
      margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--border);
      font-size: 14px; color: var(--text-secondary);
    }
    .empty-state {
      text-align: center; padding: 48px 24px; color: var(--text-muted);
    }
    .empty-state code {
      font-family: var(--font-mono); font-size: 12px;
      background: var(--bg-surface); padding: 2px 6px;
      border-radius: 4px; color: var(--action);
    }
    footer {
      margin-top: 48px; padding-top: 24px; border-top: 1px solid var(--border);
      font-size: 12px; color: var(--text-muted); text-align: center;
    }
  </style>
</head>
<body>
  <div class="container">
    <nav class="top-nav">
      <a class="back-btn" href="index.html">&larr; Back to Knowledge Base</a>
    </nav>
    <header>
      <span class="badge">Gary Questions</span>
      <h1>Questions for Gary</h1>
      <p class="subtitle">Questions collected from research and planning sessions that need Gary's input</p>
    </header>

    <div class="stats-bar">
      <div class="stats-item">
        <span class="stats-number">${questions.length}</span>
        <span class="stats-label">Total</span>
      </div>
      <div class="stats-item">
        <span class="stats-number warn">${unanswered.length}</span>
        <span class="stats-label">Unanswered</span>
      </div>
      <div class="stats-item">
        <span class="stats-number ok">${answered.length}</span>
        <span class="stats-label">Answered</span>
      </div>
    </div>

${questions.length === 0 ? '    <div class="empty-state"><p>No questions yet. Questions will appear here when session docs include <code>.gary-question</code> markup.</p></div>' : verticalSections}

    <footer>
      Screen Print Pro \u2014 Gary Questions Tracker
    </footer>
  </div>
</body>
</html>`;

  return html;
}

// --- Generate README.md ---

function generateReadmeMd(manifest) {
  const rows = manifest.documents.map(d => {
    const tags = d.tags.join(', ');
    const vLabel = VERTICAL_MAP[d.vertical] ? VERTICAL_MAP[d.vertical].label : d.vertical;
    const sLabel = STAGE_MAP[d.stage] ? STAGE_MAP[d.stage].label : d.stage;
    return `| [${d.title}](${d.file}) | ${vLabel} | ${sLabel} | ${d.date} | ${tags} |`;
  }).join('\n');

  return `# For Human \u2014 Knowledge Base

Session summaries, decisions, and build logs organized by vertical and stage.

## Index

| File | Vertical | Stage | Date | Tags |
|------|----------|-------|------|------|
${rows}

## Verticals

| Vertical | Docs |
|----------|------|
${manifest.verticals.map(v => `| ${v.label} | ${manifest.documents.filter(d => d.vertical === v.slug).length} |`).join('\n')}

## How to Use

Open \`index.html\` in your browser for the full knowledge base with search, vertical navigation, and stage pipeline visualization.

Individual session docs are standalone HTML files that can be opened directly.

## Regenerating

This file, \`index.html\`, \`gary-tracker.html\`, \`manifest.json\`, and \`_stage/*.html\` are all auto-generated:

\`\`\`bash
npm run gen:index
\`\`\`

## Gary Questions

Questions for Gary (the shop owner) are tracked in \`gary-tracker.html\`. To add a question, use the \`.gary-question\` markup in any session doc, then re-run \`npm run gen:index\`.
`;
}

// --- Main ---

function main() {
  console.log('Scanning for_human/ directory...');
  const { entries, garyQuestions } = scanEntries();
  console.log(`Found ${entries.length} session entries.`);
  console.log(`Found ${garyQuestions.length} Gary questions.`);

  // Build manifest
  const manifest = buildManifest(entries, garyQuestions);

  // Write manifest.json
  fs.writeFileSync(
    path.join(FOR_HUMAN_DIR, 'manifest.json'),
    JSON.stringify(manifest, null, 2)
  );
  console.log('Generated for_human/manifest.json');

  // Write index.html
  const indexHtml = generateIndexHtml(manifest);
  fs.writeFileSync(path.join(FOR_HUMAN_DIR, 'index.html'), indexHtml);
  console.log('Generated for_human/index.html');

  // Write stage summaries
  const stageSummaries = generateStageSummaries(manifest);
  console.log(`Generated ${stageSummaries.length} stage summary pages in for_human/_stage/`);

  // Write gary tracker
  const garyHtml = generateGaryTracker(manifest);
  fs.writeFileSync(path.join(FOR_HUMAN_DIR, 'gary-tracker.html'), garyHtml);
  console.log('Generated for_human/gary-tracker.html');

  // Write README.md
  const readmeMd = generateReadmeMd(manifest);
  fs.writeFileSync(path.join(FOR_HUMAN_DIR, 'README.md'), readmeMd);
  console.log('Generated for_human/README.md');

  console.log(`\nDone. ${entries.length} docs, ${manifest.verticals.length} verticals, ${stageSummaries.length} stage pages.`);
}

main();
