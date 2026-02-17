import Link from "next/link";
import { Topbar } from "@shared/ui/layouts/topbar";
import { buildBreadcrumbs } from "@/lib/helpers/breadcrumbs";
import { Badge } from "@shared/ui/primitives/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/ui/primitives/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@shared/ui/primitives/table";
import { getScreens } from "@infra/repositories/screens";
import { getJobs } from "@infra/repositories/jobs";
import { BURN_STATUS_LABELS } from "@domain/constants";
import { Printer } from "lucide-react";
import type { BurnStatus } from "@domain/entities/screen";

const BURN_STATUS_COLORS: Record<BurnStatus, string> = {
  pending: "bg-warning/10 text-warning border border-warning/20",
  burned: "bg-success/10 text-success border border-success/20",
  reclaimed: "bg-muted text-muted-foreground",
};

export default async function ScreensPage() {
  const [screens, jobs] = await Promise.all([getScreens(), getJobs()]);

  function findJob(jobId: string) {
    return jobs.find((j) => j.id === jobId) ?? null;
  }

  return (
    <>
      <Topbar breadcrumbs={buildBreadcrumbs({ label: "Screens" })} />
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Screens</h1>
          <p className="text-sm text-muted-foreground">
            Track screens, mesh counts, and burn status
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Printer className="size-5 text-action" />
              <CardTitle className="text-base">
                Screens ({screens.length})
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {screens.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <Printer className="size-10 mb-3" aria-hidden="true" />
                <p className="text-sm font-medium">No screens yet</p>
              </div>
            ) : (
              <Table aria-label="Screen inventory">
                <TableHeader>
                  <TableRow>
                    <TableHead>Mesh Count</TableHead>
                    <TableHead>Emulsion Type</TableHead>
                    <TableHead>Burn Status</TableHead>
                    <TableHead>Linked Job</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {screens.map((screen) => (
                    <TableRow key={screen.id}>
                      <TableCell className="font-medium text-foreground tabular-nums">
                        {screen.meshCount}
                      </TableCell>
                      <TableCell className="text-foreground">
                        {screen.emulsionType}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="ghost"
                          className={BURN_STATUS_COLORS[screen.burnStatus]}
                        >
                          {BURN_STATUS_LABELS[screen.burnStatus]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const job = findJob(screen.jobId);
                          return job ? (
                            <Link
                              href={`/jobs/${screen.jobId}`}
                              className="text-action hover:underline text-sm"
                            >
                              {job.jobNumber}
                            </Link>
                          ) : (
                            <span className="text-muted-foreground italic text-sm">
                              Unknown job
                            </span>
                          );
                        })()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
