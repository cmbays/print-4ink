# Quality Checklist

Run before marking any screen complete. Every item must pass.

## Visual (4 checks)

- [ ] **Visual hierarchy**: Primary action is most prominent. Eye lands where it should. Purpose clear in 5 seconds.
- [ ] **Spacing**: All spacing uses Tailwind utilities (`gap-4`, `p-6`, `space-y-6`). No hardcoded px values. Content breathes.
- [ ] **Typography**: Max 3-4 sizes per screen. Inter for all UI text. JetBrains Mono for code/technical values only. Max 3 font weights.
- [ ] **Color**: Monochrome base layer. Status colors (`text-action`, `text-success`, `text-error`, `text-warning`) used only for meaning, never decoration. No hex values in components — use Tailwind semantic classes.

## Interactive (2 checks)

- [ ] **States**: All interactive elements have: `hover:` state, `focus-visible:` outline, `active:` feedback, `disabled:` styling. Primary CTAs get neobrutalist shadow treatment.
- [ ] **Icons**: Lucide React only. Consistent sizes (`h-4 w-4` inline, `h-5 w-5` prominent, `h-6 w-6` hero). Every icon serves a purpose (not decorative).

## Resilience (2 checks)

- [ ] **Motion**: Tailwind `transition-*` for hover/focus. Framer Motion for layout changes. `prefers-reduced-motion` respected.
- [ ] **Empty/Error states**: Empty state has icon + message + optional CTA (per APP_FLOW State Definitions). Detail pages handle invalid IDs with error message + link back to list.

## Accessibility (1 check)

- [ ] **A11y**: All interactive elements keyboard navigable (Tab). Icon-only buttons have `aria-label`. 4.5:1 contrast minimum. Headings in correct hierarchy (`h1` > `h2` > `h3`).

## Discipline (1 check)

- [ ] **Jobs Filter**: Review every element. "Can this be removed without losing meaning?" If yes, remove it. Every element must earn its place.
