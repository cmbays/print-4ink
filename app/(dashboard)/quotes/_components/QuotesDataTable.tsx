"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Copy,
  Eye,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Send,
} from "lucide-react";
import { toast } from "sonner";


import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StatusBadge } from "@/components/features/StatusBadge";
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
  };
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const STATUS_TABS: { value: string; label: string }[] = [
  { value: "all", label: "All" },
  { value: "draft", label: "Draft" },
  { value: "sent", label: "Sent" },
  { value: "accepted", label: "Accepted" },
  { value: "declined", label: "Declined" },
  { value: "revised", label: "Revised" },
];

type SortKey = "quoteNumber" | "customerName" | "status" | "lineItemCount" | "total" | "createdAt";
type SortDir = "asc" | "desc";

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

  // Read URL state
  const statusFilter = searchParams.get("status") ?? "all";
  const searchQuery = searchParams.get("q") ?? "";

  // Local search input (for debounce)
  const [localSearch, setLocalSearch] = useState(searchQuery);

  // Sort state
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  // Debounced search → URL
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

  // Status filter → URL
  const handleStatusChange = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === "all") {
        params.delete("status");
      } else {
        params.set("status", value);
      }
      router.replace(`?${params.toString()}`, { scroll: false });
    },
    [searchParams, router],
  );

  // Sort toggle
  const handleSort = useCallback(
    (key: SortKey) => {
      if (sortKey === key) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      } else {
        setSortKey(key);
        setSortDir("asc");
      }
    },
    [sortKey],
  );

  // Filter + sort
  const filteredQuotes = useMemo(() => {
    let result = MOCK_QUOTES;

    // Status filter
    if (statusFilter !== "all") {
      result = result.filter((q) => q.status === statusFilter);
    }

    // Search filter
    if (searchQuery) {
      const lower = searchQuery.toLowerCase();
      result = result.filter(
        (q) =>
          q.quoteNumber.toLowerCase().includes(lower) ||
          q.customerName.toLowerCase().includes(lower),
      );
    }

    // Sort
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
  }, [statusFilter, searchQuery, sortKey, sortDir]);

  // Render sort indicator
  const renderSortIcon = (column: SortKey) => {
    if (sortKey !== column) return null;
    return sortDir === "asc" ? (
      <ChevronUp className="size-4" />
    ) : (
      <ChevronDown className="size-4" />
    );
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Quotes</h1>
        <Button asChild className="bg-action text-primary-foreground font-medium shadow-[4px_4px_0px] shadow-action/30 hover:shadow-[2px_2px_0px] hover:translate-x-[2px] hover:translate-y-[2px] transition-all">
          <Link href="/quotes/new">
            <Plus className="size-4" />
            New Quote
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs
          value={statusFilter}
          onValueChange={handleStatusChange}
        >
          <TabsList>
            {STATUS_TABS.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search quotes or customers..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="pl-9"
            aria-label="Search quotes"
          />
        </div>
      </div>

      {/* Table */}
      {filteredQuotes.length > 0 ? (
        <div className="rounded-md border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
                    onClick={() => handleSort("quoteNumber")}
                    aria-label="Sort by quote number"
                  >
                    Quote # {renderSortIcon("quoteNumber")}
                  </button>
                </TableHead>
                <TableHead>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
                    onClick={() => handleSort("customerName")}
                    aria-label="Sort by customer"
                  >
                    Customer {renderSortIcon("customerName")}
                  </button>
                </TableHead>
                <TableHead>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
                    onClick={() => handleSort("status")}
                    aria-label="Sort by status"
                  >
                    Status {renderSortIcon("status")}
                  </button>
                </TableHead>
                <TableHead>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
                    onClick={() => handleSort("lineItemCount")}
                    aria-label="Sort by items"
                  >
                    Items {renderSortIcon("lineItemCount")}
                  </button>
                </TableHead>
                <TableHead>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
                    onClick={() => handleSort("total")}
                    aria-label="Sort by total"
                  >
                    Total {renderSortIcon("total")}
                  </button>
                </TableHead>
                <TableHead>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
                    onClick={() => handleSort("createdAt")}
                    aria-label="Sort by date"
                  >
                    Date {renderSortIcon("createdAt")}
                  </button>
                </TableHead>
                <TableHead className="w-10">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredQuotes.map((quote) => (
                <TableRow key={quote.id}>
                  <TableCell className="font-medium">
                    <Link
                      href={`/quotes/${quote.id}`}
                      className="text-action hover:underline"
                    >
                      {quote.quoteNumber}
                    </Link>
                  </TableCell>
                  <TableCell>{quote.customerName}</TableCell>
                  <TableCell>
                    <StatusBadge status={quote.status} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {quote.lineItemCount} {quote.lineItemCount === 1 ? "item" : "items"}
                  </TableCell>
                  <TableCell>{formatCurrency(quote.total)}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(quote.createdAt)}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          aria-label={`Actions for ${quote.quoteNumber}`}
                        >
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/quotes/${quote.id}`}>
                            <Eye className="size-4" />
                            View
                          </Link>
                        </DropdownMenuItem>
                        {quote.status === "draft" && (
                          <DropdownMenuItem asChild>
                            <Link href={`/quotes/${quote.id}/edit`}>
                              <Pencil className="size-4" />
                              Edit
                            </Link>
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem asChild>
                          <Link href={`/quotes/new?duplicate=${quote.id}`}>
                            <Copy className="size-4" />
                            Copy as New
                          </Link>
                        </DropdownMenuItem>
                        {quote.status === "draft" && (
                          <DropdownMenuItem
                            onClick={() => {
                              toast.success(`${quote.quoteNumber} sent to ${quote.customerName}`);
                            }}
                          >
                            <Send className="size-4" />
                            Send
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        /* Empty state */
        <div className="flex flex-col items-center justify-center rounded-md border border-dashed border-border py-16">
          <ClipboardList className="size-12 text-muted-foreground/50" />
          <p className="mt-4 text-sm font-medium">No quotes found</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {searchQuery || statusFilter !== "all"
              ? "Try adjusting your filters or search term"
              : "Create your first quote to get started"}
          </p>
          <Button asChild className="mt-4 bg-action text-primary-foreground font-medium">
            <Link href="/quotes/new">Create Quote</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
