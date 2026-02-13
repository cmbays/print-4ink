"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useCallback } from "react";
import { Filter, X, Layers, SplitSquareHorizontal } from "lucide-react";
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
  RISK_LABELS,
  SERVICE_TYPE_LABELS,
} from "@/lib/constants";
import { z } from "zod";
import { riskLevelEnum } from "@/lib/schemas/job";
import { serviceTypeEnum } from "@/lib/schemas/quote";
import type { RiskLevel } from "@/lib/schemas/job";
import type { ServiceType } from "@/lib/schemas/quote";
import type { CardFilters } from "@/lib/helpers/job-utils";

const horizonEnum = z.enum(["past_due", "this_week", "next_week"]);
const layoutEnum = z.enum(["combined", "split"]);

export type BoardLayout = z.infer<typeof layoutEnum>;

// ---------------------------------------------------------------------------
// Filter options
// ---------------------------------------------------------------------------

const SERVICE_TYPE_OPTIONS: { value: ServiceType; label: string }[] = [
  { value: "screen-print", label: SERVICE_TYPE_LABELS["screen-print"] },
  { value: "dtf", label: SERVICE_TYPE_LABELS["dtf"] },
  { value: "embroidery", label: SERVICE_TYPE_LABELS["embroidery"] },
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
  { value: "this_week", label: "Due This Week" },
  { value: "next_week", label: "Due Next Week" },
];

// ---------------------------------------------------------------------------
// Hook: read filters from URL
// ---------------------------------------------------------------------------

export function useFiltersFromURL(): CardFilters {
  const searchParams = useSearchParams();

  const today = searchParams.get("today") === "true";
  const serviceType = serviceTypeEnum.safeParse(searchParams.get("serviceType")).data;
  const risk = riskLevelEnum.safeParse(searchParams.get("risk")).data;
  const horizon = horizonEnum.safeParse(searchParams.get("horizon")).data;

  return { today: today || undefined, serviceType, risk, horizon };
}

export function useLayoutFromURL(): BoardLayout {
  const searchParams = useSearchParams();
  return layoutEnum.safeParse(searchParams.get("layout")).data ?? "combined";
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
    const params = new URLSearchParams();
    const currentLayout = searchParams.get("layout");
    if (currentLayout) params.set("layout", currentLayout);
    router.replace(`?${params.toString()}`, { scroll: false });
  }, [router, searchParams]);

  const layout = useLayoutFromURL();

  return (
    <div role="group" aria-label="Board filters" className="flex flex-wrap items-center gap-3">
      {/* Layout toggle: Combined / Split */}
      <div
        role="group"
        aria-label="Board layout"
        className="flex items-center rounded-md border border-border/50 p-0.5"
      >
        <Button
          variant="ghost"
          size="xs"
          className={cn(
            "gap-1 rounded-sm px-2 py-1 text-xs",
            layout === "combined"
              ? "bg-surface text-foreground"
              : "text-muted-foreground",
          )}
          aria-pressed={layout === "combined"}
          onClick={() => setParam("layout", null)}
        >
          <Layers className="size-3" />
          Combined
        </Button>
        <Button
          variant="ghost"
          size="xs"
          className={cn(
            "gap-1 rounded-sm px-2 py-1 text-xs",
            layout === "split"
              ? "bg-surface text-foreground"
              : "text-muted-foreground",
          )}
          aria-pressed={layout === "split"}
          onClick={() => setParam("layout", "split")}
        >
          <SplitSquareHorizontal className="size-3" />
          Split
        </Button>
      </div>

      {/* Divider */}
      <div className="h-4 w-px bg-border/50" />

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
          <SelectItem value="all">All Service Types</SelectItem>
          {SERVICE_TYPE_OPTIONS.map((opt) => (
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
          <SelectItem value="all">All Due Dates</SelectItem>
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
