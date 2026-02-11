import { Suspense } from "react";
import { Topbar } from "@/components/layout/topbar";
import { invoices } from "@/lib/mock-data";
import { InvoiceStatsBar } from "./_components/InvoiceStatsBar";
import { InvoicesSmartViewTabs } from "./_components/InvoicesSmartViewTabs";
import { InvoicesDataTable } from "./_components/InvoicesDataTable";

export default function InvoicesPage() {
  return (
    <>
      <Topbar breadcrumbs={[{ label: "Invoices" }]} />
      <div className="flex flex-col gap-6">
        <Suspense fallback={<p className="p-4 text-sm text-muted-foreground">Loading invoices...</p>}>
          <InvoiceStatsBar />
          <InvoicesSmartViewTabs />
          <InvoicesDataTable invoices={invoices} />
        </Suspense>
      </div>
    </>
  );
}
