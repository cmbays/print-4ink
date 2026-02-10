"use client";

import { useState } from "react";
import { StickyNote, Pin, PinOff, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { NOTE_CHANNEL_LABELS } from "@/lib/constants";
import type { Note, NoteChannel, NoteEntityType } from "@/lib/schemas/note";

const CHANNEL_COLORS: Record<NoteChannel, string> = {
  phone: "bg-action/10 text-action border border-action/20",
  email: "bg-success/10 text-success border border-success/20",
  text: "bg-warning/10 text-warning border border-warning/20",
  social: "bg-error/10 text-error border border-error/20",
  "in-person": "bg-muted text-muted-foreground",
};

interface NotesPanelProps {
  notes: Note[];
  entityType: NoteEntityType;
  entityId: string;
}

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function NoteItem({
  note,
  onTogglePin,
}: {
  note: Note;
  onTogglePin: (id: string) => void;
}) {
  return (
    <div
      className={cn(
        "rounded-md border p-3 space-y-2",
        note.isPinned
          ? "bg-action/5 border-action/20"
          : "bg-background border-border"
      )}
    >
      <p className="text-sm text-foreground whitespace-pre-wrap">
        {note.content}
      </p>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>by {note.createdBy}</span>
          <span aria-hidden="true">&middot;</span>
          <time dateTime={note.createdAt}>
            {formatRelativeDate(note.createdAt)}
          </time>
          {note.channel && (
            <Badge
              variant="ghost"
              className={cn(CHANNEL_COLORS[note.channel], "text-xs")}
            >
              {NOTE_CHANNEL_LABELS[note.channel]}
            </Badge>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={() => onTogglePin(note.id)}
          aria-label={note.isPinned ? "Unpin note" : "Pin note"}
        >
          {note.isPinned ? (
            <PinOff className="size-3" />
          ) : (
            <Pin className="size-3" />
          )}
        </Button>
      </div>
    </div>
  );
}

export function NotesPanel({ notes: initialNotes, entityType, entityId }: NotesPanelProps) {
  const [notes, setNotes] = useState<Note[]>(initialNotes);
  const [newContent, setNewContent] = useState("");
  const [selectedChannel, setSelectedChannel] = useState<string>("none");

  const pinnedNotes = notes.filter((n) => n.isPinned);
  const regularNotes = notes
    .filter((n) => !n.isPinned)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

  function handleAddNote() {
    if (!newContent.trim()) return;

    const note: Note = {
      id: crypto.randomUUID(),
      content: newContent.trim(),
      createdAt: new Date().toISOString(),
      createdBy: "You",
      isPinned: false,
      channel: selectedChannel === "none" ? null : (selectedChannel as NoteChannel),
      entityType,
      entityId,
    };

    setNotes((prev) => [note, ...prev]);
    setNewContent("");
    setSelectedChannel("none");
  }

  function handleTogglePin(id: string) {
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isPinned: !n.isPinned } : n))
    );
  }

  return (
    <div className="space-y-4">
      {/* Quick-add input */}
      <div className="space-y-2">
        <Textarea
          placeholder="Add a note..."
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
          className="min-h-20 resize-none"
          aria-label="New note content"
        />
        <div className="flex items-center justify-between gap-2">
          <Select value={selectedChannel} onValueChange={setSelectedChannel}>
            <SelectTrigger className="w-32" size="sm" aria-label="Communication channel">
              <SelectValue placeholder="Channel" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No channel</SelectItem>
              {(Object.entries(NOTE_CHANNEL_LABELS) as [NoteChannel, string][]).map(
                ([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                )
              )}
            </SelectContent>
          </Select>
          <Button
            size="sm"
            onClick={handleAddNote}
            disabled={!newContent.trim()}
          >
            <Plus className="size-4" />
            Add Note
          </Button>
        </div>
      </div>

      {/* Pinned notes */}
      {pinnedNotes.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            <Pin className="size-3" />
            Pinned
          </div>
          <div className="space-y-2">
            {pinnedNotes.map((note) => (
              <NoteItem
                key={note.id}
                note={note}
                onTogglePin={handleTogglePin}
              />
            ))}
          </div>
        </div>
      )}

      {/* Regular notes */}
      {regularNotes.length > 0 && (
        <div className="space-y-2">
          {pinnedNotes.length > 0 && (
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Recent
            </div>
          )}
          <div className="space-y-2">
            {regularNotes.map((note) => (
              <NoteItem
                key={note.id}
                note={note}
                onTogglePin={handleTogglePin}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {notes.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <StickyNote className="size-10 mb-3 opacity-40" />
          <p className="text-sm">No notes yet — add one above</p>
        </div>
      )}
    </div>
  );
}
