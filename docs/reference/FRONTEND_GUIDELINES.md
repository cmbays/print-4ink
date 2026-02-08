# Frontend Guidelines

**Last Updated**: 2026-02-04
**Status**: Active
**Part of**: Vibe Coding Gap Analysis (#198, Phase 2)

---

## Design Philosophy

### The Standard: "Linear Calm + Raycast Polish + Neobrutalist Delight"

Our aesthetic combines three influences into a cohesive system:

| Layer | Influence | Treatment |
|-------|-----------|-----------|
| **Base** | Linear | Monochrome, opacity hierarchy, extreme restraint |
| **Polish** | Raycast | OS-native feel, subtle glass, responsive transitions |
| **Attention** | Neobrutalist | Bold borders, vibrant status colors, springy animations |

**Core Insight**: The contrast between calm base and bold accents makes attention elements pop harder.

### Design Principles

1. **Calm by Default**: Most UI should be monochrome and restrained. No color unless it serves a purpose.
2. **Delightful When It Matters**: Primary CTAs, success moments, and interactive states get the bold treatment.
3. **Opacity Over Color**: Use opacity levels (87%, 60%, 38%) for text hierarchy instead of different colors.
4. **Status-Driven Color**: Color communicates meaning (action, success, error, warning), not decoration.
5. **Remove Until It Breaks**: Apply the Jobs filter - if an element can be removed without losing meaning, remove it.

### Anti-Patterns (Avoid)

- Multiple accent colors competing for attention
- Gradients and decorative elements that don't serve function
- Dense layouts with insufficient whitespace
- Color used for decoration rather than communication
- Inconsistent component styling across playgrounds

### The Jobs Filter

Ask these questions of every UI element:
- "Would a user need to be told this exists?" → If yes, redesign it until obvious
- "Can this be removed without losing meaning?" → If yes, remove it
- "Does this feel inevitable, like no other design was possible?" → If no, it's not done

---

## Architecture

### Hybrid Approach: Shared CSS + Inline Overrides

```
playgrounds/
├── shared/
│   ├── base.css          # CSS variables, reset, typography
│   ├── components.css    # Buttons, cards, modals, tabs
│   └── utilities.css     # Spacing, flex helpers, responsive
├── workflow-hub.html
├── learning-playground.html
└── ...
```

### File Structure

**shared/base.css** - Design tokens and foundation:
- CSS custom properties (colors, spacing, typography)
- CSS reset/normalize
- Base typography styles

**shared/components.css** - Reusable components:
- Buttons (`.btn`, `.btn-primary`, `.btn-sm`)
- Cards (`.card`, `.card-header`, `.card-body`)
- Modals (`.modal-overlay`, `.modal`, `.modal-header`)
- Tabs (`.tab-bar`, `.tab-btn`, `.tab-panel`)

**shared/utilities.css** - Helper classes:
- Spacing (`.mt-1`, `.p-2`, etc.)
- Flexbox (`.flex`, `.items-center`, `.justify-between`)
- Responsive (`.hidden-mobile`, `.stack-mobile`)

### Usage in Playgrounds

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Playground Name</title>

  <!-- Shared styles -->
  <link rel="stylesheet" href="shared/base.css">
  <link rel="stylesheet" href="shared/components.css">
  <link rel="stylesheet" href="shared/utilities.css">

  <!-- Playground-specific overrides -->
  <style>
    /* Only styles unique to this playground */
    .kanban-column { /* ... */ }
  </style>
</head>
```

---

## Color System

### Design Philosophy: Monochrome + Status

**Base Layer**: Near-black monochrome with opacity-based text hierarchy (Linear-inspired)
**Attention Layer**: Vibrant status colors for elements that need attention (Neobrutalist)

### Design Tokens

```css
:root {
  /* ===================
     BASE LAYER (Monochrome)
     Linear-inspired restraint
     =================== */

  /* Background - Near-black foundation */
  --color-bg-primary: #09090b;      /* Main background */
  --color-bg-secondary: #0f0f11;    /* Slightly elevated */
  --color-bg-elevated: #18181b;     /* Cards, panels */
  --color-bg-surface: #1c1c1f;      /* Interactive surfaces */

  /* Text - Opacity-based hierarchy (on dark backgrounds) */
  --color-text-primary: rgba(255, 255, 255, 0.87);    /* High emphasis */
  --color-text-secondary: rgba(255, 255, 255, 0.60);  /* Medium emphasis */
  --color-text-muted: rgba(255, 255, 255, 0.38);      /* Disabled/hints */
  --color-text-disabled: rgba(255, 255, 255, 0.20);   /* Truly disabled */

  /* Borders - Subtle definition */
  --color-border-subtle: rgba(255, 255, 255, 0.08);
  --color-border-default: rgba(255, 255, 255, 0.12);
  --color-border-strong: rgba(255, 255, 255, 0.20);

  /* ===================
     ATTENTION LAYER (Status-Driven)
     Neobrutalist vibrant accents
     =================== */

  /* Action - Cyan (primary CTAs, interactive focus) */
  --color-action: #22d3ee;
  --color-action-hover: #06b6d4;
  --color-action-bold: #00e5ff;     /* For brutal shadows */

  /* Success - Green (completions, confirmations) */
  --color-success: #34d399;
  --color-success-hover: #10b981;
  --color-success-bold: #00ff88;

  /* Error - Red (failures, destructive actions) */
  --color-error: #f87171;
  --color-error-hover: #ef4444;
  --color-error-bold: #ff4444;

  /* Warning - Amber (cautions, pending states) */
  --color-warning: #fbbf24;
  --color-warning-hover: #f59e0b;
  --color-warning-bold: #ffcc00;

  /* ===================
     EFFECTS
     =================== */

  /* Glassmorphism (Raycast-inspired) */
  --glass-bg: rgba(255, 255, 255, 0.05);
  --glass-blur: blur(12px);
  --glass-border: rgba(255, 255, 255, 0.1);

  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.3);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.3);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.3);

  /* Neobrutalist Effects */
  --border-bold: 2px solid;
  --border-brutal: 3px solid;
  --shadow-brutal: 4px 4px 0px;

  /* Transitions */
  --transition-fast: 150ms ease;
  --transition-normal: 200ms ease;
  --transition-spring: 300ms cubic-bezier(0.34, 1.56, 0.64, 1);

  /* Radii */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-full: 9999px;
}

