import { Suspense } from "react";
import { Topbar } from "@/components/layout/topbar";
import { buildBreadcrumbs } from "@/lib/helpers/breadcrumbs";
import { invoices } from "@/lib/mock-data";
import { InvoiceStatsBar } from "./_components/InvoiceStatsBar";
import { InvoicesDataTable } from "./_components/InvoicesDataTable";

export default function InvoicesPage() {
  return (
    <>
      <Topbar breadcrumbs={buildBreadcrumbs({ label: "Invoices" })} />
      <div className="flex flex-col gap-6">
        <Suspense fallback={<p className="p-4 text-sm text-muted-foreground">Loading invoices...</p>}>
          <InvoiceStatsBar />
          <InvoicesDataTable invoices={invoices} />
        </Suspense>
      </div>
    </>
  );
}
