import { Suspense } from "react";
import { QuotesDataTable } from "./_components/QuotesDataTable";

export default function QuotesPage() {
  return (
    <div className="flex flex-col gap-6">
      <Suspense>
        <QuotesDataTable />
      </Suspense>
    </div>
  );
}
