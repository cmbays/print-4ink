"use client";

import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/features/StatusBadge";
import { DiscountRow } from "./DiscountRow";
import { QuoteActions } from "./QuoteActions";
import { MockupFilterProvider, GarmentMockupThumbnail } from "@/components/features/mockup";
import { normalizePosition } from "@/lib/constants/print-zones";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useState } from "react";
import { DollarSign, Info, Send } from "lucide-react";
import { toast } from "sonner";
import { MatrixPeekSheet } from "./MatrixPeekSheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Quote, QuoteLineItem } from "@/lib/schemas/quote";
import type { Customer } from "@/lib/schemas/customer";
import type { Artwork } from "@/lib/schemas/artwork";
import { garmentCatalog, colors as allColors } from "@/lib/mock-data";
import { formatDate } from "@/lib/helpers/format";
import { SERVICE_TYPE_LABELS, SERVICE_TYPE_COLORS } from "@/lib/constants";
import { LifecycleBadge } from "@/components/features/LifecycleBadge";
import { DECORATION_COST_PER_COLOR, LOCATION_FEE_PER_UNIT, calculateGarmentCost, calculateDecorationCost, calculateLineItemSetupFee, calculateQuoteSetupFee } from "./LineItemRow";
import { cn } from "@/lib/utils";

