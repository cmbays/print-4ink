import { Topbar } from "@/components/layout/topbar";
import { buildBreadcrumbs } from "@/lib/helpers/breadcrumbs";
import { getJobs } from "@/lib/dal/jobs";
import { getCustomers } from "@/lib/dal/customers";
import { JobsList } from "./_components/JobsList";

export default async function JobsListPage() {
  const [jobs, customers] = await Promise.all([getJobs(), getCustomers()]);

  return (
    <>
      <Topbar breadcrumbs={buildBreadcrumbs({ label: "Jobs" })} />
      <JobsList initialJobs={jobs} customers={customers} />
    </>
  );
}
