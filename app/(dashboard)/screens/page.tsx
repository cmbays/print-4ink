import Link from "next/link";
import { Topbar } from "@/components/layout/topbar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { screens, jobs } from "@/lib/mock-data";
import { BURN_STATUS_LABELS } from "@/lib/constants";
import { Printer } from "lucide-react";
import type { BurnStatus } from "@/lib/schemas/screen";

const BURN_STATUS_COLORS: Record<BurnStatus, string> = {
  pending: "bg-warning/10 text-warning border border-warning/20",
  burned: "bg-success/10 text-success border border-success/20",
  reclaimed: "bg-muted text-muted-foreground",
};

function getJobNumber(jobId: string): string {
  return jobs.find((j) => j.id === jobId)?.jobNumber ?? "Unknown";
}

export default function ScreensPage() {
  return (
    <>
      <Topbar breadcrumbs={[{ label: "Screen Room" }]} />
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Screen Room</h1>
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
              <Table>
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
                        <Link
                          href={`/jobs/${screen.jobId}`}
                          className="text-action hover:underline text-sm"
                        >
                          {getJobNumber(screen.jobId)}
                        </Link>
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
