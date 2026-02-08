# Playground Audit Protocol

**Last Updated**: 2026-02-04
**Status**: Active
**Purpose**: Systematic quality checklist for playground UI review

---

## Overview

This protocol defines the systematic audit process for evaluating playground UI implementations. Every playground must pass this audit before being considered production-ready.

**Philosophy**: "Linear calm + Raycast polish + Neobrutalist delight"

---

## Pre-Audit Requirements

Before running the audit, ensure:

- [ ] FRONTEND_GUIDELINES.md has been read and internalized
- [ ] APP_FLOW exists for this playground (or create one first)
- [ ] Playground loads without console errors
- [ ] All interactive features are functional

---

## The 15-Point Audit

### Visual Quality (1-5)

#### 1. Visual Hierarchy

| Question | Pass Criteria |
|----------|---------------|
| Does the eye land where it should? | Primary action is most prominent |
| Is the most important element obvious? | No competing elements at same visual weight |
| Can a user understand the screen in 2 seconds? | Purpose is immediately clear |

**Token Check**: Are heading sizes using `--text-2xl`, `--text-xl`, `--text-lg` hierarchy?

#### 2. Spacing & Rhythm

| Question | Pass Criteria |
|----------|---------------|
| Is whitespace consistent and intentional? | All spacing uses `--space-*` tokens |
| Do elements breathe or are they cramped? | Minimum `--space-4` between sections |
| Is vertical rhythm harmonious? | Consistent gaps throughout |

**Token Check**: No hardcoded pixel values for margins/padding.

#### 3. Typography

| Question | Pass Criteria |
|----------|---------------|
| Are type sizes establishing clear hierarchy? | Max 3-4 distinct sizes per screen |
| Are there too many font weights competing? | Max 3 weights (regular, medium, semibold) |
| Does the type feel calm or chaotic? | Inter for UI, JetBrains Mono for code only |

**Token Check**: All text uses `--text-*` and `--leading-*` tokens.

#### 4. Color

| Question | Pass Criteria |
|----------|---------------|
| Is color used with restraint and purpose? | Base layer is monochrome |
| Do colors guide attention or scatter it? | Status colors only for communication |
| Is contrast sufficient for accessibility? | WCAG AA minimum (4.5:1 for text) |

**Token Check**: Colors use `--color-*` tokens, no hex/rgb literals.

#### 5. Alignment & Grid

| Question | Pass Criteria |
|----------|---------------|
| Do elements sit on a consistent grid? | Visual alignment at all edges |
| Is anything off by 1-2 pixels? | Pixel-perfect alignment |
| Does every element feel locked into the layout? | No floating or misaligned items |

---

### Component Consistency (6-8)

#### 6. Components

| Question | Pass Criteria |
|----------|---------------|
| Are similar elements styled identically? | Same component = same styles everywhere |
| Are interactive elements obviously interactive? | Cursor changes, hover states present |
| Are all states accounted for? | Disabled, hover, active, focus all styled |

**Token Check**: Buttons use `.btn`, `.btn-primary` patterns from guidelines.

#### 7. Iconography

| Question | Pass Criteria |
|----------|---------------|
| Are icons consistent in style and weight? | All from same icon set |
| Are they consistent in size? | Icons use standard sizes (16px, 20px, 24px) |
| Do they support meaning or just decorate? | Every icon has purpose |

**Standard**: Use Lucide icons via CDN.

#### 8. Motion & Transitions

| Question | Pass Criteria |
|----------|---------------|
| Do transitions feel natural and purposeful? | Use `--transition-*` tokens |
| Is there motion that exists for no reason? | Remove decorative animations |
| Does the app feel responsive to interaction? | Immediate feedback on click/hover |

**Token Check**: Respects `prefers-reduced-motion`.

---

### State Handling (9-11)

#### 9. Empty States

| Question | Pass Criteria |
|----------|---------------|
| What does every screen look like with no data? | Intentional empty state designed |
| Do blank screens feel intentional or broken? | Clear messaging, not just blank |
| Is the user guided toward their first action? | CTA present in empty state |

#### 10. Loading States

| Question | Pass Criteria |
|----------|---------------|
| Are loading indicators consistent? | Same spinner/skeleton everywhere |
| Does the app feel alive while waiting? | Visual feedback during operations |
| Are long operations handled? | Progress indication for >2s operations |

#### 11. Error States

| Question | Pass Criteria |
|----------|---------------|
| Are error messages styled consistently? | Use `--color-error` token |
| Do they feel helpful and clear? | Plain language, actionable guidance |
| Are error messages accessible? | `role="alert"` or `aria-live` |

---

### Responsive & Accessible (12-15)

#### 12. Dark Mode / Theming

| Question | Pass Criteria |
|----------|---------------|
| Is dark mode actually designed? | Not just inverted colors |
| Do all tokens hold up in dark mode? | Test contrast ratios |
| Are shadows appropriate for dark? | Subtle or removed in dark mode |

