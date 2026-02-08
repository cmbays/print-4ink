# 8. Empty & Error States

## Criteria

- [ ] Empty state designed for when there's no data (per APP_FLOW State Definitions)
- [ ] Empty state has: Lucide icon (`h-12 w-12 text-muted-foreground/50`) + message + optional CTA
- [ ] Search "no results" state shows: "No results for '[query]'" + clear search action
- [ ] Detail pages handle invalid IDs: error message + link back to list
- [ ] Error messages use `text-error` and `border-error/30` styling
- [ ] Error containers have `role="alert"`

## Empty State Pattern

```tsx
<div className="flex flex-col items-center justify-center py-12 text-center">
  <Icon className="h-12 w-12 text-muted-foreground/50 mb-4" />
  <h3 className="text-lg font-semibold text-muted-foreground">Message</h3>
  <p className="text-sm text-muted-foreground/60 mt-1 max-w-xs">Description</p>
</div>
```

## Error State Pattern

```tsx
<div className="rounded-md border border-error/30 bg-error/10 p-4" role="alert">
  <p className="text-sm font-medium text-error">Not found</p>
  <p className="text-sm text-muted-foreground mt-1">
    <Link href="/list" className="text-action underline">Back to list</Link>
  </p>
</div>
```

## APP_FLOW Empty States (reference)

| Screen | Message |
|--------|---------|
| Dashboard — Blocked | "All clear — no blocked jobs" |
| Jobs List | "No jobs yet. Jobs will appear here." |
| Quotes List | "No quotes yet." |
| Customer Detail — Jobs | "No jobs for this customer" |
| Customer Detail — Quotes | "No quotes for this customer" |
| Screen Room | "No screens tracked yet" |
| Search results | "No results for '[query]'" |

## Common Failures

- No empty state at all — screen looks broken when data is empty
- Generic empty message instead of context-specific one from APP_FLOW
- Missing `role="alert"` on error containers
- Error state missing recovery link back to the list page
