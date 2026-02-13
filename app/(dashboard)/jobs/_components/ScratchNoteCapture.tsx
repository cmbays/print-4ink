"use client";

import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";

interface ScratchNoteCaptureProps {
  onSubmit: (content: string) => void;
  onCancel: () => void;
}

export function ScratchNoteCapture({
  onSubmit,
  onCancel,
}: ScratchNoteCaptureProps) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && value.trim()) {
      e.preventDefault();
      onSubmit(value.trim());
    } else if (e.key === "Escape") {
      e.preventDefault();
      onCancel();
    }
  }

  return (
    <div className="rounded-lg border border-dashed border-action/40 bg-elevated/60 p-2">
      <Input
        ref={inputRef}
        placeholder="Quick note… (Enter to save, Esc to cancel)"
        aria-label="Scratch note"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={onCancel}
        className="h-8 border-none bg-transparent text-sm shadow-none focus-visible:ring-0"
      />
    </div>
  );
}
