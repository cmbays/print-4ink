"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface FavoriteStarProps {
  isFavorite: boolean;
  onToggle: () => void;
  label?: string;
  size?: number;
  className?: string;
}

export function FavoriteStar({
  isFavorite,
  onToggle,
  label = "favorite",
  size = 16,
  className,
}: FavoriteStarProps) {
  return (
    <button
      type="button"
      aria-label={isFavorite ? `Remove from ${label}` : `Add to ${label}`}
      aria-pressed={isFavorite}
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      className={cn(
        "inline-flex items-center justify-center rounded-sm p-1 transition-colors",
        "hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        "motion-reduce:transition-none",
        isFavorite ? "text-warning" : "text-muted-foreground/40 hover:text-muted-foreground",
        className,
      )}
    >
      <Star
        size={size}
        className={cn(isFavorite && "fill-current")}
        aria-hidden="true"
      />
    </button>
  );
}
