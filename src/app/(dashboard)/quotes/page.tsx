import { Suspense } from "react";
import { Topbar } from "@shared/ui/layouts/topbar";
import { buildBreadcrumbs } from "@shared/lib/breadcrumbs";
import { QuotesDataTable } from "./_components/QuotesDataTable";
import { getQuotes } from "@infra/repositories/quotes";
import { getCustomers } from "@infra/repositories/customers";

export default async function QuotesPage() {
  const [quotes, customers] = await Promise.all([getQuotes(), getCustomers()]);

  return (
    <>
      <Topbar breadcrumbs={buildBreadcrumbs({ label: "Quotes" })} />
      <div className="flex flex-col gap-6">
        <Suspense fallback={<p className="p-4 text-sm text-muted-foreground">Loading quotes...</p>}>
          <QuotesDataTable quotes={quotes} customers={customers} />
        </Suspense>
      </div>
    </>
  );
}