/* Dark mode is default - light mode optional */
@media (prefers-color-scheme: light) {
  :root {
    /* Light mode overrides if needed */
    --color-bg-primary: #fafafa;
    --color-bg-secondary: #f4f4f5;
    --color-bg-elevated: #ffffff;
    --color-bg-surface: #ffffff;

    --color-text-primary: rgba(0, 0, 0, 0.87);
    --color-text-secondary: rgba(0, 0, 0, 0.60);
    --color-text-muted: rgba(0, 0, 0, 0.38);

    --color-border-subtle: rgba(0, 0, 0, 0.06);
    --color-border-default: rgba(0, 0, 0, 0.12);
    --color-border-strong: rgba(0, 0, 0, 0.20);

    --glass-bg: rgba(255, 255, 255, 0.7);
    --glass-border: rgba(0, 0, 0, 0.1);

    --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
    --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.07);
    --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
  }
}
```

### Color Usage

| Use Case | Token | Notes |
|----------|-------|-------|
| Page background | `--color-bg-primary` | Near-black (#09090b) |
| Elevated sections | `--color-bg-elevated` | Cards, modals |
| Body text | `--color-text-primary` | 87% opacity white |
| Secondary text | `--color-text-secondary` | 60% opacity white |
| Placeholder/hint | `--color-text-muted` | 38% opacity white |
| Default borders | `--color-border-default` | 12% opacity white |
| **Primary CTA** | `--color-action` | Cyan - draws attention |
| **Success states** | `--color-success` | Green - celebrates completion |
| **Error states** | `--color-error` | Red - unmissable |
| **Warning states** | `--color-warning` | Amber - caution |

### When to Use Color

**Use monochrome for:**
- All non-interactive text
- Borders and dividers
- Backgrounds
- Secondary buttons

**Use status colors for:**
- Primary action buttons (cyan)
- Success confirmations (green)
- Error messages (red)
- Warnings (amber)
- Active/selected states
- Interactive focus indicators

---

## Typography

### Font Stack: Inter + JetBrains Mono

We use Google Fonts for consistent, high-quality typography across all playgrounds.

```css
:root {
  /* Primary UI font - clean, readable, matches Linear/Raycast */
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;

  /* Code font - developer-focused with ligature support */
  --font-mono: 'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace;
}
```

### Google Fonts Embed

Add this to `<head>` in every playground:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
```

