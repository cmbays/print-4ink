"use client";

import Link from "next/link";
import {
  ArrowRightLeft,
  ShieldAlert,
  ShieldCheck,
  LayoutGrid,
} from "lucide-react";
import { ENTITY_STYLES } from "@domain/constants/entities";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { Job } from "@domain/entities/job";

interface QuickActionsBarProps {
  job: Job;
  onMoveLane: () => void;
  onBlock: () => void;
  onUnblock: () => void;
}

export function QuickActionsBar({
  job,
  onMoveLane,
  onBlock,
  onUnblock,
}: QuickActionsBarProps) {
  const isBlocked = job.lane === "blocked";

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Move Lane */}
      <Button variant="outline" size="sm" className="gap-1.5" onClick={onMoveLane}>
        <ArrowRightLeft className="size-3.5" />
        Move Lane
      </Button>

      {/* Block / Unblock */}
      {isBlocked ? (
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 border-success/30 text-success hover:bg-success/10 hover:text-success"
          onClick={onUnblock}
        >
          <ShieldCheck className="size-3.5" />
          Unblock
        </Button>
      ) : (
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 border-error/30 text-error hover:bg-error/10 hover:text-error"
          onClick={onBlock}
        >
          <ShieldAlert className="size-3.5" />
          Mark Blocked
        </Button>
      )}

      {/* View Quote */}
      {job.sourceQuoteId && (
        <Button variant="outline" size="sm" className="gap-1.5" asChild>
          <Link href={`/quotes/${job.sourceQuoteId}`}>
            <ENTITY_STYLES.quote.icon className={cn("size-3.5", ENTITY_STYLES.quote.color)} />
            View Quote
          </Link>
        </Button>
      )}

      {/* View Invoice */}
      {job.invoiceId && (
        <Button variant="outline" size="sm" className="gap-1.5" asChild>
          <Link href={`/invoices/${job.invoiceId}`}>
            <ENTITY_STYLES.invoice.icon className={cn("size-3.5", ENTITY_STYLES.invoice.color)} />
            View Invoice
          </Link>
        </Button>
      )}

      {/* View on Board */}
      <Button variant="outline" size="sm" className="gap-1.5" asChild>
        <Link href="/jobs/board">
          <LayoutGrid className="size-3.5" />
          View on Board
        </Link>
      </Button>
    </div>
  );
}
