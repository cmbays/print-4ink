"use client";

import { useState, useMemo } from "react";
import { Plus, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NoteItem } from "./NoteItem";
import type { JobNote, JobNoteType } from "@/lib/schemas/job";

interface NotesFeedProps {
  notes: JobNote[];
  onAddNote: (type: JobNoteType, content: string) => void;
}

const NOTE_FILTER_TABS: Array<{ value: string; label: string }> = [
  { value: "all", label: "All" },
  { value: "internal", label: "Internal" },
  { value: "customer", label: "Customer" },
  { value: "system", label: "System" },
];

export function NotesFeed({ notes, onAddNote }: NotesFeedProps) {
  const [activeFilter, setActiveFilter] = useState("all");
  const [newNoteContent, setNewNoteContent] = useState("");
  const [newNoteType, setNewNoteType] = useState<JobNoteType>("internal");

  // Filter and sort notes chronologically (newest first)
  const filteredNotes = useMemo(() => {
    const sorted = [...notes].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    if (activeFilter === "all") return sorted;
    return sorted.filter((n) => n.type === activeFilter);
  }, [notes, activeFilter]);

  function handleAddNote() {
    const content = newNoteContent.trim();
    if (!content) return;
    onAddNote(newNoteType, content);
    setNewNoteContent("");
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAddNote();
    }
  }

  return (
    <section className="rounded-lg border border-border bg-card">
      <div className="border-b border-border px-4 py-3">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Notes
        </h2>
      </div>

      {/* Filter tabs */}
      <div className="border-b border-border px-4 py-2">
        <Tabs value={activeFilter} onValueChange={setActiveFilter}>
          <TabsList variant="line" className="h-8">
            {NOTE_FILTER_TABS.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="text-xs px-2 py-1"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Quick-add form */}
      <div className="flex items-center gap-2 border-b border-border/50 px-4 py-3">
        <Select
          value={newNoteType}
          onValueChange={(v) => setNewNoteType(v as JobNoteType)}
        >
          <SelectTrigger size="sm" className="w-28 shrink-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="internal">Internal</SelectItem>
            <SelectItem value="customer">Customer</SelectItem>
          </SelectContent>
        </Select>
        <Input
          placeholder="Add a note..."
          value={newNoteContent}
          onChange={(e) => setNewNoteContent(e.target.value)}
          onKeyDown={handleKeyDown}
          className="h-8 text-sm"
        />
        <Button
          size="sm"
          className="gap-1.5 shrink-0"
          onClick={handleAddNote}
          disabled={!newNoteContent.trim()}
        >
          <Plus className="size-3.5" />
          Add
        </Button>
      </div>

      {/* Notes feed */}
      <div className="divide-y divide-border/30 px-1">
        {filteredNotes.map((note) => (
          <NoteItem key={note.id} note={note} />
        ))}
      </div>

      {/* Empty state */}
      {filteredNotes.length === 0 && (
        <div className="flex flex-col items-center justify-center px-4 py-8 text-center">
          <MessageSquare className="size-8 text-muted-foreground/40" />
          <p className="mt-2 text-sm text-muted-foreground">
            {activeFilter === "all"
              ? "No notes yet."
              : `No ${activeFilter} notes.`}
          </p>
        </div>
      )}
    </section>
  );
}
