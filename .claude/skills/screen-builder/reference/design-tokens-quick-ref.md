# Design Tokens Quick Reference

Use these Tailwind classes. Do NOT use raw hex/rgb values in components.

## Backgrounds

| Use | Class | Value |
|-----|-------|-------|
| Page background | `bg-background` | #09090b |
| Card / panel | `bg-card` | #18181b |
| Interactive surface | `bg-surface` | #1c1c1f |
| Muted / sidebar bg | `bg-muted` | #0f0f11 |

## Text

| Use | Class | Value |
|-----|-------|-------|
| Primary text | `text-foreground` | rgba(255,255,255,0.87) |
| Secondary text | `text-muted-foreground` | rgba(255,255,255,0.60) |
| Muted/hints | `text-muted-foreground/50` | ~38% opacity |

## Status Colors

| Status | Text class | Use |
|--------|-----------|-----|
| Action/primary | `text-action` | Primary CTAs, active states, links |
| Success | `text-success` | Completions, shipped, approved |
| Error | `text-error` | Failures, rejected, destructive |
| Warning | `text-warning` | Cautions, pending, blocked |

Each has hover variant: `text-action-hover`, `text-success-hover`, etc.

## Production State → Color

```
design     → text-muted-foreground
approval   → text-warning
burning    → text-action
press      → text-action
finishing  → text-success
shipped    → text-success
```

## Priority → Color

```
low    → text-muted-foreground
medium → text-foreground
high   → text-warning
rush   → text-error
```

## Typography

| Element | Classes |
|---------|---------|
| Page heading | `text-2xl font-semibold tracking-tight` |
| Section heading | `text-lg font-semibold` |
| Card title | `text-sm font-medium text-muted-foreground` |
| Body text | `text-sm` (most UI) or `text-base` |
| Caption | `text-xs text-muted-foreground` |

Fonts: `font-sans` (Inter), `font-mono` (JetBrains Mono — code only)

## Spacing

| Tailwind | px | Use |
|----------|-----|-----|
| `gap-1` / `p-1` | 4px | Tight (badge padding) |
| `gap-2` / `p-2` | 8px | Related elements (icon + label) |
| `gap-3` / `p-3` | 12px | Component padding |
| `gap-4` / `p-4` | 16px | Standard gap |
| `gap-6` / `p-6` | 24px | Section padding, card padding |
| `space-y-6` | 24px | Page section gaps |
| `gap-8` / `p-8` | 32px | Large section gaps |

## Borders & Radius

| Use | Class |
|-----|-------|
| Default border | `border-border` (12% white) |
| Subtle border | `border-border/50` |
| Border radius | `rounded-sm` (4px), `rounded-md` (8px), `rounded-lg` (12px) |

## Neobrutalist CTA

```tsx
className="bg-action text-black font-semibold border-2 border-current shadow-[4px_4px_0px] shadow-cyan-400 hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px] active:translate-x-0 active:translate-y-0 active:shadow-[2px_2px_0px] transition-all"
```

## Icon Sizes

| Size | Class | Use |
|------|-------|-----|
| Small | `h-4 w-4` | Inline with text, table cells |
| Medium | `h-5 w-5` | Buttons, card headers |
| Large | `h-6 w-6` | Hero/feature icons |
| Empty state | `h-12 w-12` | Centered empty state icon |
