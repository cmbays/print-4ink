# Price Matrix — Owner Interview Findings

**Date**: 2026-02-10
**Interviewee**: 4Ink shop owner (Chris)
**Purpose**: Eliminate ambiguity before breadboarding the Price Matrix vertical

---

## Architecture Decisions

| Decision | Answer | Rationale |
|----------|--------|-----------|
| **Nav location** | Settings (full config) + peek/shortcut from Quotes | Pricing is configured once, used via quotes daily |
| **Service types in Phase 1** | Screen Print + DTF (separate matrices) | DTF is common enough to include; fundamentally different pricing model |
| **Users / permissions** | Single user, no permission system | "I just tell them not to change the pricing" |
| **Pricing change frequency** | Situational (event-triggered, not scheduled) | Version history is P2, not P1 |
| **PrintLife import** | Not feasible (no export exists) | Pivot to exceptional wizard UX with smart defaults |
| **CSV import** | Phase 2 feature | Useful for power users but not critical for demo |

---

## Screen Print Pricing Matrix

### Current Workflow
- Uses PrintLife matrix for auto-calculation
- Pricing structures are **ad hoc** — no formal organized rate sheets
- All four primary dimensions matter: quantity, colors, locations, garment type
- Also has special pricing for: loyalty, schools/non-profits, contract customers

### Pricing Dimensions (All Active)
1. **Quantity tiers** — Industry defaults (12, 24, 48, 72, 144+), must be fully customizable (add/remove breakpoints, adjust starting tier)
2. **Color count** — Per-color hit rate, 1–8+ colors
3. **Print locations** — Front (base), back, sleeves, pocket with per-location upcharges
4. **Garment type** — T-shirts vs. hoodies vs. hats with different base pricing

### Customer Pricing Tiers
| Tier | Description | Pricing Model |
|------|-------------|---------------|
| **Standard** | Default for new/walk-in customers | Base matrix pricing |
| **Contract** | Own rate structure entirely | Separate pricing template |
| **Schools/non-profits** | Negotiated per-customer | Custom overrides |
| **Loyalty/repeat** | Modest discount for repeat customers | Percentage discount off standard |

- **5–15 customers** currently have some form of special pricing
- **Tag→template mapping**: Customer type tags auto-select pricing templates
  - e.g., `sports-school` tag → school pricing template
  - Ties into existing `customerTypeTagEnum` and `pricingTierEnum` in schema

### Cost Breakdown (for Margin Visibility)
Must break out separately:
- **Garment cost** — from catalog (currently in PrintLife, needs recreation)
- **Ink cost** — per-color hit rate, broken out from everything else
- **Shop overhead** — labor, screens, supplies lumped as configurable rate

Nice to have:
- **Labor** — if easy to set up once (hourly rate × estimated time)

**Margin = Revenue - (Garment + Ink + Overhead)**

### Setup Fees
- PrintLife handles this transparently — Chris isn't sure exactly how it breaks out
- We should make setup fees transparent but simple to configure
- Must support: per-screen fees, bulk waiver rules, reorder discounts

---

## DTF Pricing Matrix

### Structure
- **Sheet-size based** — fixed 22" width, variable length
- Fundamentally different from screen print (not per-piece qty × colors × locations)
- **Separate matrix** from screen print (not tabs within same matrix)

### Current 4Ink Retail Pricing
| Size | Price |
|------|-------|
| 22"x24" | $18 |
| 22"x48" | $27 |
| 22"x76" | $42 |
| 22"x100" | $57 |
| 22"x136" | $77 |
| 22"x164" | $92 |
| 22"x194" | $110 |
| 22"x219" | $124 |
| 22"x240" | $138 |

- These are **customer-facing retail prices**, not production cost
- Contract pricing also available (separate tier)
- Production costs are lower — margin visibility needed here too

### DTF Pricing Dimensions (from research)
1. Sheet length (primary)
2. Customer tier (retail / bulk / contract)
3. Rush fees (standard / 2-day / next-day / same-day)
4. Film type (standard / glossy / metallic / glow)
5. Volume discounts (quantity of sheets)

### Phase 1 Scope
- **Pricing lookup only** — sheet size → price with customer tier
- No gang sheet builder (drag-and-drop layout tool)
- No customer-facing calculator
- Margin indicators based on production cost per sheet size

---

## Quote Integration

| Feature | Detail |
|---------|--------|
| **Auto-fill** | Matrix auto-calculates all line item pricing |
| **Manual override** | Owner can change any price on any quote |
| **Manual discounts** | Both percentage-based and flat/nominal amounts |
| **Quick adjust from quote** | Two options: "override just this quote" OR "update the matrix for everyone" |
| **Matrix peek** | Internal-only view of relevant pricing matrix from within a quote |

---

## Demo Must-Haves (All Four Are P0)

All four are equally critical — none can be cut:

1. **Margin visibility** — green/yellow/red per cell with cost breakdown tooltip
2. **5-minute setup** — wizard with industry template defaults
3. **What-if scenarios** — sandbox mode (experiment freely) + side-by-side comparison (current vs. proposed)
4. **Quote integration** — matrix feeds quotes automatically with correct pricing

---

## Template System

- Save multiple pricing templates (standard, contract, schools, etc.)
- **Tag→template mapping**: Attach a pricing template to a customer type tag
  - When quoting a customer with tag "sports-school", auto-apply school template
- Industry template always viewable and selectable as starting point
- Duplicate templates for seasonal variations

---

## Existing Schema Hooks

Already in codebase and ready to wire into:

- `customerTypeTagEnum`: `retail`, `sports-school`, `corporate`, `storefront-merch`, `wholesale`
- `pricingTierEnum`: `standard`, `preferred`, `contract`, `wholesale`
- `garmentCatalogSchema`: has `basePrice` (garment wholesale cost)
- `quoteLineItemSchema`: has `unitPrice`, `lineTotal`, `printLocationDetails` with `setupFee`
- `discountSchema`: has `label`, `amount`, `type` (manual/contract/volume)

---

## What-If Scenarios UX

- **Sandbox mode**: Enter testing mode, make changes freely, Save or Discard when done
- **Compare view**: Side-by-side current pricing vs. proposed, with margin impact highlighted
- Both modes available

---

## Wizard Setup Approach

- Start from **industry template** with smart defaults (always viewable/selectable)
- ~~PrintLife import~~ → Not feasible, no export exists
- CSV import → Phase 2
- All defaults editable — user tweaks to match their shop
- Visual preview as you build

---

*Interview complete. Ready for breadboarding.*
