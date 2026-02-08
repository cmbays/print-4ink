# **Strategic Disposition Plan: Screen Print Pro**

This document categorizes existing assets from the dbt-playground to determine what we keep, what we transform, and what we rebuild from scratch to enable rapid "vibe coding" with Claude.

## **1\. THE FOUNDATION: Keep as "Source of Truth"**

*These assets are solid. They act as the "Laws" for the AI and require almost no modification.*

* **Design Tokens (FRONTEND\_GUIDELINES.md):** The color hex codes, spacing scales, and "Linear Calm" philosophy are gold. We will feed these to Claude to define the visual identity.  
* **Audit Protocols (PLAYGROUND\_AUDIT\_PROTOCOL.md):** This is your high-quality bar. We use this to "grade" everything Claude builds from scratch.  
* **UX Research (UX\_USER\_RESEARCH.md):** The identified pain points and "Love Factor" criteria are universal. They prevent us from building features nobody wants.

## **2\. THE RAW MATERIAL: Mapping & Migration Strategy**

Use this table to map legacy high-value patterns to the new AI-optimized stack.

| Legacy Asset (dbt-playground) | New Target (Screen Print Pro) | Migration Strategy / Why |
| :---- | :---- | :---- |
| **Monochrome Design Tokens** | tailwind.config.ts (Theme) | Map CSS variables to Tailwind colors. Ensures "Raycast Polish" is global. |
| **Kanban Layout (workflow-hub.html)** | @/components/features/Kanban | Rebuild using dnd-kit. Keep the column logic but replace manual DOM with React state. |
| **"Glass" Card Styles** | components/ui/card.tsx | Use shadcn/ui Card as the base, apply the specific glass/border opacity from the guidelines. |
| **Interactive Modals** | components/ui/dialog.tsx | Replace reveal.js/manual modals with Radix-based Dialogs for accessibility. |
| **UX\_TASK\_FLOWS.md** | Next.js App Router Structure | Convert "User Journeys" into file-based routes (e.g., /jobs/\[id\]/approval). |
| **Playground Audit Protocol** | CLAUDE.md / Custom Linting | Feed the 15-point checklist to Claude as a "Definition of Done." |

## **3\. THE CLEAN SLATE: Start from Scratch**

*These items are "Tech Debt" or unnecessary complexity. We discard the old code and use modern defaults.*

* **The HTML Files:** All 7 playground HTML files are discarded.  
* **Mermaid & Timeline Logic:** These are discarded. If we need visualization later, we will use a modern React-native plugin rather than trying to migrate the existing implementations.  
* **Manual CSS & JS:** We move 100% to **Tailwind CSS**, **React State**, and **React Hook Form**.  
* **Iconography:** We replace all emoji/custom SVGs with **Lucide React**.  
* **Data Validation:** We implement **Zod Schemas** from day one.

## **4\. NEW TOOL INTEGRATION (The "Free Wins")**

*Instead of building these from scratch, we use modern plugins that Claude knows how to configure.*

| Feature | New Tool / Plugin | Why? |
| :---- | :---- | :---- |
| **Complex Tables** | TanStack Table | Perfect for the "Job Queue" list views. |
| **Form Logic** | React Hook Form | Handles complex multi-part Quote Calculators. |
| **Animations** | Framer Motion | Smooth state transitions for the Kanban board. |
| **Drag and Drop** | @dnd-kit | High-performance logic for the Kanban production board. |

## **5\. Summary Blueprint for Claude**

To start the project, provide Claude with the following "Seed Context":

1. **The Design Tokens** (to set the theme).  
2. **The Zod Schema** (to define the "Job" object).  
3. **The Next.js 15 Scaffold** (the new home).  
4. **The CLAUDE.md** (the project rules).

**Verdict:** We are keeping the **"Brain"** (Research) and the **"Skin"** (Design Tokens), and only carrying over the **"Workflow Layout"** of the Kanban board. Everything else is a fresh, modern build.