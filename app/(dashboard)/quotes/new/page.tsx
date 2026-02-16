import { Topbar } from "@/components/layout/topbar";
import { buildBreadcrumbs, CRUMBS } from "@/lib/helpers/breadcrumbs";
import { QuoteForm } from "../_components/QuoteForm";
import { quotes } from "@/lib/mock-data";
import type { LineItemData } from "../_components/LineItemRow";

export default async function NewQuotePage({
  searchParams,
}: {
  searchParams: Promise<{ duplicate?: string; customer?: string }>;
}) {
  const { duplicate, customer: customerParam } = await searchParams;

  let initialData: {
    customerId?: string;
    lineItems?: LineItemData[];
    discounts?: { label: string; amount: number; type: "manual" | "contract" | "volume" }[];
    shipping?: number;
    artworkIds?: string[];
    internalNotes?: string;
    customerNotes?: string;
  } | undefined;

  let isDuplicate = false;

  // Pre-fill customer if coming from customer detail page
  if (customerParam && !duplicate) {
    initialData = { customerId: customerParam };
  }

  if (duplicate) {
    const sourceQuote = quotes.find((q) => q.id === duplicate);
    if (sourceQuote) {
      isDuplicate = true;
      initialData = {
        customerId: sourceQuote.customerId,
        lineItems: sourceQuote.lineItems.map((item, i) => ({
          id: `dup-${i}`,
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
        discounts: sourceQuote.discounts.filter((d) => d.type !== "contract").map((d) => ({ ...d })),
        shipping: sourceQuote.shipping,
        artworkIds: [...sourceQuote.artworkIds],
        internalNotes: sourceQuote.internalNotes,
        customerNotes: sourceQuote.customerNotes,
      };
    }
  }

  return (
    <>
      <Topbar breadcrumbs={buildBreadcrumbs(CRUMBS.quotes, { label: isDuplicate ? "Copy as New" : "New Quote" })} />
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-semibold tracking-tight">
          {isDuplicate ? "Copy as New" : "New Quote"}
        </h1>
        <QuoteForm key={duplicate || "new"} mode="create" initialData={initialData} />
      </div>
    </>
  );
}
