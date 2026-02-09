"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { Search, Upload, Check, ImageIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Artwork } from "@/lib/schemas/artwork";
import type { CustomerTag } from "@/lib/schemas/customer";
import { ARTWORK_TAG_LABELS } from "@/lib/constants";

interface ArtworkLibraryProps {
  artworks: Artwork[];
  customerTag?: CustomerTag;
  selectedArtworkIds: string[];
  onToggleSelect: (artworkId: string) => void;
  onUploadNew: () => void;
}

export function ArtworkLibrary({
  artworks,
  customerTag,
  selectedArtworkIds,
  onToggleSelect,
  onUploadNew,
}: ArtworkLibraryProps) {
  const [search, setSearch] = useState("");
  const [tagFilter, setTagFilter] = useState<string | null>(null);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    artworks.forEach((a) => a.tags.forEach((t) => tags.add(t)));
    return Array.from(tags).sort();
  }, [artworks]);

  const filtered = useMemo(() => {
    let result = artworks;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((a) => a.name.toLowerCase().includes(q));
    }
    if (tagFilter) {
      result = result.filter((a) => a.tags.includes(tagFilter as Artwork["tags"][number]));
    }
    return result;
  }, [artworks, search, tagFilter]);

  // For repeat: sort by lastUsedAt, recently used first
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const aDate = a.lastUsedAt || a.createdAt;
      const bDate = b.lastUsedAt || b.createdAt;
      return new Date(bDate).getTime() - new Date(aDate).getTime();
    });
  }, [filtered]);

  // For new customers — clean upload only
  if (customerTag === "new" && artworks.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-border p-8 cursor-pointer hover:border-action/50 transition-colors"
        onClick={onUploadNew}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onUploadNew(); } }}
      >
        <Upload className="size-6 text-muted-foreground" />
        <p className="text-sm font-medium text-foreground">Upload Artwork</p>
        <p className="text-xs text-muted-foreground">Drop files here or click to browse</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Search + filter */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search artwork..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 pl-8 text-sm"
          />
        </div>
        <Button variant="outline" size="sm" onClick={onUploadNew} className="h-8 shrink-0">
          <Upload size={16} />
          Upload
        </Button>
      </div>

      {/* Tag filters — only for contract */}
      {customerTag === "contract" && allTags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          <Badge
            variant="ghost"
            className={cn(
              "cursor-pointer text-xs",
              !tagFilter ? "bg-action/10 text-action" : "bg-muted text-muted-foreground hover:text-foreground"
            )}
            onClick={() => setTagFilter(null)}
          >
            All
          </Badge>
          {allTags.map((tag) => (
            <Badge
              key={tag}
              variant="ghost"
              className={cn(
                "cursor-pointer text-xs",
                tagFilter === tag ? "bg-action/10 text-action" : "bg-muted text-muted-foreground hover:text-foreground"
              )}
              onClick={() => setTagFilter(tagFilter === tag ? null : tag)}
            >
              {ARTWORK_TAG_LABELS[tag as keyof typeof ARTWORK_TAG_LABELS] || tag}
            </Badge>
          ))}
        </div>
      )}

      {/* Grid */}
      {sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-md border border-dashed border-border py-8">
          <ImageIcon className="size-6 text-muted-foreground/50" />
          <p className="mt-2 text-sm text-muted-foreground">No artwork found</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {sorted.map((artwork) => {
            const isSelected = selectedArtworkIds.includes(artwork.id);
            return (
              <button
                key={artwork.id}
                type="button"
                onClick={() => onToggleSelect(artwork.id)}
                className={cn(
                  "relative flex flex-col items-center gap-1.5 rounded-lg border p-2 transition-all text-left",
                  isSelected
                    ? "border-action bg-action/5 ring-1 ring-action"
                    : "border-border bg-surface hover:border-foreground/20"
                )}
              >
                {/* Thumbnail */}
                <div className="relative w-full aspect-square rounded bg-muted flex items-center justify-center overflow-hidden">
                  <Image
                    src={artwork.thumbnailUrl}
                    alt={artwork.name}
                    fill
                    className="object-contain p-2"
                  />
                  {isSelected && (
                    <div className="absolute inset-0 flex items-center justify-center bg-action/20">
                      <Check size={20} className="text-action" />
                    </div>
                  )}
                </div>
                {/* Info */}
                <div className="w-full">
                  <p className="text-xs font-medium text-foreground truncate">{artwork.name}</p>
                  <p className="text-xs text-muted-foreground">{artwork.colorCount} color{artwork.colorCount !== 1 ? "s" : ""}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Selection count */}
      {selectedArtworkIds.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {selectedArtworkIds.length} artwork{selectedArtworkIds.length !== 1 ? "s" : ""} selected for this quote
        </p>
      )}
    </div>
  );
}
