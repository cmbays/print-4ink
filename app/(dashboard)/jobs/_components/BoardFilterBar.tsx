"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useCallback } from "react";
import { Filter, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LANE_LABELS,
  RISK_LABELS,
  SERVICE_TYPE_LABELS,
} from "@/lib/constants";
import { laneEnum, riskLevelEnum } from "@/lib/schemas/job";
import { serviceTypeEnum } from "@/lib/schemas/quote";
import type { Lane, RiskLevel } from "@/lib/schemas/job";
import type { ServiceType } from "@/lib/schemas/quote";
import type { CardFilters } from "@/lib/helpers/job-utils";

// ---------------------------------------------------------------------------
// Filter options
// ---------------------------------------------------------------------------

const SERVICE_TYPE_OPTIONS: { value: ServiceType; label: string }[] = [
  { value: "screen-print", label: SERVICE_TYPE_LABELS["screen-print"] },
  { value: "dtf", label: SERVICE_TYPE_LABELS["dtf"] },
  { value: "embroidery", label: SERVICE_TYPE_LABELS["embroidery"] },
];

const LANE_OPTIONS: { value: Lane; label: string }[] = [
  { value: "ready", label: LANE_LABELS["ready"] },
  { value: "in_progress", label: LANE_LABELS["in_progress"] },
  { value: "review", label: LANE_LABELS["review"] },
  { value: "blocked", label: LANE_LABELS["blocked"] },
  { value: "done", label: LANE_LABELS["done"] },
];

const RISK_OPTIONS: { value: RiskLevel; label: string }[] = [
  { value: "on_track", label: RISK_LABELS["on_track"] },
  { value: "getting_tight", label: RISK_LABELS["getting_tight"] },
  { value: "at_risk", label: RISK_LABELS["at_risk"] },
];

const HORIZON_OPTIONS: {
  value: "past_due" | "this_week" | "next_week";
  label: string;
}[] = [
  { value: "past_due", label: "Past Due" },
  { value: "this_week", label: "This Week" },
  { value: "next_week", label: "Next Week" },
];

// ---------------------------------------------------------------------------
// Hook: read filters from URL
// ---------------------------------------------------------------------------

export function useFiltersFromURL(): CardFilters {
  const searchParams = useSearchParams();

  const today = searchParams.get("today") === "true";
  const serviceType = serviceTypeEnum.safeParse(searchParams.get("serviceType")).data;
  const section = laneEnum.safeParse(searchParams.get("section")).data;
  const risk = riskLevelEnum.safeParse(searchParams.get("risk")).data;

  const rawHorizon = searchParams.get("horizon");
  const horizon =
    rawHorizon === "past_due" || rawHorizon === "this_week" || rawHorizon === "next_week"
      ? rawHorizon
      : undefined;

  return { today: today || undefined, serviceType, section, risk, horizon };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function BoardFilterBar() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const filters = useFiltersFromURL();

  const activeCount = [
    filters.today,
    filters.serviceType,
    filters.section,
    filters.risk,
    filters.horizon,
  ].filter(Boolean).length;

  // --- URL update helper ---
  const setParam = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      router.replace(`?${params.toString()}`, { scroll: false });
    },
    [searchParams, router],
  );

  const clearAll = useCallback(() => {
    router.replace("?", { scroll: false });
  }, [router]);

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Filter icon + count */}
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Filter className="size-4" />
        {activeCount > 0 && (
          <Badge
            variant="ghost"
            className="bg-action/10 text-action border border-action/20 text-[10px]"
          >
            {activeCount}
          </Badge>
        )}
      </div>

      {/* Today toggle */}
      <div className="flex items-center gap-1.5">
        <Switch
          id="today-filter"
          size="sm"
          checked={!!filters.today}
          onCheckedChange={(checked) =>
            setParam("today", checked ? "true" : null)
          }
        />
        <Label
          htmlFor="today-filter"
          className="text-xs text-muted-foreground cursor-pointer"
        >
          Today
        </Label>
      </div>

      {/* Service Type */}
      <Select
        value={filters.serviceType ?? "all"}
        onValueChange={(v) =>
          setParam("serviceType", v === "all" ? null : v)
        }
      >
        <SelectTrigger
          className={cn(
            "h-7 w-auto gap-1 rounded-md border-border/50 bg-transparent px-2 text-xs",
            filters.serviceType && "border-action/40 text-action",
          )}
        >
          <SelectValue placeholder="Service Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Types</SelectItem>
          {SERVICE_TYPE_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Lane (Section) filter */}
      <Select
        value={filters.section ?? "all"}
        onValueChange={(v) => setParam("section", v === "all" ? null : v)}
      >
        <SelectTrigger
          className={cn(
            "h-7 w-auto gap-1 rounded-md border-border/50 bg-transparent px-2 text-xs",
            filters.section && "border-action/40 text-action",
          )}
        >
          <SelectValue placeholder="Lane" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Lanes</SelectItem>
          {LANE_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Risk filter */}
      <Select
        value={filters.risk ?? "all"}
        onValueChange={(v) => setParam("risk", v === "all" ? null : v)}
      >
        <SelectTrigger
          className={cn(
            "h-7 w-auto gap-1 rounded-md border-border/50 bg-transparent px-2 text-xs",
            filters.risk && "border-action/40 text-action",
          )}
        >
          <SelectValue placeholder="Risk" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Risk</SelectItem>
          {RISK_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Horizon filter */}
      <Select
        value={filters.horizon ?? "all"}
        onValueChange={(v) => setParam("horizon", v === "all" ? null : v)}
      >
        <SelectTrigger
          className={cn(
            "h-7 w-auto gap-1 rounded-md border-border/50 bg-transparent px-2 text-xs",
            filters.horizon && "border-action/40 text-action",
          )}
        >
          <SelectValue placeholder="Horizon" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Dates</SelectItem>
          {HORIZON_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Clear all */}
      {activeCount > 0 && (
        <Button
          variant="ghost"
          size="xs"
          className="text-muted-foreground hover:text-foreground"
          onClick={clearAll}
        >
          <X className="size-3" />
          Clear
        </Button>
      )}
    </div>
  );
}
