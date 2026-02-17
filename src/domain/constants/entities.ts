// Canonical entity icon + color assignments.
// Every component that renders a job, quote, invoice, or scratch-note icon
// MUST import from here to guarantee visual consistency.

import {
  Hammer,
  FileSignature,
  Receipt,
  StickyNote,
  type LucideIcon,
} from "lucide-react";

export interface EntityStyle {
  icon: LucideIcon;
  /** Tailwind text-color class, e.g. "text-purple" */
  color: string;
  /** Tailwind border-l color for board card accent */
  borderColor: string;
  label: string;
}

export const ENTITY_STYLES = {
  job: {
    icon: Hammer,
    color: "text-purple",
    borderColor: "border-l-purple",
    label: "Jobs",
  },
  quote: {
    icon: FileSignature,
    color: "text-magenta",
    borderColor: "border-l-magenta",
    label: "Quotes",
  },
  invoice: {
    icon: Receipt,
    color: "text-success",
    borderColor: "border-l-success",
    label: "Invoices",
  },
  scratch_note: {
    icon: StickyNote,
    color: "text-magenta",
    borderColor: "border-l-magenta",
    label: "Scratch Notes",
  },
} as const satisfies Record<string, EntityStyle>;
