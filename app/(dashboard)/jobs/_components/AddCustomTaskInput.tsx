"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface AddCustomTaskInputProps {
  onAdd: (label: string, detail?: string) => void;
  onCancel: () => void;
}

export function AddCustomTaskInput({ onAdd, onCancel }: AddCustomTaskInputProps) {
  const [label, setLabel] = useState("");
  const [detail, setDetail] = useState("");

  function handleSubmit() {
    const trimmedLabel = label.trim();
    if (!trimmedLabel) return;
    onAdd(trimmedLabel, detail.trim() || undefined);
    setLabel("");
    setDetail("");
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === "Escape") {
      onCancel();
    }
  }

  return (
    <div className="flex flex-col gap-2 rounded-md border border-border/50 bg-surface/30 p-3">
      <Input
        placeholder="Task label..."
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        onKeyDown={handleKeyDown}
        autoFocus
        className="h-8 text-sm"
      />
      <Input
        placeholder="Optional detail..."
        value={detail}
        onChange={(e) => setDetail(e.target.value)}
        onKeyDown={handleKeyDown}
        className="h-8 text-sm"
      />
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          className="gap-1.5"
          onClick={handleSubmit}
          disabled={!label.trim()}
        >
          <Plus className="size-3.5" />
          Add
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5"
          onClick={onCancel}
        >
          <X className="size-3.5" />
          Cancel
        </Button>
      </div>
    </div>
  );
}
