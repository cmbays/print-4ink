import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Topbar } from "@/components/layout/topbar";
import {
  LANE_LABELS,
  PRIORITY_LABELS,
} from "@/lib/constants";
import { jobs, customers } from "@/lib/mock-data";
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  Package,
} from "lucide-react";

function getCustomerName(customerId: string) {
  return customers.find((c) => c.id === customerId)?.company ?? "Unknown";
}

const blockedJobs = jobs.filter((j) => j.lane === "blocked");
const inProgressJobs = jobs.filter(
  (j) => j.lane === "in_progress" || j.lane === "review"
);
const completedJobs = jobs.filter((j) => j.lane === "done");

export default function DashboardPage() {
  return (
    <>
    <Topbar />
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Production overview for 4Ink
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-4">
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

      {/* Blocked items */}
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
              <div
                key={job.id}
                className="flex items-center justify-between rounded-md border border-border p-3"
              >
                <div>
                  <p className="text-sm font-medium">{job.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {job.jobNumber} &middot; {getCustomerName(job.customerId)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-warning border-warning">
                    {PRIORITY_LABELS[job.priority]}
                  </Badge>
                  {job.blockReason && (
                    <Badge variant="secondary">
                      {job.blockReason}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* In progress */}
      <Card>
        <CardHeader>
          <CardTitle>In Progress</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {inProgressJobs.map((job) => (
            <div
              key={job.id}
              className="flex items-center justify-between rounded-md border border-border p-3"
            >
              <div>
                <p className="text-sm font-medium">{job.title}</p>
                <p className="text-xs text-muted-foreground">
                  {job.jobNumber} &middot; {getCustomerName(job.customerId)}{" "}
                  &middot; Due {job.dueDate}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  {LANE_LABELS[job.lane]}
                </Badge>
                <Badge variant="secondary">
                  {PRIORITY_LABELS[job.priority]}
                </Badge>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
    </>
  );
}
