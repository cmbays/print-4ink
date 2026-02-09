import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { QuoteForm } from "../../_components/QuoteForm";
import type { LineItemData } from "../../_components/LineItemRow";
import { quotes } from "@/lib/mock-data";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function EditQuotePage({
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

  const initialData: {
    customerId?: string;
    lineItems?: LineItemData[];
    discounts?: { label: string; amount: number; type: "manual" | "contract" | "volume" }[];
    shipping?: number;
    artworkIds?: string[];
    internalNotes?: string;
    customerNotes?: string;
  } = {
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
    <div className="flex flex-col gap-6 p-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/quotes">Quotes</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href={`/quotes/${id}`}>
              {quote.quoteNumber}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Edit</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <h1 className="text-2xl font-semibold">Edit Quote — {quote.quoteNumber}</h1>
      <QuoteForm mode="edit" initialData={initialData} quoteId={quote.id} />
    </div>
  );
}
