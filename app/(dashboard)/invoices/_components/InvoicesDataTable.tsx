"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  FileText,
  Plus,
  Search,
  X,
} from "lucide-react";

import { z } from "zod";
import { cn } from "@/lib/utils";
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
import { StatusBadge } from "@/components/features/StatusBadge";
import { OverdueBadge } from "@/components/features/OverdueBadge";
import { ColumnHeaderMenu } from "@/components/features/ColumnHeaderMenu";
import { customers } from "@/lib/mock-data";
import { computeIsOverdue } from "@/lib/helpers/invoice-utils";
import { INVOICE_STATUS_LABELS } from "@/lib/constants";
import type { Invoice, InvoiceStatus } from "@/lib/schemas/invoice";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface InvoicesDataTableProps {
  invoices: Invoice[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const sortKeySchema = z.enum(["invoiceNumber", "customer", "status", "total", "dueDate", "balanceDue", "createdAt"]);
type SortKey = z.infer<typeof sortKeySchema>;

const sortDirSchema = z.enum(["asc", "desc"]);
type SortDir = z.infer<typeof sortDirSchema>;

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getCustomerName(customerId: string): string {
  const customer = customers.find((c) => c.id === customerId);
  return customer?.company ?? "Unknown";
}

// Status filter options
const ALL_STATUSES: InvoiceStatus[] = ["draft", "sent", "partial", "paid", "void"];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function InvoicesDataTable({ invoices }: InvoicesDataTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // ---- URL state reads ------------------------------------------------------
  const view = searchParams.get("view") ?? "all";
  const searchQuery = searchParams.get("q") ?? "";
  const statusFilter = searchParams.get("status") ?? "";
  const sortKeyParam = sortKeySchema.catch("createdAt").parse(searchParams.get("sort") ?? "createdAt");
  const sortDirParam = sortDirSchema.catch("desc").parse(searchParams.get("dir") ?? "desc");

  // ---- Local state (for debounced search) -----------------------------------
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const [sortKey, setSortKey] = useState<SortKey>(sortKeyParam);
  const [sortDir, setSortDir] = useState<SortDir>(sortDirParam);

  // Sync search from URL when navigating back/forward
  useEffect(() => {
    setLocalSearch(searchQuery);
  }, [searchQuery]);

  // Sync sort from URL when navigating back/forward
  useEffect(() => {
    setSortKey(sortKeyParam);
    setSortDir(sortDirParam);
  }, [sortKeyParam, sortDirParam]);

  // ---- Debounced search -> URL ----------------------------------------------
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

  // ---- URL update helpers ---------------------------------------------------

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

  // ---- Status filter --------------------------------------------------------

  const handleStatusFilterToggle = useCallback(
    (value: string) => {
      updateParam("status", value === statusFilter ? null : value);
    },
    [statusFilter, updateParam],
  );

  const handleStatusFilterClear = useCallback(() => {
    updateParam("status", null);
  }, [updateParam]);

  // ---- Sort -----------------------------------------------------------------

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

  // ---- Customer name cache --------------------------------------------------

  const customerNameMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const inv of invoices) {
      if (!map.has(inv.customerId)) {
        map.set(inv.customerId, getCustomerName(inv.customerId));
      }
    }
    return map;
  }, [invoices]);

  // ---- Filter + sort pipeline -----------------------------------------------

  const filteredInvoices = useMemo(() => {
    let result = invoices;

    // 1. Smart view filtering
    switch (view) {
      case "draft":
        result = result.filter((inv) => inv.status === "draft");
        break;
      case "outstanding":
        result = result.filter((inv) => inv.status === "sent" || inv.status === "partial");
        break;
      case "overdue":
        result = result.filter((inv) => computeIsOverdue(inv));
        break;
      case "paid":
        result = result.filter((inv) => inv.status === "paid");
        break;
      // "all" — no additional filter
    }

    // 2. Global search (invoice number, customer name)
    if (searchQuery) {
      const lower = searchQuery.toLowerCase();
      result = result.filter((inv) => {
        if (inv.invoiceNumber.toLowerCase().includes(lower)) return true;
        const name = customerNameMap.get(inv.customerId) ?? "";
        if (name.toLowerCase().includes(lower)) return true;
        return false;
      });
    }

    // 3. Status filter
    if (statusFilter) {
      result = result.filter((inv) => inv.status === statusFilter);
    }

    // 4. Sort
    result = [...result].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "invoiceNumber":
          cmp = a.invoiceNumber.localeCompare(b.invoiceNumber);
          break;
        case "customer": {
          const aName = customerNameMap.get(a.customerId) ?? "";
          const bName = customerNameMap.get(b.customerId) ?? "";
          cmp = aName.localeCompare(bName);
          break;
        }
        case "status": {
          const statusOrder: Record<InvoiceStatus, number> = { draft: 0, sent: 1, partial: 2, paid: 3, void: 4 };
          cmp = statusOrder[a.status] - statusOrder[b.status];
          break;
        }
        case "total":
          cmp = a.total - b.total;
          break;
        case "dueDate":
          cmp = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
          break;
        case "balanceDue":
          cmp = a.balanceDue - b.balanceDue;
          break;
        case "createdAt":
          cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return result;
  }, [invoices, view, searchQuery, statusFilter, sortKey, sortDir, customerNameMap]);

  // ---- Check if any filters are active --------------------------------------

  const hasFilters =
    searchQuery.length > 0 ||
    statusFilter.length > 0 ||
    view !== "all";

  // ---- Clear all filters helper ---------------------------------------------

  const clearFilters = useCallback(() => {
    router.replace("?", { scroll: false });
    setLocalSearch("");
  }, [router]);

  // ---- Status filter options for ColumnHeaderMenu ---------------------------

  const statusFilterOptions = ALL_STATUSES.map((s) => ({
    value: s,
    label: INVOICE_STATUS_LABELS[s],
  }));

  // ---- Render ---------------------------------------------------------------

  return (
    <div className="flex flex-col gap-4">
      {/* ---- Sticky header area ---- */}
      <div className="sticky top-0 z-10 bg-[var(--color-bg-primary)] pb-2">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight shrink-0">Invoices</h1>

          <div className="flex-1" />

          {/* Search bar */}
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              placeholder="Search invoice #, customer..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="pl-9"
              aria-label="Search invoices"
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

          <Button
            onClick={() => router.push("/invoices/new")}
            className="bg-action text-primary-foreground font-medium shadow-[4px_4px_0px] shadow-action/30 hover:shadow-[2px_2px_0px] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
          >
            <Plus className="size-4" />
            New Invoice
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

      {/* ---- Data Table (desktop) / Card List (mobile) ---- */}
      {filteredInvoices.length > 0 ? (
        <>
          {/* Desktop table — hidden below md */}
          <div className="hidden md:block rounded-md border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <ColumnHeaderMenu
                      label="Invoice #"
                      sortKey="invoiceNumber"
                      currentSortKey={sortKey}
                      currentSortDir={sortDir}
                      onSort={(_k, dir) => handleSort("invoiceNumber", dir)}
                    />
                  </TableHead>
                  <TableHead>
                    <ColumnHeaderMenu
                      label="Customer"
                      sortKey="customer"
                      currentSortKey={sortKey}
                      currentSortDir={sortDir}
                      onSort={(_k, dir) => handleSort("customer", dir)}
                    />
                  </TableHead>
                  <TableHead>
                    <ColumnHeaderMenu
                      label="Status"
                      sortKey="status"
                      currentSortKey={sortKey}
                      currentSortDir={sortDir}
                      onSort={(_k, dir) => handleSort("status", dir)}
                      filterOptions={statusFilterOptions}
                      activeFilters={statusFilter ? [statusFilter] : []}
                      onFilterToggle={handleStatusFilterToggle}
                      onFilterClear={handleStatusFilterClear}
                    />
                  </TableHead>
                  <TableHead>
                    <ColumnHeaderMenu
                      label="Amount"
                      sortKey="total"
                      currentSortKey={sortKey}
                      currentSortDir={sortDir}
                      onSort={(_k, dir) => handleSort("total", dir)}
                    />
                  </TableHead>
                  <TableHead>
                    <ColumnHeaderMenu
                      label="Due Date"
                      sortKey="dueDate"
                      currentSortKey={sortKey}
                      currentSortDir={sortDir}
                      onSort={(_k, dir) => handleSort("dueDate", dir)}
                    />
                  </TableHead>
                  <TableHead>
                    <ColumnHeaderMenu
                      label="Balance Due"
                      sortKey="balanceDue"
                      currentSortKey={sortKey}
                      currentSortDir={sortDir}
                      onSort={(_k, dir) => handleSort("balanceDue", dir)}
                    />
                  </TableHead>
                  <TableHead>
                    <ColumnHeaderMenu
                      label="Created"
                      sortKey="createdAt"
                      currentSortKey={sortKey}
                      currentSortDir={sortDir}
                      onSort={(_k, dir) => handleSort("createdAt", dir)}
                    />
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.map((invoice) => (
                  <TableRow
                    key={invoice.id}
                    className="cursor-pointer hover:bg-muted/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                    onClick={() => router.push(`/invoices/${invoice.id}`)}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        router.push(`/invoices/${invoice.id}`);
                      }
                    }}
                    aria-label={`View ${invoice.invoiceNumber}`}
                  >
                    <TableCell className="font-medium">
                      <span className="text-action hover:underline">
                        {invoice.invoiceNumber}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm">
                      {customerNameMap.get(invoice.customerId) ?? "Unknown"}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <StatusBadge status={invoice.status} variant="invoice" />
                        <OverdueBadge
                          dueDate={invoice.dueDate}
                          balanceDue={invoice.balanceDue}
                          status={invoice.status}
                        />
                      </div>
                    </TableCell>
                    <TableCell className="text-sm font-medium tabular-nums">
                      {formatCurrency(invoice.total)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(invoice.dueDate)}
                    </TableCell>
                    <TableCell className="text-sm font-medium tabular-nums">
                      {invoice.balanceDue > 0 ? (
                        formatCurrency(invoice.balanceDue)
                      ) : (
                        <span className="text-muted-foreground">--</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(invoice.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile card list — visible below md */}
          <div className="flex flex-col gap-3 md:hidden">
            {filteredInvoices.map((invoice) => (
              <button
                key={invoice.id}
                type="button"
                onClick={() => router.push(`/invoices/${invoice.id}`)}
                className={cn(
                  "flex flex-col gap-2 rounded-lg border border-border bg-elevated p-4",
                  "text-left transition-colors hover:bg-muted/50",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action/50",
                )}
              >
                {/* Top row: invoice # + amount */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium text-action">
                      {invoice.invoiceNumber}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {customerNameMap.get(invoice.customerId) ?? "Unknown"}
                    </span>
                  </div>
                  <span className="shrink-0 text-sm font-medium tabular-nums">
                    {formatCurrency(invoice.total)}
                  </span>
                </div>

                {/* Middle row: due date + balance */}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Due {formatDate(invoice.dueDate)}</span>
                  {invoice.balanceDue > 0 && (
                    <span className="font-medium text-foreground">
                      Balance: {formatCurrency(invoice.balanceDue)}
                    </span>
                  )}
                </div>

                {/* Bottom row: badges */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <StatusBadge status={invoice.status} variant="invoice" />
                  <OverdueBadge
                    dueDate={invoice.dueDate}
                    balanceDue={invoice.balanceDue}
                    status={invoice.status}
                  />
                </div>
              </button>
            ))}
          </div>
        </>
      ) : (
        /* ---- Empty state ---- */
        <div className="flex flex-col items-center justify-center rounded-md border border-dashed border-border py-16">
          <FileText className="size-12 text-muted-foreground/50" aria-hidden="true" />
          <p className="mt-4 text-sm font-medium">No invoices found</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {hasFilters
              ? `No results for "${searchQuery || "current filters"}"`
              : "Create your first invoice to get started"}
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
            <Button
              className="mt-4 bg-action text-primary-foreground font-medium"
              onClick={() => router.push("/invoices/new")}
            >
              New Invoice
            </Button>
          )}
        </div>
      )}

      {/* ---- Result count ---- */}
      {filteredInvoices.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {filteredInvoices.length}{" "}
          {filteredInvoices.length === 1 ? "invoice" : "invoices"}
          {hasFilters && " (filtered)"}
        </p>
      )}
    </div>
  );
}
