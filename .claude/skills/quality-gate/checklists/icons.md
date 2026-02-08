# 6. Icons

## Criteria

- [ ] All icons from `lucide-react` — no emoji, no custom SVGs, no other icon libraries
- [ ] Consistent sizes within context: `h-4 w-4` (inline), `h-5 w-5` (prominent), `h-6 w-6` (hero)
- [ ] Empty state icons use `h-12 w-12 text-muted-foreground/50`
- [ ] Every icon serves a purpose (communicates meaning, not decoration)
- [ ] Icon-only buttons wrapped with `aria-label`

## How to Check

1. Search imports for icon sources — only `lucide-react` is allowed
2. List all icon size classes — verify consistency within context
3. Check icon-only buttons for `aria-label` prop
4. For each icon, ask: "Does removing this lose information?" If no, remove it.

## Common Failures

- Mixing `h-4 w-4` and `h-5 w-5` icons in the same row/context
- Decorative icons that add visual noise without meaning
- Icon-only `<Button>` missing `aria-label`
