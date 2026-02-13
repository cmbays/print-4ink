"use client";

import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/helpers/format";
import type { JobNote, JobNoteType } from "@/lib/schemas/job";

const NOTE_TYPE_STYLES: Record<
  JobNoteType,
  { label: string; className: string }
> = {
  internal: {
    label: "Internal",
    className: "bg-warning/10 text-warning border border-warning/20",
  },
  customer: {
    label: "Customer",
    className: "bg-action/10 text-action border border-action/20",
  },
  system: {
    label: "System",
    className: "bg-muted text-muted-foreground",
  },
};

interface NoteItemProps {
  note: JobNote;
}

export function NoteItem({ note }: NoteItemProps) {
  const style = NOTE_TYPE_STYLES[note.type];

  return (
    <div className="flex flex-col gap-1.5 rounded-md px-3 py-2.5 hover:bg-surface/30 transition-colors">
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium",
            style.className
          )}
        >
          {style.label}
        </span>
        <span className="text-xs text-muted-foreground">
          {formatDate(note.createdAt)}
        </span>
        <span className="text-xs font-medium text-secondary-foreground">
          {note.author}
        </span>
      </div>
      <p className="text-sm text-foreground leading-relaxed">{note.content}</p>
    </div>
  );
}
