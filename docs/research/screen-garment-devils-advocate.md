# Devil's Advocate: Screen Room & Garment Catalog Vertical Discovery

> **Thesis**: The ROADMAP calls these "simple" builds. They are not. Below is the evidence.

---

## 1. Assumptions Challenged

### Screen Room

**Assumption 1: "Simple data table + status badges"**

**Challenge**: The Jobs vertical was also described as a "list page" in the original IMPLEMENTATION_PLAN (Step 2: "Implement DataTable with columns"). It ended up as a **4,293-line monster** with a full Kanban board, drag-and-drop via dnd-kit, 3 card types, capacity strips, lane glow animations, block reason dialogs, scratch notes, and 20+ components. The IMPLEMENTATION_PLAN Step 8 describes Screen Room in 6 bullet points. The Jobs list was also 7 bullet points — and it took 3 PRs (#58, #64, #77) to ship.

**Evidence**: Compare IMPLEMENTATION_PLAN Step 8 (Screen Room, 6 tasks) vs Step 2 (Jobs List, 7 tasks). Jobs shipped at 60x the anticipated complexity.

---

**Assumption 2: "Burn status is just 3 states"**

**Challenge**: The `burnStatusEnum` has 3 values: `pending`, `burned`, `reclaimed`. But the CLAUDE.md domain context says the screen lifecycle is: `New -> Coated -> Burned -> In Use -> Needs Reclaim -> Reclaimed -> Ready`. That's **7 states**, not 3. The schema is incomplete for what the domain actually needs.

**Evidence from CLAUDE.md**: "Screen Room: Track mesh count, emulsion type, burn status per screen, linked to jobs." But the domain context says "Production States: design -> approval -> burning -> press -> finishing -> shipped" — which implies screens move through a parallel lifecycle alongside jobs.

**Risk**: If we build with 3 states and Gary sees it, he'll immediately ask "where's the 'in use' status?" and "how do I know which screens need to be reclaimed after a job finishes?" This means either the schema is wrong (and we need to expand it before building) or the domain model was intentionally simplified for Phase 1 (in which case, we need to know where the line is).

---

**Assumption 3: "5 screens is enough mock data"**

**Challenge**: A real screen-printing shop has **40-100+ physical screens** on the racks at any time. 5 screens doesn't let us test:

- Pagination/scrolling UX
- Filter combinations (mesh count 110 + pending + linked to rush job = 0 results?)
- Grouping patterns (by mesh count? by rack location? by job?)
- The "burn queue" workflow — which screens need burning today?
- Screen utilization patterns — are we running low on 230-mesh screens?

With 5 data points, the table will look empty and feel incomplete. Gary will look at it and think "that's not my screen room."

---

**Assumption 4: "The screen schema is complete"**

**Challenge**: The current `screenSchema` has only 4 fields:

```typescript
{
  id: string (uuid),
  meshCount: number,
  emulsionType: string,
  burnStatus: "pending" | "burned" | "reclaimed",
  jobId: string (uuid)   // REQUIRED — every screen must have a job
}
```

**Missing fields that a screen-printing shop owner would expect:**

- `frameSize` — screens come in different physical sizes (20x24, 23x31, etc.)
- `tension` — measured in N/cm, determines print quality
- `location` / `rackNumber` — "where is this screen right now?"
- `exposureTime` — burn settings per screen
- `lastUsedDate` / `reclaimedDate` — lifecycle tracking
- `notes` — "this screen has a small pinhole on the left side"
- `designName` or `artworkId` — what's burned onto it?
- `createdAt` — when was the screen coated?

**Critical issue**: `jobId` is REQUIRED (not optional). This means every screen MUST be linked to a job. But reclaimed screens aren't linked to any job — they're back in inventory. The schema literally can't represent an available screen. This is a **data model bug** that must be fixed before building.

---

**Assumption 5: "Screens link to jobs, that's it"**

**Challenge**: The actual relationship is more complex:

1. A **job can have multiple screens** (the mock data shows this: job `f1a00001` has 2 screens, job `f1a00003` has 2 screens)
2. A **screen can be reused across jobs** over time (burned → used → reclaimed → re-coated → burned for new job)
3. Screens connect to **print locations** — each location needs a different screen (front print = different screen than back print)
4. Screen count is tracked on jobs (`job.complexity.screenCount`) but there's no validation that the screen records match

The cross-links required are:

- Screen Room → click job link → Job Detail (defined in APP_FLOW)
- Job Detail → show linked screens (NOT defined anywhere — hidden dependency)
- Job tasks reference "Screens burned" and "Screens registered on press" — but there's no connection between the task checklist and actual screen records

---

### Garment Catalog

**Assumption 6: "Grouped display" understates the data model**

**Challenge**: The garment catalog schema (`garmentCatalogSchema`) has 8 fields including:

- `availableColors: string[]` — references color IDs from the 42-entry color table
- `availableSizes: GarmentSize[]` — each with priceAdjustment values
- `basePrice: number` — wholesale cost
- `baseCategory: GarmentCategory` — 5 categories

This is a **3-dimensional product matrix** (style × color × size), not a flat grouped list. Each garment can have 12-21 colors × 7-8 sizes = **84-168 unique SKU combinations**.

A "grouped display" that just shows brand → garment name is useless. The shop owner needs to see:

- Which colors are available for this style?
- What's the size range and pricing?
- What's the base cost vs. what I charge?

---

**Assumption 7: "5 garments is enough mock data"**

**Challenge**: The catalog has only 5 garments across 3 brands. A real shop stocks from **S&S Activewear, SanMar, and Alphabroder** — typical catalogs have 50-200+ active styles. With 5 items, we can't test:

- Brand grouping with multiple items per brand (Bella+Canvas has only 1 item)
- Category filtering across a meaningful dataset
- Search/filter UX (searching 5 items feels silly)
- The visual density of a real catalog page

---

**Assumption 8: "The catalog is purely reference"**

**Challenge**: APP_FLOW.md says: "Expand/click to see which jobs use this garment." That's a reverse lookup — for each catalog garment, show all jobs that reference it. This requires:

1. A `getJobsByGarmentId()` helper (doesn't exist)
2. UI to display job references per garment (job number, customer, status)
3. Potentially click-through to job detail

But there's a deeper question: US-6.2 says "As a shop owner, I want to see which jobs use a particular garment style." Is this just informational, or is it an active workflow? When Gary looks at a garment and sees "3 jobs use Gildan 5000 in Black," does he want to:

- Just know the number? (informational table)
- Click through to those jobs? (cross-linked navigation)
- Start a new quote with that garment? (workflow entry point)
- See inventory levels? (Phase 2 concern bleeding into Phase 1 UX)

---

**Assumption 9: "Garments in the catalog are the same as garments on jobs"**

**Challenge**: There are actually TWO garment schemas:

1. `garmentSchema` (in `garment.ts`) — used on jobs: `{ sku, style, brand, color, sizes }`
2. `garmentCatalogSchema` (in `garment.ts`) — used for catalog: `{ id, brand, sku, name, baseCategory, basePrice, availableColors, availableSizes }`

They are NOT the same shape. The job garment has a flat `color` string, while the catalog garment has `availableColors` array. The job garment has `sizes` as a record of ordered quantities, while the catalog has `availableSizes` with price adjustments.

The mapping between them happens via `garmentId` on `garmentDetailSchema` (in `job.ts`): `{ garmentId: "gc-002", colorId: "clr-black", sizes: { S: 20, M: 60... } }`.

**Hidden dependency**: The job detail page (`JobDetailsSection.tsx`, line 41) currently displays RAW IDs: `gd.garmentId` and `gd.colorId` — not human-readable names! Building the garment catalog forces us to create `getGarmentById()` and `getColorById()` lookup functions, which should ALSO fix the job detail display. This is cross-vertical work that's invisible in the "simple" scope.

---

### Cross-Vertical Challenges

**Assumption 10: "These can be built in isolation"**

**Challenge**: Here's the dependency web:

```
Screen Room
  └─> needs: getJobScreens(jobId)     — NEW reverse lookup
  └─> needs: screen schema expansion   — NEW fields
  └─> needs: 20+ mock screens         — expand mock data
  └─> fixes: Job Detail screen display — currently not shown

Garment Catalog
  └─> needs: getGarmentById(id)        — NEW lookup
  └─> needs: getColorById(id)          — NEW lookup
  └─> needs: getJobsByGarmentId(id)    — NEW reverse lookup
  └─> fixes: Job Detail garment display — currently shows raw IDs
  └─> connects to: Quote form (garment selection already exists there)

Cross-Links (#65-#69)
  └─> #65: Dashboard → Jobs links
  └─> #66: Customer Detail → Jobs links
  └─> #67: Quote → "Create Job" action (complex!)
  └─> #68: Invoice → Job link
  └─> #69: Screen Room build (the whole vertical is one issue)
```

Issue #67 alone ("Create Job from Quote") is a significant piece of work — it requires creating a new job from quote data, auto-populating canonical tasks, navigating to the new job, and updating the quote to show the linked job. This is NOT a simple cross-link.

---

**Assumption 11: "10 hours for both verticals + cross-linking"**

**Challenge**: Let's look at the empirical data:

| Vertical  | Lines of Code | PRs | Components | Estimated Hours |
| --------- | ------------- | --- | ---------- | --------------- |
| Customers | 2,971         | 4   | 16         | ~15-20          |
| Invoicing | 3,648         | 3   | 18         | ~20-25          |
| Quotes    | 4,236         | 4   | 17         | ~20-25          |
| Jobs      | 4,293         | 3   | 23         | ~25-30          |

The "simplest" existing vertical (Customers) was still ~3,000 lines across 16 components. Even a truly simple vertical is 10-15 hours when you include mock data expansion, helper functions, cross-links, testing, and quality gate.

---

## 2. Hidden Complexities Found

### Screen Room

| Complexity                                             | Why It's Hidden                                        | Impact                                                                |
| ------------------------------------------------------ | ------------------------------------------------------ | --------------------------------------------------------------------- |
| Schema is incomplete (3 states vs 7 real states)       | Original schema was written as MVP placeholder         | Requires user decision: ship minimal or expand?                       |
| `jobId` is required but reclaimed screens are unlinked | Data model bug                                         | Must make `jobId` optional before building                            |
| No reverse lookup helpers exist                        | Nobody needed them before                              | Must create `getJobScreens()`, likely `getScreensByStatus()`          |
| Job detail doesn't display linked screens              | Job detail focuses on tasks, not physical assets       | Cross-vertical fix required                                           |
| Burn queue workflow (PRD US-5.1, US-5.2)               | "Filter by status" undersells a prioritized work queue | Sorting by linked job priority/due date needed                        |
| Only 5 mock screens                                    | Original mock data was minimal                         | Need 20-30+ screens across all statuses, multiple jobs                |
| No screen count validation                             | `job.complexity.screenCount` is a manual number        | Should match actual screen records — or at least be rendered together |

### Garment Catalog

| Complexity                                         | Why It's Hidden                                  | Impact                                                                                     |
| -------------------------------------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------ |
| 3D product matrix (style × color × size)           | "Grouped display" implies flat list              | Need expandable cards or nested tables                                                     |
| Color swatch rendering                             | Quote form already has `ColorSwatchPicker`       | Reuse opportunity — but also a component coupling dependency                               |
| Price display (base + size adjustments)            | PRD doesn't mention pricing on catalog           | But garment `basePrice` and `priceAdjustment` are in schema — user will expect to see them |
| Job detail shows raw garment/color IDs             | `JobDetailsSection.tsx` line 41-43               | Building catalog lookup functions MUST fix this                                            |
| Only 5 catalog entries                             | Doesn't represent a real catalog                 | Need 15-20 entries across all categories                                                   |
| `garmentSchema` vs `garmentCatalogSchema` mismatch | Two different shapes for the same domain concept | Developers must understand the mapping                                                     |
| Category filtering across small dataset            | 5 entries across 3 categories = trivial filters  | More mock data needed to make categories meaningful                                        |

---

## 3. Risk Assessment

| #   | Risk                                                               | Category              | Severity | Mitigation                                                                       |
| --- | ------------------------------------------------------------------ | --------------------- | -------- | -------------------------------------------------------------------------------- |
| 1   | Screen schema only has 3 of 7 real burn states                     | **Showstopper**       | High     | Decision: expand schema now or document "Phase 1 simplified" explicitly for Gary |
| 2   | `jobId` is required on screens — can't represent available screens | **Showstopper**       | High     | Make `jobId` optional in schema immediately                                      |
| 3   | Job detail displays raw garment/color IDs                          | **UX Trap**           | High     | Create lookup helpers; fix as part of garment catalog work                       |
| 4   | No `getJobScreens()` reverse lookup                                | **Hidden Dependency** | Medium   | Create helper in mock-data.ts                                                    |
| 5   | No `getGarmentById()` / `getColorById()` lookups                   | **Hidden Dependency** | Medium   | Create helpers; needed by both catalog AND job detail                            |
| 6   | Issue #67 (Quote → Job conversion) is complex                      | **Scope Creep**       | High     | Time-box to 2 hours or defer to separate PR                                      |
| 7   | Mock data is too sparse (5 screens, 5 garments)                    | **UX Trap**           | Medium   | Expand to 20-30 screens, 15+ garments                                            |
| 8   | Screen Room could evolve into a Kanban/pipeline view               | **Scope Creep**       | High     | Explicitly fence Phase 1 as table-only; document pipeline view as Phase 2        |
| 9   | Garment catalog might need to connect to quote form                | **Scope Creep**       | Medium   | Keep catalog read-only in Phase 1                                                |
| 10  | Price display expectations on garment catalog                      | **Scope Creep**       | Low      | Show base price; defer margin/markup to Phase 2                                  |
| 11  | Cross-link #65-#68 seem simple but add up                          | **Scope Creep**       | Medium   | Time-box cross-links to 2 hours total                                            |
| 12  | Quality gate expectations from established patterns                | **Hidden Dependency** | Medium   | Other verticals have 10-category quality gate — these need it too                |
| 13  | Screen lifecycle tracking (last used, reclaim date)                | **Scope Creep**       | High     | Explicitly defer all lifecycle timestamps to Phase 2                             |
| 14  | No screen-to-print-location mapping                                | **Hidden Dependency** | Low      | Document as Phase 2 gap — don't build                                            |
| 15  | Garment inventory concept doesn't exist yet                        | **Scope Creep**       | Medium   | Catalog is NOT inventory — document the distinction clearly                      |

---

## 4. Revised Scope Recommendation

### Screen Room — Minimum Viable Build

**Must do:**

1. Fix schema: make `jobId` optional (screens can exist unlinked)
2. Create `app/(dashboard)/screens/page.tsx` with DataTable
3. Columns: Screen #, Mesh Count, Emulsion Type, Burn Status, Frame Size (add to schema), Linked Job
4. Burn status filter (3 states: pending, burned, reclaimed — keep it simple for Phase 1)
5. Job link → `/jobs/[id]`
6. Empty state
7. Expand mock data to 15-20 screens
8. Create `getJobScreens(jobId)` helper
9. Breadcrumbs

**Explicitly defer:**

- Screen lifecycle beyond 3 states (Phase 2)
- Screen location/rack tracking (Phase 2)
- Burn queue as a separate priority view (Phase 2)
- Job Detail → linked screens section (separate PR, low priority)
- Screen creation/editing forms (Phase 2)
- Screen tension, exposure time, notes (Phase 2 schema expansion)

**Estimated hours: 4-5 hours** (not 2-3)

### Garment Catalog — Minimum Viable Build

**Must do:**

1. Create `app/(dashboard)/garments/page.tsx`
2. Group by brand with expandable sections
3. Per garment: name, SKU, category badge, base price, color count, size range
4. Color swatches per garment (reuse `ColorSwatchPicker` or a simplified read-only version)
5. Expand/click to see jobs using this garment (with links)
6. Category filter tabs (t-shirts, fleece, outerwear, pants, headwear)
7. Create `getGarmentById()` and `getColorById()` helpers
8. Create `getJobsByGarmentId()` reverse lookup
9. Fix `JobDetailsSection.tsx` to display resolved garment names instead of raw IDs
10. Expand mock data to 12-15 garments
11. Breadcrumbs

**Explicitly defer:**

- "Start quote from catalog" workflow (Phase 2)
- Size × color matrix grid view (Phase 2)
- Vendor catalog integration prep (Phase 2)
- Markup/margin display (connects to Price Matrix — Phase 2)
- Image placeholder system (Phase 2)

**Estimated hours: 5-7 hours** (not 2-3)

### Cross-Links — Realistic Scope

| Issue                            | Estimated Hours | Notes                               |
| -------------------------------- | --------------- | ----------------------------------- |
| #65: Dashboard → Job links       | 0.5h            | Simple Link wrappers                |
| #66: Customer Detail → Job links | 0.5h            | onClick + cursor-pointer pattern    |
| #67: Quote → Create Job          | 2-3h            | This is a FEATURE, not a cross-link |
| #68: Invoice → Job link          | 0.5h            | Add row to source info section      |
| #69: Screen Room build           | Covered above   | This IS the vertical                |

**Recommended**: Ship #65, #66, #68 as a quick cross-links PR (1-1.5 hours). Treat #67 as a separate feature with its own scope.

---

## 5. Questions for the Team

### Must-Answer Before Building

1. **Screen burn states**: Should we ship with 3 states (pending/burned/reclaimed) or expand to the full 7-state lifecycle? This affects schema, mock data, and UI design.

2. **Screen schema expansion**: At minimum, `jobId` must become optional. Should we also add `frameSize`? What about `location`/`rackNumber`? Where's the Phase 1 line?

3. **Garment price visibility**: The catalog schema includes `basePrice` and size `priceAdjustment`. Should the catalog page show wholesale prices? Or is pricing strictly a Price Matrix concern?

4. **Job Detail garment display bug**: `JobDetailsSection.tsx` shows raw IDs. Should we fix this as part of the garment catalog build, or track it as separate tech debt?

5. **Quote → Job conversion (#67)**: Is this in scope for the "10 hours" or is it a separate feature? It's the most complex cross-link by far.

6. **Mock data expansion budget**: Expanding from 5→20 screens and 5→15 garments is 1-2 hours of work. Is this within budget?

### Nice-to-Answer

7. **Screen Room as work queue**: Gary will likely want to filter screens by "burn today" based on linked job due dates. Should we pre-build this filter or wait for his feedback?

8. **Garment catalog as workflow entry point**: Should clicking a garment let you start a new quote, or is the catalog strictly browse-only?

9. **Demo timing**: Should we demo the existing 5 verticals to Gary BEFORE building Screen Room + Garments? His feedback might reshape what we build.

---

## 6. Honest Time Estimate

### If scope is contained (recommended):

| Work Item                                                    | Hours      | Risk                                      |
| ------------------------------------------------------------ | ---------- | ----------------------------------------- |
| Screen Room (schema fix + table + mock data)                 | 4-5h       | Low if scope held                         |
| Garment Catalog (grouped display + lookups + job detail fix) | 5-7h       | Medium — swatch rendering may take longer |
| Cross-links #65, #66, #68 (simple)                           | 1-1.5h     | Low                                       |
| Cross-link #67 (Quote → Job)                                 | 2-3h       | Medium — multiple state changes           |
| Mock data expansion                                          | 1-2h       | Low                                       |
| Quality gate + polish                                        | 1-2h       | Low                                       |
| **Total**                                                    | **14-20h** |                                           |

### Bottom line: 10 hours is NOT realistic for the full scope.

**To fit in 10 hours, you must cut:**

- Defer #67 (Quote → Job conversion) — saves 2-3h
- Minimal garment catalog (no color swatches, just text list) — saves 2-3h
- Skip mock data expansion (ship with 5 screens, 5 garments) — saves 1-2h
- Skip Job Detail garment ID fix — saves 1h

**Stripped-down 10-hour scope:**

1. Screen Room: basic table with 3-state filter, 5 screens (4h)
2. Garment Catalog: brand-grouped text list, no swatches, 5 garments (3h)
3. Cross-links #65, #66, #68 (1.5h)
4. Buffer (1.5h)

But this "stripped-down" version will feel unfinished when Gary sees it. The Job Detail page will still show raw garment IDs. The screen room will have 5 screens when his shop has 60. The catalog won't show colors.

**My recommendation**: Budget 15-18 hours. Do it properly. The cost of re-work after a bad first demo is higher than the cost of doing it right the first time. These verticals are the LAST thing Gary sees before forming his opinion of the product.
