# Industry Collection — Agent Guide

> This file is for agents. Astro ignores `_`-prefixed files and will not load it as content.

## What belongs here

Knowledge about the **screen-print and garment industry** that is true independent of our software.
This is ground truth about the physical world: how inks behave, what suppliers offer, how garments
are sized, what standards exist. None of this references our product or code.

**Good deposit candidates:**

- Garment fabric weights, sizing standards, brand tier positioning
- Screen-print ink chemistry, mesh counts, emulsion types, cure temperatures
- DTF transfer specs, adhesive activation temps, substrate compatibility
- Embroidery thread counts, backing types, digitizing rules of thumb
- S&S Activewear / alphabroder API behaviors, PromoStandards protocol details
- Industry terminology that agents should know when reading user messages

**Does NOT belong here:**

- How our domain model represents garments → `domain/garments/`
- Why we chose S&S over another supplier → `product/` or `strategy/`
- S&S API integration code patterns → `tools/`

## Subdirectory guide

| Subdir          | Contents                                                                                                                      |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `garments/`     | Fabric specs (cotton, poly, tri-blend), sizing conventions, brand tiers (Gildan vs Bella+Canvas vs Next Level), care labels   |
| `screen-print/` | Mesh counts per ink type, emulsion chemistry, press mechanics, ink (plastisol vs water-base vs discharge), color separation   |
| `dtf/`          | Transfer sheet specs, adhesive powder, heat press temps and dwell times, substrate compatibility, color gamut vs screen-print |
| `embroidery/`   | Thread (rayon vs poly vs metallic), backing types, pull compensation, minimum stitch counts, digitizing rules                 |
| `supply-chain/` | S&S / alphabroder merger context, PromoStandards protocol, GTIN/UPC as cross-reference key, inventory feeds, lead times       |

## Mutation model

**Living docs.** When new industry knowledge is discovered:

1. Read the existing file
2. Identify the sections that need updating
3. Rewrite those sections coherently — no raw notes appended at bottom
4. Update `lastUpdated` in frontmatter

## Naming convention

```
{subdir}/{topic}.md

Examples:
  garments/fabric-weights.md
  screen-print/mesh-counts.md
  dtf/heat-press-parameters.md
  supply-chain/ss-activewear-api.md
```

## Frontmatter template

```yaml
---
title: 'Topic Name'
type: 'overview' # overview | reference | standards
status: 'current' # current | draft | deprecated
lastUpdated: YYYY-MM-DD
---
```
