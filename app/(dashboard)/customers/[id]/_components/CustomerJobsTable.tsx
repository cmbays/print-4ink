"use client";

import { useRouter } from "next/navigation";
import { Briefcase } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  LANE_LABELS,
  LANE_COLORS,
  PRIORITY_LABELS,
  PRIORITY_COLORS,
} from "@/lib/constants";
import { formatDate } from "@/lib/helpers/format";
import type { Job } from "@/lib/schemas/job";

interface CustomerJobsTableProps {
  jobs: Job[];
}

export function CustomerJobsTable({ jobs }: CustomerJobsTableProps) {
  const router = useRouter();
  const sorted = [...jobs].sort(
    (a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime()
  );

  if (sorted.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <Briefcase className="size-10 mb-3" aria-hidden="true" />
        <p className="text-sm font-medium">No jobs yet</p>
      </div>
    );
  }

  return (
    <>
      {/* Desktop table */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-sm" aria-label="Customer jobs">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="pb-3 font-medium text-muted-foreground">Job #</th>
              <th className="pb-3 font-medium text-muted-foreground">Title</th>
              <th className="pb-3 font-medium text-muted-foreground">Lane</th>
              <th className="pb-3 font-medium text-muted-foreground">Priority</th>
              <th className="pb-3 font-medium text-muted-foreground">Due Date</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((job) => (
              <tr
                key={job.id}
                className="border-b border-border/50 hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => router.push(`/jobs/${job.id}`)}
              >
                <td className="py-3 font-medium text-foreground">
                  {job.jobNumber}
                </td>
                <td className="py-3 text-foreground">{job.title}</td>
                <td className="py-3">
                  <Badge variant="ghost" className={LANE_COLORS[job.lane]}>
                    {LANE_LABELS[job.lane]}
                  </Badge>
                </td>
                <td className="py-3">
                  <Badge variant="ghost" className={PRIORITY_COLORS[job.priority]}>
                    {PRIORITY_LABELS[job.priority]}
                  </Badge>
                </td>
                <td className="py-3 text-muted-foreground">
                  {formatDate(job.dueDate)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="sm:hidden space-y-3" role="list" aria-label="Customer jobs">
        {sorted.map((job) => (
          <div
            key={job.id}
            className="rounded-lg border border-border bg-elevated p-4 cursor-pointer hover:bg-muted/50 transition-colors"
            role="listitem"
            onClick={() => router.push(`/jobs/${job.id}`)}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-foreground">{job.jobNumber}</span>
              <Badge variant="ghost" className={LANE_COLORS[job.lane]}>
                {LANE_LABELS[job.lane]}
              </Badge>
            </div>
            <p className="text-sm text-foreground mb-2">{job.title}</p>
            <div className="flex items-center justify-between">
              <Badge variant="ghost" className={PRIORITY_COLORS[job.priority]}>
                {PRIORITY_LABELS[job.priority]}
              </Badge>
              <span className="text-xs text-muted-foreground">
                Due {formatDate(job.dueDate)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
