"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/pricing-engine";
import type { LocationUpcharge } from "@/lib/schemas/price-matrix";
import { MapPin } from "lucide-react";

const LOCATION_LABELS: Record<string, string> = {
  front: "Front",
  back: "Back",
  "left-sleeve": "Left Sleeve",
  "right-sleeve": "Right Sleeve",
  pocket: "Pocket",
};

interface LocationUpchargeEditorProps {
  locations: LocationUpcharge[];
  onLocationsChange: (locations: LocationUpcharge[]) => void;
}

export function LocationUpchargeEditor({
  locations,
  onLocationsChange,
}: LocationUpchargeEditorProps) {
  const updateUpcharge = (index: number, value: number) => {
    const updated = locations.map((loc, i) =>
      i === index ? { ...loc, upcharge: value } : loc
    );
    onLocationsChange(updated);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <MapPin className="size-4 text-muted-foreground" />
          <CardTitle className="text-base">Location Upcharges</CardTitle>
        </div>
        <p className="text-xs text-muted-foreground">
          Additional per-piece cost for each print location beyond the primary.
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {locations.map((loc, index) => (
            <div
              key={loc.location}
              className="flex items-center justify-between gap-4 rounded-md bg-surface px-3 py-2"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm text-foreground">
                  {LOCATION_LABELS[loc.location] ?? loc.location}
                </span>
                {loc.upcharge === 0 && (
                  <Badge variant="secondary" className="text-[10px]">
                    Base
                  </Badge>
                )}
              </div>
              <div className="relative w-24">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  $
                </span>
                <Input
                  type="number"
                  step={0.25}
                  min={0}
                  value={loc.upcharge}
                  onChange={(e) =>
                    updateUpcharge(index, parseFloat(e.target.value) || 0)
                  }
                  className="h-8 pl-5 text-xs text-right"
                />
              </div>
            </div>
          ))}

          {/* Summary */}
          <div className="mt-2 text-xs text-muted-foreground">
            Max location surcharge (all locations):{" "}
            <span className="text-foreground font-medium">
              {formatCurrency(
                locations.reduce((sum, loc) => sum + loc.upcharge, 0)
              )}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
