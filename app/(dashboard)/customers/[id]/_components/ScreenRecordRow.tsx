"use client";

import Link from "next/link";
import { Monitor } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ColorSwatchPicker } from "@/components/features/ColorSwatchPicker";
import { getColorById } from "@/lib/helpers/garment-helpers";
import type { CustomerScreen } from "@/lib/schemas/customer-screen";
import type { Color } from "@/lib/schemas/color";

interface ScreenRecordRowProps {
  screen: CustomerScreen;
  onReclaim: (screenId: string) => void;
}

export function ScreenRecordRow({ screen, onReclaim }: ScreenRecordRowProps) {
  // Resolve color objects
  const screenColors = screen.colorIds
    .map((id) => getColorById(id))
    .filter((c): c is Color => c != null);

  const dateStr = new Date(screen.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-elevated p-3">
      <div className="flex items-start gap-3">
        <Monitor className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">{screen.artworkName}</p>
          <div className="flex items-center gap-2">
            <ColorSwatchPicker
              colors={screenColors}
              onSelect={() => {}}
              compact
              maxCompactSwatches={6}
            />
            <Badge variant="outline" className="text-[10px]">
              {screen.meshCount} mesh
            </Badge>
            <span className="text-xs text-muted-foreground">{dateStr}</span>
          </div>
          <Link
            href={`/jobs/${screen.jobId}`}
            className="text-xs text-action hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            View linked job
          </Link>
        </div>
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="text-xs text-destructive hover:text-destructive"
        onClick={() => onReclaim(screen.id)}
      >
        Reclaim
      </Button>
    </div>
  );
}
