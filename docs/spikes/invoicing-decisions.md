# Invoicing Vertical — Decision Record

> **Context**: Decisions made during user interview for invoicing vertical
> **Date**: 2026-02-10
> **Branch**: `session/0210-invoicing-research`
> **Participants**: 4Ink owner (via proxy), research team lead

---

## Summary of All Decisions

| #   | Decision                    | Answer                              | Rationale                                                 |
| --- | --------------------------- | ----------------------------------- | --------------------------------------------------------- |
| 1   | Current invoicing state     | QuickBooks (manual entry)           | Eliminating double-entry is the core value prop           |
| 2   | Line item display           | Configurable per invoice            | Toggle between itemized and bundled views                 |
| 3   | Deposit policy              | Varies by customer                  | Smart defaults from tier + history                        |
| 4   | Accounting software         | QuickBooks (Online or Desktop TBD)  | Need to confirm with Chris                                |
| 5   | Quote-to-invoice conversion | Manual one-click                    | Allows production changes before invoicing                |
| 6   | Payment processor           | Square (4Ink's existing processor)  | Don't fix what isn't broken                               |
| 7   | Customer-facing view        | Separate vertical (customer portal) | All external views handled in portal vertical             |
| 8   | Progress billing            | Deposit + final only                | Single invoice, deposits as partial payments              |
| 9   | Deposit UX                  | Smart default with manual override  | % or flat amount, driven by customer context              |
| 10  | Invoice numbering           | Match QuickBooks scheme             | Ensures clean sync when integrated                        |
| 11  | Read receipts               | Phase 2 (with customer portal)      | Build status infrastructure now                           |
| 12  | Change tracking             | Lightweight diff log                | Track quote-to-invoice divergence internally              |
| 13  | Payment reminders           | Gentle cadence                      | 3 days before, on due, 3/7 days overdue                   |
| 14  | Late fees                   | Yes, configurable per customer      | Auto-calculate, separate line item                        |
| 15  | Credit memos                | Formal CM documents                 | Linked to original invoice, needed for QB sync            |
| 16  | Phase 1 scope               | Full internal flow                  | Schema + list + detail + create + payments + customer tab |
| 17  | Customer-furnished garments | Supported                           | Print/setup only, no garment charge                       |
| 18  | Multi-state tax             | Mostly IN, some KY                  | Tax rate per invoice (not hardcoded)                      |
| 19  | AR aging                    | Stats bar on list page              | Detailed report deferred to reporting vertical            |

---

## Decision Details

### 1. Single Invoice with Partial Payments (Not Two Separate Invoices)

**Context**: Research recommended two separate invoices (deposit + final) as the "accounting textbook" approach. User pushed back — wanted linked tracking, not independent documents.

**Decision**: Single invoice for the full amount. Deposits recorded as partial payments. The invoice shows balance due that updates automatically.

**Example Timeline:**

```
Step                    Status          Balance Due
─────────────────────────────────────────────────────
Invoice created         Draft           $1,000
Invoice sent            Sent            $1,000
Deposit received ($500) Partial         $500
Production happens      Partial         $500
Final payment ($500)    Paid            $0
```

**Why**: Simpler mental model. One document, one status, one place to look. QuickBooks handles partial payments natively.

### 2. Smart Deposit Defaults

**Context**: User wants an automated, intelligent deposit recommendation rather than a fixed percentage.

**Decision**: Default deposit amount driven by:

- **Customer tier** (standard/preferred/contract/wholesale) sets baseline %
- **Payment history** (revenue, on-time record) can adjust recommendation
- **Contract terms** — contract customers may have fixed negotiated amounts

**Schema additions needed on customer:**

- `defaultDepositPercent` — baseline from tier
- `contractDepositAmount` — override for contract customers

**UX**: Pre-filled "Recommended Deposit" with manual override supporting both percentage and flat dollar amount.

### 3. Square Over Stripe

**Context**: Research recommended Stripe. User informed us 4Ink already uses Square.

**Decision**: Default to Square for payment processing integration (Phase 2+). Only consider Stripe if there's a compelling reason to switch.

**Open question**: Need to verify if 4Ink uses QuickBooks Online or Desktop — affects integration approach significantly.

### 4. Customer Portal Is a Separate Vertical

**Context**: Research proposed customer-facing invoice views as part of the invoicing vertical.

**Decision**: All external/customer-facing views (invoice viewing, payment, approval) will be handled in a dedicated customer portal vertical. The invoicing vertical focuses exclusively on the internal shop-owner experience.

**Implication**: No PDF generation, no customer-facing pages, no "Pay Now" buttons in Phase 1. Those ship when the portal vertical is built.

### 5. Configurable Line Item Display

**Context**: Industry is split between full itemization and bundled pricing. Some customers negotiate when they see itemized costs.

**Decision**: Default to one display mode but allow toggling between itemized and bundled on a per-invoice basis.

**Itemized view**: Every component (garment, print per location, setup, art, rush) as separate lines.
**Bundled view**: One line per garment style with total price, separate lines only for standalone charges (setup, art, rush).

### 6. Lightweight Change Order Tracking

**Context**: Production changes (added garments, rush fees, quantity adjustments) happen between quote acceptance and invoicing.

**Decision**: Track what changed between the original quote and the final invoice as a simple diff visible internally. No formal approval flow or separate change order documents.

**Implementation**: Store the original quote snapshot on the invoice, compute and display the differences.

---

## Open Items for Future Resolution

1. **Confirm QuickBooks version** — Online vs Desktop affects API approach (REST vs QBXML)
2. **Invoice template branding** — Does 4Ink want custom logo/colors on invoices?
3. **Recurring invoices** — Needed for contract customers with monthly orders? (Defer to Phase 2)
4. **Multi-currency** — International customers? (Likely not relevant for IN/KY market)
5. **Commission tracking** — Does 4Ink pay sales commissions? (Defer to reporting vertical)
