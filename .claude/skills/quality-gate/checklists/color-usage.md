# 4. Color Usage

## Criteria

- [ ] Base layer is monochrome (backgrounds, borders, text all use neutral/opacity tokens)
- [ ] Status colors used only for meaning: `text-action`, `text-success`, `text-error`, `text-warning`
- [ ] No hex or rgb values in component code — all colors via Tailwind semantic classes
- [ ] No decorative gradients
- [ ] Background colors use `bg-background`, `bg-card`, `bg-surface`, `bg-muted`
- [ ] Text colors use `text-foreground`, `text-muted-foreground`, or status colors
- [ ] Border colors use `border-border` or status border variants

## How to Check

1. Search component for hex values (`#`), `rgb(`, `rgba(` — should find zero
2. Search for status color classes — verify each one communicates meaning (not decoration)
3. Verify backgrounds use semantic classes not literal values
4. Check that color is never the sole indicator of information (pair with icon/text)

## Common Failures

- `text-cyan-500` instead of `text-action`
- `bg-red-100` instead of `bg-error/10`
- Status colors used for decorative borders or backgrounds
- Hardcoded `#22d3ee` in className — use `text-action` instead
