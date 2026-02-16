import { Topbar } from "@/components/layout/topbar";
import { buildBreadcrumbs, CRUMBS } from "@/lib/helpers/breadcrumbs";
import { InvoiceForm } from "../_components/InvoiceForm";

export default async function NewInvoicePage({
  searchParams,
}: {
  searchParams: Promise<{ quoteId?: string }>;
}) {
  const { quoteId } = await searchParams;

  return (
    <>
      <Topbar breadcrumbs={buildBreadcrumbs(CRUMBS.invoices, { label: "New Invoice" })} />
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-semibold tracking-tight">New Invoice</h1>
        <InvoiceForm mode="create" quoteId={quoteId} />
      </div>
    </>
  );
}
