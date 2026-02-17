import { Topbar } from "@/components/layout/topbar";
import { buildBreadcrumbs, CRUMBS } from "@/lib/helpers/breadcrumbs";
import { QuoteForm } from "../../_components/QuoteForm";
import type { QuoteFormInitialData } from "../../_components/QuoteForm";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getQuoteById } from "@/lib/dal/quotes";
import { getCustomers } from "@/lib/dal/customers";
import { getColors } from "@/lib/dal/colors";
import { getGarmentCatalog } from "@/lib/dal/garments";
import { getArtworks } from "@/lib/dal/artworks";


export default async function EditQuotePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const quote = await getQuoteById(id);

  if (!quote) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="rounded-lg border border-border bg-card p-8 text-center" role="alert">
          <h2 className="text-xl font-semibold text-foreground">
            Quote not found
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            This quote doesn&apos;t exist or has been removed.
          </p>
          <Button variant="outline" className="mt-4" asChild>
            <Link href="/quotes">
              <ArrowLeft className="size-4" />
              Back to Quotes
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const [customers, colors, garmentCatalog, artworks] = await Promise.all([
    getCustomers(),
    getColors(),
    getGarmentCatalog(),
    getArtworks(),
  ]);

  const initialData: QuoteFormInitialData = {
    customerId: quote.customerId,
    lineItems: quote.lineItems.map((item, i) => ({
      id: `edit-${i}`,
      garmentId: item.garmentId,
      colorId: item.colorId,
      sizes: { ...item.sizes },
      serviceType: item.serviceType,
      printLocationDetails: item.printLocationDetails.map((d) => ({
        location: d.location,
        colorCount: d.colorCount,
        setupFee: d.setupFee,
        artworkId: d.artworkId,
      })),
    })),
    discounts: quote.discounts.filter((d) => d.type !== "contract").map((d) => ({ ...d })),
    shipping: quote.shipping,
    artworkIds: [...quote.artworkIds],
    internalNotes: quote.internalNotes,
    customerNotes: quote.customerNotes,
  };

  return (
    <>
      <Topbar breadcrumbs={buildBreadcrumbs(CRUMBS.quotes, { label: quote.quoteNumber, href: `/quotes/${id}` }, { label: "Edit" })} />
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-semibold tracking-tight">Edit Quote — {quote.quoteNumber}</h1>
        <QuoteForm
          mode="edit"
          customers={customers}
          colors={colors}
          garmentCatalog={garmentCatalog}
          artworks={artworks}
          initialData={initialData}
          quoteId={quote.id}
        />
      </div>
    </>
  );
}
