import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import {
  getInvoiceById,
  getInvoicePayments,
  getInvoiceCreditMemos,
} from '@infra/repositories/invoices'
import { getCustomerById } from '@infra/repositories/customers'
import { Button } from '@shared/ui/primitives/button'
import { Topbar } from '@shared/ui/layouts/topbar'
import { buildBreadcrumbs, CRUMBS } from '@shared/lib/breadcrumbs'
import { InvoiceDetailView } from '@/src/app/(dashboard)/invoices/_components/InvoiceDetailView'

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const invoice = await getInvoiceById(id)

  if (!invoice) {
    return (
      <>
        <Topbar breadcrumbs={buildBreadcrumbs(CRUMBS.invoices, { label: 'Not Found' })} />
        <div className="flex flex-col items-center justify-center py-24">
          <div className="rounded-lg border border-border bg-card p-8 text-center" role="alert">
            <h2 className="text-xl font-semibold text-foreground">Invoice not found</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              This invoice doesn&apos;t exist or has been removed.
            </p>
            <Button variant="outline" className="mt-4" asChild>
              <Link href="/invoices">
                <ArrowLeft className="size-4" />
                Back to Invoices
              </Link>
            </Button>
          </div>
        </div>
      </>
    )
  }

  const [customer, invoicePayments, invoiceCreditMemos] = await Promise.all([
    getCustomerById(invoice.customerId),
    getInvoicePayments(invoice.id),
    getInvoiceCreditMemos(invoice.id),
  ])

  return (
    <>
      <Topbar breadcrumbs={buildBreadcrumbs(CRUMBS.invoices, { label: invoice.invoiceNumber })} />
      <div className="mx-auto max-w-4xl space-y-6 py-6">
        <InvoiceDetailView
          invoice={invoice}
          customer={customer}
          payments={invoicePayments}
          creditMemos={invoiceCreditMemos}
        />
      </div>
    </>
  )
}
