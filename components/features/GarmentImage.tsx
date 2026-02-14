import { Shirt } from "lucide-react";
import { cn } from "@/lib/utils";

interface GarmentImageProps {
  brand: string;
  sku: string;
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZE_CLASSES = {
  sm: "h-10 w-10",
  md: "h-20 w-20",
  lg: "h-40 w-40",
} as const;

const ICON_SIZES = { sm: 16, md: 32, lg: 48 } as const;

export function GarmentImage({
  brand,
  sku,
  name,
  size = "md",
  className,
}: GarmentImageProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-md bg-surface text-muted-foreground",
        SIZE_CLASSES[size],
        className,
      )}
      role="img"
      aria-label={`${brand} ${sku} — ${name}`}
    >
      <Shirt size={ICON_SIZES[size]} aria-hidden="true" />
      {size !== "sm" && (
        <span className="mt-1 text-center text-xs leading-tight">
          {sku}
        </span>
      )}
    </div>
  );
}
