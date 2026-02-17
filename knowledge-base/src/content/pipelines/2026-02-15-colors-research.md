---
title: "Colors — UX Research: Hierarchical Settings Inheritance"
subtitle: "Industry best practices for cascading color preferences across global, supplier, and customer levels"
date: 2026-02-15
phase: 1
pipelineName: colors
pipelineType: vertical
products: [customers]
domains: [garments]
tools: []
stage: research
tags: [research, decision]
sessionId: "08cc4e02-a47a-42b3-b9c9-d47e392c498b"
branch: "session/0215-color-prefs"
status: complete
---

## Summary

Researched UX best practices for hierarchical/cascading settings inheritance to inform the design of a 3-level color preference system (Global > Supplier/Brand > Customer). Analyzed patterns from 10+ products across multiple industries. Key finding: Figma-style live inheritance with per-item override preservation is the strongest fit for a screen-printing shop context.

## Research Scope

The core UX challenge: when a shop owner edits a parent-level setting (e.g., adds a new global favorite color), what should happen to child levels (suppliers, customers) that already have their own customized settings?

## Key Patterns Analyzed

### 1. Live Inheritance with Override Preservation (Figma)

The main component is the source of truth. Instances inherit all properties. When the main component changes, all instances update automatically — EXCEPT for properties that have been explicitly overridden. Overrides are preserved through parent updates.

- Parent adds new property: flows to all instances automatically
- Parent changes non-overridden property: flows to all instances
- Parent changes overridden property: instance keeps its override
- Instance can "reset" any override to re-inherit from parent

**Verdict**: Best fit for color preferences. Intuitive mental model for non-technical users.

### 2. Figma Variables / Design Tokens

Extended Collections let you create a collection based on another and override specific values. Overridden values highlighted in blue with "Reset change" action. Clean visual differentiation between inherited and overridden.

**Verdict**: "Blue highlight for overrides" and "Reset change" patterns directly applicable.

### 3. CSS Cascade

Properties cascade from parent to child. More specific selectors override less specific. The `revert` keyword maps to "reset to parent defaults." Battle-tested model, but vocabulary needs translation for non-technical users.

### 4. Salesforce Permissions (Additive Only)

Permissions are purely additive — can only grant more, never restrict. When a Permission Set is updated, changes propagate through recalculation to all groups.

**Verdict**: Too limiting. Can't represent "this customer does NOT want this color."

### 5. Google Workspace OU Settings

Each setting labeled "Inherited" or "Overridden" with clear visual text. Toggle between "Override" and "Inherit" per setting.

**Verdict**: The labeling pattern and toggle are ideal for non-technical users.

### 6. CrashPlan Push vs. Lock

Two distinct propagation modes:
- **Push**: Changes the setting on children, but they can change it later (soft propagation)
- **Lock**: Pushes and prevents children from changing it (hard enforcement)

**Verdict**: Excellent fit. Maps to "Add this color to all customers" (push) vs. "Require this color" (lock).

### 7. Unity Editor Override Bar

Colored vertical bar on the left margin of overridden properties. Bolded label. Right-click for Compare, Revert, or Apply to Parent.

**Verdict**: Strong progressive disclosure pattern for showing provenance.

### 8. Beth Meyer's Settings Inheritance Pattern

Section-level toggle: "Use Site Defaults" (inherit) / "Use Custom Settings" (override). When overriding, fields become editable. Organization defaults shown as read-only reference below.

**Verdict**: Best fit for the main interaction model. Directly maps to "Use global colors" / "Customize colors for this customer."

### 9. WordPress Parent/Child Themes (Anti-Pattern)

Child theme settings are completely isolated from parent. No live inheritance. Users lose all customizations when switching themes.

**Verdict**: Anti-pattern. Explicitly what NOT to do.

### 10. Microsoft Dataverse (Over-Engineering)

6 cascade options per action type (All, Active, User-Owned, None, Remove Link, Restrict). Designed for system administrators.

