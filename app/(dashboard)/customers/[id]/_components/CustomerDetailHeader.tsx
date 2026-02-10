"use client";

import { useState } from "react";
import Link from "next/link";
import { Copy, Check, Plus, Pencil, Archive, Mail, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LifecycleBadge } from "@/components/features/LifecycleBadge";
import { HealthBadge } from "@/components/features/HealthBadge";
import { TypeTagBadges } from "@/components/features/TypeTagBadges";
import { CustomerQuickStats, type CustomerStats } from "@/components/features/CustomerQuickStats";
import { EditCustomerSheet } from "./EditCustomerSheet";
import { ArchiveDialog } from "./ArchiveDialog";
import type { Customer } from "@/lib/schemas/customer";

interface CustomerDetailHeaderProps {
  customer: Customer;
  stats: CustomerStats;
}

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors group"
      aria-label={`Copy ${label}: ${value}`}
    >
      {value}
      {copied ? (
        <Check className="size-3 text-success" />
      ) : (
        <Copy className="size-3 opacity-0 group-hover:opacity-100 transition-opacity" />
      )}
    </button>
  );
}

export function CustomerDetailHeader({ customer, stats }: CustomerDetailHeaderProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);

  const primaryContact = customer.contacts.find((c) => c.isPrimary) ?? customer.contacts[0];

  return (
    <div className="space-y-4">
      {/* Top row: name + badges + actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          {/* Company name */}
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            {customer.company}
          </h1>

          {/* Primary contact info */}
          {primaryContact && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <span className="text-sm font-medium text-foreground">
                {primaryContact.name}
              </span>
              {primaryContact.email && (
                <span className="inline-flex items-center gap-1">
                  <Mail className="size-3 text-muted-foreground" aria-hidden="true" />
                  <CopyButton value={primaryContact.email} label="email" />
                </span>
              )}
              {primaryContact.phone && (
                <span className="inline-flex items-center gap-1">
                  <Phone className="size-3 text-muted-foreground" aria-hidden="true" />
                  <CopyButton value={primaryContact.phone} label="phone" />
                </span>
              )}
            </div>
          )}

          {/* Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <LifecycleBadge stage={customer.lifecycleStage} />
            <HealthBadge status={customer.healthStatus} />
            <TypeTagBadges tags={customer.typeTags} />
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
          <Button asChild>
            <Link href={`/quotes/new?customer=${customer.id}`}>
              <Plus className="size-4" />
              New Quote
            </Link>
          </Button>
          <Button variant="outline" onClick={() => setEditOpen(true)}>
            <Pencil className="size-4" />
            <span className="hidden sm:inline">Edit</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => setArchiveOpen(true)}
            className="text-muted-foreground hover:text-error hover:border-error/50"
          >
            <Archive className="size-4" />
            <span className="hidden sm:inline">Archive</span>
          </Button>
        </div>
      </div>

      {/* Quick stats */}
      <CustomerQuickStats stats={stats} variant="header" />

      {/* Modals */}
      <EditCustomerSheet
        customer={customer}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
      <ArchiveDialog
        customer={customer}
        open={archiveOpen}
        onOpenChange={setArchiveOpen}
      />
    </div>
  );
}
