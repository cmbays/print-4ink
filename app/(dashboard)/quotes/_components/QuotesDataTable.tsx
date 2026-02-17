"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Archive,
  Package,
  Plus,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { ENTITY_STYLES } from "@/lib/constants/entities";
import { MoneyAmount } from "@/components/features/MoneyAmount";
import { z } from "zod";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { StatusBadge } from "@/components/features/StatusBadge";
import { ColumnHeaderMenu } from "@/components/features/ColumnHeaderMenu";
import { MobileFilterSheet } from "@/components/features/MobileFilterSheet";
import { formatDate } from "@/lib/helpers/format";
import type { Quote, QuoteStatus } from "@/lib/schemas/quote";
import type { Customer } from "@/lib/schemas/customer";

// ---------------------------------------------------------------------------
// Derived table rows
// ---------------------------------------------------------------------------

type TableQuote = {
  id: string;
  quoteNumber: string;
  customerId: string;
  customerName: string;
  status: QuoteStatus;
  lineItemCount: number;
  total: number;
  createdAt: string;
  isArchived: boolean;
};

type QuotesDataTableProps = {
  quotes: Quote[];
  customers: Customer[];
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "draft", label: "Draft" },
  { value: "sent", label: "Sent" },
  { value: "accepted", label: "Accepted" },
  { value: "declined", label: "Declined" },
  { value: "revised", label: "Revised" },
];

const sortKeySchema = z.enum(["quoteNumber", "customerName", "status", "lineItemCount", "createdAt", "total"]);
type SortKey = z.infer<typeof sortKeySchema>;

const sortDirSchema = z.enum(["asc", "desc"]);
type SortDir = z.infer<typeof sortDirSchema>;


// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function QuotesDataTable({ quotes, customers }: QuotesDataTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const tableQuotes = useMemo<TableQuote[]>(
    () =>
      quotes.map((q) => {
        const customer = customers.find((c) => c.id === q.customerId);
        return {
          id: q.id,
          quoteNumber: q.quoteNumber,
          customerId: q.customerId,
          customerName: customer?.company ?? customer?.name ?? "Unknown",
          status: q.status,
          lineItemCount: q.lineItems.length,
          total: q.total,
          createdAt: q.createdAt,
          isArchived: q.isArchived,
        };
      }),
    [quotes, customers]
  );

  // ---- URL state reads ----------------------------------------------------
  const searchQuery = searchParams.get("q") ?? "";
  const showArchived = searchParams.get("archived") === "true";
  const sortKeyParam = sortKeySchema.catch("createdAt").parse(searchParams.get("sort") ?? "createdAt");
  const sortDirParam = sortDirSchema.catch("desc").parse(searchParams.get("dir") ?? "desc");

  // Status filter (comma-separated for multi-select via ColumnHeaderMenu)
  const statusFilterRaw = searchParams.get("status");
  const activeStatuses = useMemo(
    () => statusFilterRaw?.split(",").filter(Boolean) ?? [],
    [statusFilterRaw],
  );

  // ---- Local state --------------------------------------------------------
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const [sortKey, setSortKey] = useState<SortKey>(sortKeyParam);
  const [sortDir, setSortDir] = useState<SortDir>(sortDirParam);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);

  // Sync from URL on back/forward navigation
  useEffect(() => {
    setLocalSearch(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    setSortKey(sortKeyParam);
    setSortDir(sortDirParam);
  }, [sortKeyParam, sortDirParam]);

  // ---- Debounced search -> URL --------------------------------------------
  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (localSearch) {
        params.set("q", localSearch);
      } else {
        params.delete("q");
      }
      router.replace(`?${params.toString()}`, { scroll: false });
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally omitting searchParams to avoid re-render loop
  }, [localSearch, router]);

  // ---- URL update helpers -------------------------------------------------

  const updateParam = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value !== null) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      router.replace(`?${params.toString()}`, { scroll: false });
    },
    [searchParams, router],
  );

  const clearFilters = useCallback(() => {
    router.replace("?", { scroll: false });
    setLocalSearch("");
  }, [router]);

  // ---- Status filter toggle -----------------------------------------------

  const handleStatusToggle = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      const current = params.get("status")?.split(",").filter(Boolean) ?? [];

      let next: string[];
      if (current.includes(value)) {
        next = current.filter((s) => s !== value);
      } else {
        next = [...current, value];
      }

      if (next.length > 0) {
        params.set("status", next.join(","));
      } else {
        params.delete("status");
      }
      router.replace(`?${params.toString()}`, { scroll: false });
    },
    [searchParams, router],
  );

  const handleStatusFilterClear = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("status");
    router.replace(`?${params.toString()}`, { scroll: false });
  }, [searchParams, router]);

  // ---- Archived toggle ----------------------------------------------------

  const toggleArchived = useCallback(() => {
    updateParam("archived", showArchived ? null : "true");
  }, [showArchived, updateParam]);

  // ---- Sort ---------------------------------------------------------------

  const handleSort = useCallback(
    (key: SortKey, explicitDir?: SortDir) => {
      let nextDir: SortDir;
      if (explicitDir) {
        nextDir = explicitDir;
      } else if (sortKey === key) {
        nextDir = sortDir === "asc" ? "desc" : "asc";
      } else {
        nextDir = "asc";
      }
      setSortKey(key);
      setSortDir(nextDir);

      const params = new URLSearchParams(searchParams.toString());
      params.set("sort", key);
      params.set("dir", nextDir);
      router.replace(`?${params.toString()}`, { scroll: false });
    },
    [sortKey, sortDir, searchParams, router],
  );

  // ---- Filter + sort pipeline ---------------------------------------------

  const filteredQuotes = useMemo(() => {
    let result = tableQuotes;

    // 1. Archive toggle (hide archived by default)
    if (!showArchived) {
      result = result.filter((q) => !q.isArchived);
    }

    // 2. Status filter
    if (activeStatuses.length > 0) {
      result = result.filter((q) => activeStatuses.includes(q.status));
    }

    // 3. Search filter
    if (searchQuery) {
      const lower = searchQuery.toLowerCase();
      result = result.filter(
        (q) =>
          q.quoteNumber.toLowerCase().includes(lower) ||
          q.customerName.toLowerCase().includes(lower),
      );
    }

    // 4. Sort
    result = [...result].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "quoteNumber":
          cmp = a.quoteNumber.localeCompare(b.quoteNumber);
          break;
        case "customerName":
          cmp = a.customerName.localeCompare(b.customerName);
          break;
        case "status":
          cmp = a.status.localeCompare(b.status);
          break;
        case "lineItemCount":
          cmp = a.lineItemCount - b.lineItemCount;
          break;
        case "total":
          cmp = a.total - b.total;
          break;
        case "createdAt":
          cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return result;
  }, [tableQuotes, showArchived, activeStatuses, searchQuery, sortKey, sortDir]);

  // ---- Check if any filters are active ------------------------------------

  const hasFilters = searchQuery.length > 0 || activeStatuses.length > 0 || showArchived;

  return (
    <div className="flex flex-col gap-4">
      {/* ---- Sticky header area ---- */}
      <div className="sticky top-0 z-10 bg-background pb-2">
        {/* Header row: title + search + archive toggle + action button */}
        <div className="flex items-center gap-3">
          <h1 className="hidden md:block text-2xl font-semibold tracking-tight shrink-0">Quotes</h1>

          <div className="hidden md:block flex-1" />

          {/* Search bar — full width on mobile, constrained on desktop */}
          <div className="relative flex-1 md:flex-none md:w-full md:max-w-xs">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              placeholder="Search quotes or customers..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="pl-9"
              aria-label="Search quotes"
            />
            {localSearch && (
              <button
                type="button"
                onClick={() => setLocalSearch("")}
                className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                aria-label="Clear search"
              >
                <X className="size-4" />
              </button>
            )}
          </div>

          {/* Mobile filter button */}
          <button
            type="button"
            onClick={() => setFilterSheetOpen(true)}
            className={cn(
              "inline-flex items-center justify-center rounded-md p-2 md:hidden",
              "min-h-(--mobile-touch-target) min-w-(--mobile-touch-target)",
              "text-muted-foreground hover:text-foreground transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              (activeStatuses.length > 0) && "text-action",
            )}
            aria-label="Sort & Filter"
          >
            <SlidersHorizontal className="size-4" />
          </button>

          {/* Archive toggle — icon only with tooltip */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={toggleArchived}
                className={cn(
                  "inline-flex items-center justify-center rounded-md p-2 transition-colors",
                  "min-h-(--mobile-touch-target) min-w-(--mobile-touch-target) md:min-h-0 md:min-w-0",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  "active:scale-95 disabled:opacity-50 disabled:pointer-events-none",
                  showArchived
                    ? "bg-error/10 text-error border border-error"
                    : "bg-transparent text-error/60 border border-transparent hover:text-error hover:bg-error/5",
                )}
                aria-label={showArchived ? "Hide Archived" : "Show Archived"}
              >
                <Archive className="size-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              {showArchived ? "Hide Archived" : "Show Archived"}
            </TooltipContent>
          </Tooltip>

          <Button asChild className="bg-action text-primary-foreground font-medium shadow-brutal shadow-action/30 hover:shadow-brutal-sm hover:translate-x-[2px] hover:translate-y-[2px] transition-all">
            <Link href="/quotes/new">
              <Plus className="size-4" />
              New Quote
            </Link>
          </Button>
        </div>

        {/* Clear all filters */}
        {hasFilters && (
          <div className="flex items-center mt-2">
            <button
              type="button"
              onClick={clearFilters}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* ---- Table + Cards ---- */}
      {filteredQuotes.length > 0 ? (
        <>
        {/* Desktop table */}
        <div className="hidden rounded-md border border-border md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <ColumnHeaderMenu
                    label="Quote #"
                    sortKey="quoteNumber"
                    currentSortKey={sortKey}
                    currentSortDir={sortDir}
                    onSort={(_k, dir) => handleSort("quoteNumber", dir)}
                  />
                </TableHead>
                <TableHead>
                  <ColumnHeaderMenu
                    label="Customer"
                    sortKey="customerName"
                    currentSortKey={sortKey}
                    currentSortDir={sortDir}
                    onSort={(_k, dir) => handleSort("customerName", dir)}
                  />
                </TableHead>
                <TableHead>
                  <ColumnHeaderMenu
                    label="Status"
                    sortKey="status"
                    currentSortKey={sortKey}
                    currentSortDir={sortDir}
                    onSort={(_k, dir) => handleSort("status", dir)}
                    filterOptions={STATUS_OPTIONS}
                    activeFilters={activeStatuses}
                    onFilterToggle={handleStatusToggle}
                    onFilterClear={handleStatusFilterClear}
                  />
                </TableHead>
                <TableHead>
                  <ColumnHeaderMenu
                    label="Items"
                    sortKey="lineItemCount"
                    currentSortKey={sortKey}
                    currentSortDir={sortDir}
                    onSort={(_k, dir) => handleSort("lineItemCount", dir)}
                  />
                </TableHead>
                <TableHead>
                  <ColumnHeaderMenu
                    label="Date"
                    sortKey="createdAt"
                    currentSortKey={sortKey}
                    currentSortDir={sortDir}
                    onSort={(_k, dir) => handleSort("createdAt", dir)}
                  />
                </TableHead>
                <TableHead>
                  <ColumnHeaderMenu
                    label="Total"
                    sortKey="total"
                    currentSortKey={sortKey}
                    currentSortDir={sortDir}
                    onSort={(_k, dir) => handleSort("total", dir)}
                  />
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredQuotes.map((quote) => (
                <TableRow
                  key={quote.id}
                  className="cursor-pointer hover:bg-muted/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                  onClick={() => router.push(`/quotes/${quote.id}`)}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      router.push(`/quotes/${quote.id}`);
                    }
                  }}
                  aria-label={`View ${quote.quoteNumber}`}
                >
                  <TableCell className="font-medium">
                    <span className="text-action hover:underline">
                      {quote.quoteNumber}
                    </span>
                    {quote.isArchived && (
                      <Badge
                        variant="ghost"
                        className="ml-2 bg-muted text-muted-foreground text-xs"
                      >
                        Archived
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>{quote.customerName}</TableCell>
                  <TableCell>
                    <StatusBadge status={quote.status} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {quote.lineItemCount} {quote.lineItemCount === 1 ? "item" : "items"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(quote.createdAt)}
                  </TableCell>
                  <TableCell className="text-sm font-medium tabular-nums">
                    <MoneyAmount value={quote.total} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Mobile card list */}
        <div className="flex flex-col gap-(--mobile-card-gap) md:hidden">
          {filteredQuotes.map((quote) => (
            <button
              key={quote.id}
              type="button"
              onClick={() => router.push(`/quotes/${quote.id}`)}
              className={cn(
                "flex flex-col gap-2 rounded-lg border border-border bg-elevated p-4",
                "text-left transition-colors hover:bg-muted/50",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action/50",
              )}
            >
              {/* Top row: quote # + customer left, price + qty right */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-col gap-0.5">
                  <span className="font-medium text-action">
                    {quote.quoteNumber}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {quote.customerName}
                  </span>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-0.5">
                  <MoneyAmount value={quote.total} format="compact" className="text-sm font-medium" />
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <Package className="size-3" />
                    {quote.lineItemCount}
                  </span>
                </div>
              </div>

              {/* Status badge */}
              <div className="flex items-center">
                <StatusBadge status={quote.status} />
              </div>
            </button>
          ))}
        </div>
        </>
      ) : (
        /* Empty state */
        <div className="flex flex-col items-center justify-center rounded-md border border-dashed border-border py-16">
          <ENTITY_STYLES.quote.icon className="size-6 text-muted-foreground/50" aria-hidden="true" />
          <p className="mt-4 text-sm font-medium">No quotes found</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {hasFilters
              ? "Try adjusting your filters or search term"
              : "Create your first quote to get started"}
          </p>
          {hasFilters ? (
            <Button
              variant="outline"
              className="mt-4"
              onClick={clearFilters}
            >
              Clear Filters
            </Button>
          ) : (
            <Button asChild className="mt-4 bg-action text-primary-foreground font-medium">
              <Link href="/quotes/new">Create Quote</Link>
            </Button>
          )}
        </div>
      )}

      {/* ---- Result count ---- */}
      {filteredQuotes.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {filteredQuotes.length}{" "}
          {filteredQuotes.length === 1 ? "quote" : "quotes"}
          {hasFilters && " (filtered)"}
        </p>
      )}

      {/* ---- Mobile filter sheet ---- */}
      {filterSheetOpen && (
        <MobileFilterSheet
          open={filterSheetOpen}
          onOpenChange={setFilterSheetOpen}
          sortOptions={[
            { value: "createdAt", label: "Date" },
            { value: "quoteNumber", label: "Quote #" },
            { value: "customerName", label: "Customer" },
            { value: "total", label: "Total" },
            { value: "status", label: "Status" },
          ]}
          currentSort={sortKey}
          onSortChange={(value) => handleSort(value as SortKey)}
          filterGroups={[
            {
              label: "Status",
              options: STATUS_OPTIONS,
              selected: activeStatuses,
              onToggle: handleStatusToggle,
            },
          ]}
          onApply={() => setFilterSheetOpen(false)}
          onReset={clearFilters}
        />
      )}
    </div>
  );
}
