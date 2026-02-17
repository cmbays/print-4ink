"use client";

import { useState } from "react";
import { BottomSheet } from "@shared/ui/primitives/bottom-sheet";
import { Button } from "@shared/ui/primitives/button";
import { Textarea } from "@shared/ui/primitives/textarea";
import { Switch } from "@shared/ui/primitives/switch";
import { Label } from "@shared/ui/primitives/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/primitives/select";
import { Send, ShieldAlert, ShieldCheck } from "lucide-react";

const channels = [
  { value: "phone", label: "Phone" },
  { value: "email", label: "Email" },
  { value: "text", label: "Text" },
  { value: "social", label: "Social" },
  { value: "in-person", label: "In Person" },
];

const noteTypes = [
  { value: "internal", label: "Internal" },
  { value: "customer", label: "Customer" },
];

interface NoteCaptureProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobTitle: string;
  currentLane: string;
  onSave: (data: {
    content: string;
    type: "internal" | "customer";
    channel: string;
    blockJob?: boolean;
    blockReason?: string;
    unblockJob?: boolean;
  }) => void;
}

export function NoteCapture({
  open,
  onOpenChange,
  jobTitle,
  currentLane,
  onSave,
}: NoteCaptureProps) {
  const [content, setContent] = useState("");
  const [noteType, setNoteType] = useState<"internal" | "customer">("internal");
  const [channel, setChannel] = useState("phone");
  const [blockToggle, setBlockToggle] = useState(false);
  const [unblockToggle, setUnblockToggle] = useState(false);

  const isBlocked = currentLane === "blocked";
  const canSave = content.trim().length > 0;

  const handleSave = () => {
    if (!canSave) return;
    onSave({
      content: content.trim(),
      type: noteType,
      channel,
      blockJob: !isBlocked && blockToggle ? true : undefined,
      blockReason:
        !isBlocked && blockToggle ? content.trim() : undefined,
      unblockJob: isBlocked && unblockToggle ? true : undefined,
    });
    // State reset via conditional rendering — parent renders
    // {open && <NoteCapture />} so React unmounts/remounts.
    onOpenChange(false);
  };

  return (
    <BottomSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Add Note"
      description={jobTitle}
    >
      <div className="flex flex-col gap-4 p-4">
        <Textarea
          placeholder="Type your note..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="min-h-24 resize-none"
          autoFocus
        />

        {/* Type + Channel row */}
        <div className="flex gap-2">
          <Select
            value={noteType}
            onValueChange={(v) => setNoteType(v as "internal" | "customer")}
          >
            <SelectTrigger className="flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {noteTypes.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={channel} onValueChange={setChannel}>
            <SelectTrigger className="flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {channels.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Side effects — block/unblock toggles */}
        {!isBlocked && (
          <div className="flex items-center gap-3 rounded-lg border border-border p-3">
            <ShieldAlert className="h-5 w-5 shrink-0 text-warning" />
            <div className="flex-1">
              <Label htmlFor="block-toggle" className="text-sm font-medium">
                Block this job
              </Label>
              <p className="text-xs text-muted-foreground">
                Note becomes the block reason
              </p>
            </div>
            <Switch
              id="block-toggle"
              checked={blockToggle}
              onCheckedChange={setBlockToggle}
            />
          </div>
        )}

        {isBlocked && (
          <div className="flex items-center gap-3 rounded-lg border border-success/30 p-3">
            <ShieldCheck className="h-5 w-5 shrink-0 text-success" />
            <div className="flex-1">
              <Label htmlFor="unblock-toggle" className="text-sm font-medium">
                Unblock this job
              </Label>
              <p className="text-xs text-muted-foreground">
                Move back to previous lane
              </p>
            </div>
            <Switch
              id="unblock-toggle"
              checked={unblockToggle}
              onCheckedChange={setUnblockToggle}
            />
          </div>
        )}

        <Button
          onClick={handleSave}
          disabled={!canSave}
          className="min-h-(--mobile-touch-target)"
        >
          <Send className="mr-2 h-4 w-4" />
          {blockToggle
            ? "Save Note & Block Job"
            : unblockToggle
              ? "Save Note & Unblock"
              : "Save Note"}
        </Button>
      </div>
    </BottomSheet>
  );
}
