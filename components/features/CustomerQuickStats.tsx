import { cn } from "@/lib/utils";
import { DollarSign, ShoppingBag, TrendingUp, Clock, Users } from "lucide-react";

export interface CustomerStats {
  lifetimeRevenue: number;
  totalOrders: number;
  avgOrderValue: number;
  lastOrderDate: string | null;
  referralCount?: number;
}

interface CustomerQuickStatsProps {
  stats: CustomerStats;
  variant?: "bar" | "header";
  className?: string;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDaysAgo(dateString: string | null): string {
  if (!dateString) return "No orders";
  const diffMs = Date.now() - new Date(dateString).getTime();
  const days = Math.floor(Math.abs(diffMs) / (1000 * 60 * 60 * 24));
  if (diffMs < 0) {
    // Future date
    if (days === 0) return "Today";
    if (days === 1) return "In 1 day";
    return `In ${days} days`;
  }
  if (days === 0) return "Today";
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}

const statItems = [
  {
    key: "revenue" as const,
    label: "Lifetime Revenue",
    icon: DollarSign,
    format: (s: CustomerQuickStatsProps["stats"]) =>
      formatCurrency(s.lifetimeRevenue),
  },
  {
    key: "orders" as const,
    label: "Total Orders",
    icon: ShoppingBag,
    format: (s: CustomerQuickStatsProps["stats"]) =>
      String(s.totalOrders),
  },
  {
    key: "aov" as const,
    label: "Avg Order",
    icon: TrendingUp,
    format: (s: CustomerQuickStatsProps["stats"]) =>
      formatCurrency(s.avgOrderValue),
  },
  {
    key: "lastOrder" as const,
    label: "Last Order",
    icon: Clock,
    format: (s: CustomerQuickStatsProps["stats"]) =>
      formatDaysAgo(s.lastOrderDate),
  },
];

export function CustomerQuickStats({
  stats,
  variant = "bar",
  className,
}: CustomerQuickStatsProps) {
  const showReferrals =
    stats.referralCount !== undefined && stats.referralCount > 0;

  if (variant === "bar") {
    return (
      <div
        className={cn(
          "flex flex-wrap items-center gap-4 text-sm",
          className
        )}
        aria-label="Customer statistics"
      >
        {statItems.map(({ key, label, icon: Icon, format }) => (
          <div key={key} className="flex items-center gap-1.5">
            <Icon className="size-4 text-muted-foreground" aria-hidden="true" />
            <span className="text-muted-foreground">{label}:</span>
            <span className="font-medium text-foreground">
              {format(stats)}
            </span>
          </div>
        ))}
        {showReferrals && (
          <div className="flex items-center gap-1.5">
            <Users className="size-4 text-muted-foreground" aria-hidden="true" />
            <span className="text-muted-foreground">Referrals:</span>
            <span className="font-medium text-foreground">
              {stats.referralCount}
            </span>
          </div>
        )}
      </div>
    );
  }

  // variant === "header" — more prominent, for customer detail page
  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-3 md:flex md:flex-wrap md:items-center md:gap-6",
        className
      )}
      aria-label="Customer statistics"
    >
      {statItems.map(({ key, label, icon: Icon, format }) => (
        <div key={key} className="flex flex-col gap-0.5">
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Icon className="size-4" aria-hidden="true" />
            {label}
          </span>
          <span className="text-sm font-semibold text-foreground">
            {format(stats)}
          </span>
        </div>
      ))}
      {showReferrals && (
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Users className="size-4" aria-hidden="true" />
            Referrals
          </span>
          <span className="text-sm font-semibold text-foreground">
            {stats.referralCount}
          </span>
        </div>
      )}
    </div>
  );
}
