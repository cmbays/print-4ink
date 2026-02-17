"use client";

import { useState } from "react";
import { Monitor } from "lucide-react";
import { deriveScreensFromJobs } from "@domain/rules/screen.rules";
import { getJobsMutable } from "@infra/repositories/jobs";
import { ScreenRecordRow } from "./ScreenRecordRow";
import { ReclaimScreenDialog } from "./ReclaimScreenDialog";
import type { CustomerScreen } from "@domain/entities/customer-screen";

interface CustomerScreensTabProps {
  customerId: string;
}

export function CustomerScreensTab({ customerId }: CustomerScreensTabProps) {
  const allScreens = deriveScreensFromJobs(customerId, getJobsMutable());
  const [reclaimedIds, setReclaimedIds] = useState<Set<string>>(new Set());
  const [reclaimTarget, setReclaimTarget] = useState<CustomerScreen | null>(null);

  const activeScreens = allScreens.filter((s) => !reclaimedIds.has(s.id));

  function handleReclaim(screenId: string) {
    const screen = allScreens.find((s) => s.id === screenId);
    if (screen) setReclaimTarget(screen);
  }

  function confirmReclaim() {
    if (reclaimTarget) {
      setReclaimedIds((prev) => new Set([...prev, reclaimTarget.id]));
      setReclaimTarget(null);
    }
  }

  if (allScreens.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Monitor className="mb-3 size-8 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">No screens for this customer</p>
        <p className="mt-1 text-xs text-muted-foreground/60">
          Screens are derived from completed jobs
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {activeScreens.length} active screen{activeScreens.length !== 1 ? "s" : ""}
          {reclaimedIds.size > 0 && ` \u00b7 ${reclaimedIds.size} reclaimed`}
        </p>
      </div>

      <div className="space-y-2">
        {activeScreens.map((screen) => (
          <ScreenRecordRow
            key={screen.id}
            screen={screen}
            onReclaim={handleReclaim}
          />
        ))}
      </div>

      {/* Conditional rendering for state reset */}
      {reclaimTarget && (
        <ReclaimScreenDialog
          screen={reclaimTarget}
          open={true}
          onOpenChange={(open) => {
            if (!open) setReclaimTarget(null);
          }}
          onConfirm={confirmReclaim}
        />
      )}
    </div>
  );
}
