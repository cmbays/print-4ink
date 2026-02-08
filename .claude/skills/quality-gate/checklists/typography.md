# 3. Typography

## Criteria

- [ ] Maximum 3-4 distinct text sizes per screen
- [ ] All text uses Tailwind `text-*` classes (not CSS font-size)
- [ ] Inter (`font-sans`) used for all UI text
- [ ] JetBrains Mono (`font-mono`) used only for code, IDs, SKUs, technical values
- [ ] Maximum 3 font weights per screen: `font-normal`, `font-medium`, `font-semibold`
- [ ] Page heading pattern: `text-2xl font-semibold tracking-tight`
- [ ] Subtitle pattern: `text-sm text-muted-foreground`

## How to Check

1. List all distinct `text-*` classes used in the component
2. Count unique sizes — should be 3-4 max
3. Search for `font-mono` — verify it's only on technical values
4. Search for font weight classes — verify max 3 distinct weights
5. Check heading hierarchy is logical (h1 > h2 > h3)

## Common Failures

- Using 6+ different text sizes on one screen (visual noise)
- `font-mono` on regular body text or labels
- `font-bold` (700 weight) — our system uses `font-semibold` (600) max
- Missing `tracking-tight` on page headings
