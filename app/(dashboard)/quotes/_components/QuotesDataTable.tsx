"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Archive,
  ClipboardList,
  Plus,
  Search,
  X,
} from "lucide-react";
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
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { StatusBadge } from "@/components/features/StatusBadge";
import { ColumnHeaderMenu } from "@/components/features/ColumnHeaderMenu";
import type { QuoteStatus } from "@/lib/schemas/quote";
import { quotes as rawQuotes, customers } from "@/lib/mock-data";

// ---------------------------------------------------------------------------
// Derived table rows from canonical mock data
// ---------------------------------------------------------------------------

interface TableQuote {
  id: string;
  quoteNumber: string;
  customerId: string;
  customerName: string;
  status: QuoteStatus;
  lineItemCount: number;
  total: number;
  createdAt: string;
  isArchived: boolean;
}

const MOCK_QUOTES: TableQuote[] = rawQuotes.map((q) => {
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
});

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

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function QuotesDataTable() {
  const router = useRouter();
  const searchParams = useSearchParams();

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
    let result = MOCK_QUOTES;

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
  }, [showArchived, activeStatuses, searchQuery, sortKey, sortDir]);

  // ---- Check if any filters are active ------------------------------------

  const hasFilters = searchQuery.length > 0 || activeStatuses.length > 0 || showArchived;

  return (
    <div className="flex flex-col gap-4">
      {/* ---- Sticky header area ---- */}
      <div className="sticky top-0 z-10 bg-[var(--color-bg-primary)] pb-2">
        {/* Header row: title + search + archive toggle + action button */}
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight shrink-0">Quotes</h1>

          <div className="flex-1" />

          {/* Search bar */}
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
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
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                aria-label="Clear search"
              >
                <X className="size-4" />
              </button>
            )}
          </div>

          {/* Archive toggle — icon only with tooltip */}
          <TooltipProvider skipDelayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={toggleArchived}
                  className={cn(
                    "inline-flex items-center justify-center rounded-md p-2 transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    showArchived
                      ? "bg-action/10 text-action border border-action/20"
                      : "bg-transparent text-muted-foreground border border-transparent hover:text-foreground hover:bg-muted",
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
          </TooltipProvider>

          <Button asChild className="bg-action text-primary-foreground font-medium shadow-[4px_4px_0px] shadow-action/30 hover:shadow-[2px_2px_0px] hover:translate-x-[2px] hover:translate-y-[2px] transition-all">
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
              onClick={() => {
                router.replace("?", { scroll: false });
                setLocalSearch("");
              }}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* ---- Table ---- */}
      {filteredQuotes.length > 0 ? (
        <div className="rounded-md border border-border">
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
                    {formatCurrency(quote.total)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        /* Empty state */
        <div className="flex flex-col items-center justify-center rounded-md border border-dashed border-border py-16">
          <ClipboardList className="size-6 text-muted-foreground/50" />
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
              onClick={() => {
                router.replace("?", { scroll: false });
                setLocalSearch("");
              }}
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
    </div>
  );
}
