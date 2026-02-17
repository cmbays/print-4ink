/**
 * UI-layer entity icon mapping.
 * Icons are a presentation concern (Lucide React components) and must NOT
 * live in the domain layer. Import this from UI components that need to
 * render entity icons. For labels and color classes, use ENTITY_STYLES from
 * @domain/constants/entities.
 */

import { Hammer, FileSignature, Receipt, StickyNote, type LucideIcon } from 'lucide-react'

export const ENTITY_ICONS: Record<string, LucideIcon> = {
  job: Hammer,
  quote: FileSignature,
  invoice: Receipt,
  scratch_note: StickyNote,
} as const
