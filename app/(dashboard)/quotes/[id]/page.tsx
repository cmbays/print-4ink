import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { quotes, customers, artworks } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Topbar } from "@/components/layout/topbar";
import { buildBreadcrumbs, CRUMBS } from "@/lib/helpers/breadcrumbs";
import { QuoteDetailView } from "@/app/(dashboard)/quotes/_components/QuoteDetailView";

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

  const customer = customers.find((c) => c.id === quote.customerId) ?? null;
  const quoteArtworks = artworks.filter((a) =>
    quote.artworkIds.includes(a.id)
  );

  return (
    <>
      <Topbar breadcrumbs={buildBreadcrumbs(CRUMBS.quotes, { label: quote.quoteNumber })} />
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Quote Detail */}
        <QuoteDetailView
          quote={quote}
          customer={customer}
          artworks={quoteArtworks}
          mode="detail"
        />
      </div>
    </>
  );
}