### Type Scale

| Token | Size | Weight | Line Height | Use |
|-------|------|--------|-------------|-----|
| `--text-xs` | 0.75rem (12px) | 400 | 1.4 | Captions, badges |
| `--text-sm` | 0.875rem (14px) | 400 | 1.5 | Secondary text, buttons |
| `--text-base` | 1rem (16px) | 400 | 1.5 | Body text |
| `--text-lg` | 1.125rem (18px) | 500 | 1.4 | Emphasis |
| `--text-xl` | 1.25rem (20px) | 600 | 1.3 | H3 |
| `--text-2xl` | 1.5rem (24px) | 600 | 1.25 | H2 |
| `--text-3xl` | 1.875rem (30px) | 700 | 1.2 | H1 |

### Typography CSS

```css
body {
  font-family: var(--font-sans);
  font-size: var(--text-base);
  line-height: 1.5;
  color: var(--color-text-primary);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

h1, h2, h3, h4 {
  font-weight: 600;
  color: var(--color-text-primary);
  letter-spacing: -0.02em;  /* Tighten headings slightly */
}

code, pre, .mono {
  font-family: var(--font-mono);
  font-size: 0.875em;
}

/* Code blocks */
pre {
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-md);
  padding: var(--space-4);
  overflow-x: auto;
}
```

---

## Spacing

### Spacing Scale (8px base)

| Token | Value | Use |
|-------|-------|-----|
| `--space-1` | 0.25rem (4px) | Tight spacing |
| `--space-2` | 0.5rem (8px) | Related elements |
| `--space-3` | 0.75rem (12px) | Component padding |
| `--space-4` | 1rem (16px) | Standard gap |
| `--space-6` | 1.5rem (24px) | Section padding |
| `--space-8` | 2rem (32px) | Large sections |
| `--space-12` | 3rem (48px) | Page sections |

### Spacing Philosophy

**Japanese Minimalism (Ma)**: Use generous spacing. When in doubt, add more space.

```css
/* Too dense - avoid */
.card { padding: 8px; }
.card + .card { margin-top: 8px; }

/* Better - let content breathe */
.card { padding: var(--space-6); }
.card + .card { margin-top: var(--space-4); }
```

---

## Components

### Buttons

Two button modes: **Calm** (secondary) and **Attention** (primary/neobrutalist).

```css
/* Base button - calm, monochrome */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  font-weight: 500;
  line-height: 1.5;
  color: var(--color-text-primary);
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn:hover {
  background: var(--color-bg-surface);
  border-color: var(--color-border-strong);
}

.btn:focus-visible {
  outline: 2px solid var(--color-action);
  outline-offset: 2px;
}

/* PRIMARY BUTTON - Neobrutalist attention-grabbing */
.btn-primary {
  background: var(--color-action);
  color: #000;
  border: var(--border-bold) currentColor;
  font-weight: 600;
  box-shadow: var(--shadow-brutal) var(--color-action-bold);
  transition: all var(--transition-spring);
}

.btn-primary:hover {
  transform: translate(-2px, -2px);
  box-shadow: 6px 6px 0px var(--color-action-bold);
}

.btn-primary:active {
  transform: translate(0, 0);
  box-shadow: 2px 2px 0px var(--color-action-bold);
}

/* Success button - for confirmations */
.btn-success {
  background: var(--color-success);
  color: #000;
  border: var(--border-bold) currentColor;
  box-shadow: var(--shadow-brutal) var(--color-success-bold);
}

/* Danger button - for destructive actions */
.btn-danger {
  background: var(--color-error);
  color: #000;
  border: var(--border-bold) currentColor;
  box-shadow: var(--shadow-brutal) var(--color-error-bold);
}

/* Ghost button - minimal footprint */
.btn-ghost {
  background: transparent;
  border-color: transparent;
}

.btn-ghost:hover {
  background: var(--color-bg-surface);
}

/* Size variants */
.btn-sm {
  padding: var(--space-1) var(--space-3);
  font-size: var(--text-xs);
}

.btn-lg {
  padding: var(--space-3) var(--space-6);
  font-size: var(--text-base);
}
```

