"use client";

import { useState, useCallback, Suspense } from "react";
import Link from "next/link";
import { Plus, LayoutGrid, List } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Topbar } from "@/components/layout/topbar";
import { buildBreadcrumbs } from "@/lib/helpers/breadcrumbs";

import { JobsDataTable } from "./_components/JobsDataTable";
import { MoveLaneDialog } from "./_components/MoveLaneDialog";
import { BlockReasonDialog } from "./_components/BlockReasonDialog";

import {
  jobs as initialJobs,
  customers,
} from "@/lib/mock-data";
import { LANE_LABELS } from "@/lib/constants";
import type { Job, Lane } from "@/lib/schemas/job";

// ---------------------------------------------------------------------------
// Inner component (needs Suspense boundary for useSearchParams)
// ---------------------------------------------------------------------------

function JobsListInner() {
  // ---- Mutable job state (Phase 1 client-side only) ----
  const [jobs, setJobs] = useState<Job[]>(() =>
    initialJobs.filter((j) => !j.isArchived),
  );

  // ---- Move Lane dialog state ----
  const [moveLaneDialog, setMoveLaneDialog] = useState<{
    open: boolean;
    job: Job | null;
  }>({ open: false, job: null });

  // ---- Block Reason dialog state ----
  const [blockDialog, setBlockDialog] = useState<{
    open: boolean;
    job: Job | null;
  }>({ open: false, job: null });

  // ---- Customer name helper ----
  function getCustomerName(customerId: string): string {
    const customer = customers.find((c) => c.id === customerId);
    return customer?.company ?? customer?.name ?? "Unknown";
  }

  function getJobLabel(job: Job): string {
    return `${job.jobNumber}: ${getCustomerName(job.customerId)}`;
  }

  // ---- Move lane ----
  const handleMoveLane = useCallback((job: Job) => {
    setMoveLaneDialog({ open: true, job });
  }, []);

  const confirmMoveLane = useCallback(
    (targetLane: Lane, blockReason?: string) => {
      if (!moveLaneDialog.job) return;
      const jobId = moveLaneDialog.job.id;
      setJobs((prev) =>
        prev.map((j) =>
          j.id === jobId
            ? {
                ...j,
                lane: targetLane,
                blockReason:
                  targetLane === "blocked" ? blockReason : undefined,
                blockedAt:
                  targetLane === "blocked"
                    ? new Date().toISOString()
                    : undefined,
              }
            : j,
        ),
      );
      toast.success(
        `${moveLaneDialog.job.jobNumber} moved to ${LANE_LABELS[targetLane]}`,
      );
      setMoveLaneDialog({ open: false, job: null });
    },
    [moveLaneDialog.job],
  );

  const cancelMoveLane = useCallback(() => {
    setMoveLaneDialog({ open: false, job: null });
  }, []);

  // ---- Block ----
  const handleBlock = useCallback((job: Job) => {
    setBlockDialog({ open: true, job });
  }, []);

  const confirmBlock = useCallback(
    (reason: string) => {
      if (!blockDialog.job) return;
      const jobId = blockDialog.job.id;
      setJobs((prev) =>
        prev.map((j) =>
          j.id === jobId
            ? {
                ...j,
                lane: "blocked" as Lane,
                blockReason: reason,
                blockedAt: new Date().toISOString(),
              }
            : j,
        ),
      );
      toast.success(`${blockDialog.job.jobNumber} marked as blocked`);
      setBlockDialog({ open: false, job: null });
    },
    [blockDialog.job],
  );

  const cancelBlock = useCallback(() => {
    setBlockDialog({ open: false, job: null });
  }, []);

  // ---- Unblock ----
  const handleUnblock = useCallback((job: Job) => {
    // Restore to last non-blocked lane from history (matches detail page behavior)
    const lastNonBlockedEntry = [...job.history]
      .reverse()
      .find((entry) => entry.fromLane !== "blocked");
    const restoreLane: Lane = lastNonBlockedEntry
      ? lastNonBlockedEntry.fromLane
      : "ready";

    setJobs((prev) =>
      prev.map((j) =>
        j.id === job.id
          ? {
              ...j,
              lane: restoreLane,
              blockReason: undefined,
              blockedAt: undefined,
            }
          : j,
      ),
    );
    toast.success(`${job.jobNumber} unblocked and moved to ${LANE_LABELS[restoreLane]}`);
  }, []);

  return (
    <>
      <JobsDataTable
        jobs={jobs}
        onMoveLane={handleMoveLane}
        onBlock={handleBlock}
        onUnblock={handleUnblock}
      />

      {/* Move Lane Dialog */}
      {moveLaneDialog.job && (
        <MoveLaneDialog
          open={moveLaneDialog.open}
          onOpenChange={(open) => {
            if (!open) cancelMoveLane();
          }}
          cardLabel={getJobLabel(moveLaneDialog.job)}
          currentLane={moveLaneDialog.job.lane}
          onConfirm={confirmMoveLane}
          onCancel={cancelMoveLane}
        />
      )}

      {/* Block Reason Dialog */}
      {blockDialog.job && (
        <BlockReasonDialog
          open={blockDialog.open}
          onOpenChange={(open) => {
            if (!open) cancelBlock();
          }}
          cardLabel={getJobLabel(blockDialog.job)}
          onConfirm={confirmBlock}
          onCancel={cancelBlock}
        />
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function JobsListPage() {
  return (
    <>
      <Topbar breadcrumbs={buildBreadcrumbs({ label: "Jobs" })} />
      <div className="flex flex-col gap-4">
        {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-lg font-semibold text-foreground">Jobs</h1>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div
            role="group"
            aria-label="View mode"
            className="flex items-center rounded-md border border-border/50 p-0.5"
          >
            <Button
              variant="ghost"
              size="icon-xs"
              className="bg-surface text-foreground"
              aria-label="List view"
              aria-pressed="true"
            >
              <List className="size-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon-xs"
              className="text-muted-foreground"
              aria-label="Board view"
              aria-pressed="false"
              asChild
            >
              <Link href="/jobs/board">
                <LayoutGrid className="size-3.5" />
              </Link>
            </Button>
          </div>

          {/* New Job placeholder */}
          <Button
            size="sm"
            className="gap-1.5 bg-action text-primary-foreground font-medium shadow-brutal shadow-action/30 hover:shadow-brutal-sm hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
            onClick={() =>
              toast.info("Create Job from Quote -- coming in Phase 2")
            }
          >
            <Plus className="size-3.5" />
            New Job
          </Button>
        </div>
      </div>

      {/* Data table (wrapped in Suspense for useSearchParams) */}
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
            Loading jobs...
          </div>
        }
      >
        <JobsListInner />
      </Suspense>
      </div>
    </>
  );
}
