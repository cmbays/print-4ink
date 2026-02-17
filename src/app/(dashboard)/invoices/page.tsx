import { Suspense } from "react";
import { Topbar } from "@shared/ui/layouts/topbar";
import { buildBreadcrumbs } from "@shared/lib/breadcrumbs";
import { getInvoices } from "@infra/repositories/invoices";
import { getCustomers } from "@infra/repositories/customers";
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
