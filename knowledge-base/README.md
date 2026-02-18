# Screen Print Pro — Knowledge Base

> **Agent guide.** This is the primary entry point for any agent reading or writing to the KB.
> Read this file before touching any content. It tells you where things live, how to find them,
> and how to deposit new knowledge correctly.

---

## What This Is

The Knowledge Base is the institutional memory of Screen Print Pro. It stores:

- **Industry facts** that don't change (garment specs, screen-print physics, supplier standards)
- **Market intelligence** that evolves (competitor moves, customer mental models, UX patterns)
- **Domain knowledge** grounded in DDD (pricing rules, job state machines, inventory logic)
- **Product decisions** explaining why each vertical was built the way it was
- **Engineering learnings** — gotchas, patterns, decisions discovered during builds
- **Strategy** — cooldowns, planning docs, retrospectives
- **Tool documentation** — how dev tools work in this project
- **Pipeline records** — what happened in each build session

**Primary consumer: agents.** Humans browse; agents retrieve. Structure and naming exist for grep
speed and semantic clarity, not aesthetics.

---

## Collections at a Glance

| Collection   | Mutation model         | What belongs here                                                                                    |
| ------------ | ---------------------- | ---------------------------------------------------------------------------------------------------- |
| `industry/`  | Living (synthesize)    | Screen-print physics, garment specs, emulsion chemistry, supplier standards, industry terminology    |
| `market/`    | Living (synthesize)    | Competitor analysis, customer mental models, UX patterns from peer products                          |
| `domain/`    | Living (synthesize)    | DDD domain knowledge — pricing rules, job states, garment sourcing logic. **Not** product decisions. |
| `product/`   | Living (synthesize)    | Per-vertical product decisions — why features exist, scope choices, open questions                   |
| `learnings/` | Append-only (new file) | Engineering gotchas, reusable patterns, one-time decisions. See subdirs.                             |
| `strategy/`  | Append-only (new file) | Cooldowns, planning docs, cycle retrospectives                                                       |
| `tools/`     | Living (synthesize)    | How dev tools work in this project (Vitest patterns, Astro gotchas, CI config)                       |
| `pipelines/` | Append-only (new file) | Session records — what was built, artifacts, PRs, decisions                                          |

**Living docs** are synthesized on update — read existing content, identify what changed, rewrite
affected sections coherently. Never append raw notes. No sediment layers.

**Append-only collections** get a new file per entry. Never edit existing pipeline or learnings
files — file a new one.

---

## How to Retrieve

### Step 1 — Know which collection

Identify the category of knowledge you need from the table above. When in doubt:

- "How does X work in the screen-print industry?" → `industry/`
- "What did competitor Y do with feature Z?" → `market/`
- "What are the rules for pricing in our domain model?" → `domain/`
- "Why was the Quote vertical built this way?" → `product/`
- "What are the gotchas with Tailwind v4 tokens?" → `learnings/`
- "What happened in the Phase 4 migration session?" → `pipelines/`

### Step 2 — Search within the collection

```bash
# Broad keyword search across a collection
grep -r "keyword" knowledge-base/src/content/industry/

# Search titles only (frontmatter)
grep -r "^title:" knowledge-base/src/content/domain/

# Search by subdomain
grep -r "dtf" knowledge-base/src/content/industry/dtf/
```

### Step 3 — Read the collection's \_index.md first

Each collection has a `_index.md` guide explaining its naming conventions and what good looks like.
Read it before depositing. Astro ignores `_`-prefixed files — they exist solely for agents.

```bash
cat knowledge-base/src/content/industry/_index.md
```

---

## How to Deposit — Two-Pass Wrap-up Protocol

Run this at the end of every session that generated new knowledge.

### Pass 1 — Extraction Scan (5 minutes)

Review what the session produced. For each piece of knowledge, classify it:

| What you found                               | Target collection                           | Mutation   |
| -------------------------------------------- | ------------------------------------------- | ---------- |
| Bug fixed by understanding physics/chemistry | `industry/`                                 | Synthesize |
| Competitor feature discovered                | `market/competitors/`                       | Synthesize |
| Domain rule clarified (pricing, jobs, etc.)  | `domain/`                                   | Synthesize |
| Vertical scope decision made                 | `product/`                                  | Synthesize |
| Engineering gotcha hit (new one)             | `learnings/<subdomain>/YYYY-MM-DD-topic.md` | New file   |
| Build session completed                      | `pipelines/YYYY-MM-DD-topic.md`             | New file   |
| Cooldown or planning doc                     | `strategy/YYYY-MM-DD-topic.md`              | New file   |

Skip anything that belongs in `CLAUDE.md` (operating rules) or `docs/` (architecture, roadmap).
The KB stores **why** and **what happened**. Root docs store **rules**.

### Pass 2 — Deposit

**For append-only collections** (learnings, pipelines, strategy):

