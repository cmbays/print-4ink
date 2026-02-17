import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Topbar } from "@/components/layout/topbar";
import { CapacitySummary } from "@/components/features/CapacitySummary";
import {
  LANE_LABELS,
  PRIORITY_LABELS,
} from "@/lib/constants";
import { getJobs } from "@infra/repositories/jobs";
import { getCustomers } from "@infra/repositories/customers";
import { money, toNumber } from "@/lib/helpers/money";
import {
  AlertTriangle,
  Calendar,
  Clock,
  CheckCircle2,
  Package,
  Kanban,
} from "lucide-react";
import type { Lane } from "@/lib/schemas/job";

export default async function DashboardPage() {
  const [jobs, customers] = await Promise.all([getJobs(), getCustomers()]);

  function getCustomerName(customerId: string) {
    return customers.find((c) => c.id === customerId)?.company ?? "Unknown";
  }

  const blockedJobs = jobs.filter((j) => j.lane === "blocked");
  const inProgressJobs = jobs.filter(
    (j) => j.lane === "in_progress" || j.lane === "review"
  );
  const completedJobs = jobs.filter((j) => j.lane === "done");

  // Coming up this week — jobs due within the next 7 days (server-computed)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weekFromToday = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
  const comingUpJobs = jobs
    .filter((j) => {
      if (j.lane === "done" || j.isArchived) return false;
      const due = new Date(j.dueDate);
      return due >= today && due <= weekFromToday;
    })
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  // Capacity summary (server-computed)
  const capacitySummary = {
    totalQuantity: jobs.filter((j) => j.lane !== "done").reduce((sum, j) => sum + j.quantity, 0),
    rushQuantity: jobs.filter((j) => j.lane !== "done" && j.priority === "rush").reduce((sum, j) => sum + j.quantity, 0),
    totalRevenue: toNumber(jobs.reduce((sum, j) => sum.plus(money(j.orderTotal)), money(0))),
    cardsByLane: (["ready", "in_progress", "review", "blocked", "done"] as Lane[]).reduce(
      (acc, lane) => ({ ...acc, [lane]: jobs.filter((j) => j.lane === lane).length }),
      {} as Record<Lane, number>
    ),
  };

  return (
    <>
    <Topbar />
    <div className="space-y-4 md:space-y-6">
      <div className="hidden md:block">
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Production overview for 4Ink
        </p>
      </div>

      {/* Summary cards — 2 col on mobile, 4 col on desktop */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Blocked
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{blockedJobs.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              In Progress
            </CardTitle>
            <Clock className="h-4 w-4 text-action" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{inProgressJobs.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completed
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{completedJobs.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Jobs
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{jobs.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Capacity summary — mobile only */}
      <div className="md:hidden">
        <CapacitySummary summary={capacitySummary} variant="full" />
      </div>

      {/* Needs Attention — blocked jobs (highest priority) */}
      {blockedJobs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-warning">
              <AlertTriangle className="h-5 w-5" />
              Needs Attention
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {blockedJobs.map((job) => (
              <Link
                key={job.id}
                href={`/jobs/${job.id}`}
                className="flex flex-col gap-2 rounded-md border border-border p-3 transition-colors hover:bg-muted/50 md:flex-row md:items-center md:justify-between md:gap-0"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium">{job.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {job.jobNumber} &middot; {getCustomerName(job.customerId)}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="text-warning border-warning">
                    {PRIORITY_LABELS[job.priority]}
                  </Badge>
                  {job.blockReason && (
                    <Badge variant="secondary" className="max-w-48 truncate md:max-w-none">
                      {job.blockReason}
                    </Badge>
                  )}
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}

      {/* In Progress */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>In Progress</CardTitle>
          <Button variant="outline" size="sm" asChild>
            <Link href="/jobs/board">
              <Kanban className="size-4" />
              <span className="hidden sm:inline">View Board</span>
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {inProgressJobs.map((job) => (
            <Link
              key={job.id}
              href={`/jobs/${job.id}`}
              className="flex flex-col gap-2 rounded-md border border-border p-3 transition-colors hover:bg-muted/50 md:flex-row md:items-center md:justify-between md:gap-0"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium">{job.title}</p>
                <p className="text-xs text-muted-foreground">
                  {job.jobNumber} &middot; {getCustomerName(job.customerId)}{" "}
                  &middot; Due {job.dueDate}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">
                  {LANE_LABELS[job.lane]}
                </Badge>
                <Badge variant="secondary">
                  {PRIORITY_LABELS[job.priority]}
                </Badge>
              </div>
            </Link>
          ))}
        </CardContent>
      </Card>

      {/* Coming Up This Week — mobile only, lowest priority */}
      {comingUpJobs.length > 0 && (
        <div className="md:hidden">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-action" />
                Coming Up This Week
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {comingUpJobs.slice(0, 5).map((job) => (
                <Link
                  key={job.id}
                  href={`/jobs/${job.id}`}
                  className="flex min-h-(--mobile-touch-target) items-center justify-between rounded-md border border-border p-3 transition-colors hover:bg-muted/50"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{job.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {job.jobNumber} &middot; Due{" "}
                      {new Date(job.dueDate).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant="outline" className="ml-2 shrink-0">
                    {LANE_LABELS[job.lane]}
                  </Badge>
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
    </>
  );
}
