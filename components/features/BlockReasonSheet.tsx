"use client";

import { useState } from "react";
import { BottomSheet } from "@shared/ui/primitives/bottom-sheet";
import { Button } from "@shared/ui/primitives/button";
import { Textarea } from "@shared/ui/primitives/textarea";
import { ShieldAlert } from "lucide-react";

interface BlockReasonSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobTitle: string;
  onConfirm: (reason: string) => void;
}

export function BlockReasonSheet({
  open,
  onOpenChange,
  jobTitle,
  onConfirm,
}: BlockReasonSheetProps) {
  const [reason, setReason] = useState("");

  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} title="Block Job">
      <div className="flex flex-col gap-4 p-4">
        <div className="flex items-center gap-2 text-warning">
          <ShieldAlert className="h-5 w-5" />
          <span className="text-sm font-medium">{jobTitle}</span>
        </div>
        <Textarea
          placeholder="Why is this job blocked?"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="min-h-20"
          autoFocus
        />
        <Button
          onClick={() => {
            onConfirm(reason.trim() || "Blocked (no reason given)");
            onOpenChange(false);
          }}
          className="min-h-(--mobile-touch-target) bg-warning text-background hover:bg-warning-hover"
        >
          Block Job
        </Button>
      </div>
    </BottomSheet>
  );
}
