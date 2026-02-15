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
      className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
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
          {/* Company name — hidden on mobile since breadcrumb shows it */}
          <h1 className="hidden md:block text-2xl font-bold text-foreground tracking-tight">
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
                  {/* Desktop: copy-to-clipboard button */}
                  <span className="hidden md:inline">
                    <CopyButton value={primaryContact.email} label="email" />
                  </span>
                  {/* Mobile: tap-to-email link */}
                  <a
                    href={`mailto:${primaryContact.email}`}
                    className="md:hidden inline-flex items-center min-h-(--mobile-touch-target) text-sm text-action active:text-action/80 transition-colors"
                    aria-label={`Email ${primaryContact.email}`}
                  >
                    {primaryContact.email}
                  </a>
                </span>
              )}
              {primaryContact.phone && (
                <span className="inline-flex items-center gap-1">
                  <Phone className="size-3 text-muted-foreground" aria-hidden="true" />
                  {/* Desktop: copy-to-clipboard button */}
                  <span className="hidden md:inline">
                    <CopyButton value={primaryContact.phone} label="phone" />
                  </span>
                  {/* Mobile: tap-to-call link */}
                  <a
                    href={`tel:${primaryContact.phone}`}
                    className="md:hidden inline-flex items-center min-h-(--mobile-touch-target) text-sm text-action active:text-action/80 transition-colors"
                    aria-label={`Call ${primaryContact.phone}`}
                  >
                    {primaryContact.phone}
                  </a>
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
            className="text-error/70 border-error/30 hover:text-error hover:border-error/50 hover:bg-error/5 focus-visible:ring-error/50"
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
