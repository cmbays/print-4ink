"use client";

import type { Customer } from "@/lib/schemas/customer";
import { quotes } from "@/lib/mock-data";
import { Users, UserCheck, DollarSign, UserPlus } from "lucide-react";

function computeRevenueYTD(): number {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  return quotes
    .filter(
      (q) => q.status === "accepted" && new Date(q.createdAt) >= startOfYear
    )
    .reduce((sum, q) => sum + q.total, 0);
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

const stats = [
  { key: "total", label: "Total Customers", icon: Users },
  { key: "active", label: "Active", icon: UserCheck },
  { key: "revenue", label: "Revenue YTD", icon: DollarSign },
  { key: "prospects", label: "Prospects", icon: UserPlus },
] as const;

interface CustomerListStatsBarProps {
  customers: Customer[];
}

export function CustomerListStatsBar({
  customers,
}: CustomerListStatsBarProps) {
  const activeCustomers = customers.filter((c) => !c.isArchived);
  const total = activeCustomers.length;
  const active = activeCustomers.filter(
    (c) => c.healthStatus === "active"
  ).length;
  const prospects = activeCustomers.filter(
    (c) => c.lifecycleStage === "prospect"
  ).length;
  const revenueYTD = computeRevenueYTD();

  const values: Record<(typeof stats)[number]["key"], string> = {
    total: String(total),
    active: String(active),
    revenue: formatCurrency(revenueYTD),
    prospects: String(prospects),
  };

  return (
    <div
      className="grid grid-cols-2 gap-3 sm:grid-cols-4"
      aria-label="Customer statistics overview"
    >
      {stats.map(({ key, label, icon: Icon }) => (
        <div
          key={key}
          className="rounded-lg border border-border bg-elevated p-4"
        >
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{label}</span>
          </div>
          <p className="mt-1 text-lg font-semibold text-foreground">
            {values[key]}
          </p>
        </div>
      ))}
    </div>
  );
}

