import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@shared/ui/primitives/button'
import { Topbar } from '@shared/ui/layouts/topbar'
import { buildBreadcrumbs, CRUMBS } from '@shared/lib/breadcrumbs'
import { QuoteDetailView } from '@/src/app/(dashboard)/quotes/_components/QuoteDetailView'
import { getQuoteById } from '@infra/repositories/quotes'
import { getCustomerById } from '@infra/repositories/customers'
import { getArtworks } from '@infra/repositories/artworks'
import { getGarmentCatalog } from '@infra/repositories/garments'
import { getColors } from '@infra/repositories/colors'

export default async function QuoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const quote = await getQuoteById(id)

  if (!quote) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="rounded-lg border border-border bg-card p-8 text-center" role="alert">
          <h2 className="text-xl font-semibold text-foreground">Quote not found</h2>
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
    )
  }

  const [customer, allArtworks, garmentCatalog, colors] = await Promise.all([
    getCustomerById(quote.customerId),
    getArtworks(),
    getGarmentCatalog(),
    getColors(),
  ])
  const quoteArtworks = allArtworks.filter((a) => quote.artworkIds.includes(a.id))

  return (
    <>
      <Topbar breadcrumbs={buildBreadcrumbs(CRUMBS.quotes, { label: quote.quoteNumber })} />
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Quote Detail */}
        <QuoteDetailView
          quote={quote}
          customer={customer}
          artworks={quoteArtworks}
          garmentCatalog={garmentCatalog}
          colors={colors}
          mode="detail"
        />
      </div>
    </>
  )
}
