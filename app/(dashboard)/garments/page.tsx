import { Suspense } from "react";
import { Topbar } from "@/components/layout/topbar";
import { buildBreadcrumbs } from "@/lib/helpers/breadcrumbs";
import { getGarmentCatalog } from "@/lib/dal/garments";
import { getJobs } from "@/lib/dal/jobs";
import { getCustomers } from "@/lib/dal/customers";
import { GarmentCatalogClient } from "./_components/GarmentCatalogClient";

export default async function GarmentCatalogPage() {
  const [garmentCatalog, jobs, customers] = await Promise.all([
    getGarmentCatalog(),
    getJobs(),
    getCustomers(),
  ]);

  return (
    <>
      <Topbar breadcrumbs={buildBreadcrumbs({ label: "Garment Catalog" })} />
      <div className="flex flex-col gap-4">
        <Suspense
          fallback={
            <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
              Loading garments...
            </div>
          }
        >
          <GarmentCatalogClient
            initialCatalog={garmentCatalog}
            initialJobs={jobs}
            initialCustomers={customers}
          />
        </Suspense>
      </div>
    </>
  );
}
