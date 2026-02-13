import { Package, MapPin, Shirt, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { SERVICE_TYPE_LABELS } from "@/lib/constants";
import type { Job } from "@/lib/schemas/job";

interface JobDetailsSectionProps {
  job: Job;
}

export function JobDetailsSection({ job }: JobDetailsSectionProps) {
  return (
    <section className="rounded-lg border border-border bg-card">
      <div className="border-b border-border px-4 py-3">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Production Details
        </h2>
      </div>

      <div className="space-y-4 p-4">
        {/* Quantity + Service Type */}
        <div className="flex items-start gap-3">
          <Package className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium text-foreground">
              {job.quantity.toLocaleString()} pcs
              <span className="ml-2 text-xs text-muted-foreground">
                {SERVICE_TYPE_LABELS[job.serviceType]}
              </span>
            </p>
          </div>
        </div>

        {/* Garment Details */}
        {job.garmentDetails.length > 0 && (
          <div className="flex items-start gap-3">
            <Shirt className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <div className="space-y-2">
              {job.garmentDetails.map((gd) => (
                <div key={`${gd.garmentId}:${gd.colorId}`}>
                  <p className="text-sm text-foreground">
                    {gd.garmentId}
                    <span className="ml-2 text-xs text-muted-foreground">
                      {gd.colorId}
                    </span>
                  </p>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {Object.entries(gd.sizes).map(([size, count]) => (
                      <span
                        key={size}
                        className="inline-flex items-center rounded bg-surface px-1.5 py-0.5 text-xs text-secondary-foreground"
                      >
                        {size}: {count}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Print Locations */}
        {job.printLocations.length > 0 && (
          <div className="flex items-start gap-3">
            <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <div className="space-y-1.5">
              {job.printLocations.map((loc) => (
                <div
                  key={loc.position}
                  className="flex items-center gap-2 text-sm"
                >
                  <span className="text-foreground">{loc.position}</span>
                  <span className="text-xs text-muted-foreground">
                    {loc.colorCount} {loc.colorCount === 1 ? "color" : "colors"}
                  </span>
                  {loc.artworkApproved ? (
                    <span className="inline-flex items-center gap-1 text-xs text-success">
                      <CheckCircle2 className="size-3" />
                      Approved
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs text-warning">
                      <XCircle className="size-3" />
                      Pending
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Complexity */}
        <div className="flex flex-wrap gap-3 border-t border-border/30 pt-3">
          <DetailChip
            label="Locations"
            value={String(job.complexity.locationCount)}
          />
          {job.complexity.screenCount != null && (
            <DetailChip
              label="Screens"
              value={String(job.complexity.screenCount)}
            />
          )}
          <DetailChip
            label="Garment Varieties"
            value={String(job.complexity.garmentVariety)}
          />
        </div>
      </div>
    </section>
  );
}

function DetailChip({ label, value }: { label: string; value: string }) {
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 rounded-md bg-surface px-2.5 py-1 text-xs"
    )}>
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </span>
  );
}
