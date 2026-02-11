import { Suspense } from "react";
import { Topbar } from "@/components/layout/topbar";
import { QuotesDataTable } from "./_components/QuotesDataTable";

export default function QuotesPage() {
  return (
    <>
      <Topbar breadcrumbs={[{ label: "Quotes" }]} />
      <div className="flex flex-col gap-6">
        <Suspense fallback={<p className="p-4 text-sm text-muted-foreground">Loading quotes...</p>}>
          <QuotesDataTable />
        </Suspense>
      </div>
    </>
  );
}
