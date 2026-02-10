"use client";

import { AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { Customer } from "@/lib/schemas/customer";

interface ArchiveDialogProps {
  customer: Customer;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ArchiveDialog({
  customer,
  open,
  onOpenChange,
}: ArchiveDialogProps) {
  function handleArchive() {
    // Phase 1: No actual archive
    console.log("Customer archived", customer.id);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="size-5 text-warning" />
            Archive Customer
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to archive{" "}
            <span className="font-medium text-foreground">
              {customer.company}
            </span>
            ?
          </DialogDescription>
        </DialogHeader>

        <p className="text-sm text-muted-foreground">
          Archived customers won&apos;t appear in searches or lists. You can
          restore them later.
        </p>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleArchive}>
            Archive
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
