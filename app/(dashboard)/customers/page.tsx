import { Suspense } from "react";
import { Topbar } from "@/components/layout/topbar";
import { buildBreadcrumbs } from "@/lib/helpers/breadcrumbs";
import { customers } from "@/lib/mock-data";
import { CustomerListStatsBar } from "./_components/CustomerListStatsBar";
import { SmartViewTabs } from "./_components/SmartViewTabs";
import { CustomersDataTable } from "./_components/CustomersDataTable";

export default function CustomersPage() {
  return (
    <>
      <Topbar breadcrumbs={buildBreadcrumbs({ label: "Customers" })} />
      <div className="flex flex-col gap-6">
        <Suspense fallback={<p className="p-4 text-sm text-muted-foreground">Loading customers...</p>}>
          <CustomerListStatsBar customers={customers} />
          <SmartViewTabs />
          <CustomersDataTable customers={customers} />
        </Suspense>
      </div>
    </>
  );
}
