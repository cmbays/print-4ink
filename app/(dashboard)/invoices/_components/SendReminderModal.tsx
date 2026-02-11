"use client";

import { Send } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { computeIsOverdue, computeDaysOverdue } from "@/lib/helpers/invoice-utils";
import type { Invoice } from "@/lib/schemas/invoice";

interface SendReminderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: Invoice;
  customerEmail: string;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

export function SendReminderModal({
  open,
  onOpenChange,
  invoice,
  customerEmail,
}: SendReminderModalProps) {
  const isOverdue = computeIsOverdue(invoice);
  const daysOverdue = isOverdue ? computeDaysOverdue(invoice.dueDate) : 0;

  const subject = isOverdue
    ? `Overdue: Invoice ${invoice.invoiceNumber} — ${formatCurrency(invoice.balanceDue)} past due`
    : `Payment Reminder: Invoice ${invoice.invoiceNumber}`;

  const body = isOverdue
    ? `Hi,\n\nThis is a friendly reminder that invoice ${invoice.invoiceNumber} for ${formatCurrency(invoice.balanceDue)} was due ${daysOverdue} ${daysOverdue === 1 ? "day" : "days"} ago.\n\nPlease arrange payment at your earliest convenience.\n\nThank you,\n4Ink Screen Printing`
    : `Hi,\n\nThis is a friendly reminder that invoice ${invoice.invoiceNumber} for ${formatCurrency(invoice.balanceDue)} is due on ${new Date(invoice.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}.\n\nPlease let us know if you have any questions.\n\nThank you,\n4Ink Screen Printing`;

  function handleSend() {
    toast.success(`Reminder sent to ${customerEmail}`);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="size-5 text-action" />
            Send Payment Reminder
          </DialogTitle>
          <DialogDescription>
            Preview the reminder email for {invoice.invoiceNumber}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">To</p>
            <p className="text-sm text-foreground">{customerEmail}</p>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Subject</p>
            <p className="text-sm text-foreground">{subject}</p>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Body</p>
            <div className="rounded-md border border-border bg-elevated p-3">
              <pre className="whitespace-pre-wrap text-sm text-foreground font-sans leading-relaxed">
                {body}
              </pre>
            </div>
          </div>

          {isOverdue && (
            <p className="text-xs text-error font-medium">
              This invoice is {daysOverdue} {daysOverdue === 1 ? "day" : "days"} overdue
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSend}>
            <Send className="size-4" />
            Send Reminder
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