**Note**: Our playgrounds default to dark mode (monochrome base).

#### 13. Density

| Question | Pass Criteria |
|----------|---------------|
| Can anything be removed without losing meaning? | Apply Jobs filter |
| Are there redundant elements? | No duplicate information |
| Is every element earning its place? | Justify each element's existence |

#### 14. Responsiveness

| Question | Pass Criteria |
|----------|---------------|
| Does the layout handle different window sizes? | Test 1280px, 1440px, 1920px |
| Does content remain readable at all widths? | No horizontal overflow |
| Are controls accessible at all sizes? | Touch targets adequate |

**Note**: Desktop-first. Mobile is future scope.

#### 15. Accessibility

| Requirement | Implementation |
|-------------|----------------|
| Keyboard navigation | All interactive elements focusable |
| Focus states | Visible focus indicators (`:focus-visible`) |
| ARIA labels | Dynamic content has appropriate roles |
| Color contrast | 4.5:1 minimum for text |
| Screen reader flow | Logical reading order |

---

## The Jobs Filter

For **every element** on the screen, ask these five questions:

### 1. "Would a user need to be told this exists?"

- **If yes**: Redesign it until it's obvious
- The best UI is invisible. Controls should be self-evident.

### 2. "Can this be removed without losing meaning?"

- **If yes**: Remove it
- Less is more. Every element adds cognitive load.

### 3. "Does this feel inevitable, like no other design was possible?"

- **If no**: It's not done
- Great design feels like the only possible solution.

### 4. "Is this detail as refined as the details users will never see?"

- The back of the fence must be painted too
- Consistency in the small details elevates the whole.

### 5. "Say no to 1,000 things"

- Cut good ideas to keep great ones
- Features compete for attention. Less but better.

---

## Audit Output Template

```markdown
## Playground Audit: [Name]

**Date**: YYYY-MM-DD
**Reviewer**: [Name/Agent]
**APP_FLOW**: [Link or "Not Created"]

### Summary

| Category | Score | Notes |
|----------|-------|-------|
| Visual Quality (1-5) | X/5 | |
| Component Consistency (6-8) | X/3 | |
| State Handling (9-11) | X/3 | |
| Responsive & Accessible (12-15) | X/4 | |
| **Total** | **X/15** | |

### Detailed Findings

#### Passing (✅)
- [List items that pass]

#### Warnings (⚠️)
- [List items with minor issues]

#### Failing (❌)
- [List items that fail]

### Jobs Filter Results

- Elements reviewed: X
- Elements to redesign: X
- Elements to remove: X

### Phased Remediation Plan

#### Phase 1 — Critical (Do First)
1. [Issue]: [Current] → [Required] → [Reason]

#### Phase 2 — Refinement (Do Next)
1. [Issue]: [Current] → [Required] → [Reason]

#### Phase 3 — Polish (Do Last)
1. [Issue]: [Current] → [Required] → [Reason]

### Verdict

- [ ] **Pass**: Ready for production
- [ ] **Conditional Pass**: Usable with Phase 1 fixes
- [ ] **Fail**: Requires significant work
```

---

## Scoring Guide

| Score | Meaning | Action |
|-------|---------|--------|
| 15/15 | Exceptional | Ship it |
| 12-14 | Good | Polish and ship |
| 9-11 | Acceptable | Address warnings |
| 6-8 | Needs Work | Complete Phase 1 |
| <6 | Failing | Significant rework |

---

## Quick Checklist (Copy/Paste)

```markdown
### Quick Audit Checklist

#### Visual Quality
- [ ] 1. Visual hierarchy clear
- [ ] 2. Spacing uses tokens
- [ ] 3. Typography hierarchy (max 4 sizes)
- [ ] 4. Color is monochrome base + status accents
- [ ] 5. Pixel-perfect alignment

#### Component Consistency
- [ ] 6. Components styled consistently
- [ ] 7. Icons from single set (Lucide)
- [ ] 8. Motion uses tokens, respects reduced-motion

#### State Handling
- [ ] 9. Empty states designed
- [ ] 10. Loading states consistent
- [ ] 11. Error states helpful and accessible

#### Responsive & Accessible
- [ ] 12. Dark mode properly designed
- [ ] 13. Density: nothing redundant
- [ ] 14. Works at 1280px, 1440px, 1920px
- [ ] 15. Keyboard nav, focus states, ARIA, contrast
```

---

## Related Documents

- [FRONTEND_GUIDELINES.md](../reference/FRONTEND_GUIDELINES.md) - Design tokens and patterns
- [APP_FLOW_STANDARD.md](./APP_FLOW_STANDARD.md) - User journey documentation
- [design-reviewer.md](../../.claude/agents/design-reviewer.md) - Agent definition

---

## Version History

| Date | Change |
|------|--------|
| 2026-02-04 | Initial protocol created |
