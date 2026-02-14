"use client";

import { useState } from "react";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { LANE_LABELS } from "@/lib/constants";
import type { Lane } from "@/lib/schemas/job";

const LANE_OPTIONS: { value: Lane; color: string }[] = [
  { value: "ready", color: "text-foreground" },
  { value: "in_progress", color: "text-action" },
  { value: "review", color: "text-purple" },
  { value: "blocked", color: "text-warning" },
  { value: "done", color: "text-success" },
];

interface LaneSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentLane: Lane;
  onConfirm: (lane: Lane, blockReason?: string) => void;
}

export function LaneSelector({
  open,
  onOpenChange,
  currentLane,
  onConfirm,
}: LaneSelectorProps) {
  const [selectedLane, setSelectedLane] = useState<Lane>(currentLane);
  const [blockReason, setBlockReason] = useState("");

  const handleConfirm = () => {
    onConfirm(
      selectedLane,
      selectedLane === "blocked" ? blockReason : undefined
    );
    // State reset via conditional rendering
    onOpenChange(false);
  };

  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} title="Move Lane">
      <div className="flex flex-col gap-2 p-4">
        {LANE_OPTIONS.map((lane) => (
          <button
            key={lane.value}
            onClick={() => setSelectedLane(lane.value)}
            className={cn(
              "flex items-center justify-between rounded-lg border px-4 py-3 text-left transition-colors",
              "min-h-(--mobile-touch-target)",
              selectedLane === lane.value
                ? "border-action bg-action/10"
                : "border-border hover:bg-surface",
              lane.value === currentLane && "opacity-50"
            )}
            disabled={lane.value === currentLane}
          >
            <span className={cn("text-sm font-medium", lane.color)}>
              {LANE_LABELS[lane.value]}
            </span>
            {lane.value === currentLane && (
              <span className="text-xs text-muted-foreground">Current</span>
            )}
            {selectedLane === lane.value && lane.value !== currentLane && (
              <Check className="h-4 w-4 text-action" />
            )}
          </button>
        ))}

        {/* Block reason input */}
        {selectedLane === "blocked" && selectedLane !== currentLane && (
          <Textarea
            placeholder="Block reason..."
            value={blockReason}
            onChange={(e) => setBlockReason(e.target.value)}
            className="mt-2 min-h-20"
          />
        )}

        <Button
          onClick={handleConfirm}
          disabled={selectedLane === currentLane}
          className="mt-2 min-h-(--mobile-touch-target)"
        >
          Confirm Move
        </Button>
      </div>
    </BottomSheet>
  );
}
