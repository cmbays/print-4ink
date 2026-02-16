import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const items = [
  { color: "bg-success", label: "Healthy", threshold: "\u226530%", tooltip: "Margin is 30% or above \u2014 price comfortably covers costs" },
  { color: "bg-warning", label: "Caution", threshold: "15\u201330%", tooltip: "Margin is 15\u201330% \u2014 covers costs but leaves little room for error" },
  { color: "bg-error", label: "Unprofitable", threshold: "<15%", tooltip: "Margin is below 15% \u2014 may not cover ink, labor, and overhead" },
] as const;

interface MarginLegendProps {
  variant?: "simple" | "tooltip";
  className?: string;
}

export function MarginLegend({ variant = "simple", className }: MarginLegendProps) {
  if (variant === "tooltip") {
    return (
      <div className={cn("flex items-center gap-3 text-xs text-muted-foreground", className)}>
        {items.map((item) => (
          <Tooltip key={item.label}>
            <TooltipTrigger asChild>
              <div className="flex cursor-default items-center gap-1">
                <span className={cn("inline-block size-2 rounded-full", item.color)} />
                {item.label}
              </div>
            </TooltipTrigger>
            <TooltipContent
              side="bottom"
              sideOffset={6}
              className="data-[state=closed]:pointer-events-none"
            >
              {item.tooltip}
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-4 text-xs text-muted-foreground", className)}>
      {items.map((item) => (
        <span key={item.label} className="flex items-center gap-1.5">
          <span className={cn("inline-block size-2 rounded-full", item.color)} />
          {item.label} ({item.threshold})
        </span>
      ))}
    </div>
  );
}
