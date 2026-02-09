import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { quotes, customers, artworks } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
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

  const customer = customers.find((c) => c.id === quote.customerId) ?? null;
  const quoteArtworks = artworks.filter((a) =>
    quote.artworkIds.includes(a.id)
  );

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

      {/* Quote Detail */}
      <QuoteDetailView
        quote={quote}
        customer={customer}
        artworks={quoteArtworks}
        mode="detail"
      />
    </div>
  );
}
