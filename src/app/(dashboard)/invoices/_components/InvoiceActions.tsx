"use client";

import Link from "next/link";
import { Pencil, Send, Ban, CreditCard, Bell, FileText, Copy } from "lucide-react";
import { Button } from "@shared/ui/primitives/button";
import { toast } from "sonner";
import { isValidStatusTransition } from "@domain/rules/invoice.rules";
import type { Invoice } from "@domain/entities/invoice";
import type { Customer } from "@domain/entities/customer";

interface InvoiceActionsProps {
  invoice: Invoice;
  customer: Customer | null;
}

export function InvoiceActions({ invoice, customer }: InvoiceActionsProps) {
  const { status } = invoice;

  const canSend = status === "draft" && isValidStatusTransition(status, "sent");
  const canEdit = status === "draft";
  const canVoid =
    isValidStatusTransition(status, "void") && !invoice.isVoid;
  const canRecordPayment =
    status === "sent" || status === "partial";
  const canSendReminder =
    status === "sent" || status === "partial";
  const canIssueCreditMemo = status === "paid";
  const canDuplicate = status === "paid" || status === "void";

  return (
    <div className="flex flex-wrap items-center gap-2">
      {canEdit && (
        <Button variant="outline" size="sm" asChild>
          <Link href={`/invoices/${invoice.id}/edit`}>
            <Pencil className="size-4" />
            Edit
          </Link>
        </Button>
      )}

      {canSend && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            toast.success(`Invoice ${invoice.invoiceNumber} sent to ${customer?.email ?? "customer"}`);
          }}
        >
          <Send className="size-4" />
          Send
        </Button>
      )}

      {canRecordPayment && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            toast.info("Record Payment dialog coming in Phase 2");
          }}
        >
          <CreditCard className="size-4" />
          Record Payment
        </Button>
      )}

      {canSendReminder && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            toast.success(`Reminder sent for ${invoice.invoiceNumber}`);
          }}
        >
          <Bell className="size-4" />
          Send Reminder
        </Button>
      )}

      {canIssueCreditMemo && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            toast.info("Credit Memo form coming in Phase 2");
          }}
        >
          <FileText className="size-4" />
          Issue Credit Memo
        </Button>
      )}

      {canDuplicate && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            toast.info("Duplicate invoice coming in Phase 2");
          }}
        >
          <Copy className="size-4" />
          Duplicate
        </Button>
      )}

      {canVoid && (
        <Button
          variant="outline"
          size="sm"
          className="text-error hover:text-error hover:bg-error/10"
          onClick={() => {
            toast.success(`Invoice ${invoice.invoiceNumber} voided`);
          }}
        >
          <Ban className="size-4" />
          Void
        </Button>
      )}
    </div>
  );
}
