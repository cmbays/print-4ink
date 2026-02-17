import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getInvoiceById } from "@infra/repositories/invoices";
import { getCustomers } from "@infra/repositories/customers";
import { getQuoteById } from "@infra/repositories/quotes";
import { Button } from "@shared/ui/primitives/button";
import { Topbar } from "@/components/layout/topbar";
import { buildBreadcrumbs, CRUMBS } from "@/lib/helpers/breadcrumbs";
import { InvoiceForm } from "@/src/app/(dashboard)/invoices/_components/InvoiceForm";

export default async function EditInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const invoice = await getInvoiceById(id);

  if (!invoice) {
    return (
      <>
        <Topbar
          breadcrumbs={buildBreadcrumbs(
            CRUMBS.invoices,
            { label: "Not Found" },
          )}
        />
        <div className="flex flex-col items-center justify-center py-24">
          <div
            className="rounded-lg border border-border bg-card p-8 text-center"
            role="alert"
          >
            <h2 className="text-xl font-semibold text-foreground">
              Invoice not found
            </h2>
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
    );
  }

  // Only draft invoices can be edited
  if (invoice.status !== "draft") {
    redirect(`/invoices/${id}`);
  }

  const [customers, sourceQuote] = await Promise.all([
    getCustomers(),
    invoice.quoteId ? getQuoteById(invoice.quoteId) : Promise.resolve(null),
  ]);

  return (
    <>
      <Topbar
        breadcrumbs={buildBreadcrumbs(
          CRUMBS.invoices,
          { label: invoice.invoiceNumber, href: `/invoices/${id}` },
          { label: "Edit" },
        )}
      />
      <div className="mx-auto max-w-4xl space-y-6 py-6">
        <InvoiceForm
          mode="edit"
          initialData={invoice}
          customers={customers}
          sourceQuote={sourceQuote}
        />
      </div>
    </>
  );
}