**Verdict**: Too complex for shop owners. Binary inherit/customize is sufficient.

## Industry Propagation Consensus

| Change Type | Industry Standard | Rationale |
|---|---|---|
| Additive (parent adds) | Auto-propagate to all children | Low risk, children gain a new option |
| Modification (parent changes) | Auto-propagate to non-overridden children | Medium risk, respect explicit overrides |
| Removal (parent removes) | Require confirmation + show impact | High risk, may break active workflows |

This asymmetry is consistent across Figma, CSS, Unity, and Google Workspace.

## NNg Confirmation Dialog Guidelines

- Don't overuse confirmations — users stop paying attention
- Be specific about what will happen
- Reserve for destructive actions only
- Provide undo as a safety net beyond the dialog

**Application**: Only show confirmation for removals at parent level. Never for additive changes.

## Print/Promo Industry Color Management

### DecoNetwork
Palettes created at system level, assigned to specific stores. Flat model (assign palette X to store Y), no hierarchical inheritance.

### Printavo / Industry Practice
Shops standardize on ~44 PMS colors, create physical color cards, hang in shop. Customer preferences tracked through job notes and tribal knowledge.

**Key finding**: No competitor has a hierarchical color preference system. This is genuinely novel and differentiating.

### Swatch Display (Baymard Institute)
All color swatches should be visible on mobile — 57% of sites fail at this. Flat swatch grids scan faster than grouped layouts for visual properties.

## Recommended Architecture

**Live Inheritance with Override Preservation** (Figma model) combined with:
- **Beth Meyer toggle** at each level ("Use parent colors" / "Customize")
- **CrashPlan push** for propagation controls (soft propagation by default)
- **Unity override bar** concept for progressive disclosure of provenance
- **NNg guidelines** for confirmation only on removals
- **Flat swatch grid** as default display (Baymard + Gary preference)

## Sources

- [Figma Component Overrides](https://www.figma.com/blog/figma-feature-highlight-component-overrides/)
- [Figma Variable Mode Inheritance](https://help.figma.com/hc/en-us/articles/15343816063383-Modes-for-variables)
- [Grammarly Engineering — Demystifying Figma Variables](https://www.grammarly.com/blog/engineering/demystifying-figma/)
- [Unity Foundations — Inheritance Pattern](https://www.foundations.unity.com/patterns/inheritance)
- [GitLab Docs — Cascading Settings](https://docs.gitlab.com/development/cascading_settings/)
- [GitLab Pajamas — Settings Management](https://design.gitlab.com/patterns/settings-management/)
- [Google Workspace — Organizational Structure](https://support.google.com/a/answer/4352075)
- [CrashPlan — Configure Device Backup Settings](https://support.crashplan.com/hc/en-us/articles/8686993872269)
- [PRTG — Inheritance of Settings](https://www.paessler.com/manuals/prtg/inheritance_of_settings)
- [NNg — Confirmation Dialogs](https://www.nngroup.com/articles/confirmation-dialog/)
- [Microsoft Dataverse — Cascading Behavior](https://learn.microsoft.com/en-us/power-apps/developer/data-platform/configure-entity-relationship-cascading-behavior)
- [Beth Meyer — Conveying Inheritance in Settings](https://drbethmeyer.tumblr.com/post/92086472024/design-pattern-conveying-inheritance-in-settings)
- [Baymard Institute — Mobile Interactive Color Swatches](https://baymard.com/blog/mobile-interactive-color-swatches)
- [DecoNetwork — Screen Printing Designer Settings](https://help.deconetwork.com/hc/en-us/articles/115001079228)
- [WordPress Trac #27177 — Child themes should inherit parent settings](https://core.trac.wordpress.org/ticket/27177)
- [Salesforce — Permission Set Groups](https://admin.salesforce.com/blog/2019/introducing-the-next-generation-of-user-management-permission-set-groups)
