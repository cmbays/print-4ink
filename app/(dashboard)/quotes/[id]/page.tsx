import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { quotes, customers, garmentCatalog, colors } from "@/lib/mock-data";
import { StatusBadge } from "@/components/features/StatusBadge";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { QuoteActions } from "@/app/(dashboard)/quotes/_components/QuoteActions";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getTotalQty(sizes: Record<string, number>): number {
  return Object.values(sizes).reduce((sum, qty) => sum + qty, 0);
}

export default async function QuoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const quote = quotes.find((q) => q.id === id);

  if (!quote) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="rounded-lg border border-border bg-card p-8 text-center">
          <h2 className="text-xl font-semibold text-foreground">
            Quote not found
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            This quote doesn&apos;t exist or has been removed.
          </p>
          <Link href="/quotes">
            <Button variant="outline" className="mt-4">
              <ArrowLeft className="size-4" />
              Back to Quotes
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const customer = customers.find((c) => c.id === quote.customerId);
  const effectiveTotal = quote.priceOverride ?? quote.total;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/quotes">Quotes</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{quote.quoteNumber}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Back link */}
      <Link
        href="/quotes"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to Quotes
      </Link>

      {/* Quote Header */}
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold text-foreground">
                Quote {quote.quoteNumber}
              </h1>
              <StatusBadge status={quote.status} />
            </div>
            <p className="text-sm text-muted-foreground">
              Created {formatDate(quote.createdAt)}
              {quote.updatedAt && (
                <span> &middot; Updated {formatDate(quote.updatedAt)}</span>
              )}
              {quote.sentAt && (
                <span> &middot; Sent {formatDate(quote.sentAt)}</span>
              )}
            </p>
          </div>
        </div>

        {/* Customer */}
        {customer && (
          <>
            <Separator className="my-4" />
            <div className="space-y-0.5">
              <p className="text-sm font-medium text-foreground">
                {customer.name}{" "}
                <span className="text-muted-foreground">
                  &mdash; {customer.company}
                </span>
              </p>
              <p className="text-sm text-muted-foreground">{customer.email}</p>
            </div>
          </>
        )}
      </div>

      {/* Line Items */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">Line Items</h2>
        {quote.lineItems.map((item, index) => {
          const garment = garmentCatalog.find((g) => g.id === item.garmentId);
          const color = colors.find((c) => c.id === item.colorId);
          const totalQty = getTotalQty(item.sizes);

          return (
            <div
              key={index}
              className="rounded-lg border border-border bg-surface p-4 space-y-3"
            >
              {/* Garment info */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium text-foreground">
                    {garment
                      ? `${garment.brand} ${garment.sku} — ${garment.name}`
                      : "Unknown Garment"}
                  </p>
                  {/* Color */}
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      Color:
                    </span>
                    {color ? (
                      <span className="inline-flex items-center gap-1.5">
                        <span
                          className="inline-block size-3.5 rounded-sm border border-border"
                          style={{ backgroundColor: color.hex }}
                        />
                        <span className="text-sm text-foreground">
                          {color.name}
                        </span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5">
                        <span className="inline-block size-3.5 rounded-sm border border-border bg-muted" />
                        <span className="text-sm text-muted-foreground">
                          Unknown
                        </span>
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-right text-sm font-medium text-foreground whitespace-nowrap">
                  {formatCurrency(item.lineTotal)}
                </p>
              </div>

              {/* Sizes */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                <span className="text-muted-foreground">Sizes:</span>
                {Object.entries(item.sizes).map(([size, qty]) => (
                  <span key={size} className="text-foreground">
                    {size}({qty})
                  </span>
                ))}
                <span className="text-muted-foreground">
                  = {totalQty} total
                </span>
              </div>

              {/* Locations & pricing */}
              <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
                <span>
                  <span className="text-muted-foreground">Locations: </span>
                  <span className="text-foreground">
                    {item.printLocations.join(", ")}
                  </span>
                </span>
                <span>
                  <span className="text-muted-foreground">
                    Colors/Location:{" "}
                  </span>
                  <span className="text-foreground">
                    {item.colorsPerLocation}
                  </span>
                </span>
              </div>

              {/* Unit price breakdown */}
              <p className="text-sm text-muted-foreground">
                {formatCurrency(item.unitPrice)} x {totalQty} ={" "}
                <span className="font-medium text-foreground">
                  {formatCurrency(item.lineTotal)}
                </span>
              </p>
            </div>
          );
        })}
      </div>

      {/* Pricing */}
      <div className="rounded-lg border border-border bg-card p-6 space-y-2">
        <h2 className="text-lg font-semibold text-foreground">Pricing</h2>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="text-foreground">
              {formatCurrency(quote.subtotal)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Setup Fees</span>
            <span className="text-foreground">
              {formatCurrency(quote.setupFees)}
            </span>
          </div>
          <Separator className="my-2" />
          <div className="flex justify-between text-base font-semibold">
            <span className="text-foreground">Grand Total</span>
            <span className="text-foreground">
              {formatCurrency(effectiveTotal)}
            </span>
          </div>
          {quote.priceOverride != null &&
            quote.priceOverride !== quote.total && (
              <p className="text-sm text-warning">
                Price adjusted from {formatCurrency(quote.total)}
              </p>
            )}
        </div>
      </div>

      {/* Notes */}
      {(quote.internalNotes || quote.customerNotes) && (
        <div className="rounded-lg border border-border bg-card p-6 space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Notes</h2>
          {quote.internalNotes && (
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Internal
              </p>
              <p className="text-sm text-foreground">
                {quote.internalNotes}
              </p>
            </div>
          )}
          {quote.customerNotes && (
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Customer
              </p>
              <p className="text-sm text-foreground">
                {quote.customerNotes}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <QuoteActions
        quote={quote}
        customer={customer ?? null}
      />
    </div>
  );
}