1. Create a new file with the correct name format (see each collection's `_index.md`)
2. Use the Tier 1 frontmatter template for that collection type
3. Write content following the document quality rules below

**For living docs** (industry, market, domain, product, tools):

1. Read the existing file if it exists
2. Identify exactly which sections need updating
3. Rewrite those sections with the new knowledge integrated coherently
4. Do **not** append raw notes at the bottom — synthesize into existing structure
5. Update `lastUpdated` in frontmatter
6. If no file exists yet, create it from the template in `_index.md`

---

## Frontmatter Templates

### Living doc (industry, market, domain, product, tools)

```yaml
---
title: 'Topic Name'
type: 'overview' # overview | reference | decisions | history
status: 'current' # current | draft | deprecated
lastUpdated: YYYY-MM-DD
---
```

### Append-only — learnings

```yaml
---
title: 'Short descriptive title of the gotcha or pattern'
type: 'gotcha' # gotcha | pattern | decision
status: 'active' # active | superseded
date: YYYY-MM-DD
---
```

### Append-only — pipelines

```yaml
---
title: 'Document Title'
subtitle: 'Short description'
date: YYYY-MM-DD
phase: 1
pipelineName: 'Human Readable Pipeline Name'
pipelineType: vertical # see config/pipeline-types.json
products: []
tools: []
stage: wrap-up # see config/stages.json
tags: []
sessionId: 'UUID'
branch: 'session/MMDD-topic'
status: complete
---
```

### Append-only — strategy

```yaml
---
title: 'Cooldown / Planning Title'
subtitle: 'Short description'
date: YYYY-MM-DD
docType: cooldown # cooldown | planning
phase: 1
tags: []
status: complete
---
```

---

## Document Quality Rules

1. **Write for grep first.** Use the exact terminology an agent would search for. "Tailwind v4" not
   "the CSS framework we use". "DTF" not "direct-to-film".

2. **No sediment.** Living docs must read as a coherent document at any point in time. An agent
   reading a domain doc should not encounter "UPDATE 2026-02-17: actually ignore the above."

3. **Claim clearly.** Use present tense for current truth ("DTF pricing uses tier breakpoints").
   Use past tense for history ("In Phase 1, we used a flat rate").

4. **Depth over breadth.** One sharp paragraph beats five vague bullet points. If you can't
   articulate the principle in one paragraph, you don't understand it yet.

5. **Link don't duplicate.** If a rule lives in `CLAUDE.md` or `docs/`, reference it with a
   GitHub URL — don't copy it into the KB. The KB explains decisions; root docs enforce rules.

6. **Supersede cleanly.** If a learnings entry is no longer true, create a new file with
   `status: superseded` pointing to the old one. Never edit old learnings files.

---

## Directory Structure

```
knowledge-base/src/content/
├── industry/               # How the screen-print world works (physics, suppliers, standards)
│   ├── _index.md           # Collection guide (agent-only, Astro ignores _-prefixed files)
│   ├── garments/           # Fabric specs, sizing, brand positioning
│   ├── screen-print/       # Ink, mesh, emulsion, press mechanics
│   ├── dtf/                # Direct-to-film: transfers, adhesive, cure
│   ├── embroidery/         # Thread, backing, digitizing
│   └── supply-chain/       # S&S, alphabroder, PromoStandards, lead times
│
├── market/                 # Competitors, customers, UX patterns
│   ├── _index.md
│   ├── competitors/        # Per-competitor analysis files
│   ├── consumer/           # Customer mental models, pain points, workflow observations
│   └── ux-patterns/        # UI/UX patterns observed across peer tools
│
├── domain/                 # DDD domain knowledge (not product decisions)
│   ├── _index.md
│   ├── garments/
│   ├── pricing/
│   └── screens/
│
├── product/                # Per-vertical product decisions and scope
│   ├── _index.md
│   ├── customers/
│   ├── dashboard/
│   ├── invoices/
│   ├── jobs/
│   └── quotes/
│
├── learnings/              # Engineering gotchas and patterns (append-only)
│   ├── _index.md
│   ├── financial/          # Money arithmetic, big.js, rounding
│   ├── architecture/       # Clean arch, layer violations, ESLint rules
│   ├── mobile/             # Breakpoints, touch targets, safe area
│   ├── typing/             # TypeScript, Zod, interface vs type
│   ├── ui/                 # Radix, shadcn, Tailwind gotchas
│   └── deployment/         # Vercel, git worktrees, CI
│
├── strategy/               # Cooldowns and planning docs (append-only)
│   └── _index.md
│
├── tools/                  # Dev tool documentation (living)
│   └── _index.md
│
└── pipelines/              # Session records (append-only)
    └── _index.md
```

---

## What NOT to Store Here

- **Operating rules** → `CLAUDE.md` (AI session rules) or root `docs/` (architecture, roadmap)
- **In-progress work** → `.session-context.md` scratchpad in the worktree
- **Code comments** → the source files themselves
- **Speculative future ideas** → GitHub issues, not KB
- **Duplicate of root docs** — if it's a rule, it belongs in CLAUDE.md, not here
