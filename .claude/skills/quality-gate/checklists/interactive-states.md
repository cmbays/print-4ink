# 5. Interactive States

## Criteria

- [ ] All buttons have hover, focus-visible, active, and disabled states
- [ ] Primary CTAs use neobrutalist shadow treatment
- [ ] Table rows with click handlers have `cursor-pointer` and `hover:bg-muted/50`
- [ ] Links have `hover:underline` or visible hover state
- [ ] Focus states use `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action`
- [ ] shadcn/ui components used where possible (they handle states automatically)

## How to Check

1. Find all interactive elements: buttons, links, clickable rows, form inputs
2. For each, verify hover state exists (search for `hover:`)
3. For buttons, verify they use `<Button>` from shadcn/ui (built-in states) or have manual states
4. For table rows with `onClick`, verify cursor + hover styling
5. Check primary CTA has the neobrutalist shadow pattern

## Neobrutalist CTA Pattern

```tsx
className="bg-action text-black font-semibold border-2 border-current shadow-[4px_4px_0px] shadow-action hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px] active:translate-x-0 active:translate-y-0 active:shadow-[2px_2px_0px] transition-all"
```

## Common Failures

- Clickable table rows missing `cursor-pointer`
- Custom buttons without hover/focus states
- Links that look like regular text (no visual affordance)
