# 9. Accessibility

## Criteria

- [ ] All interactive elements reachable via Tab key
- [ ] Focus order follows logical reading order
- [ ] `focus-visible` indicators are visible on all focusable elements
- [ ] Icon-only buttons have `aria-label` describing the action
- [ ] Images/decorative icons have `aria-hidden="true"` or alt text
- [ ] Dynamic status messages use `role="status"` or `role="alert"`
- [ ] Form inputs have associated `<Label>` elements
- [ ] Headings follow correct hierarchy (h1 → h2 → h3, no skipping)
- [ ] Minimum 4.5:1 contrast ratio for all text

## How to Check

1. Tab through the page mentally (or in browser) — verify all interactive elements are reachable
2. Search for `<Button` with `size="icon"` — each must have `aria-label`
3. Search for `<img` — each must have `alt`
4. Verify heading levels: one `h1` per page, `h2` for sections, `h3` for subsections
5. Check contrast: our design token colors all pass AA (verified in FRONTEND_GUIDELINES)

## Contrast Ratios (pre-verified)

| Combination | Ratio | WCAG |
|-------------|-------|------|
| White (87%) on #09090b | 16:1 | AAA |
| White (60%) on #09090b | 11:1 | AAA |
| White (38%) on #09090b | 7:1 | AAA |
| Cyan (#22d3ee) on #09090b | 11:1 | AAA |

All design token combinations pass. Failures only happen with custom/off-palette colors.

## Common Failures

- Icon-only button missing `aria-label`
- Form input without associated label
- Heading hierarchy skipped (h1 → h3 with no h2)
