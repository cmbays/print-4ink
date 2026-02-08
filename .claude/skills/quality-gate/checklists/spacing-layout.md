# 2. Spacing & Layout

## Criteria

- [ ] All spacing uses Tailwind utilities — no hardcoded `px`, `rem`, or `em` values
- [ ] Page sections separated with `space-y-6` or `gap-6`
- [ ] Card content uses `p-6` for standard padding
- [ ] Related items grouped with `gap-2` or `gap-4`
- [ ] Grid layouts use Tailwind `grid grid-cols-*` and `gap-*`
- [ ] No cramped areas — minimum `gap-4` between distinct sections

## How to Check

1. Search the component for any hardcoded spacing (`style=`, inline px/rem values)
2. Verify `space-y-*` or `gap-*` on container elements
3. Check card components use consistent padding
4. Verify grid columns use Tailwind responsive classes where appropriate

## Common Failures

- `style={{ marginTop: '12px' }}` instead of `mt-3`
- Inconsistent gaps between sections (mixing `gap-2` and `gap-6` for similar elements)
- Missing padding on card content areas
