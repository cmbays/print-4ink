import { Topbar } from "@shared/ui/layouts/topbar";
import { buildBreadcrumbs, CRUMBS } from "@/lib/helpers/breadcrumbs";
import { getInvoices } from "@infra/repositories/invoices";
import { getCustomers } from "@infra/repositories/customers";
import { getQuoteById } from "@infra/repositories/quotes";
import { InvoiceForm } from "../_components/InvoiceForm";

export default async function NewInvoicePage({
  searchParams,
}: {
  searchParams: Promise<{ quoteId?: string }>;
}) {
  const { quoteId } = await searchParams;

  const [invoices, customers, sourceQuote] = await Promise.all([
    getInvoices(),
    getCustomers(),
    quoteId ? getQuoteById(quoteId) : Promise.resolve(null),
  ]);

  const initialInvoiceNumber = `INV-${String(invoices.length + 1).padStart(4, "0")}`;

  return (
    <>
      <Topbar breadcrumbs={buildBreadcrumbs(CRUMBS.invoices, { label: "New Invoice" })} />
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-semibold tracking-tight">New Invoice</h1>
        <InvoiceForm
          mode="create"
          customers={customers}
          sourceQuote={sourceQuote}
          initialInvoiceNumber={initialInvoiceNumber}
        />
      </div>
    </>
  );
}