### Cards

Three card variants: **Solid** (default), **Glass** (elevated), **Interactive** (attention).

```css
/* Base card - solid background */
.card {
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
}

/* Glass card - Raycast-inspired frosted effect */
.card-glass {
  background: var(--glass-bg);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
}

/* Interactive card - Neobrutalist hover treatment */
.card-interactive {
  background: var(--color-bg-elevated);
  border: var(--border-bold) var(--color-border-strong);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
  cursor: pointer;
  transition: all var(--transition-spring);
}

.card-interactive:hover {
  transform: translate(-2px, -2px);
  box-shadow: var(--shadow-brutal) var(--color-action-bold);
  border-color: var(--color-action);
}

.card-interactive:active {
  transform: translate(0, 0);
  box-shadow: 2px 2px 0px var(--color-action-bold);
}

/* Card sub-components */
.card-header {
  margin-bottom: var(--space-4);
  padding-bottom: var(--space-4);
  border-bottom: 1px solid var(--color-border-subtle);
}

.card-title {
  font-size: var(--text-lg);
  font-weight: 600;
  margin: 0;
  color: var(--color-text-primary);
}

.card-description {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  margin-top: var(--space-1);
}

.card-body {
  color: var(--color-text-secondary);
}

.card-footer {
  margin-top: var(--space-4);
  padding-top: var(--space-4);
  border-top: 1px solid var(--color-border-subtle);
}
```

### Modals

```css
.modal-overlay {
  display: none;
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  z-index: 1000;
}

.modal-overlay.active {
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal {
  background: var(--color-bg-card);
  border: 2px solid var(--color-border-strong);
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
  max-height: 85vh;
  overflow: hidden;
  box-shadow: var(--shadow-brutal);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4) var(--space-6);
  border-bottom: 1px solid var(--color-border);
}

.modal-body {
  padding: var(--space-6);
  overflow-y: auto;
}
```

### Tabs

```css
.tab-bar {
  display: flex;
  gap: var(--space-1);
  border-bottom: 2px solid var(--color-border);
  padding-bottom: 0;
}

.tab-btn {
  padding: var(--space-2) var(--space-4);
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text-secondary);
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.tab-btn:hover {
  color: var(--color-text-primary);
}

.tab-btn.active {
  color: var(--color-accent);
  border-bottom-color: var(--color-accent);
}

.tab-panel {
  display: none;
  padding: var(--space-6) 0;
}

.tab-panel.active {
  display: block;
}
```

### Form Inputs

```css
.input {
  width: 100%;
  padding: var(--space-2) var(--space-3);
  font-size: 1rem;
  border: 2px solid var(--color-border);
  border-radius: 6px;
  background: var(--color-bg-card);
  color: var(--color-text-primary);
  transition: all 0.15s ease;
}

.input:hover {
  border-color: var(--color-border-strong);
}

/* Neobrutalist focus state */
.input:focus {
  outline: none;
  border-color: var(--color-border-strong);
  box-shadow: var(--shadow-brutal);
}

.input::placeholder {
  color: var(--color-text-muted);
}
```

---

## Animations & Motion

### Motion Philosophy

- **Subtle by default**: 150-200ms easing for standard interactions
- **Springy for delight**: 300ms spring curves for celebrations and attention moments
- **Respect preferences**: Always check `prefers-reduced-motion`

### Transition Tokens

