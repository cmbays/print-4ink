import { Suspense } from "react";
import { Topbar } from "@/components/layout/topbar";
import { buildBreadcrumbs } from "@/lib/helpers/breadcrumbs";
import { getInvoices } from "@/lib/dal/invoices";
import { getCustomers } from "@/lib/dal/customers";
import { InvoiceStatsBar } from "./_components/InvoiceStatsBar";
import { InvoicesDataTable } from "./_components/InvoicesDataTable";

export default async function InvoicesPage() {
  const [invoices, customers] = await Promise.all([getInvoices(), getCustomers()]);

  return (
    <>
      <Topbar breadcrumbs={buildBreadcrumbs({ label: "Invoices" })} />
      <div className="flex flex-col gap-6">
        <Suspense fallback={<p className="p-4 text-sm text-muted-foreground">Loading invoices...</p>}>
          <InvoiceStatsBar invoices={invoices} />
          <InvoicesDataTable invoices={invoices} customers={customers} />
        </Suspense>
      </div>
    </>
  );
}
