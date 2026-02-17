import { Suspense } from "react";
import { Topbar } from "@/components/layout/topbar";
import { buildBreadcrumbs } from "@/lib/helpers/breadcrumbs";
import { QuotesDataTable } from "./_components/QuotesDataTable";
import { getQuotes } from "@/lib/dal/quotes";
import { getCustomers } from "@/lib/dal/customers";

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