```css
:root {
  --transition-fast: 150ms ease;
  --transition-normal: 200ms ease;
  --transition-spring: 300ms cubic-bezier(0.34, 1.56, 0.64, 1);
}
```

### Animation Patterns

```css
/* Fade in */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Slide up */
@keyframes slideUp {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Success celebration - springy scale */
@keyframes celebrate {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

/* Attention pulse */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}
```

### Success Toast (Celebration Moment)

```css
.toast-success {
  background: var(--color-success);
  color: #000;
  border: var(--border-brutal) var(--color-success-bold);
  box-shadow: var(--shadow-brutal) var(--color-success-bold);
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-md);
  font-weight: 600;
  animation: celebrate var(--transition-spring) ease-out;
}
```

### Reduced Motion

Always provide reduced motion alternatives:

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## UI States

Every interactive component should handle these states explicitly.

### Empty State

When there's no data to display:

```css
.empty-state {
  text-align: center;
  padding: var(--space-12) var(--space-6);
  color: var(--color-text-muted);
}

.empty-state-icon {
  font-size: 3rem;
  margin-bottom: var(--space-4);
  opacity: 0.5;
}

.empty-state-title {
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--color-text-secondary);
  margin-bottom: var(--space-2);
}

.empty-state-description {
  font-size: var(--text-sm);
  max-width: 300px;
  margin: 0 auto;
}
```

### Loading State

```css
.loading-spinner {
  width: 24px;
  height: 24px;
  border: 2px solid var(--color-border-default);
  border-top-color: var(--color-action);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Skeleton loading */
.skeleton {
  background: linear-gradient(
    90deg,
    var(--color-bg-elevated) 0%,
    var(--color-bg-surface) 50%,
    var(--color-bg-elevated) 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: var(--radius-sm);
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

### Error State

```css
.error-banner {
  background: var(--color-error);
  color: #000;
  border: var(--border-bold) var(--color-error-bold);
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.error-inline {
  color: var(--color-error);
  font-size: var(--text-sm);
  margin-top: var(--space-1);
}
```

### Disabled State

```css
.disabled,
[disabled] {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}
```

---

## Accessibility (WCAG AA)

### Focus Indicators

All interactive elements must have visible focus states:

```css
:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

/* For elements with custom focus styling */
.btn:focus-visible,
.input:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.3);
}
```

### Color Contrast

| Combination | Ratio | Status |
|-------------|-------|--------|
| #1a1a1a on #ffffff | 16:1 | ✅ AAA |
| #525252 on #ffffff | 7.4:1 | ✅ AAA |
| #737373 on #ffffff | 4.6:1 | ✅ AA |
| #f5f5f5 on #1a1a1a | 16:1 | ✅ AAA |

### Keyboard Navigation

| Key | Action |
|-----|--------|
| Tab | Move to next focusable element |
| Shift+Tab | Move to previous focusable element |
| Enter | Activate button, submit form |
| Escape | Close modal, cancel action |
| Arrow keys | Navigate within component (tabs, menus) |

### ARIA Requirements

```html
<!-- Modal -->
<div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
  <h2 id="modal-title">Modal Title</h2>
</div>

<!-- Tabs -->
<div role="tablist">
  <button role="tab" aria-selected="true" aria-controls="panel-1">Tab 1</button>
  <button role="tab" aria-selected="false" aria-controls="panel-2">Tab 2</button>
</div>
<div role="tabpanel" id="panel-1">Content 1</div>
<div role="tabpanel" id="panel-2" hidden>Content 2</div>

<!-- Status messages -->
<div role="status" aria-live="polite">Changes saved</div>
<div role="alert" aria-live="assertive">Error: Invalid input</div>
```

---

## Responsive Design

### Desktop-First Approach

These playgrounds are developer tools designed primarily for desktop use. Optimize for cursor interaction, keyboard shortcuts, and comfortable reading at typical desktop widths.

**Design Priority**: Desktop → Tablet → Mobile (future scope)

### Desktop Breakpoints

| Name | Width | Target |
|------|-------|--------|
| Standard | 1280px | Most laptops |
| Wide | 1440px | External monitors |
| Ultra-wide | 1920px+ | Large displays |

### Media Queries

```css
/* Desktop-first approach - design for desktop, then adapt down */
.component {
  /* Desktop styles (default) */
  display: flex;
  flex-direction: row;
  max-width: 1200px;
  gap: var(--space-6);
}

