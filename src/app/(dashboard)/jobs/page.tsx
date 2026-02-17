import { Topbar } from "@shared/ui/layouts/topbar";
import { buildBreadcrumbs } from "@/lib/helpers/breadcrumbs";
import { getJobs } from "@infra/repositories/jobs";
import { getCustomers } from "@infra/repositories/customers";
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
