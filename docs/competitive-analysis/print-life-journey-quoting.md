---
title: "Print Life Quoting Journey Map"
description: "Detailed step-by-step journey map of Print Life's quoting workflow with friction points, alternatives, and interconnections"
category: competitive-analysis
status: ready-for-build
phase: 1
created: 2026-02-08
---

# Print Life — Quoting Journey Map

**Purpose**: Visual and detailed documentation of Print Life's quoting workflow to identify friction points and improvement opportunities

**Status**: To be filled in after Chris's Print Life trial and interview

---

## Journey Overview

### Simple Quote: 1 Garment, 1 Color, 50 Units

**Estimated Current State**:
- Clicks: 13-20
- Time: 3-5 minutes
- Friction Level: Medium
- Primary Pain Points: [To be identified after trial]

### Complex Quote: 3 Garments, 2 Colors, Size Breakdown, Multiple Locations

**Estimated Current State**:
- Clicks: 25-35
- Time: 8-12 minutes
- Friction Level: High
- Primary Pain Points: [To be identified after trial]

---

## Detailed Journey: Simple Quote

```
START: User has customer inquiry, needs to create quote
  ↓
STEP 1: [Screen name/action]
  • What user sees: [description]
  • What user does: [action]
  • Friction: [e.g., "Have to scroll to find button"]
  • Time: ~30 seconds
  ↓
STEP 2: [Screen name/action]
  • What user sees: [description]
  • What user does: [action]
  • Friction: [none/minor/major]
  • Time: ~[estimate]
  ↓
... (repeat for each step)
  ↓
END: Quote saved/sent, ready for customer review
```

### Actual Journey (to be filled in)

**[Complete after trial]**

---

## Detailed Journey: Complex Quote

```
START: Multi-line quote with garments, colors, sizes, print locations
  ↓
STEP 1: [Screen name/action]
  ... (repeat pattern above)
  ↓
END: Complex quote saved/sent
```

### Actual Journey (to be filled in)

**[Complete after trial]**

---

## Friction Point Inventory

| # | Friction Point | Step(s) | Severity | Why It Matters | Suggested Fix |
|---|---|---|---|---|---|
| 1 | [e.g., "Modal for garment selection"] | Step 2-3 | High | Breaks flow, requires scroll/search | Single-page layout, search-on-type |
| 2 | [e.g., "Manual price entry per line"] | Step 5-6 | High | Error-prone, time-consuming | Auto-calc from quantity/colors/locations |
| 3 | [e.g., "Unclear size field labels"] | Step 4 | Medium | Users confused by S/M/L vs. unit count | Clear layout with column headers |
| — | — | — | — | — | — |

---

## Interconnections with Other Workflows

### Quote → Job Conversion
- **Current**: [How does accepted quote become a job?]
- **Data flow**: Quote #, Customer, Garments, Pricing → Job
- **Pain point**: [Any friction in this handoff?]

### Quote → Invoice
- **Current**: [How does quote generate invoice?]
- **Data flow**: [Which fields carry over?]
- **Pain point**: [Any missing data?]

### Quote → Reporting
- **Current**: [What quote data is tracked for reporting?]
- **Data flow**: Quote totals → Revenue dashboard?
- **Pain point**: [Any missing insights?]

### Customer Data in Quoting
- **Current**: [How do you select/create customer in quote?]
- **Ease of use**: [Easy dropdown or painful lookup?]
- **Pain point**: [Any friction here?]

---

## Alternative Workflows Observed

### Editing a Quote
- **Current flow**: [Steps to edit existing quote]
- **Pain**: [Any friction?]

### Duplicating a Quote
- **Current flow**: [Does Print Life support this?]
- **Use case**: [When would 4Ink use this?]

### Sending Quote to Customer
- **Current flow**: [How does quote reach customer?]
- **Options**: PDF email, customer portal link, both?
- **Pain**: [Any friction in transmission?]

### Customer Accepting Quote
- **Current flow**: [Does customer click "Accept" in Print Life, or external process?]
- **Next step**: [Does quote auto-convert to job?]

---

## Click-by-Click Walkthrough

### Simple Quote (to be measured)

```
Click 1: Navigate to Quotes section
Click 2: Click "New Quote" button
Click 3: Search for customer [Type name]
Click 4: Select customer from dropdown
Click 5: Click "Add Line Item" button
Click 6: [Open garment modal/dropdown?]
Click 7: Search for/select garment [Type SKU or style]
Click 8: Confirm garment selection
Click 9: Enter quantity [Type "50"]
Click 10: [Enter size breakdown? Open modal?]
Click 11-[X]: [Continue for colors, print locations, pricing]
Click [X]: Click "Save" or "Save & Send"
END: Quote saved
```

**Actual walkthrough to be filled in after trial**

---

## Time Distribution

**Simple Quote Breakdown** (estimated):
- Customer selection: 15-30 seconds
- Garment selection: 30-60 seconds
- Quantity/size entry: 30-60 seconds
- Print locations & colors: 30-60 seconds
- Pricing entry: 30-60 seconds
- Review & save: 15-30 seconds
- **Total: 3-5 minutes**

**Complex Quote Breakdown** (estimated):
- Customer selection: 15-30 seconds
- Add line item 1: 2-3 minutes (× 3 items)
- Setup fees: 30-60 seconds
- Review & save: 30-60 seconds
- **Total: 8-12 minutes**

**Actual breakdown to be measured after trial**

---

## Success Metrics for Redesign

| Metric | Current (Print Life) | Target (Screen Print Pro) | Improvement |
|--------|---|---|---|
| Simple quote clicks | 13-20 | 10-12 | 20-30% reduction |
| Simple quote time | 3-5 min | 2-3 min | 30-40% faster |
| Complex quote clicks | 25-35 | 18-25 | 20-30% reduction |
| Complex quote time | 8-12 min | 5-7 min | 30-40% faster |
| User confusion (subjective) | High | Low | Clear UX |
| Real-time feedback (pricing, totals) | No | Yes | Better visibility |

---

## Handoff to Designers

**Key Design Principles from Analysis**:
1. [Principle 1: derived from friction points]
2. [Principle 2: derived from interconnections]
3. [Principle 3: derived from time analysis]

**Must-Haves for New Design**:
- [ ] [Feature 1]
- [ ] [Feature 2]
- [ ] [Feature 3]

**Nice-to-Haves**:
- [ ] [Feature 1]
- [ ] [Feature 2]

---

## Related Documents

- `docs/competitive-analysis/print-life-quoting-analysis.md` (feature analysis)
- `docs/strategy/quoting-discovery-interview-questions.md` (interview guide)
- `docs/strategy/screen-print-pro-journey-quoting.md` (improved journey design)
- `.claude/plans/vertical-by-vertical-strategy.md` (overall strategy)
