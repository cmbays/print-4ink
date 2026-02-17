import { Badge } from "@shared/ui/primitives/badge";
import { cn } from "@/lib/utils";
import {
  CUSTOMER_TYPE_TAG_LABELS,
  CUSTOMER_TYPE_TAG_COLORS,
} from "@domain/constants";
import type { CustomerTypeTag } from "@domain/entities/customer";

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
            "transition-colors text-xs"
          )}
          aria-label={`Type: ${CUSTOMER_TYPE_TAG_LABELS[tag]}`}
        >
          {CUSTOMER_TYPE_TAG_LABELS[tag]}
        </Badge>
      ))}
    </div>
  );
}
