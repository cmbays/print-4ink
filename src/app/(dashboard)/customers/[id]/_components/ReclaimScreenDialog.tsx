"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@shared/ui/primitives/dialog";
import { Button } from "@shared/ui/primitives/button";
import type { CustomerScreen } from "@domain/entities/customer-screen";

interface ReclaimScreenDialogProps {
  screen: CustomerScreen;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function ReclaimScreenDialog({
  screen,
  open,
  onOpenChange,
  onConfirm,
}: ReclaimScreenDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reclaim Screen</DialogTitle>
          <DialogDescription>
            This will mark the screen for &ldquo;{screen.artworkName}&rdquo; as
            reclaimed. The screen frame will be available for reuse.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 rounded-md bg-surface p-3 text-sm">
          <p><span className="text-muted-foreground">Artwork:</span> {screen.artworkName}</p>
          <p><span className="text-muted-foreground">Mesh:</span> {screen.meshCount}</p>
          <p><span className="text-muted-foreground">Colors:</span> {screen.colorIds.length}</p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            Reclaim
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
