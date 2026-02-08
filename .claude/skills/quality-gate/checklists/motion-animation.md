# 7. Motion & Animation

## Criteria

- [ ] Hover/focus transitions use Tailwind `transition-*` utilities (not Framer Motion)
- [ ] Layout changes and enter/exit animations use Framer Motion where appropriate
- [ ] `prefers-reduced-motion` is respected (CSS media query in globals.css handles this)
- [ ] No animations that exist purely for decoration
- [ ] Transitions feel responsive (immediate feedback, not sluggish)

## How to Check

1. Search for `transition-` classes — verify they're on interactive elements
2. Search for `motion.` or `framer-motion` imports — verify used for layout, not hover
3. Verify `globals.css` has the `prefers-reduced-motion` media query (it does by default)
4. Ask: "Does this animation help the user understand what happened?" If no, remove it.

## Common Failures

- Framer Motion used for simple hover effects (use Tailwind instead)
- Missing `transition-all` or `transition-colors` on elements that change on hover
- Animations that distract rather than inform
