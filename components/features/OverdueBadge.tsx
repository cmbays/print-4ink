"use client";

import { computeIsOverdue, computeDaysOverdue } from "@/lib/helpers/invoice-utils";

interface OverdueBadgeProps {
  dueDate: string;
  balanceDue: number;
  status: "draft" | "sent" | "partial" | "paid" | "void";
}

export function OverdueBadge({ dueDate, balanceDue, status }: OverdueBadgeProps) {
  const isOverdue = computeIsOverdue({ dueDate, balanceDue, status });

  if (!isOverdue) return null;

  const days = computeDaysOverdue(dueDate);

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-error/10 text-error border border-error/20 px-2 py-0.5 text-xs font-medium">
      <span
        className="relative flex h-1.5 w-1.5"
        aria-hidden="true"
      >
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-error opacity-75 motion-reduce:animate-none" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-error" />
      </span>
      {days} {days === 1 ? "day" : "days"} overdue
    </span>
  );
}
