# 1. Visual Hierarchy

## Criteria

- [ ] Primary action is the most visually prominent element on the page
- [ ] Page heading uses `text-2xl font-semibold tracking-tight`
- [ ] No two elements compete at the same visual weight (size + color + weight)
- [ ] User can understand the screen's purpose in 5 seconds (5-second rule)
- [ ] Heading sizes follow downward hierarchy: `text-2xl` > `text-lg` > `text-sm`

## How to Check

1. Read the page component's JSX
2. Identify the primary action (the thing the user most needs to do/see)
3. Verify it has the strongest visual treatment (largest, boldest, or most colorful)
4. Check heading elements use decreasing size classes
5. Look for competing elements at the same visual weight

## Common Failures

- Multiple CTAs with equal visual weight (should be one primary, others secondary/ghost)
- Section headings same size as page heading
- Status badges more prominent than the content they describe
