"use client";

import { useState } from "react";
import { ArrowRightLeft } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LANE_LABELS } from "@/lib/constants";
import type { Lane } from "@/lib/schemas/job";

const LANE_OPTIONS: Lane[] = [
  "ready",
  "in_progress",
  "review",
  "blocked",
  "done",
];

interface MoveLaneDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cardLabel: string;
  currentLane: Lane;
  onConfirm: (targetLane: Lane, blockReason?: string) => void;
  onCancel: () => void;
}

export function MoveLaneDialog({
  open,
  onOpenChange,
  cardLabel,
  currentLane,
  onConfirm,
  onCancel,
}: MoveLaneDialogProps) {
  const [targetLane, setTargetLane] = useState<Lane | "">("");
  const [blockReason, setBlockReason] = useState("");

  const isBlocked = targetLane === "blocked";
  const canConfirm = targetLane && targetLane !== currentLane && (!isBlocked || blockReason.trim());

  function handleConfirm() {
    if (!targetLane || targetLane === currentLane) return;
    onConfirm(
      targetLane,
      isBlocked ? blockReason.trim() : undefined,
    );
    resetState();
  }

  function handleCancel() {
    resetState();
    onCancel();
  }

  function resetState() {
    setTargetLane("");
    setBlockReason("");
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      handleCancel();
    }
    onOpenChange(nextOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft className="size-5 text-action" />
            Move Lane
          </DialogTitle>
          <DialogDescription>
            Move{" "}
            <span className="font-medium text-foreground">{cardLabel}</span>{" "}
            to a different lane.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <Select
            value={targetLane}
            onValueChange={(v) => setTargetLane(v as Lane)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select target lane" />
            </SelectTrigger>
            <SelectContent>
              {LANE_OPTIONS.filter((l) => l !== currentLane).map((lane) => (
                <SelectItem key={lane} value={lane}>
                  {LANE_LABELS[lane]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {isBlocked && (
            <Textarea
              placeholder="Block reason…"
              value={blockReason}
              onChange={(e) => setBlockReason(e.target.value)}
              className="min-h-20"
              autoFocus
            />
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!canConfirm}>
            Move
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
