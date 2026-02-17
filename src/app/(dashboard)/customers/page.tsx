import { Suspense } from "react";
import { Topbar } from "@/components/layout/topbar";
import { buildBreadcrumbs } from "@/lib/helpers/breadcrumbs";
import { getCustomers } from "@/lib/dal/customers";
import { getQuotes } from "@/lib/dal/quotes";
import { CustomerListStatsBar } from "./_components/CustomerListStatsBar";
import { SmartViewTabs } from "./_components/SmartViewTabs";
import { CustomersDataTable } from "./_components/CustomersDataTable";

export default async function CustomersPage() {
  const [customers, quotes] = await Promise.all([getCustomers(), getQuotes()]);

  return (
    <>
      <Topbar breadcrumbs={buildBreadcrumbs({ label: "Customers" })} />
      <div className="flex flex-col gap-6">
        <Suspense fallback={<p className="p-4 text-sm text-muted-foreground">Loading customers...</p>}>
          <CustomerListStatsBar customers={customers} quotes={quotes} />
          <SmartViewTabs />
          <CustomersDataTable customers={customers} quotes={quotes} />
        </Suspense>
      </div>
    </>
  );
}
