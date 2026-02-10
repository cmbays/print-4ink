import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  CUSTOMER_TYPE_TAG_LABELS,
  CUSTOMER_TYPE_TAG_COLORS,
} from "@/lib/constants";
import type { CustomerTypeTag } from "@/lib/schemas/customer";

interface TypeTagBadgesProps {
  tags: CustomerTypeTag[];
  className?: string;
}

export function TypeTagBadges({ tags, className }: TypeTagBadgesProps) {
  if (tags.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap gap-1", className)}>
      {tags.map((tag) => (
        <Badge
          key={tag}
          variant="ghost"
          className={cn(
            CUSTOMER_TYPE_TAG_COLORS[tag],
            "transition-colors text-[11px]"
          )}
          aria-label={`Type: ${CUSTOMER_TYPE_TAG_LABELS[tag]}`}
        >
          {CUSTOMER_TYPE_TAG_LABELS[tag]}
        </Badge>
      ))}
    </div>
  );
}