/* Narrow viewport adaptation (if needed later) */
@media (max-width: 1024px) {
  .component {
    /* Smaller screens - stack if necessary */
    flex-direction: column;
    gap: var(--space-4);
  }
}
```

### Width Considerations

```css
/* Content containers - comfortable reading width */
.content-container {
  max-width: 80ch;  /* Optimal line length for reading */
  margin: 0 auto;
}

/* Full-width layouts for dashboards/editors */
.dashboard-layout {
  max-width: 1600px;
  margin: 0 auto;
  padding: 0 var(--space-6);
}

/* Sidebar layouts */
.sidebar-layout {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: var(--space-6);
}
```

### Window Resize Handling

```css
/* Prevent awkward layouts at common desktop widths */
.main-content {
  min-width: 600px;  /* Don't let content get too cramped */
}

/* Flexible grids that work across desktop sizes */
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: var(--space-6);
}
```

---

## Dark Mode

### Strategy: Auto-Detect

Respect user's system preference via `prefers-color-scheme`. No manual toggle.

```css
@media (prefers-color-scheme: dark) {
  :root {
    /* Override light mode tokens */
  }
}
```

### Testing Dark Mode

**macOS**: System Preferences → Appearance → Dark
**Chrome DevTools**: Elements → Rendering → Emulate prefers-color-scheme: dark

---

## CDN Dependencies

### Approved Libraries

| Library | Version | CDN URL | Purpose |
|---------|---------|---------|---------|
| Mermaid | 10.9.0 | `https://cdn.jsdelivr.net/npm/mermaid@10.9.0/dist/mermaid.min.js` | Diagrams |
| Reveal.js | 4.6.0 | `https://cdn.jsdelivr.net/npm/reveal.js@4.6.0/dist/reveal.js` | Slides |
| Panzoom | 9.4.3 | `https://cdn.jsdelivr.net/npm/panzoom@9.4.3/+esm` | Zoom/pan |

### Version Policy

Lock to specific minor versions (e.g., `@10.9.0` not `@10`) to prevent breaking changes.

---

## File Checklist for New Playgrounds

```markdown
- [ ] Links shared CSS files (base.css, components.css, utilities.css)
- [ ] Has `<meta name="viewport">` for responsive
- [ ] Has `lang="en"` on `<html>`
- [ ] Uses design tokens (no hardcoded colors)
- [ ] Has visible focus states on all interactive elements
- [ ] Modals have ARIA attributes
- [ ] Works at 640px width (mobile)
- [ ] Dark mode tested
- [ ] No console errors
```

---

## Migration Guide

### For Existing Playgrounds

1. **Create shared/ directory** with base.css, components.css, utilities.css
2. **Extract common styles** from workflow-hub.html (most complete)
3. **Update each playground**:
   - Add `<link>` to shared CSS files
   - Remove duplicated styles
   - Keep only playground-specific overrides
4. **Add mobile breakpoints** to playgrounds that lack them
5. **Add focus indicators** to all interactive elements
6. **Test** dark mode and mobile views

### Estimated Effort

| Phase | Hours |
|-------|-------|
| Create shared CSS | 4-6h |
| Migrate 6 playgrounds | 6-12h |
| Add mobile support | 3-4h |
| Add accessibility | 2-3h |
| **Total** | **15-25h** |

---

## Version History

| Date | Change |
|------|--------|
| 2026-02-04 | Initial guidelines created |

---

## Related Documents

- [TECH_STACK.md](./TECH_STACK.md) - Technology versions including CDN deps
- [PLAYGROUND_AUDIT.md](../../temp/PLAYGROUND_AUDIT.md) - Baseline audit data
- [DESIGN_PRINCIPLES.md](../standards/DESIGN_PRINCIPLES.md) - General design standards