interface QuoteDetailViewProps {
  quote: Quote;
  customer: Customer | null;
  artworks: Artwork[];
  mode: "detail" | "review";
  onSend?: () => void;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

function getTotalQty(sizes: Record<string, number>): number {
  return Object.values(sizes).reduce((sum, qty) => sum + qty, 0);
}

export function QuoteDetailView({
  quote,
  customer,
  artworks,
  mode,
  onSend,
}: QuoteDetailViewProps) {
  const [peekOpen, setPeekOpen] = useState(false);
  const [peekLineItem, setPeekLineItem] = useState<QuoteLineItem | null>(null);

  const totalDiscounts = quote.discounts.reduce((sum, d) => sum + d.amount, 0);
  const artworkMap = new Map(artworks.map((a) => [a.id, a]));

  // Compute garment / decoration / setup split from line items
  let garmentTotal = 0;
  let decorationTotal = 0;
  let lineItemSetupFees = 0;
  quote.lineItems.forEach((item) => {
    const garment = garmentCatalog.find((g) => g.id === item.garmentId);
    const totalQty = getTotalQty(item.sizes);
    garmentTotal += calculateGarmentCost(garment, totalQty);
    decorationTotal += calculateDecorationCost(item.serviceType, item.printLocationDetails, totalQty);
    lineItemSetupFees += calculateLineItemSetupFee(item.serviceType);
  });
  const quoteSetupFee = calculateQuoteSetupFee(quote.lineItems);
  const setupFeesTotal = lineItemSetupFees + quoteSetupFee;
  const subtotal = garmentTotal + decorationTotal + setupFeesTotal;
  const effectiveTotal = quote.total;

  const garmentColors = quote.lineItems
    .map((item) => allColors.find((c) => c.id === item.colorId)?.hex)
    .filter(Boolean) as string[];

  return (
    <div className="space-y-6">
      <MockupFilterProvider colors={garmentColors} />
      {/* Header — sticky at top */}
      <div className="sticky top-0 z-10 rounded-lg border border-border bg-card p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-foreground">
              {quote.quoteNumber}
            </h1>
            <StatusBadge status={quote.status} />
          </div>
          {mode === "detail" ? (
            <QuoteActions quote={quote} customer={customer} />
          ) : (
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-xs text-muted-foreground leading-none">Total</p>
                <p className="text-base font-semibold text-foreground leading-tight">{formatCurrency(effectiveTotal)}</p>
              </div>
              <Button size="sm" onClick={onSend} className="bg-action text-primary-foreground">
                <Send size={14} />
                Send Quote
              </Button>
            </div>
          )}
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Created {formatDate(quote.createdAt)}
          {quote.updatedAt && <span> · Updated {formatDate(quote.updatedAt)}</span>}
          {quote.sentAt && <span> · Sent {formatDate(quote.sentAt)}</span>}
        </p>

        {customer && (
          <>
            <Separator className="my-3" />
            <div className="flex items-center gap-2">
              <Link
                href={`/customers/${customer.id}`}
                className="text-sm font-medium text-foreground hover:text-action transition-colors"
              >
                {customer.name} — {customer.company}
              </Link>
              <LifecycleBadge stage={customer.lifecycleStage} className="text-xs" />
            </div>
            <p className="text-sm text-muted-foreground">{customer.email} · {customer.phone}</p>
          </>
        )}
      </div>

      {/* Line Items */}
      <TooltipProvider delayDuration={200}>
      <div className="space-y-3">
        <h3 className="text-base font-semibold text-foreground">Line Items</h3>
        {quote.lineItems.map((item, index) => {
          const garment = garmentCatalog.find((g) => g.id === item.garmentId);
          const color = allColors.find((c) => c.id === item.colorId);
          const totalQty = getTotalQty(item.sizes);
          const serviceType = item.serviceType as keyof typeof DECORATION_COST_PER_COLOR;
          const garmentUnitCost = garment?.basePrice ?? 0;
          const decorationPerUnit = item.printLocationDetails.reduce(
            (sum, d) => sum + d.colorCount * DECORATION_COST_PER_COLOR[serviceType] + LOCATION_FEE_PER_UNIT[serviceType],
            0
          );
          const unitCostCombined = garmentUnitCost + decorationPerUnit;
          const itemSetupFee = calculateLineItemSetupFee(serviceType);

          return (
            <div key={index} className="rounded-lg border border-border bg-surface p-4 space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-foreground">
                      {garment ? `${garment.brand} ${garment.sku} — ${garment.name}` : "Unknown Garment"}
                    </p>
                    <Badge variant="ghost" className={cn("text-xs", SERVICE_TYPE_COLORS[item.serviceType])}>
                      {SERVICE_TYPE_LABELS[item.serviceType]}
                    </Badge>
                  </div>
                  {color && (
                    <div className="mt-1 flex items-center gap-1.5">
                      <span className="inline-block size-3.5 rounded-sm border border-border" style={{ backgroundColor: color.hex }} />
                      <span className="text-sm text-foreground">{color.name}</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  {item.serviceType === "screen-print" && customer && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 text-muted-foreground hover:text-action"
                      onClick={() => {
                        setPeekLineItem(item);
                        setPeekOpen(true);
                      }}
                      aria-label="View pricing matrix"
                    >
                      <DollarSign className="size-3.5" />
                    </Button>
                  )}
                  <p className="text-right text-sm font-medium text-foreground whitespace-nowrap">
                    {formatCurrency(item.lineTotal)}
                  </p>
                </div>
              </div>

              {/* Sizes */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                <span className="text-muted-foreground">Sizes:</span>
                {Object.entries(item.sizes).map(([size, qty]) => (
                  <span key={size} className="text-foreground">{size}({qty})</span>
                ))}
                <span className="text-muted-foreground">= {totalQty} total</span>
              </div>

              {/* Print Locations with per-location decoration fee */}
              <div className="space-y-1">
                {item.printLocationDetails.map((detail, di) => {
                  const artwork = detail.artworkId ? artworkMap.get(detail.artworkId) : undefined;
                  const locDecorationPerUnit = detail.colorCount * DECORATION_COST_PER_COLOR[serviceType] + LOCATION_FEE_PER_UNIT[serviceType];
                  return (
                    <div key={di} className="flex items-center gap-3 text-sm">
                      {color && (
                        <GarmentMockupThumbnail
                          garmentCategory={garment?.baseCategory ?? "t-shirts"}
                          colorHex={color.hex}
                          artworkPlacements={artwork ? [{
                            artworkUrl: artwork.thumbnailUrl,
                            position: normalizePosition(detail.location),
                          }] : []}
                          className="shrink-0"
                        />
                      )}
                      <div className="flex-1">
                        <span className="text-foreground">{detail.location}</span>
                        <span className="text-muted-foreground"> · {detail.colorCount} color{detail.colorCount !== 1 ? "s" : ""}</span>
                        {artwork && <span className="text-muted-foreground"> · {artwork.name}</span>}
                      </div>
                      <span className="text-xs text-muted-foreground">+{formatCurrency(locDecorationPerUnit)}/unit</span>
                    </div>
                  );
                })}
              </div>

              {/* Formula with setup fee and info tooltip */}
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <span>
                  ({formatCurrency(unitCostCombined)} x {totalQty} qty){itemSetupFee > 0 && <> + {formatCurrency(itemSetupFee)} setup</>} = <span className="font-medium text-foreground">{formatCurrency(item.lineTotal)}</span>
                </span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="cursor-default text-muted-foreground hover:text-foreground transition-colors">
                      <Info size={14} />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="top" align="start" className="max-w-xs">
                    <div className="space-y-1.5 text-xs">
                      <p className="font-medium text-foreground">Price Breakdown</p>
                      <p className="text-muted-foreground">
                        {formatCurrency(garmentUnitCost)} garment + {formatCurrency(decorationPerUnit)} decoration = {formatCurrency(unitCostCombined)}/unit
                      </p>
                      <div className="border-t border-border pt-1.5 space-y-0.5">
                        <p className="font-medium text-foreground">Setup Fees</p>
                        <p className="text-muted-foreground">Screen Print: $40 per quote</p>
                        <p className="text-muted-foreground">DTF: $0</p>
                        <p className="text-muted-foreground">Embroidery: $20 per design</p>
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          );
        })}
      </div>
      </TooltipProvider>

      {/* Pricing */}
      <div className="rounded-lg border border-border bg-card p-6 space-y-2">
        <h3 className="text-base font-semibold text-foreground">Pricing</h3>
        <div className="space-y-1.5 text-sm">
          {/* Cost breakdown */}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Garments</span>
            <span className="text-foreground">{formatCurrency(garmentTotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Decoration</span>
            <span className="text-foreground">{formatCurrency(decorationTotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Setup Fees</span>
            <span className="text-foreground">{formatCurrency(setupFeesTotal)}</span>
          </div>

          <Separator className="my-2" />

          {/* Subtotal */}
          <div className="flex justify-between font-medium">
            <span className="text-foreground">Subtotal</span>
            <span className="text-foreground">{formatCurrency(subtotal)}</span>
          </div>

          {/* Discounts */}
          {quote.discounts.map((discount, i) => (
            <DiscountRow key={i} label={discount.label} amount={discount.amount} type={discount.type} />
          ))}

          {/* Shipping */}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Shipping</span>
            {quote.shipping === 0 ? (
              <Badge variant="ghost" className="bg-success/10 text-success text-xs">FREE</Badge>
            ) : (
              <span className="text-foreground">{formatCurrency(quote.shipping)}</span>
            )}
          </div>

          {/* Tax */}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Tax (10%)</span>
            <span className="text-foreground">{formatCurrency(quote.tax)}</span>
          </div>

          <Separator className="my-2" />

          {/* Grand Total */}
          <div className="flex justify-between text-base font-semibold">
            <span className="text-foreground">Grand Total</span>
            <span className="text-foreground">{formatCurrency(effectiveTotal)}</span>
          </div>

          {/* Savings banner */}
          {totalDiscounts > 0 && (
            <div className="mt-2 rounded-md bg-success/10 px-3 py-2 text-center">
              <span className="text-sm font-medium text-success">You save {formatCurrency(totalDiscounts)}!</span>
            </div>
          )}
        </div>
      </div>

      {/* Notes */}
      {(quote.internalNotes || quote.customerNotes) && (
        <div className="rounded-lg border border-border bg-card p-6 space-y-3">
          <h3 className="text-base font-semibold text-foreground">Notes</h3>
          {quote.internalNotes && (
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Internal</p>
              <p className="text-sm text-foreground">{quote.internalNotes}</p>
            </div>
          )}
          {quote.customerNotes && (
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Customer</p>
              <p className="text-sm text-foreground">{quote.customerNotes}</p>
            </div>
          )}
        </div>
      )}

      {/* Matrix Peek Sheet */}
      {customer && peekLineItem && (
        <MatrixPeekSheet
          open={peekOpen}
          onOpenChange={setPeekOpen}
          customer={customer}
          lineItem={peekLineItem}
          onOverride={() => {
            toast.success("Override mode enabled for this quote");
          }}
        />
      )}
    </div>
  );
}
